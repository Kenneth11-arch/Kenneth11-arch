import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import asyncio

# Import our custom modules
from database import connect_to_mongo, close_mongo_connection, create_indexes, get_database
from models import (
    User, UserCreate, UserLogin, UserResponse, 
    Match, MatchResponse, MatchCreate, MatchUpdate, MatchStatus,
    Bet, BetCreate, BetResponse, BetStatus, BetType,
    Transaction, TransactionCreate, WithdrawalRequest, TransactionType, TransactionStatus,
    BettingStats, SettledMatch, UserRole
)
from auth import authenticate_user, create_user, create_access_token, get_current_active_user, get_current_user
from sports_data import start_sports_data_service, sports_service
from betting_engine import betting_engine
from arbitrage import arbitrage_engine
from ultra_exchange import ultra_exchange
from user_settings import user_settings_manager
from usdt_service import usdt_service
from database import (
    USERS_COLLECTION, MATCHES_COLLECTION, BETS_COLLECTION, TRANSACTIONS_COLLECTION
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Bet365 Clone API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication routes
@api_router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await create_user(user_data.email, user_data.username, user_data.password)
        return UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            real_balance_usdt=user.real_balance_usdt,
            free_bet_balance=999999.0 if user.role == UserRole.SPECIAL else 0.0,
            deposit_address=user.deposit_address,
            withdrawal_address=user.withdrawal_address,
            created_at=user.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/login")
async def login(user_data: UserLogin):
    """Login user"""
    user = await authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    # Update last login
    database = await get_database()
    await database[USERS_COLLECTION].update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            real_balance_usdt=user.real_balance_usdt,
            free_bet_balance=999999.0 if user.role == UserRole.SPECIAL else 0.0,
            deposit_address=user.deposit_address,
            withdrawal_address=user.withdrawal_address,
            created_at=user.created_at
        )
    }

@api_router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        real_balance_usdt=current_user.real_balance_usdt,
        free_bet_balance=999999.0 if current_user.role == UserRole.SPECIAL else current_user.free_bet_balance,
        deposit_address=current_user.deposit_address,
        withdrawal_address=current_user.withdrawal_address,
        created_at=current_user.created_at
    )

@api_router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_active_user)):
    """Get current user balances"""
    # Refresh balances from database
    database = await get_database()
    user_data = await database[USERS_COLLECTION].find_one({"id": current_user.id})
    if user_data:
        return {
            "real_balance_usdt": user_data.get("real_balance_usdt", 0.0),
            "free_bet_balance": 999999.0 if user_data.get("role") == UserRole.SPECIAL else 0.0
        }
    return {
        "real_balance_usdt": 0.0,
        "free_bet_balance": 0.0
    }

# Sports and matches routes
@api_router.get("/sports")
async def get_sports():
    """Get available sports"""
    return [
        {"id": "all", "name": "All Sports", "icon": "🏆"},
        {"id": "nfl", "name": "American Football", "icon": "🏈"},
        {"id": "nba", "name": "Basketball", "icon": "🏀"},
        {"id": "soccer", "name": "Football", "icon": "⚽"},
        {"id": "tennis", "name": "Tennis", "icon": "🎾"},
    ]

@api_router.post("/admin/refresh-matches")
async def refresh_matches():
    """Admin endpoint to clear old matches and generate new ones"""
    database = await get_database()
    
    # Clear all existing matches
    result = await database[MATCHES_COLLECTION].delete_many({})
    logger.info(f"Deleted {result.deleted_count} old matches")
    
    # Force regeneration of new matches
    await sports_service.update_matches_in_db()
    
    # Get count of new matches
    new_count = await database[MATCHES_COLLECTION].count_documents({})
    
    return {
        "message": "Matches refreshed successfully",
        "deleted_old_matches": result.deleted_count,
        "created_new_matches": new_count
    }

