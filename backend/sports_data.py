import httpx
import asyncio
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random
from models import Match, MatchCreate, MatchStatus
from database import get_database, MATCHES_COLLECTION
import logging

logger = logging.getLogger(__name__)

# Since we're using development mode, we'll use mock data
# In production, replace with real API calls

class SportsDataService:
    def __init__(self):
        self.odds_api_key = "development-key"  # Replace with real key
        self.trongrid_api_key = "development-key"  # Replace with real key
        self.base_url = "https://api.the-odds-api.com/v4"
        
    def generate_realistic_odds(self) -> Dict[str, float]:
        """Generate realistic betting odds"""
        # Generate odds that add up to > 100% (bookmaker margin)
        home_odds = round(random.uniform(1.5, 3.5), 2)
        away_odds = round(random.uniform(1.5, 3.5), 2)
        draw_odds = round(random.uniform(2.5, 4.5), 2)
        
        return {
            "home": home_odds,
            "away": away_odds,
            "draw": draw_odds
        }
    
    def get_mock_nfl_matches(self) -> List[Dict[str, Any]]:
        """Generate mock NFL matches with real team names"""
        teams = [
            "Philadelphia Eagles", "Dallas Cowboys", "New York Giants", "Washington Commanders",
            "Buffalo Bills", "Miami Dolphins", "New England Patriots", "New York Jets",
            "Baltimore Ravens", "Cincinnati Bengals", "Cleveland Browns", "Pittsburgh Steelers",
            "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans",
            "Denver Broncos", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers",
            "Green Bay Packers", "Chicago Bears", "Detroit Lions", "Minnesota Vikings",
            "Atlanta Falcons", "Carolina Panthers", "New Orleans Saints", "Tampa Bay Buccaneers",
            "Arizona Cardinals", "Los Angeles Rams", "San Francisco 49ers", "Seattle Seahawks"
        ]
        
        matches = []
        for i in range(8):  # 8 NFL matches
            home_team = random.choice(teams)
            away_team = random.choice([t for t in teams if t != home_team])
            
            # Generate match time (next 7 days, starting at least 1 hour from now)
            commence_time = datetime.utcnow() + timedelta(
                hours=random.randint(1, 4),  # 1-4 hours from now
                days=random.randint(0, 7),   # Plus 0-7 additional days
                minutes=random.choice([0, 15, 30, 45])
            )
            
            matches.append({
                "id": f"nfl_{i+1}",
                "sport_title": "NFL",
                "home_team": home_team,
                "away_team": away_team,
                "commence_time": commence_time.isoformat(),
                "odds": self.generate_realistic_odds()
            })
        
        return matches
    
    def get_mock_nba_matches(self) -> List[Dict[str, Any]]:
        """Generate mock NBA matches with real team names"""
        teams = [
            "Los Angeles Lakers", "Golden State Warriors", "Boston Celtics", "Brooklyn Nets",
            "Milwaukee Bucks", "Miami Heat", "Philadelphia 76ers", "Phoenix Suns",
            "Denver Nuggets", "Dallas Mavericks", "Memphis Grizzlies", "Sacramento Kings",
            "New York Knicks", "Cleveland Cavaliers", "Toronto Raptors", "Atlanta Hawks",
            "Chicago Bulls", "Minnesota Timberwolves", "New Orleans Pelicans", "Utah Jazz",
            "Portland Trail Blazers", "Oklahoma City Thunder", "San Antonio Spurs", "Orlando Magic",
            "Charlotte Hornets", "Washington Wizards", "Indiana Pacers", "Detroit Pistons",
            "Los Angeles Clippers", "Houston Rockets"
        ]
        
        matches = []
        for i in range(6):  # 6 NBA matches
            home_team = random.choice(teams)
            away_team = random.choice([t for t in teams if t != home_team])
            
            commence_time = datetime.utcnow() + timedelta(
                days=random.randint(0, 3),
                hours=random.randint(19, 22),  # Evening games
                minutes=random.choice([0, 30])
            )
            
            matches.append({
                "id": f"nba_{i+1}",
                "sport_title": "NBA",
                "home_team": home_team,
                "away_team": away_team,
                "commence_time": commence_time.isoformat(),
                "odds": self.generate_realistic_odds()
            })
        
        return matches
    
    def get_mock_soccer_matches(self) -> List[Dict[str, Any]]:
        """Generate mock soccer matches with real team names"""
        teams = [
            "Manchester United", "Manchester City", "Liverpool", "Chelsea", "Arsenal",
            "Tottenham Hotspur", "Newcastle United", "Brighton", "Aston Villa", "West Ham",
            "Crystal Palace", "Fulham", "Brentford", "Nottingham Forest", "Everton",
            "Leicester City", "Wolverhampton", "Bournemouth", "Sheffield United", "Burnley"
        ]
        
        matches = []
        for i in range(10):  # 10 soccer matches
            home_team = random.choice(teams)
            away_team = random.choice([t for t in teams if t != home_team])
            
            commence_time = datetime.utcnow() + timedelta(
                days=random.randint(0, 4),
                hours=random.randint(12, 17),  # Afternoon games
                minutes=random.choice([0, 30])
            )
            
            matches.append({
                "id": f"soccer_{i+1}",
                "sport_title": "Premier League",
                "home_team": home_team,
                "away_team": away_team,
                "commence_time": commence_time.isoformat(),
                "odds": self.generate_realistic_odds()
            })
        
        return matches
    
    def get_mock_tennis_matches(self) -> List[Dict[str, Any]]:
        """Generate mock tennis matches with real player names"""
        players = [
            "Novak Djokovic", "Carlos Alcaraz", "Daniil Medvedev", "Alexander Zverev",
            "Andrey Rublev", "Stefanos Tsitsipas", "Holger Rune", "Casper Ruud",
            "Taylor Fritz", "Alex de Minaur", "Grigor Dimitrov", "Tommy Paul",
            "Ben Shelton", "Hubert Hurkacz", "Sebastian Korda", "Frances Tiafoe",
            "Jannik Sinner", "Lorenzo Musetti", "Matteo Berrettini", "Felix Auger-Aliassime"
        ]
        
        matches = []
        for i in range(8):  # 8 tennis matches
            home_player = random.choice(players)
            away_player = random.choice([p for p in players if p != home_player])
            
            commence_time = datetime.utcnow() + timedelta(
                days=random.randint(0, 5),
                hours=random.randint(10, 16),  # Day matches
                minutes=random.choice([0, 30])
            )
            
            # Tennis doesn't have draw, so remove draw odds
            odds = self.generate_realistic_odds()
            del odds["draw"]
            
            matches.append({
                "id": f"tennis_{i+1}",
                "sport_title": "ATP",
                "home_team": home_player,
                "away_team": away_player,
                "commence_time": commence_time.isoformat(),
                "odds": odds
            })
        
        return matches
    
    async def get_matches_by_sport(self, sport: str) -> List[Dict[str, Any]]:
        """Get matches for a specific sport"""
        if sport == "nfl":
            return self.get_mock_nfl_matches()
        elif sport == "nba":
            return self.get_mock_nba_matches()
        elif sport == "soccer":
            return self.get_mock_soccer_matches()
        elif sport == "tennis":
            return self.get_mock_tennis_matches()
        else:
            return []
    
    async def get_all_matches(self) -> List[Dict[str, Any]]:
        """Get all matches from all sports"""
        all_matches = []
        sports = ["nfl", "nba", "soccer", "tennis"]
        
        for sport in sports:
            matches = await self.get_matches_by_sport(sport)
            all_matches.extend(matches)
        
        # Sort by commence time
        all_matches.sort(key=lambda x: x["commence_time"])
        return all_matches
    
    async def update_matches_in_db(self):
        """Update matches in database from API"""
        database = await get_database()
        
        try:
            all_matches = await self.get_all_matches()
            
            for match_data in all_matches:
                # Check if match already exists
                existing_match = await database[MATCHES_COLLECTION].find_one({
                    "match_id": match_data["id"]
                })
                
                commence_time = datetime.fromisoformat(match_data["commence_time"].replace('Z', '+00:00'))
                
                if existing_match:
                    # Update existing match
                    await database[MATCHES_COLLECTION].update_one(
                        {"match_id": match_data["id"]},
                        {"$set": {
                            "odds": match_data["odds"],
                            "last_updated": datetime.utcnow()
                        }}
                    )
                else:
                    # Create new match
                    sport_map = {
                        "NFL": "nfl",
                        "NBA": "nba", 
                        "Premier League": "soccer",
                        "ATP": "tennis"
                    }
                    
                    match = Match(
                        match_id=match_data["id"],
                        sport=sport_map.get(match_data["sport_title"], "unknown"),
                        home_team=match_data["home_team"],
                        away_team=match_data["away_team"],
                        commence_time=commence_time,
                        odds=match_data["odds"],
                        status=MatchStatus.UPCOMING
                    )
                    
                    await database[MATCHES_COLLECTION].insert_one(match.dict())
            
            logger.info(f"Updated {len(all_matches)} matches in database")
            
        except Exception as e:
            logger.error(f"Error updating matches: {e}")
    
    async def simulate_live_matches(self):
        """Simulate live matches with score updates and auto-settlement"""
        database = await get_database()
        
        # Get matches that should be live or completed
        now = datetime.utcnow()
        
        # Auto-settle matches older than 2 hours
        old_completed_matches = await database[MATCHES_COLLECTION].find({
            "commence_time": {"$lt": now - timedelta(hours=2)},
            "status": {"$in": [MatchStatus.UPCOMING, MatchStatus.LIVE, MatchStatus.COMPLETED]}
        }).to_list(100)
        
        for match_data in old_completed_matches:
            match = Match(**match_data)
            
            if match.status != MatchStatus.SETTLED:
                # Generate final score and winner for old matches
                home_score = random.randint(0, 4)
                away_score = random.randint(0, 4)
                
                # Determine winner
                if home_score > away_score:
                    winner = "home"
                elif away_score > home_score:
                    winner = "away"
                else:
                    winner = "draw"
                
                # Update match to completed
                await database[MATCHES_COLLECTION].update_one(
                    {"match_id": match.match_id},
                    {"$set": {
                        "status": MatchStatus.COMPLETED,
                        "home_score": home_score,
                        "away_score": away_score,
                        "winner": winner,
                        "last_updated": datetime.utcnow()
                    }}
                )
                
                # Import and use betting engine to settle bets
                from betting_engine import betting_engine
                try:
                    await betting_engine.settle_match(match.id)
                except Exception as e:
                    logger.error(f"Error settling match {match.id}: {e}")
        
        # Handle live matches progression
        live_matches = await database[MATCHES_COLLECTION].find({
            "commence_time": {"$lt": now},
            "commence_time": {"$gt": now - timedelta(hours=2)},
            "status": {"$in": [MatchStatus.UPCOMING, MatchStatus.LIVE]}
        }).to_list(100)
        
        for match_data in live_matches:
            match = Match(**match_data)
            
            # Simulate match progression
            if match.status == MatchStatus.UPCOMING:
                # Start the match
                await database[MATCHES_COLLECTION].update_one(
                    {"match_id": match.match_id},
                    {"$set": {
                        "status": MatchStatus.LIVE,
                        "home_score": 0,
                        "away_score": 0,
                        "last_updated": datetime.utcnow()
                    }}
                )
            elif match.status == MatchStatus.LIVE:
                # Check if match should end (after 2 hours)
                if now > match.commence_time + timedelta(hours=2):
                    # End the match and settle
                    home_score = random.randint(0, 5)
                    away_score = random.randint(0, 5)
                    
                    # Determine winner
                    if home_score > away_score:
                        winner = "home"
                    elif away_score > home_score:
                        winner = "away"
                    else:
                        winner = "draw"
                    
                    await database[MATCHES_COLLECTION].update_one(
                        {"match_id": match.match_id},
                        {"$set": {
                            "status": MatchStatus.COMPLETED,
                            "home_score": home_score,
                            "away_score": away_score,
                            "winner": winner,
                            "last_updated": datetime.utcnow()
                        }}
                    )
                    
                    # Settle bets immediately
                    from betting_engine import betting_engine
                    try:
                        await betting_engine.settle_match(match.id)
                    except Exception as e:
                        logger.error(f"Error settling match {match.id}: {e}")
                else:
                    # Update live scores
                    home_score = random.randint(0, 3)
                    away_score = random.randint(0, 3)
                    
                    await database[MATCHES_COLLECTION].update_one(
                        {"match_id": match.match_id},
                        {"$set": {
                            "home_score": home_score,
                            "away_score": away_score,
                            "last_updated": datetime.utcnow()
                        }}
                    )

# Global instance
sports_service = SportsDataService()

async def start_sports_data_service():
    """Start background tasks for sports data"""
    async def update_matches_periodically():
        while True:
            try:
                await sports_service.update_matches_in_db()
                await asyncio.sleep(300)  # Update every 5 minutes
            except Exception as e:
                logger.error(f"Error in periodic match update: {e}")
                await asyncio.sleep(60)
    
    async def simulate_live_matches_periodically():
        while True:
            try:
                await sports_service.simulate_live_matches()
                await asyncio.sleep(30)  # Update every 30 seconds
            except Exception as e:
                logger.error(f"Error in live match simulation: {e}")
                await asyncio.sleep(60)
    
    # Start background tasks
    asyncio.create_task(update_matches_periodically())
    asyncio.create_task(simulate_live_matches_periodically())
    
    logger.info("Sports data service started")