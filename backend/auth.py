from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import jwt
import os
from models import User, UserRole
from database import get_database, USERS_COLLECTION

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "bet365-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    database = await get_database()
    user_data = await database[USERS_COLLECTION].find_one({"id": user_id})
    if user_data is None:
        raise credentials_exception
    
    user = User(**user_data)
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SPECIAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def authenticate_user(email: str, password: str) -> Optional[User]:
    database = await get_database()
    user_data = await database[USERS_COLLECTION].find_one({"email": email})
    
    if not user_data:
        return None
    
    user = User(**user_data)
    if not verify_password(password, user.password_hash):
        return None
    
    return user

async def create_user(email: str, username: str, password: str, role: UserRole = UserRole.USER) -> User:
    database = await get_database()
    
    # Check if user already exists
    existing_user = await database[USERS_COLLECTION].find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_username = await database[USERS_COLLECTION].find_one({"username": username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    user = User(
        email=email,
        username=username,
        password_hash=get_password_hash(password),
        role=role,
        balance=1000.0  # Start with 1000 free credits
    )
    
    await database[USERS_COLLECTION].insert_one(user.dict())
    return user