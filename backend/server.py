from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.hash import bcrypt
import jwt
import json
import requests
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT settings
SECRET_KEY = "your-secret-key-here-bet365-clone"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# USDT Wallet Configuration
USDT_WALLET_ADDRESS = "TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ"

# Security
security = HTTPBearer()

# Models (keeping existing models as they are)
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    balance: float = 0.0
    free_bets: float = 1000000.0  # Unlimited free bets
    winnings: float = 0.0  # Track total winnings for withdrawal
    is_special_account: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activities: List[Dict[str, Any]] = []

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    balance: float
    free_bets: float
    winnings: float
    is_special_account: bool

class Bet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    match_id: str
    match_description: str
    bet_type: str
    odds: float
    stake: float
    is_free_bet: bool = False
    potential_winnings: float
    status: str = "pending"  # pending, won, lost
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settled_at: Optional[datetime] = None

class BetCreate(BaseModel):
    match_id: str
    match_description: str
    bet_type: str
    odds: float
    stake: float
    is_free_bet: bool = False

class WithdrawalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    usdt_address: str = USDT_WALLET_ADDRESS
    status: str = "pending"  # pending, processing, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

class WithdrawalCreate(BaseModel):
    amount: float

class Activity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str
    details: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ActivityCreate(BaseModel):
    action: str
    details: Dict[str, Any]

# Helper functions (keeping existing helper functions)
def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def log_activity(user_id: str, action: str, details: Dict[str, Any]):
    activity = Activity(user_id=user_id, action=action, details=details)
    await db.activities.insert_one(activity.dict())
    
    # Also update user's activities array
    await db.users.update_one(
        {"id": user_id},
        {"$push": {"activities": {"action": action, "details": details, "timestamp": datetime.utcnow()}}}
    )

def generate_realistic_odds():
    """Generate realistic betting odds"""
    home_odds = round(random.uniform(1.20, 4.50), 2)
    away_odds = round(random.uniform(1.20, 4.50), 2)
    draw_odds = round(random.uniform(2.80, 4.20), 2) if random.choice([True, False]) else None
    return home_odds, away_odds, draw_odds

async def fetch_real_nfl_data():
    """Fetch real NFL data from ESPN API"""
    try:
        response = requests.get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard", timeout=10)
        if response.status_code == 200:
            data = response.json()
            matches = []
            
            for event in data.get('events', []):
                try:
                    competitions = event.get('competitions', [])
                    if competitions:
                        competition = competitions[0]
                        competitors = competition.get('competitors', [])
                        
                        if len(competitors) >= 2:
                            home_team = competitors[0]['team']['displayName']
                            away_team = competitors[1]['team']['displayName']
                            
                            # Get current score
                            home_score = competitors[0].get('score', '0')
                            away_score = competitors[1].get('score', '0')
                            
                            # Get game status
                            status = competition.get('status', {})
                            game_status = status.get('type', {}).get('description', 'Scheduled')
                            clock = status.get('displayClock', '')
                            period = status.get('period', 0)
                            
                            # Generate realistic odds
                            home_odds, away_odds, draw_odds = generate_realistic_odds()
                            
                            match = {
                                "id": f"nfl_{event['id']}",
                                "sport": "American Football",
                                "home_team": home_team,
                                "away_team": away_team,
                                "home_odds": home_odds,
                                "away_odds": away_odds,
                                "draw_odds": None,  # NFL doesn't have draws
                                "score": f"{home_score}-{away_score}",
                                "time": f"{clock}" if clock else game_status,
                                "is_live": game_status in ['In Progress', 'Halftime'],
                                "start_time": event.get('date', ''),
                                "status": game_status
                            }
                            matches.append(match)
                except Exception as e:
                    print(f"Error processing NFL event: {e}")
                    continue
                    
            return matches[:5]  # Return top 5 matches
    except Exception as e:
        print(f"Error fetching NFL data: {e}")
        return []

