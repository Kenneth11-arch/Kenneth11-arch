from typing import List, Dict, Any, Optional
from datetime import datetime
from models import (
    User, Match, Bet, BetType, BetStatus, Transaction, 
    TransactionType, TransactionStatus, UserRole
)
from database import get_database, USERS_COLLECTION, MATCHES_COLLECTION, BETS_COLLECTION, TRANSACTIONS_COLLECTION
import logging
import uuid

logger = logging.getLogger(__name__)

class UltraExchangeEngine:
    """UltraExchange - Professional lay betting platform"""
    
    def __init__(self):
        self.commission_rate = 0.02  # 2% commission on winnings
        self.min_lay_stake = 10.0   # Minimum lay stake
        
    async def place_lay_bet(self, user: User, match_id: str, selection: str, lay_odds: float, lay_stake: float) -> Dict[str, Any]:
        """Place a lay bet on UltraExchange"""
        database = await get_database()
        
        # Get match
        match_data = await database[MATCHES_COLLECTION].find_one({"id": match_id})
        if not match_data:
            raise ValueError("Match not found")
        
        match = Match(**match_data)
        
        # Check if match is still open for betting
        if match.status != 'upcoming':
            raise ValueError("Match is no longer open for betting")
        
        # Calculate liability (amount you lose if selection wins)
        liability = (lay_odds - 1) * lay_stake
        
        # Check if user has enough balance for liability
        if user.balance < liability:
            raise ValueError(f"Insufficient balance. Need ${liability:.2f} to cover liability")
        
        # Create lay bet
        lay_bet = Bet(
            user_id=user.id,
            match_id=match_id,
            bet_type=BetType.LAY,
            selection=selection,
            stake=lay_stake,
            odds=lay_odds,
            potential_return=lay_stake,  # What you win if selection loses
            commission_rate=self.commission_rate,
            unmatched_amount=lay_stake
        )
        
        # Deduct liability from balance (hold funds)
        await database[USERS_COLLECTION].update_one(
            {"id": user.id},
            {"$inc": {"balance": -liability}}
        )
        
        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            amount=-liability,
            type=TransactionType.BET_STAKE,
            status=TransactionStatus.CONFIRMED,
            description=f"UltraExchange lay bet liability: {match.home_team} vs {match.away_team}"
        )
        await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
        
        # Save lay bet
        await database[BETS_COLLECTION].insert_one(lay_bet.dict())
        
        logger.info(f"Lay bet placed on UltraExchange: {lay_bet.id} by user {user.username}")
        
        return {
            'success': True,
            'bet_id': lay_bet.id,
            'lay_stake': lay_stake,
            'lay_odds': lay_odds,
            'liability': liability,
            'potential_profit': lay_stake,
            'match': {
                'home_team': match.home_team,
                'away_team': match.away_team,
                'commence_time': match.commence_time
            }
        }
    
    async def get_user_lay_bets(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's lay betting history on UltraExchange"""
        database = await get_database()
        
        # Get lay bets only
        bets = await database[BETS_COLLECTION].find({
            "user_id": user_id,
            "bet_type": BetType.LAY
        }).sort("created_at", -1).limit(limit).to_list(limit)
        
        lay_bet_responses = []
        for bet_data in bets:
            bet = Bet(**bet_data)
            
            # Get match details
            match_data = await database[MATCHES_COLLECTION].find_one({"id": bet.match_id})
            if match_data:
                match = Match(**match_data)
                
                liability = (bet.odds - 1) * bet.stake
                
                lay_bet_responses.append({
                    'id': bet.id,
                    'match_id': bet.match_id,
                    'match_home_team': match.home_team,
                    'match_away_team': match.away_team,
                    'match_commence_time': match.commence_time,
                    'match_status': match.status,
                    'selection': bet.selection,
                    'lay_stake': bet.stake,
                    'lay_odds': bet.odds,
                    'liability': liability,
                    'potential_profit': bet.stake,
                    'status': bet.status,
                    'profit_loss': bet.profit_loss,
                    'created_at': bet.created_at,
                    'settled_at': bet.settled_at
                })
        
        return lay_bet_responses
    
    async def get_live_matches_with_lay_odds(self) -> List[Dict[str, Any]]:
        """Get live matches with lay odds for UltraExchange"""
        database = await get_database()
        
        matches = await database[MATCHES_COLLECTION].find({
            'status': {'$in': ['upcoming', 'live']}
        }).sort('commence_time', 1).to_list(100)
        
        exchange_matches = []
        for match_data in matches:
            match = Match(**match_data)
            
            # Generate lay odds (slightly higher than back odds)
            lay_odds = {}
            if match.odds:
                for outcome, back_odd in match.odds.items():
                    # Lay odds are typically 0.05-0.15 higher than back odds
                    lay_odds[outcome] = round(back_odd + 0.1, 2)
            
            # Calculate market liquidity (simulated)
            liquidity = {}
            for outcome in lay_odds.keys():
                liquidity[outcome] = {
                    'back_available': round(random.uniform(500, 5000), 2),
                    'lay_available': round(random.uniform(500, 5000), 2)
                }
            
            exchange_matches.append({
                'id': match.id,
                'match_id': match.match_id,
                'sport': match.sport,
                'home_team': match.home_team,
                'away_team': match.away_team,
                'commence_time': match.commence_time,
                'status': match.status,
                'home_score': match.home_score,
                'away_score': match.away_score,
                'back_odds': match.odds,
                'lay_odds': lay_odds,
                'liquidity': liquidity,
                'is_live': match.status == 'live'
            })
        
        return exchange_matches
    
    async def get_exchange_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get UltraExchange statistics for user"""
        database = await get_database()
        
        # Get all lay bets
        lay_bets = await database[BETS_COLLECTION].find({
            'user_id': user_id,
            'bet_type': BetType.LAY
        }).to_list(1000)
        
        if not lay_bets:
            return {
                'total_lay_bets': 0,
                'total_liability': 0,
                'total_profit_loss': 0,
                'win_rate': 0,
                'pending_liability': 0,
                'settled_bets': 0
            }
        
        total_lay_bets = len(lay_bets)
        total_liability = sum((bet['odds'] - 1) * bet['stake'] for bet in lay_bets)
        settled_bets = [bet for bet in lay_bets if bet['status'] == 'settled']
        total_profit_loss = sum(bet.get('profit_loss', 0) for bet in settled_bets)
        
        # Calculate win rate for lay bets (when selection LOSES)
        winning_lay_bets = len([bet for bet in settled_bets if bet.get('profit_loss', 0) > 0])
        win_rate = (winning_lay_bets / len(settled_bets) * 100) if settled_bets else 0
        
        # Pending liability
        pending_bets = [bet for bet in lay_bets if bet['status'] in ['pending', 'matched']]
        pending_liability = sum((bet['odds'] - 1) * bet['stake'] for bet in pending_bets)
        
        return {
            'total_lay_bets': total_lay_bets,
            'total_liability': round(total_liability, 2),
            'total_profit_loss': round(total_profit_loss, 2),
            'win_rate': round(win_rate, 2),
            'pending_liability': round(pending_liability, 2),
            'settled_bets': len(settled_bets)
        }

# Global instance  
ultra_exchange = UltraExchangeEngine()