from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    mongo_url = os.environ.get("MONGO_URL")
    if not mongo_url:
        raise ValueError("MONGO_URL environment variable is not set")
    
    db.client = AsyncIOMotorClient(mongo_url)
    db.database = db.client[os.environ.get("DB_NAME", "bet365_clone")]
    
    # Test connection
    try:
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if db.database is None:
        await connect_to_mongo()
    return db.database

# Collection names
USERS_COLLECTION = "users"
MATCHES_COLLECTION = "matches"
BETS_COLLECTION = "bets"
TRANSACTIONS_COLLECTION = "transactions"
BET_MATCHES_COLLECTION = "bet_matches"

async def create_indexes():
    """Create database indexes for better performance"""
    database = await get_database()
    
    # Users indexes
    await database[USERS_COLLECTION].create_index("email", unique=True)
    await database[USERS_COLLECTION].create_index("username", unique=True)
    
    # Matches indexes
    await database[MATCHES_COLLECTION].create_index("match_id", unique=True)
    await database[MATCHES_COLLECTION].create_index("sport")
    await database[MATCHES_COLLECTION].create_index("status")
    await database[MATCHES_COLLECTION].create_index("commence_time")
    
    # Bets indexes
    await database[BETS_COLLECTION].create_index("user_id")
    await database[BETS_COLLECTION].create_index("match_id")
    await database[BETS_COLLECTION].create_index("status")
    await database[BETS_COLLECTION].create_index("bet_type")
    await database[BETS_COLLECTION].create_index("created_at")
    
    # Transactions indexes
    await database[TRANSACTIONS_COLLECTION].create_index("user_id")
    await database[TRANSACTIONS_COLLECTION].create_index("type")
    await database[TRANSACTIONS_COLLECTION].create_index("status")
    await database[TRANSACTIONS_COLLECTION].create_index("created_at")
    
    # Bet matches indexes
    await database[BET_MATCHES_COLLECTION].create_index("back_bet_id")
    await database[BET_MATCHES_COLLECTION].create_index("lay_bet_id")
    
    logger.info("Database indexes created successfully")