async def fetch_real_nba_data():
    """Fetch real NBA data from ESPN API"""
    try:
        response = requests.get("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard", timeout=10)
        if response.status_code == 200:
            data = response.json()
            matches = []
            
            for event in data.get('events', []):
                try:
                    competitions = event.get('competitions', [])
                    if competitions:
                        competition = competitions[0]
                        competitors = competition.get('competitors', [])
                        
                        if len(competitors) >= 2:
                            home_team = competitors[0]['team']['displayName']
                            away_team = competitors[1]['team']['displayName']
                            
                            # Get current score
                            home_score = competitors[0].get('score', '0')
                            away_score = competitors[1].get('score', '0')
                            
                            # Get game status
                            status = competition.get('status', {})
                            game_status = status.get('type', {}).get('description', 'Scheduled')
                            clock = status.get('displayClock', '')
                            period = status.get('period', 0)
                            
                            # Generate realistic odds
                            home_odds, away_odds, draw_odds = generate_realistic_odds()
                            
                            match = {
                                "id": f"nba_{event['id']}",
                                "sport": "Basketball",
                                "home_team": home_team,
                                "away_team": away_team,
                                "home_odds": home_odds,
                                "away_odds": away_odds,
                                "draw_odds": None,  # NBA doesn't have draws
                                "score": f"{home_score}-{away_score}",
                                "time": f"Q{period} {clock}" if period and clock else game_status,
                                "is_live": game_status in ['In Progress', 'Halftime'],
                                "start_time": event.get('date', ''),
                                "status": game_status
                            }
                            matches.append(match)
                except Exception as e:
                    print(f"Error processing NBA event: {e}")
                    continue
                    
            return matches[:5]  # Return top 5 matches
    except Exception as e:
        print(f"Error fetching NBA data: {e}")
        return []