@api_router.get("/matches")
async def get_matches(sport: Optional[str] = None, status: Optional[str] = None):
    """Get matches with optional filtering"""
    database = await get_database()
    
    # Build filter
    filter_dict = {}
    if sport and sport != "all":
        filter_dict["sport"] = sport
    if status:
        filter_dict["status"] = status
    
    matches = await database[MATCHES_COLLECTION].find(filter_dict).sort("commence_time", 1).to_list(100)
    
    match_responses = []
    for match_data in matches:
        match = Match(**match_data)
        
        # Check if match is live
        now = datetime.utcnow()
        is_live = (match.commence_time <= now <= match.commence_time + timedelta(hours=3) 
                  and match.status == MatchStatus.LIVE)
        
        match_responses.append(MatchResponse(
            id=match.id,
            match_id=match.match_id,
            sport=match.sport,
            home_team=match.home_team,
            away_team=match.away_team,
            commence_time=match.commence_time,
            status=match.status,
            home_score=match.home_score,
            away_score=match.away_score,
            winner=match.winner,
            odds=match.odds,
            is_live=is_live,
            settled_at=match.settled_at
        ))
    
    return match_responses

@api_router.get("/matches/{match_id}")
async def get_match(match_id: str):
    """Get single match details"""
    database = await get_database()
    match_data = await database[MATCHES_COLLECTION].find_one({"id": match_id})
    
    if not match_data:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match = Match(**match_data)
    now = datetime.utcnow()
    is_live = (match.commence_time <= now <= match.commence_time + timedelta(hours=3) 
              and match.status == MatchStatus.LIVE)
    
    return MatchResponse(
        id=match.id,
        match_id=match.match_id,
        sport=match.sport,
        home_team=match.home_team,
        away_team=match.away_team,
        commence_time=match.commence_time,
        status=match.status,
        home_score=match.home_score,
        away_score=match.away_score,
        winner=match.winner,
        odds=match.odds,
        is_live=is_live,
        settled_at=match.settled_at
    )

# Betting routes
@api_router.post("/bets")
async def place_bet(bet_data: BetCreate, current_user: User = Depends(get_current_active_user)):
    """Place a new bet"""
    try:
        bet = await betting_engine.place_bet(current_user, bet_data)
        return {"success": True, "bet_id": bet.id, "message": "Bet placed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/bets")
