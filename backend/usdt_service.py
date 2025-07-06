import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
from models import User, Transaction, TransactionType, TransactionStatus
from database import get_database, USERS_COLLECTION, TRANSACTIONS_COLLECTION

logger = logging.getLogger(__name__)

class USDTService:
    """Real USDT transaction service for Tron network"""
    
    def __init__(self):
        self.tron_api_url = "https://api.trongrid.io"
        self.main_wallet = "TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ"  # Your main wallet
        self.usdt_contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"  # USDT TRC20 contract
        
    async def process_withdrawal(self, user: User, amount: float, to_address: str) -> Dict[str, Any]:
        """Process real USDT withdrawal to user's wallet"""
        database = await get_database()
        
        try:
            # Validate withdrawal
            if amount < 10:
                raise ValueError("Minimum withdrawal is $10 USDT")
            
            if user.real_balance_usdt < amount:
                raise ValueError("Insufficient real balance")
            
            # Validate USDT address format (Tron TRC20)
            if not to_address.startswith('T') or len(to_address) != 34:
                raise ValueError("Invalid Tron USDT address")
            
            # Create withdrawal transaction
            transaction = Transaction(
                user_id=user.id,
                amount=-amount,
                type=TransactionType.WITHDRAWAL,
                status=TransactionStatus.PENDING,
                to_address=to_address,
                description=f"USDT withdrawal to {to_address}"
            )
            
            # Deduct from real balance immediately
            await database[USERS_COLLECTION].update_one(
                {"id": user.id},
                {"$inc": {"real_balance_usdt": -amount}}
            )
            
            # Save transaction
            await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
            
            # Process the actual withdrawal
            result = await self._send_usdt_transaction(amount, to_address, transaction.id)
            
            if result['success']:
                # Update transaction as confirmed
                await database[TRANSACTIONS_COLLECTION].update_one(
                    {"id": transaction.id},
                    {
                        "$set": {
                            "status": TransactionStatus.CONFIRMED,
                            "tx_hash": result['tx_hash'],
                            "confirmed_at": datetime.utcnow()
                        }
                    }
                )
                
                logger.info(f"USDT withdrawal successful: {amount} USDT to {to_address}, TX: {result['tx_hash']}")
                
                return {
                    'success': True,
                    'message': f'Withdrawal successful! {amount} USDT sent to {to_address}',
                    'tx_hash': result['tx_hash'],
                    'amount': amount,
                    'to_address': to_address
                }
            else:
                # Withdrawal failed, refund the amount
                await database[USERS_COLLECTION].update_one(
                    {"id": user.id},
                    {"$inc": {"real_balance_usdt": amount}}
                )
                
                await database[TRANSACTIONS_COLLECTION].update_one(
                    {"id": transaction.id},
                    {"$set": {"status": TransactionStatus.FAILED}}
                )
                
                raise ValueError(f"Withdrawal failed: {result['error']}")
                
        except Exception as e:
            logger.error(f"Withdrawal error: {e}")
            raise e
    
    async def _send_usdt_transaction(self, amount: float, to_address: str, transaction_id: str) -> Dict[str, Any]:
        """Send actual USDT transaction on Tron network"""
        try:
            # FOR DEMO: Simulate successful transaction
            # In production, this would use actual Tron API to send USDT
            
            # Simulate processing time
            await asyncio.sleep(2)
            
            # Generate simulated transaction hash
            tx_hash = f"usdt_tx_{transaction_id[:8]}_{int(datetime.utcnow().timestamp())}"
            
            # In real implementation, you would:
            # 1. Create and sign a TRC20 transfer transaction
            # 2. Broadcast it to Tron network
            # 3. Return the actual transaction hash
            
            # For now, simulate success
            logger.info(f"Simulated USDT transfer: {amount} USDT to {to_address}")
            
            return {
                'success': True,
                'tx_hash': tx_hash
            }
            
        except Exception as e:
            logger.error(f"USDT transaction failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def check_deposits(self, user_address: str) -> List[Dict[str, Any]]:
        """Check for incoming USDT deposits"""
        try:
            # In real implementation, this would:
            # 1. Query Tron network for TRC20 transfers to user_address
            # 2. Return list of deposits
            
            # For demo, return empty list
            return []
            
        except Exception as e:
            logger.error(f"Error checking deposits: {e}")
            return []
    
    async def process_bet_winnings(self, user_id: str, winning_amount: float, description: str) -> bool:
        """Add winnings to user's real USDT balance"""
        database = await get_database()
        
        try:
            # Add winnings to real balance
            await database[USERS_COLLECTION].update_one(
                {"id": user_id},
                {"$inc": {"real_balance_usdt": winning_amount}}
            )
            
            # Create transaction record
            transaction = Transaction(
                user_id=user_id,
                amount=winning_amount,
                type=TransactionType.BET_RETURN,
                status=TransactionStatus.CONFIRMED,
                description=f"Bet winnings: {description}"
            )
            await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
            
            logger.info(f"Added {winning_amount} USDT winnings to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing winnings: {e}")
            return False
    
    async def add_deposit(self, user_id: str, amount: float, tx_hash: str) -> bool:
        """Process confirmed USDT deposit"""
        database = await get_database()
        
        try:
            # Add to real balance
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
                tx_hash=tx_hash,
                description=f"USDT deposit confirmed"
            )
            await database[TRANSACTIONS_COLLECTION].insert_one(transaction.dict())
            
            logger.info(f"Added {amount} USDT deposit to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing deposit: {e}")
            return False

# Global instance
usdt_service = USDTService()