async def fetch_real_soccer_data():
    """Fetch real soccer data from ESPN API"""
    try:
        # Try multiple soccer leagues
        leagues = [
            "eng.1",  # Premier League
            "esp.1",  # La Liga
            "usa.1",  # MLS
        ]
        
        all_matches = []
        
        for league in leagues:
            try:
                response = requests.get(f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    
                    for event in data.get('events', []):
                        try:
                            competitions = event.get('competitions', [])
                            if competitions:
                                competition = competitions[0]
                                competitors = competition.get('competitors', [])
                                
                                if len(competitors) >= 2:
                                    home_team = competitors[0]['team']['displayName']
                                    away_team = competitors[1]['team']['displayName']
                                    
                                    # Get current score
                                    home_score = competitors[0].get('score', '0')
                                    away_score = competitors[1].get('score', '0')
                                    
                                    # Get game status
                                    status = competition.get('status', {})
                                    game_status = status.get('type', {}).get('description', 'Scheduled')
                                    clock = status.get('displayClock', '')
                                    
                                    # Generate realistic odds
                                    home_odds, away_odds, draw_odds = generate_realistic_odds()
                                    
                                    match = {
                                        "id": f"soccer_{event['id']}",
                                        "sport": "Football",
                                        "home_team": home_team,
                                        "away_team": away_team,
                                        "home_odds": home_odds,
                                        "away_odds": away_odds,
                                        "draw_odds": draw_odds,
                                        "score": f"{home_score}-{away_score}",
                                        "time": f"{clock}'" if clock and clock != '0:00' else game_status,
                                        "is_live": game_status in ['In Progress', 'Halftime'],
                                        "start_time": event.get('date', ''),
                                        "status": game_status
                                    }
                                    all_matches.append(match)
                        except Exception as e:
                            print(f"Error processing soccer event: {e}")
                            continue
            except Exception as e:
                print(f"Error fetching soccer league {league}: {e}")
                continue
                
        return all_matches[:6]  # Return top 6 matches
    except Exception as e:
        print(f"Error fetching soccer data: {e}")
        return []

async def fetch_mock_tennis_data():
    """Generate realistic tennis matches with current players"""
    tennis_players = [
        ("Novak Djokovic", "Carlos Alcaraz"),
        ("Jannik Sinner", "Daniil Medvedev"),
        ("Alexander Zverev", "Andrey Rublev"),
        ("Stefanos Tsitsipas", "Casper Ruud"),
        ("Taylor Fritz", "Hubert Hurkacz"),
        ("Aryna Sabalenka", "Iga Swiatek"),
        ("Coco Gauff", "Jessica Pegula"),
        ("Elena Rybakina", "Ons Jabeur")
    ]
    
    matches = []
    tournaments = ["ATP Masters 1000", "WTA 1000", "ATP 500", "WTA 500"]
    
    for i, (player1, player2) in enumerate(tennis_players[:5]):
        home_odds, away_odds, _ = generate_realistic_odds()
        
        # Generate realistic tennis scores
        sets = [f"{random.randint(4,7)}-{random.randint(2,6)}", f"{random.randint(2,6)}-{random.randint(4,7)}"]
        current_set = f"{random.randint(0,5)}-{random.randint(0,5)}"
        
        match = {
            "id": f"tennis_{i+1}",
            "sport": "Tennis",
            "home_team": player1,
            "away_team": player2,
            "home_odds": home_odds,
            "away_odds": away_odds,
            "draw_odds": None,  # Tennis doesn't have draws
            "score": f"{sets[0]}, {sets[1]}, {current_set}",
            "time": f"Set {len(sets) + 1}",
            "is_live": random.choice([True, False]),
            "start_time": datetime.now().isoformat(),
            "tournament": random.choice(tournaments)
        }
        matches.append(match)
    
    return matches

async def fetch_live_sports_data():
    """Fetch comprehensive real sports data"""
    try:
        # Fetch real data concurrently
        nfl_matches = await fetch_real_nfl_data()
        nba_matches = await fetch_real_nba_data()
        soccer_matches = await fetch_real_soccer_data()
        tennis_matches = await fetch_mock_tennis_data()
        
        # Combine all matches
        all_live_matches = []
        all_upcoming_matches = []
        
        # Categorize matches
        all_matches = nfl_matches + nba_matches + soccer_matches + tennis_matches
        
        for match in all_matches:
            if match.get('is_live', False):
                all_live_matches.append(match)
            else:
                all_upcoming_matches.append(match)
        
        # Add some mock live matches if no real live games
        if len(all_live_matches) < 3:
            mock_live = [
                {
                    "id": "live_1",
                    "sport": "Football",
                    "home_team": "Manchester United",
                    "away_team": "Liverpool",
                    "home_odds": 2.50,
                    "draw_odds": 3.20,
                    "away_odds": 2.80,
                    "time": "67'",
                    "score": "2-1",
                    "is_live": True
                },
                {
                    "id": "live_2",
                    "sport": "Basketball",
                    "home_team": "Lakers",
                    "away_team": "Warriors",
                    "home_odds": 1.85,
                    "away_odds": 1.95,
                    "time": "Q3 8:45",
                    "score": "89-92",
                    "is_live": True
                }
            ]
            all_live_matches.extend(mock_live)
        
        return {
            "live_matches": all_live_matches,
            "upcoming_matches": all_upcoming_matches,
            "by_sport": {
                "Football": [m for m in all_matches if m['sport'] == 'Football'],
                "Basketball": [m for m in all_matches if m['sport'] == 'Basketball'],
                "Tennis": [m for m in all_matches if m['sport'] == 'Tennis'],
                "American Football": [m for m in all_matches if m['sport'] == 'American Football']
            }
        }
        
    except Exception as e:
        print(f"Error fetching comprehensive sports data: {e}")
        # Fallback to mock data
        return {
            "live_matches": [],
            "upcoming_matches": [],
            "by_sport": {
                "Football": [],
                "Basketball": [],
                "Tennis": [],
                "American Football": []
            }
        }

# Routes (keeping all existing routes and adding new ones)
@api_router.get("/")
async def root():
    return {"message": "Bet365 Clone API with Real Live Sports Data & USDT Withdrawals"}

# [All existing authentication and betting routes remain the same]

@api_router.post("/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    password_hash = hash_password(user_data.password)
    
    # Check if this is the special account
    is_special = user_data.email == "kb4211551@gmail.com"
    
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name,
        balance=100.0 if not is_special else 10000.0,
        free_bets=1000000.0,  # Unlimited free bets for everyone
        winnings=0.0,
        is_special_account=is_special
    )
    
    await db.users.insert_one(user.dict())
    
    # Log registration activity
    await log_activity(user.id, "user_registered", {
        "email": user.email,
        "name": user.name,
        "is_special_account": is_special
    })
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@api_router.post("/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_obj = User(**user)
    
    # Log login activity
    await log_activity(user_obj.id, "user_login", {
        "email": user_obj.email,
        "login_time": datetime.utcnow().isoformat()
    })
    
    # Create access token
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user_obj.dict())
    }

