from typing import Dict, Any, Optional
from models import User, UserRole
from database import get_database, USERS_COLLECTION
from auth import get_password_hash, verify_password
from fastapi import HTTPException, status
import logging
import re

logger = logging.getLogger(__name__)

class UserSettingsManager:
    """Manage user settings and profile updates"""
    
    def __init__(self):
        self.phone_pattern = re.compile(r'^\+?1?\d{9,15}$')
        self.wallet_pattern = re.compile(r'^T[A-Za-z0-9]{33}$')  # Tron wallet pattern
        
    async def update_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile information"""
        database = await get_database()
        
        # Get current user
        user_data = await database[USERS_COLLECTION].find_one({"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        update_fields = {}
        
        # Validate and prepare updates
        if 'username' in updates:
            new_username = updates['username'].strip()
            if len(new_username) < 3:
                raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
            
            # Check if username is already taken
            existing_user = await database[USERS_COLLECTION].find_one({
                "username": new_username,
                "id": {"$ne": user_id}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            
            update_fields['username'] = new_username
        
        if 'email' in updates:
            new_email = updates['email'].strip().lower()
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', new_email):
                raise HTTPException(status_code=400, detail="Invalid email format")
            
            # Check if email is already taken
            existing_user = await database[USERS_COLLECTION].find_one({
                "email": new_email,
                "id": {"$ne": user_id}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            update_fields['email'] = new_email
        
        if 'phone' in updates:
            phone = updates['phone'].strip()
            if phone and not self.phone_pattern.match(phone.replace(' ', '').replace('-', '')):
                raise HTTPException(status_code=400, detail="Invalid phone number format")
            update_fields['phone'] = phone
        
        if 'usdt_wallet' in updates:
            wallet = updates['usdt_wallet'].strip()
            if wallet and not self.wallet_pattern.match(wallet):
                raise HTTPException(status_code=400, detail="Invalid Tron wallet address format")
            update_fields['usdt_wallet'] = wallet
        
        if 'first_name' in updates:
            update_fields['first_name'] = updates['first_name'].strip()
        
        if 'last_name' in updates:
            update_fields['last_name'] = updates['last_name'].strip()
        
        if 'country' in updates:
            update_fields['country'] = updates['country'].strip()
        
        if 'timezone' in updates:
            update_fields['timezone'] = updates['timezone'].strip()
        
        # Update in database
        if update_fields:
            await database[USERS_COLLECTION].update_one(
                {"id": user_id},
                {"$set": update_fields}
            )
            
            logger.info(f"Profile updated for user {user.username}: {list(update_fields.keys())}")
        
        return {
            'success': True,
            'message': 'Profile updated successfully',
            'updated_fields': list(update_fields.keys())
        }
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Change user password"""
        database = await get_database()
        
        # Get current user
        user_data = await database[USERS_COLLECTION].find_one({"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Validate new password
        if len(new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
        # Hash new password
        new_password_hash = get_password_hash(new_password)
        
        # Update password
        await database[USERS_COLLECTION].update_one(
            {"id": user_id},
            {"$set": {"password_hash": new_password_hash}}
        )
        
        logger.info(f"Password changed for user {user.username}")
        
        return {
            'success': True,
            'message': 'Password changed successfully'
        }
    
    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Get complete user profile"""
        database = await get_database()
        
        user_data = await database[USERS_COLLECTION].find_one({"id": user_id})
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_data)
        
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'balance': user.balance,
            'phone': getattr(user, 'phone', ''),
            'usdt_wallet': getattr(user, 'usdt_wallet', ''),
            'first_name': getattr(user, 'first_name', ''),
            'last_name': getattr(user, 'last_name', ''),
            'country': getattr(user, 'country', ''),
            'timezone': getattr(user, 'timezone', ''),
            'created_at': user.created_at,
            'last_login': user.last_login,
            'is_active': user.is_active
        }

# Global instance
user_settings_manager = UserSettingsManager()