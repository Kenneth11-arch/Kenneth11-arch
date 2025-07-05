from typing import List, Dict, Any, Optional
from datetime import datetime
from models import Match, User, UserRole
from database import get_database, MATCHES_COLLECTION
import logging
import random

logger = logging.getLogger(__name__)

class ArbitrageEngine:
    """Risk-free betting arbitrage engine for special accounts only"""
    
    def __init__(self):
        self.min_profit_percentage = 2.0  # Minimum 2% profit to show opportunity
        
    def calculate_arbitrage_opportunity(self, match: Match) -> Optional[Dict[str, Any]]:
        """Calculate if there's an arbitrage opportunity for a match"""
        if not match.odds or len(match.odds) < 2:
            return None
            
        bet365_odds = match.odds
        
        # Simulate UltraExchange odds (slightly different for arbitrage)
        ultra_odds = self.generate_ultra_exchange_odds(bet365_odds)
        
        # Calculate arbitrage for each outcome
        arbitrage_opportunities = []
        
        for outcome in bet365_odds.keys():
            if outcome in ultra_odds:
                bet365_odd = bet365_odds[outcome]
                ultra_lay_odd = ultra_odds[outcome]
                
                # Calculate if profitable to back on bet365 and lay on ultra
                opportunity = self.calculate_opportunity(
                    match, outcome, bet365_odd, ultra_lay_odd
                )
                
                if opportunity and opportunity['profit_percentage'] >= self.min_profit_percentage:
                    arbitrage_opportunities.append(opportunity)
        
        if arbitrage_opportunities:
            # Return the best opportunity
            best_opportunity = max(arbitrage_opportunities, key=lambda x: x['profit_percentage'])
            return best_opportunity
            
        return None
    
    def generate_ultra_exchange_odds(self, bet365_odds: Dict[str, float]) -> Dict[str, float]:
        """Generate slightly different odds for UltraExchange to create arbitrage opportunities"""
        ultra_odds = {}
        
        for outcome, odd in bet365_odds.items():
            # Create arbitrage by making lay odds slightly higher
            variation = random.uniform(0.05, 0.15)  # 5-15% variation
            ultra_odds[outcome] = round(odd + variation, 2)
            
        return ultra_odds
    
    def calculate_opportunity(self, match: Match, outcome: str, bet365_odd: float, ultra_lay_odd: float) -> Optional[Dict[str, Any]]:
        """Calculate arbitrage opportunity for a specific outcome"""
        stake = 100.0  # Base calculation on $100 stake
        
        # Back bet on bet365
        bet365_return = stake * bet365_odd
        bet365_profit = bet365_return - stake
        
        # Lay bet on ultra exchange
        # Lay liability = (lay_odds - 1) * lay_stake
        # We need to calculate lay stake to guarantee profit
        
        try:
            # Calculate required lay stake for break-even
            lay_stake = bet365_return / ultra_lay_odd
            lay_liability = (ultra_lay_odd - 1) * lay_stake
            
            # Scenario 1: Bet365 wins
            profit_if_bet365_wins = bet365_profit - lay_liability
            
            # Scenario 2: UltraExchange wins (bet365 loses)
            profit_if_ultra_wins = lay_stake - stake
            
            # Only profitable if both scenarios are positive
            if profit_if_bet365_wins > 0 and profit_if_ultra_wins > 0:
                min_profit = min(profit_if_bet365_wins, profit_if_ultra_wins)
                profit_percentage = (min_profit / stake) * 100
                
                return {
                    'match_id': match.id,
                    'match_home_team': match.home_team,
                    'match_away_team': match.away_team,
                    'match_commence_time': match.commence_time,
                    'outcome': outcome,
                    'recommendation': self.get_recommendation(outcome),
                    'bet365_odd': bet365_odd,
                    'ultra_lay_odd': ultra_lay_odd,
                    'stake_bet365': stake,
                    'stake_ultra_lay': round(lay_stake, 2),
                    'liability_ultra': round(lay_liability, 2),
                    'profit_if_bet365_wins': round(profit_if_bet365_wins, 2),
                    'profit_if_ultra_wins': round(profit_if_ultra_wins, 2),
                    'guaranteed_profit': round(min_profit, 2),
                    'profit_percentage': round(profit_percentage, 2)
                }
        except (ZeroDivisionError, ValueError):
            return None
            
        return None
    
    def get_recommendation(self, outcome: str) -> str:
        """Get human readable recommendation"""
        recommendations = {
            'home': 'Back HOME WIN on Bet365, Lay HOME WIN on UltraExchange',
            'away': 'Back AWAY WIN on Bet365, Lay AWAY WIN on UltraExchange', 
            'draw': 'Back DRAW on Bet365, Lay DRAW on UltraExchange'
        }
        return recommendations.get(outcome, f'Back {outcome.upper()} on Bet365, Lay {outcome.upper()} on UltraExchange')
    
    async def get_arbitrage_opportunities(self, user: User) -> List[Dict[str, Any]]:
        """Get all current arbitrage opportunities (special accounts only)"""
        if user.role != UserRole.SPECIAL:
            return []
            
        database = await get_database()
        
        # Get upcoming matches
        matches = await database[MATCHES_COLLECTION].find({
            'status': 'upcoming'
        }).sort('commence_time', 1).to_list(50)
        
        opportunities = []
        
        for match_data in matches:
            match = Match(**match_data)
            opportunity = self.calculate_arbitrage_opportunity(match)
            
            if opportunity:
                opportunities.append(opportunity)
        
        # Sort by profit percentage (best first)
        opportunities.sort(key=lambda x: x['profit_percentage'], reverse=True)
        
        logger.info(f"Found {len(opportunities)} arbitrage opportunities for user {user.username}")
        return opportunities
    
    def calculate_lay_amount(self, bet365_stake: float, bet365_odd: float, ultra_lay_odd: float) -> Dict[str, float]:
        """Calculate how much to lay on UltraExchange for a given Bet365 stake"""
        try:
            bet365_return = bet365_stake * bet365_odd
            lay_stake = bet365_return / ultra_lay_odd
            lay_liability = (ultra_lay_odd - 1) * lay_stake
            
            return {
                'lay_stake': round(lay_stake, 2),
                'lay_liability': round(lay_liability, 2),
                'total_risk': round(lay_liability, 2)
            }
        except (ZeroDivisionError, ValueError):
            return {
                'lay_stake': 0,
                'lay_liability': 0,
                'total_risk': 0
            }

# Global instance
arbitrage_engine = ArbitrageEngine()