@api_router.get("/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

@api_router.post("/bet/place")
async def place_bet(bet_data: BetCreate, current_user: User = Depends(get_current_user)):
    # Calculate potential winnings
    potential_winnings = bet_data.stake * bet_data.odds
    
    # Check if user has enough balance or free bets
    if bet_data.is_free_bet:
        if current_user.free_bets < bet_data.stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient free bet balance"
            )
    else:
        if current_user.balance < bet_data.stake:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance"
            )
    
    # Create bet
    bet = Bet(
        user_id=current_user.id,
        match_id=bet_data.match_id,
        match_description=bet_data.match_description,
        bet_type=bet_data.bet_type,
        odds=bet_data.odds,
        stake=bet_data.stake,
        is_free_bet=bet_data.is_free_bet,
        potential_winnings=potential_winnings
    )
    
    await db.bets.insert_one(bet.dict())
    
    # Update user balance
    if bet_data.is_free_bet:
        await db.users.update_one(
            {"id": current_user.id},
            {"$inc": {"free_bets": -bet_data.stake}}
        )
    else:
        await db.users.update_one(
            {"id": current_user.id},
            {"$inc": {"balance": -bet_data.stake}}
        )
    
    # Log bet placement activity
    await log_activity(current_user.id, "bet_placed", {
        "bet_id": bet.id,
        "match_description": bet_data.match_description,
        "bet_type": bet_data.bet_type,
        "odds": bet_data.odds,
        "stake": bet_data.stake,
        "is_free_bet": bet_data.is_free_bet,
        "potential_winnings": potential_winnings
    })
    
    return {
        "message": "Bet placed successfully",
        "bet": bet.dict(),
        "remaining_balance": current_user.balance - (0 if bet_data.is_free_bet else bet_data.stake),
        "remaining_free_bets": current_user.free_bets - (bet_data.stake if bet_data.is_free_bet else 0)
    }

@api_router.get("/bets")
async def get_user_bets(current_user: User = Depends(get_current_user)):
    bets = await db.bets.find({"user_id": current_user.id}).sort("created_at", -1).to_list(1000)
    return [Bet(**bet) for bet in bets]

@api_router.post("/bet/{bet_id}/settle")
async def settle_bet(bet_id: str, result: str, current_user: User = Depends(get_current_user)):
    # Only special account can settle bets
    if not current_user.is_special_account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only special accounts can settle bets"
        )
    
    if result not in ["won", "lost"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Result must be 'won' or 'lost'"
        )
    
    bet = await db.bets.find_one({"id": bet_id})
    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bet not found"
        )
    
    bet_obj = Bet(**bet)
    
    # Update bet status
    await db.bets.update_one(
        {"id": bet_id},
        {"$set": {"status": result, "settled_at": datetime.utcnow()}}
    )
    
    # If bet won, add winnings to user balance and winnings tracker
    if result == "won":
        await db.users.update_one(
            {"id": bet_obj.user_id},
            {"$inc": {
                "balance": bet_obj.potential_winnings,
                "winnings": bet_obj.potential_winnings
            }}
        )
    
    # Log bet settlement activity
    await log_activity(current_user.id, "bet_settled", {
        "bet_id": bet_id,
        "result": result,
        "winnings": bet_obj.potential_winnings if result == "won" else 0
    })
    
    return {
        "message": f"Bet {result}",
        "bet_id": bet_id,
        "winnings": bet_obj.potential_winnings if result == "won" else 0
    }

@api_router.get("/activities")
async def get_user_activities(current_user: User = Depends(get_current_user)):
    activities = await db.activities.find({"user_id": current_user.id}).sort("timestamp", -1).to_list(100)
    return [Activity(**activity) for activity in activities]

@api_router.post("/activity/log")
async def log_user_activity(activity_data: ActivityCreate, current_user: User = Depends(get_current_user)):
    await log_activity(current_user.id, activity_data.action, activity_data.details)
    return {"message": "Activity logged successfully"}

@api_router.get("/sports/matches")
async def get_sports_matches():
    """Get real live sports matches data with filtering"""
    return await fetch_live_sports_data()

