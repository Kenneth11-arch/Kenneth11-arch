from typing import List, Optional, Dict, Any
from datetime import datetime
from models import (
    Bet, BetCreate, BetType, BetStatus, Match, MatchStatus, 
    User, UserRole, Transaction, TransactionType, TransactionStatus
)
from database import get_database, BETS_COLLECTION, MATCHES_COLLECTION, USERS_COLLECTION, TRANSACTIONS_COLLECTION
import logging

logger = logging.getLogger(__name__)

class BettingEngine:
    def __init__(self):
        self.commission_rate = 0.02  # 2% commission
    
    async def place_bet(self, user: User, bet_data: BetCreate) -> Bet:
        """Place a new bet"""
        database = await get_database()
        
        # Get match
        match_data = await database[MATCHES_COLLECTION].find_one({"id": bet_data.match_id})
        if not match_data:
            raise ValueError("Match not found")
        
        match = Match(**match_data)
        
        # Check if match is still open for betting
        if match.status != MatchStatus.UPCOMING:
            raise ValueError("Match is no longer open for betting")
        
        # For VIP users with free bets, no balance check needed
        if not (bet_data.is_free_bet and user.role == UserRole.SPECIAL):
            # Check if user has enough balance for regular bets
            if user.balance < bet_data.stake:
                raise ValueError("Insufficient balance")
        
        # Calculate potential return
        potential_return = bet_data.stake * bet_data.odds
        
        # Set commission rate (special users get 0% commission)
        commission_rate = 0.0 if user.role == UserRole.SPECIAL else self.commission_rate
        
        # Create bet
        bet = Bet(
            user_id=user.id,
            match_id=bet_data.match_id,
            bet_type=bet_data.bet_type,
            selection=bet_data.selection,
            stake=bet_data.stake,
            odds=bet_data.odds,
            potential_return=potential_return,
            commission_rate=commission_rate,
            is_free_bet=bet_data.is_free_bet,
            unmatched_amount=bet_data.stake
        )
        
        # Only deduct from balance if it's not a free bet
        if not (bet_data.is_free_bet and user.role == UserRole.SPECIAL):
            # Deduct stake from user balance
            await database[USERS_COLLECTION].update_one(
                {"id": user.id},
                {"$inc": {"balance": -bet_data.stake}}
            )
            
            # Create transaction record
            transaction = Transaction(
                user_id=user.id,
                amount=-bet_data.stake,
                type=TransactionType.BET_STAKE,
                status=TransactionStatus.CONFIRMED,
                description=f"Bet placed on {match.home_team} vs {match.away_team}"
            )
            await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
        else:
            # Create free bet transaction record
            transaction = Transaction(
                user_id=user.id,
                amount=0,
                type=TransactionType.BET_STAKE,
                status=TransactionStatus.CONFIRMED,
                description=f"FREE BET placed on {match.home_team} vs {match.away_team} (VIP)"
            )
            await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
        
        # Save bet
        await database[BETS_COLLECTION].insert_one(bet.dict())
        
        # Try to match the bet
        await self.match_bet(bet)
        
        bet_type = "FREE BET" if bet_data.is_free_bet and user.role == UserRole.SPECIAL else "Bet"
        logger.info(f"{bet_type} placed: {bet.id} by user {user.id}")
        return bet
    
    async def match_bet(self, bet: Bet):
        """Try to match a bet with opposing bets"""
        database = await get_database()
        
        # Find opposing bets
        opposing_type = BetType.LAY if bet.bet_type == BetType.BACK else BetType.BACK
        
        # For BACK bets, find LAY bets with same or better odds
        # For LAY bets, find BACK bets with same or worse odds
        if bet.bet_type == BetType.BACK:
            odds_filter = {"odds": {"$lte": bet.odds}}
        else:
            odds_filter = {"odds": {"$gte": bet.odds}}
        
        opposing_bets = await database[BETS_COLLECTION].find({
            "match_id": bet.match_id,
            "selection": bet.selection,
            "bet_type": opposing_type,
            "status": BetStatus.PENDING,
            "unmatched_amount": {"$gt": 0},
            **odds_filter
        }).sort("created_at", 1).to_list(100)
        
        matched_amount = 0
        
        for opposing_bet_data in opposing_bets:
            opposing_bet = Bet(**opposing_bet_data)
            
            # Calculate how much can be matched
            available_amount = min(bet.unmatched_amount, opposing_bet.unmatched_amount)
            
            if available_amount > 0:
                # Update both bets
                await database[BETS_COLLECTION].update_one(
                    {"id": bet.id},
                    {
                        "$inc": {
                            "matched_amount": available_amount,
                            "unmatched_amount": -available_amount
                        },
                        "$set": {"matched_at": datetime.utcnow()}
                    }
                )
                
                await database[BETS_COLLECTION].update_one(
                    {"id": opposing_bet.id},
                    {
                        "$inc": {
                            "matched_amount": available_amount,
                            "unmatched_amount": -available_amount
                        },
                        "$set": {"matched_at": datetime.utcnow()}
                    }
                )
                
                matched_amount += available_amount
                bet.unmatched_amount -= available_amount
                
                logger.info(f"Matched {available_amount} between bets {bet.id} and {opposing_bet.id}")
                
                if bet.unmatched_amount <= 0:
                    break
        
        # Update bet status
        if bet.unmatched_amount <= 0:
            await database[BETS_COLLECTION].update_one(
                {"id": bet.id},
                {"$set": {"status": BetStatus.MATCHED}}
            )
        elif matched_amount > 0:
            await database[BETS_COLLECTION].update_one(
                {"id": bet.id},
                {"$set": {"status": BetStatus.MATCHED}}
            )
    
    async def settle_match(self, match_id: str):
        """Settle all bets for a completed match"""
        database = await get_database()
        
        # Get completed match
        match_data = await database[MATCHES_COLLECTION].find_one({"id": match_id})
        if not match_data:
            raise ValueError("Match not found")
        
        match = Match(**match_data)
        
        if match.status != MatchStatus.COMPLETED or not match.winner:
            raise ValueError("Match is not completed or winner not determined")
        
        # Get all bets for this match
        bets = await database[BETS_COLLECTION].find({
            "match_id": match_id,
            "status": {"$in": [BetStatus.PENDING, BetStatus.MATCHED]}
        }).to_list(1000)
        
        for bet_data in bets:
            bet = Bet(**bet_data)
            
            # Determine if bet won
            won = bet.selection == match.winner
            
            # Calculate profit/loss
            if won:
                if bet.bet_type == BetType.BACK:
                    # Winning back bet
                    profit = bet.matched_amount * (bet.odds - 1)
                    commission = profit * bet.commission_rate
                    net_profit = profit - commission
                    total_return = bet.matched_amount + net_profit
                else:
                    # Winning lay bet (collect stake, pay nothing)
                    profit = bet.matched_amount
                    commission = profit * bet.commission_rate
                    net_profit = profit - commission
                    total_return = bet.matched_amount + net_profit
            else:
                if bet.bet_type == BetType.BACK:
                    # Losing back bet (lose stake)
                    net_profit = -bet.matched_amount
                    total_return = 0
                else:
                    # Losing lay bet (pay out winnings)
                    liability = bet.matched_amount * (bet.odds - 1)
                    commission = 0  # No commission on losing bets
                    net_profit = -liability
                    total_return = bet.matched_amount - liability
            
            # Update bet
            await database[BETS_COLLECTION].update_one(
                {"id": bet.id},
                {
                    "$set": {
                        "status": BetStatus.SETTLED,
                        "profit_loss": net_profit,
                        "settled_at": datetime.utcnow()
                    }
                }
            )
            
            # Update user balance
            if total_return > 0:
                await database[USERS_COLLECTION].update_one(
                    {"id": bet.user_id},
                    {"$inc": {"balance": total_return}}
                )
                
                # Create transaction record
                transaction = Transaction(
                    user_id=bet.user_id,
                    amount=total_return,
                    type=TransactionType.BET_RETURN,
                    status=TransactionStatus.CONFIRMED,
                    description=f"Bet return: {match.home_team} vs {match.away_team}"
                )
                await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
            
            # Return unmatched amount
            if bet.unmatched_amount > 0:
                await database[USERS_COLLECTION].update_one(
                    {"id": bet.user_id},
                    {"$inc": {"balance": bet.unmatched_amount}}
                )
                
                transaction = Transaction(
                    user_id=bet.user_id,
                    amount=bet.unmatched_amount,
                    type=TransactionType.BET_RETURN,
                    status=TransactionStatus.CONFIRMED,
                    description=f"Unmatched bet return: {match.home_team} vs {match.away_team}"
                )
                await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
        
        # Update match status
        await database[MATCHES_COLLECTION].update_one(
            {"id": match_id},
            {
                "$set": {
                    "status": MatchStatus.SETTLED,
                    "settled_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Settled {len(bets)} bets for match {match_id}")
    
    async def get_user_bets(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user's bet history with match details"""
        database = await get_database()
        
        # Get user bets
        bets = await database[BETS_COLLECTION].find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
        
        # Enrich with match details
        bet_responses = []
        for bet_data in bets:
            bet = Bet(**bet_data)
            
            # Get match details
            match_data = await database[MATCHES_COLLECTION].find_one({"id": bet.match_id})
            if match_data:
                match = Match(**match_data)
                
                bet_responses.append({
                    "id": bet.id,
                    "match_id": bet.match_id,
                    "match_home_team": match.home_team,
                    "match_away_team": match.away_team,
                    "match_commence_time": match.commence_time,
                    "match_status": match.status,
                    "bet_type": bet.bet_type,
                    "selection": bet.selection,
                    "stake": bet.stake,
                    "odds": bet.odds,
                    "potential_return": bet.potential_return,
                    "status": bet.status,
                    "matched_amount": bet.matched_amount,
                    "unmatched_amount": bet.unmatched_amount,
                    "profit_loss": bet.profit_loss,
                    "created_at": bet.created_at,
                    "settled_at": bet.settled_at
                })
        
        return bet_responses
    
    async def get_betting_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's betting statistics"""
        database = await get_database()
        
        # Get all user bets
        bets = await database[BETS_COLLECTION].find({"user_id": user_id}).to_list(1000)
        
        if not bets:
            return {
                "total_bets": 0,
                "total_staked": 0,
                "total_returns": 0,
                "total_profit_loss": 0,
                "win_rate": 0,
                "pending_bets": 0,
                "settled_bets": 0
            }
        
        total_bets = len(bets)
        total_staked = sum(bet["stake"] for bet in bets)
        pending_bets = len([bet for bet in bets if bet["status"] in [BetStatus.PENDING, BetStatus.MATCHED]])
        settled_bets = len([bet for bet in bets if bet["status"] == BetStatus.SETTLED])
        
        # Calculate profit/loss and win rate for settled bets
        settled_bet_data = [bet for bet in bets if bet["status"] == BetStatus.SETTLED]
        total_profit_loss = sum(bet.get("profit_loss", 0) for bet in settled_bet_data)
        winning_bets = len([bet for bet in settled_bet_data if bet.get("profit_loss", 0) > 0])
        win_rate = (winning_bets / settled_bets * 100) if settled_bets > 0 else 0
        
        total_returns = total_staked + total_profit_loss
        
        return {
            "total_bets": total_bets,
            "total_staked": total_staked,
            "total_returns": total_returns,
            "total_profit_loss": total_profit_loss,
            "win_rate": round(win_rate, 2),
            "pending_bets": pending_bets,
            "settled_bets": settled_bets
        }

# Global instance
betting_engine = BettingEngine()