async def get_user_bets(
    current_user: User = Depends(get_current_active_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's betting history"""
    bets = await betting_engine.get_user_bets(current_user.id, limit, offset)
    return bets

@api_router.get("/bets/stats")
async def get_betting_stats(current_user: User = Depends(get_current_active_user)):
    """Get user's betting statistics"""
    stats = await betting_engine.get_betting_stats(current_user.id)
    return stats

@api_router.get("/bets/settled")
async def get_settled_bets(current_user: User = Depends(get_current_active_user)):
    """Get settled bets with match details"""
    database = await get_database()
    
    # Get settled bets
    settled_bets = await database[BETS_COLLECTION].find({
        "user_id": current_user.id,
        "status": BetStatus.SETTLED
    }).sort("settled_at", -1).to_list(100)
    
    # Group by match and calculate totals
    match_groups = {}
    for bet_data in settled_bets:
        bet = Bet(**bet_data)
        match_id = bet.match_id
        
        if match_id not in match_groups:
            match_groups[match_id] = {
                "bets": [],
                "total_profit_loss": 0,
                "total_commission": 0
            }
        
        match_groups[match_id]["bets"].append(bet)
        match_groups[match_id]["total_profit_loss"] += bet.profit_loss or 0
        match_groups[match_id]["total_commission"] += (bet.profit_loss or 0) * bet.commission_rate if bet.profit_loss and bet.profit_loss > 0 else 0
    
    # Get match details and build response
    settled_matches = []
    for match_id, group_data in match_groups.items():
        match_data = await database[MATCHES_COLLECTION].find_one({"id": match_id})
        if match_data:
            match = Match(**match_data)
            
            bet_responses = []
            for bet in group_data["bets"]:
                bet_responses.append(BetResponse(
                    id=bet.id,
                    match_id=bet.match_id,
                    match_home_team=match.home_team,
                    match_away_team=match.away_team,
                    match_commence_time=match.commence_time,
                    bet_type=bet.bet_type,
                    selection=bet.selection,
                    stake=bet.stake,
                    odds=bet.odds,
                    potential_return=bet.potential_return,
                    status=bet.status,
                    matched_amount=bet.matched_amount,
                    profit_loss=bet.profit_loss,
                    created_at=bet.created_at,
                    settled_at=bet.settled_at
                ))
            
            settled_matches.append(SettledMatch(
                match=MatchResponse(
                    id=match.id,
                    match_id=match.match_id,
                    sport=match.sport,
                    home_team=match.home_team,
                    away_team=match.away_team,
                    commence_time=match.commence_time,
                    status=match.status,
                    home_score=match.home_score,
                    away_score=match.away_score,
                    winner=match.winner,
                    odds=match.odds,
                    is_live=False,
                    settled_at=match.settled_at
                ),
                user_bets=bet_responses,
                total_profit_loss=group_data["total_profit_loss"],
                total_commission=group_data["total_commission"]
            ))
    
    return settled_matches

# Transaction routes
@api_router.get("/transactions")
async def get_transactions(
    current_user: User = Depends(get_current_active_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's transaction history"""
    database = await get_database()
    
    transactions = await database[TRANSACTIONS_COLLECTION].find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    return [Transaction(**tx) for tx in transactions]

@api_router.post("/withdraw")
async def request_withdrawal(
    withdrawal: WithdrawalRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Request REAL USDT withdrawal"""
    try:
        result = await usdt_service.process_withdrawal(
            current_user, 
            withdrawal.amount, 
            withdrawal.to_address
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def confirm_withdrawal_after_delay(transaction_id: str):
    """Simulate withdrawal confirmation after delay"""
    await asyncio.sleep(30)  # Wait 30 seconds
    
    database = await get_database()
    await database[TRANSACTIONS_COLLECTION].update_one(
        {"id": transaction_id},
        {
            "$set": {
                "status": TransactionStatus.CONFIRMED,
                "confirmed_at": datetime.utcnow(),
                "tx_hash": f"simulated_tx_{transaction_id[:8]}"
            }
        }
    )

# Admin routes for testing
@api_router.post("/admin/create-special-user")
async def create_special_user():
    """Create special user account for testing"""
    try:
        # Check if user already exists
        database = await get_database()
        existing_user = await database[USERS_COLLECTION].find_one({"email": "kb4211551@gmail.com"})
        
        if existing_user:
            # Update existing user to special role and real balance
            await database[USERS_COLLECTION].update_one(
                {"email": "kb4211551@gmail.com"},
                {"$set": {
                    "role": UserRole.SPECIAL,
                    "real_balance_usdt": 0.0,
                    "withdrawal_address": "TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ"
                }}
            )
            return {"success": True, "message": "Special user updated", "user_id": existing_user["id"]}
        else:
            # Create new special user
            user = await create_user(
                email="kb4211551@gmail.com",
                username="Kevin666",
                password="Kevin666",
                role=UserRole.SPECIAL
            )
            
            # Set withdrawal address
            await database[USERS_COLLECTION].update_one(
                {"id": user.id},
                {"$set": {"withdrawal_address": "TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ"}}
            )
            
            return {"success": True, "message": "Special user created", "user_id": user.id}
    except Exception as e:
        return {"success": False, "message": str(e)}

@api_router.post("/admin/add-real-usdt")
async def add_real_usdt(
    user_id: str,
    amount: float = 100.0,
    current_user: User = Depends(get_current_active_user)
):
    """Add real USDT to user account (for testing)"""
    database = await get_database()
    
    # Add USDT to real balance
    await database[USERS_COLLECTION].update_one(
        {"id": user_id},
        {"$inc": {"real_balance_usdt": amount}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        type=TransactionType.DEPOSIT,
        status=TransactionStatus.CONFIRMED,
        description=f"Real USDT added by admin"
    )
    await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
    
    return {"success": True, "message": f"Added ${amount} real USDT"}

# User Settings routes
@api_router.get("/settings/profile")
async def get_user_profile_settings(current_user: User = Depends(get_current_active_user)):
    """Get user profile for settings"""
    profile = await user_settings_manager.get_user_profile(current_user.id)
    return profile

@api_router.put("/settings/profile")
async def update_user_profile(
    updates: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Update user profile"""
    result = await user_settings_manager.update_profile(current_user.id, updates)
    return result

@api_router.post("/settings/change-password")
async def change_user_password(
    password_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Change user password"""
    current_password = password_data.get('current_password')
    new_password = password_data.get('new_password')
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current and new password required")
    
    result = await user_settings_manager.change_password(
        current_user.id, current_password, new_password
    )
    return result

# UltraExchange routes
@api_router.get("/ultra/matches")
async def get_ultra_exchange_matches():
    """Get matches with lay odds for UltraExchange"""
    matches = await ultra_exchange.get_live_matches_with_lay_odds()
    return matches

@api_router.post("/ultra/lay-bet")
async def place_ultra_lay_bet(
    bet_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Place a lay bet on UltraExchange"""
    try:
        result = await ultra_exchange.place_lay_bet(
            user=current_user,
            match_id=bet_data['match_id'],
            selection=bet_data['selection'],
            lay_odds=float(bet_data['lay_odds']),
            lay_stake=float(bet_data['lay_stake'])
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/ultra/my-lay-bets")
async def get_my_lay_bets(current_user: User = Depends(get_current_active_user)):
    """Get user's lay betting history"""
    lay_bets = await ultra_exchange.get_user_lay_bets(current_user.id)
    return lay_bets

@api_router.get("/ultra/statistics")
async def get_ultra_statistics(current_user: User = Depends(get_current_active_user)):
    """Get UltraExchange statistics for user"""
    stats = await ultra_exchange.get_exchange_statistics(current_user.id)
    return stats

# Arbitrage routes (Special accounts only)
@api_router.get("/arbitrage/opportunities")
async def get_arbitrage_opportunities(current_user: User = Depends(get_current_active_user)):
    """Get risk-free arbitrage opportunities (VIP only)"""
    if current_user.role != UserRole.SPECIAL:
        raise HTTPException(status_code=403, detail="Access denied. VIP account required.")
    
    opportunities = await arbitrage_engine.get_arbitrage_opportunities(current_user)
    return opportunities

@api_router.post("/arbitrage/calculate")
async def calculate_lay_amount(
    calculation_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Calculate lay amount for given bet365 stake"""
    if current_user.role != UserRole.SPECIAL:
        raise HTTPException(status_code=403, detail="Access denied. VIP account required.")
    
    result = arbitrage_engine.calculate_lay_amount(
        bet365_stake=float(calculation_data['bet365_stake']),
        bet365_odd=float(calculation_data['bet365_odd']),
        ultra_lay_odd=float(calculation_data['ultra_lay_odd'])
    )
    return result

@api_router.post("/arbitrage/auto-lay")
async def auto_lay_arbitrage_bet(
    arbitrage_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Automatically place lay bet on UltraExchange for arbitrage"""
    if current_user.role != UserRole.SPECIAL:
        raise HTTPException(status_code=403, detail="Access denied. VIP account required.")
    
    try:
        # Place the lay bet automatically
        result = await ultra_exchange.place_lay_bet(
            user=current_user,
            match_id=arbitrage_data['match_id'],
            selection=arbitrage_data['selection'],
            lay_odds=float(arbitrage_data['lay_odds']),
            lay_stake=float(arbitrage_data['lay_stake'])
        )
        
        return {
            'success': True,
            'message': 'Arbitrage lay bet placed automatically',
            'lay_bet': result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Bet365 Clone API...")
    
    # Connect to database
    await connect_to_mongo()
    
    # Create database indexes
    await create_indexes()
    
    # Start sports data service
    await start_sports_data_service()
    
    # Create special user if it doesn't exist
    try:
        await create_special_user()
    except:
        pass  # User already exists
    
    logger.info("Bet365 Clone API started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Bet365 Clone API...")
    await close_mongo_connection()
    logger.info("Bet365 Clone API shutdown complete")

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Bet365 Clone API is running!", "version": "1.0.0"}