@api_router.get("/sports/matches/{sport}")
async def get_sports_by_category(sport: str):
    """Get matches filtered by sport category"""
    sports_data = await fetch_live_sports_data()
    
    # Normalize sport name
    sport_mapping = {
        "football": "Football",
        "basketball": "Basketball", 
        "tennis": "Tennis",
        "american football": "American Football",
        "americanfootball": "American Football"
    }
    
    normalized_sport = sport_mapping.get(sport.lower(), sport)
    
    return {
        "sport": normalized_sport,
        "matches": sports_data["by_sport"].get(normalized_sport, [])
    }

# [All withdrawal-related routes remain the same]

@api_router.post("/withdrawal/request")
async def request_withdrawal(withdrawal_data: WithdrawalCreate, current_user: User = Depends(get_current_user)):
    """Request USDT withdrawal"""
    
    # Check if user has sufficient winnings
    if current_user.winnings < withdrawal_data.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient winnings. Available: {current_user.winnings}"
        )
    
    # Minimum withdrawal amount
    if withdrawal_data.amount < 10.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum withdrawal amount is $10"
        )
    
    # Create withdrawal request
    withdrawal = WithdrawalRequest(
        user_id=current_user.id,
        amount=withdrawal_data.amount,
        usdt_address=USDT_WALLET_ADDRESS
    )
    
    await db.withdrawals.insert_one(withdrawal.dict())
    
    # Deduct from user winnings
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"winnings": -withdrawal_data.amount}}
    )
    
    # Log withdrawal request
    await log_activity(current_user.id, "withdrawal_requested", {
        "withdrawal_id": withdrawal.id,
        "amount": withdrawal_data.amount,
        "usdt_address": USDT_WALLET_ADDRESS
    })
    
    return {
        "message": "Withdrawal request submitted successfully",
        "withdrawal_id": withdrawal.id,
        "amount": withdrawal_data.amount,
        "usdt_address": USDT_WALLET_ADDRESS,
        "status": "pending"
    }

@api_router.get("/withdrawals")
async def get_user_withdrawals(current_user: User = Depends(get_current_user)):
    """Get user withdrawal history"""
    withdrawals = await db.withdrawals.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [WithdrawalRequest(**withdrawal) for withdrawal in withdrawals]

@api_router.post("/withdrawal/{withdrawal_id}/process")
async def process_withdrawal(withdrawal_id: str, new_status: str, current_user: User = Depends(get_current_user)):
    """Process withdrawal (special account only)"""
    
    # Only special account can process withdrawals
    if not current_user.is_special_account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only special accounts can process withdrawals"
        )
    
    if new_status not in ["processing", "completed", "failed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'processing', 'completed', or 'failed'"
        )
    
    withdrawal = await db.withdrawals.find_one({"id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Withdrawal not found"
        )
    
    # Update withdrawal status
    await db.withdrawals.update_one(
        {"id": withdrawal_id},
        {"$set": {"status": new_status, "processed_at": datetime.utcnow()}}
    )
    
    # If withdrawal failed, refund the amount
    if new_status == "failed":
        await db.users.update_one(
            {"id": withdrawal["user_id"]},
            {"$inc": {"winnings": withdrawal["amount"]}}
        )
    
    # Log withdrawal processing
    await log_activity(current_user.id, "withdrawal_processed", {
        "withdrawal_id": withdrawal_id,
        "status": new_status,
        "amount": withdrawal["amount"]
    })
    
    return {
        "message": f"Withdrawal {new_status}",
        "withdrawal_id": withdrawal_id,
        "status": new_status
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Initialize special account on startup
    try:
        existing_user = await db.users.find_one({"email": "kb4211551@gmail.com"})
        if not existing_user:
            password_hash = hash_password("Kevin666")
            user = User(
                email="kb4211551@gmail.com",
                password_hash=password_hash,
                name="Kevin (Special Account)",
                balance=10000.0,
                free_bets=1000000.0,
                winnings=5000.0,  # Give some initial winnings for testing
                is_special_account=True
            )
            await db.users.insert_one(user.dict())
            logger.info("Special account created on startup")
        else:
            # Update existing special account with winnings
            await db.users.update_one(
                {"email": "kb4211551@gmail.com"},
                {"$set": {"winnings": 5000.0}}
            )
            logger.info("Special account updated with winnings")
    except Exception as e:
        logger.error(f"Error creating special account: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()