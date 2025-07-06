from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    SPECIAL = "special"  # Special account with no commission/limits

class BetType(str, Enum):
    BACK = "back"  # Traditional betting
    LAY = "lay"   # Act as bookmaker

class BetStatus(str, Enum):
    PENDING = "pending"
    MATCHED = "matched"
    SETTLED = "settled"
    CANCELLED = "cancelled"

class MatchStatus(str, Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    COMPLETED = "completed"
    SETTLED = "settled"

class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BET_STAKE = "bet_stake"
    BET_RETURN = "bet_return"
    COMMISSION = "commission"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    password_hash: str
    role: UserRole = UserRole.USER
    real_balance_usdt: float = 0.0  # Real USDT balance for withdrawals
    free_bet_balance: float = float('inf') if role == UserRole.SPECIAL else 0.0  # Unlimited free bets for VIP
    deposit_address: Optional[str] = None
    withdrawal_address: Optional[str] = None  # User's USDT wallet for withdrawals
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    # Additional profile fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    usdt_wallet: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    balance: float
    deposit_address: Optional[str]
    created_at: datetime

# Match Models
class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    match_id: str  # External API match ID
    sport: str
    home_team: str
    away_team: str
    commence_time: datetime
    status: MatchStatus = MatchStatus.UPCOMING
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    winner: Optional[str] = None  # home, away, or draw
    odds: Dict[str, float] = {}  # {"home": 1.85, "away": 2.10, "draw": 3.50}
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    settled_at: Optional[datetime] = None

class MatchCreate(BaseModel):
    match_id: str
    sport: str
    home_team: str
    away_team: str
    commence_time: datetime
    odds: Dict[str, float] = {}

class MatchUpdate(BaseModel):
    status: Optional[MatchStatus] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    winner: Optional[str] = None
    odds: Optional[Dict[str, float]] = None

# Bet Models
class Bet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    match_id: str
    bet_type: BetType
    selection: str  # home, away, draw
    stake: float
    odds: float
    potential_return: float
    status: BetStatus = BetStatus.PENDING
    matched_amount: float = 0.0
    unmatched_amount: float = 0.0
    commission_rate: float = 0.02  # 2% commission
    is_free_bet: bool = False  # VIP unlimited free bets
    created_at: datetime = Field(default_factory=datetime.utcnow)
    matched_at: Optional[datetime] = None
    settled_at: Optional[datetime] = None
    profit_loss: Optional[float] = None

class BetCreate(BaseModel):
    match_id: str
    bet_type: BetType
    selection: str
    stake: float
    odds: float
    is_free_bet: bool = False

class BetMatch(BaseModel):
    back_bet_id: str
    lay_bet_id: str
    matched_amount: float
    matched_at: datetime = Field(default_factory=datetime.utcnow)

# Transaction Models
class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    type: TransactionType
    status: TransactionStatus = TransactionStatus.PENDING
    tx_hash: Optional[str] = None
    from_address: Optional[str] = None
    to_address: Optional[str] = None
    description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None

class TransactionCreate(BaseModel):
    user_id: str
    amount: float
    type: TransactionType
    description: str = ""

class WithdrawalRequest(BaseModel):
    amount: float
    to_address: str

# Response Models
class BetResponse(BaseModel):
    id: str
    match_id: str
    match_home_team: str
    match_away_team: str
    match_commence_time: datetime
    bet_type: str
    selection: str
    stake: float
    odds: float
    potential_return: float
    status: str
    matched_amount: float
    profit_loss: Optional[float]
    created_at: datetime
    settled_at: Optional[datetime]

class MatchResponse(BaseModel):
    id: str
    match_id: str
    sport: str
    home_team: str
    away_team: str
    commence_time: datetime
    status: str
    home_score: Optional[int]
    away_score: Optional[int]
    winner: Optional[str]
    odds: Dict[str, float]
    is_live: bool
    settled_at: Optional[datetime]

class SettledMatch(BaseModel):
    match: MatchResponse
    user_bets: List[BetResponse]
    total_profit_loss: float
    total_commission: float

class BettingStats(BaseModel):
    total_bets: int
    total_staked: float
    total_returns: float
    total_profit_loss: float
    win_rate: float
    pending_bets: int
    settled_bets: int