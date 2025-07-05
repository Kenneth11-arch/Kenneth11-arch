import requests
import json
import time
import random
import unittest
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://fc8c002c-2e63-424b-a18a-54265260fd7d.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# USDT Wallet Address for testing
USDT_WALLET_ADDRESS = "TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ"

class Bet365CloneBackendTest(unittest.TestCase):
    def setUp(self):
        # Generate a unique email for testing
        timestamp = int(time.time())
        self.test_user_email = f"test_user_{timestamp}@example.com"
        self.test_user_password = "TestPassword123"
        self.test_user_name = "Test User"
        
        # Special account credentials
        self.special_email = "kb4211551@gmail.com"
        self.special_password = "Kevin666"
        
        # Store tokens and user data
        self.test_user_token = None
        self.test_user_data = None
        self.special_user_token = None
        self.special_user_data = None
        
        # For storing bet data
        self.placed_bet_id = None
        
        # For storing withdrawal data
        self.withdrawal_id = None

    def test_01_register_new_user(self):
        """Test registration of a new user"""
        print("\n=== Testing User Registration ===")
        
        # Register a new user
        register_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": self.test_user_name
        }
        
        response = requests.post(f"{API_URL}/register", json=register_data)
        response_data = response.json()
        
        print(f"Registration Response Status: {response.status_code}")
        print(f"Registration Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response_data)
        self.assertIn("user", response_data)
        self.assertEqual(response_data["user"]["email"], self.test_user_email)
        self.assertEqual(response_data["user"]["name"], self.test_user_name)
        self.assertEqual(response_data["user"]["balance"], 100.0)  # Default balance
        
        # Store the token for future requests
        self.test_user_token = response_data["access_token"]
        self.test_user_data = response_data["user"]
        
        print(f"Successfully registered user: {self.test_user_email}")

    def test_02_login_special_account(self):
        """Test login with the special account"""
        print("\n=== Testing Special Account Login ===")
        
        # Login with special account
        login_data = {
            "email": self.special_email,
            "password": self.special_password
        }
        
        response = requests.post(f"{API_URL}/login", json=login_data)
        response_data = response.json()
        
        print(f"Special Account Login Response Status: {response.status_code}")
        print(f"Special Account Login Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access_token", response_data)
        self.assertIn("user", response_data)
        self.assertEqual(response_data["user"]["email"], self.special_email)
        self.assertTrue(response_data["user"]["is_special_account"])
        
        # Store the token for future requests
        self.special_user_token = response_data["access_token"]
        self.special_user_data = response_data["user"]
        
        print(f"Successfully logged in with special account: {self.special_email}")
        print(f"Special account balance: {response_data['user']['balance']}")
        print(f"Special account free bets: {response_data['user']['free_bets']}")

    def test_03_verify_special_account_privileges(self):
        """Verify the special account has unlimited free bets and special privileges"""
        print("\n=== Testing Special Account Privileges ===")
        
        # Ensure we have the special account token
        if not self.special_user_token:
            self.test_02_login_special_account()
        
        # Check user profile to verify privileges
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        response_data = response.json()
        
        print(f"Special Account Profile Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["email"], self.special_email)
        self.assertTrue(response_data["is_special_account"])
        self.assertGreaterEqual(response_data["free_bets"], 1000000.0)  # Unlimited free bets
        self.assertGreaterEqual(response_data["balance"], 10000.0)  # High balance
        
        print("Special account has the expected privileges and unlimited free bets")

    def test_04_user_profile_endpoint(self):
        """Test user profile endpoint"""
        print("\n=== Testing User Profile Endpoint ===")
        
        # Ensure we have the test user token
        if not self.test_user_token:
            self.test_01_register_new_user()
        
        # Get user profile
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        response_data = response.json()
        
        print(f"User Profile Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["email"], self.test_user_email)
        self.assertEqual(response_data["name"], self.test_user_name)
        self.assertEqual(response_data["balance"], 100.0)  # Default balance
        
        print("User profile endpoint working correctly")

    def test_05_get_sports_matches(self):
        """Test getting sports matches data"""
        print("\n=== Testing Sports Matches Endpoint ===")
        
        response = requests.get(f"{API_URL}/sports/matches")
        response_data = response.json()
        
        print(f"Sports Matches Response Status: {response.status_code}")
        print(f"Sports Matches Response (sample): {json.dumps(response_data.keys(), indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("live_matches", response_data)
        self.assertIn("upcoming_matches", response_data)
        self.assertTrue(len(response_data["live_matches"]) > 0)
        self.assertTrue(len(response_data["upcoming_matches"]) > 0)
        
        # Store a match for betting tests
        self.test_match = response_data["live_matches"][0]
        
        print(f"Successfully retrieved sports matches data")
        print(f"Sample match: {json.dumps(self.test_match, indent=2)}")

    def test_06_place_bet_regular_balance(self):
        """Test placing a bet with regular balance"""
        print("\n=== Testing Bet Placement with Regular Balance ===")
        
        # Ensure we have the test user token and match data
        if not self.test_user_token:
            self.test_01_register_new_user()
        if not hasattr(self, 'test_match'):
            self.test_05_get_sports_matches()
        
        # Place a bet
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        bet_data = {
            "match_id": self.test_match["id"],
            "match_description": f"{self.test_match['home_team']} vs {self.test_match['away_team']}",
            "bet_type": "home_win",
            "odds": self.test_match["home_odds"],
            "stake": 10.0,
            "is_free_bet": False
        }
        
        response = requests.post(f"{API_URL}/bet/place", headers=headers, json=bet_data)
        response_data = response.json()
        
        print(f"Place Bet Response Status: {response.status_code}")
        print(f"Place Bet Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        self.assertIn("bet", response_data)
        self.assertIn("remaining_balance", response_data)
        
        # Store the bet ID for later tests
        self.placed_bet_id = response_data["bet"]["id"]
        
        # Verify balance deduction
        self.assertEqual(response_data["remaining_balance"], 90.0)  # 100 - 10
        
        print(f"Successfully placed bet with regular balance")
        print(f"Remaining balance: {response_data['remaining_balance']}")

    def test_07_place_bet_free_bets(self):
        """Test placing a bet with free bets"""
        print("\n=== Testing Bet Placement with Free Bets ===")
        
        # Ensure we have the test user token and match data
        if not self.test_user_token:
            self.test_01_register_new_user()
        if not hasattr(self, 'test_match'):
            self.test_05_get_sports_matches()
        
        # Place a bet with free bets
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        bet_data = {
            "match_id": self.test_match["id"],
            "match_description": f"{self.test_match['home_team']} vs {self.test_match['away_team']}",
            "bet_type": "away_win",
            "odds": self.test_match["away_odds"],
            "stake": 50.0,
            "is_free_bet": True
        }
        
        response = requests.post(f"{API_URL}/bet/place", headers=headers, json=bet_data)
        response_data = response.json()
        
        print(f"Place Free Bet Response Status: {response.status_code}")
        print(f"Place Free Bet Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        self.assertIn("bet", response_data)
        self.assertIn("remaining_free_bets", response_data)
        
        # Verify free bets deduction
        initial_free_bets = 1000000.0
        self.assertEqual(response_data["remaining_free_bets"], initial_free_bets - 50.0)
        
        print(f"Successfully placed bet with free bets")
        print(f"Remaining free bets: {response_data['remaining_free_bets']}")

    def test_08_get_bet_history(self):
        """Test retrieving bet history"""
        print("\n=== Testing Bet History Retrieval ===")
        
        # Ensure we have the test user token and have placed bets
        if not self.test_user_token:
            self.test_01_register_new_user()
            self.test_06_place_bet_regular_balance()
            self.test_07_place_bet_free_bets()
        
        # Get bet history
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/bets", headers=headers)
        response_data = response.json()
        
        print(f"Bet History Response Status: {response.status_code}")
        print(f"Bet History Response (count): {len(response_data)}")
        if response_data:
            print(f"Sample bet: {json.dumps(response_data[0], indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response_data, list)
        self.assertGreaterEqual(len(response_data), 2)  # Should have at least 2 bets
        
        print(f"Successfully retrieved bet history with {len(response_data)} bets")

    def test_09_settle_bet_special_account(self):
        """Test settling a bet with the special account"""
        print("\n=== Testing Bet Settlement with Special Account ===")
        
        # Ensure we have the special account token and a placed bet
        if not self.special_user_token:
            self.test_02_login_special_account()
        if not self.placed_bet_id:
            self.test_06_place_bet_regular_balance()
        
        # Settle the bet
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        result = "won"  # or "lost"
        
        response = requests.post(f"{API_URL}/bet/{self.placed_bet_id}/settle?result={result}", headers=headers)
        response_data = response.json()
        
        print(f"Settle Bet Response Status: {response.status_code}")
        print(f"Settle Bet Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        self.assertEqual(response_data["bet_id"], self.placed_bet_id)
        
        print(f"Successfully settled bet with result: {result}")
        
        # Verify regular user can't settle bets
        if self.test_user_token:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = requests.post(f"{API_URL}/bet/{self.placed_bet_id}/settle?result=lost", headers=headers)
            
            print(f"Regular User Settle Bet Response Status: {response.status_code}")
            self.assertNotEqual(response.status_code, 200)
            print("Verified regular users cannot settle bets")

    def test_10_get_activities(self):
        """Test retrieving user activity logs"""
        print("\n=== Testing Activity Logs Retrieval ===")
        
        # Ensure we have the test user token
        if not self.test_user_token:
            self.test_01_register_new_user()
        
        # Get activity logs
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/activities", headers=headers)
        response_data = response.json()
        
        print(f"Activities Response Status: {response.status_code}")
        print(f"Activities Response (count): {len(response_data)}")
        if response_data:
            print(f"Sample activity: {json.dumps(response_data[0], indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response_data, list)
        
        print(f"Successfully retrieved {len(response_data)} activity logs")

    def test_11_log_activity(self):
        """Test logging a custom activity"""
        print("\n=== Testing Activity Logging ===")
        
        # Ensure we have the test user token
        if not self.test_user_token:
            self.test_01_register_new_user()
        
        # Log a custom activity
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        activity_data = {
            "action": "custom_action",
            "details": {
                "description": "This is a test custom activity",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        response = requests.post(f"{API_URL}/activity/log", headers=headers, json=activity_data)
        response_data = response.json()
        
        print(f"Log Activity Response Status: {response.status_code}")
        print(f"Log Activity Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        
        # Verify the activity was logged
        response = requests.get(f"{API_URL}/activities", headers=headers)
        activities = response.json()
        
        found_activity = False
        for activity in activities:
            if activity["action"] == "custom_action":
                found_activity = True
                break
        
        self.assertTrue(found_activity, "Custom activity was not found in activity logs")
        print("Successfully logged and verified custom activity")

    def test_12_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid login
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = requests.post(f"{API_URL}/login", json=login_data)
        print(f"Invalid Login Response Status: {response.status_code}")
        self.assertEqual(response.status_code, 401)
        
        # Test insufficient balance
        if self.test_user_token:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            # Get sports matches
            if not hasattr(self, 'test_match'):
                self.test_05_get_sports_matches()
            
            # Try to place a bet with more than available balance
            bet_data = {
                "match_id": self.test_match["id"],
                "match_description": f"{self.test_match['home_team']} vs {self.test_match['away_team']}",
                "bet_type": "home_win",
                "odds": self.test_match["home_odds"],
                "stake": 1000.0,  # More than the 100.0 initial balance
                "is_free_bet": False
            }
            
            response = requests.post(f"{API_URL}/bet/place", headers=headers, json=bet_data)
            print(f"Insufficient Balance Response Status: {response.status_code}")
            self.assertEqual(response.status_code, 400)
        
        print("Error handling tests completed successfully")
        
    def test_13_verify_special_account_winnings(self):
        """Verify the special account has initial winnings of $5,000"""
        print("\n=== Testing Special Account Initial Winnings ===")
        
        # Ensure we have the special account token
        if not self.special_user_token:
            self.test_02_login_special_account()
        
        # Check user profile to verify winnings
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        response_data = response.json()
        
        print(f"Special Account Profile Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["email"], self.special_email)
        self.assertTrue(response_data["is_special_account"])
        self.assertEqual(response_data["winnings"], 5000.0)  # Verify $5,000 initial winnings
        
        print("Special account has the expected initial winnings of $5,000")
        
    def test_14_winnings_tracking_after_bet_settlement(self):
        """Test winnings tracking when bets are settled as won"""
        print("\n=== Testing Winnings Tracking After Bet Settlement ===")
        
        # Ensure we have both user tokens and a placed bet
        if not self.test_user_token:
            self.test_01_register_new_user()
        if not self.special_user_token:
            self.test_02_login_special_account()
        
        # Get user profile before bet settlement
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        user_before = response.json()
        initial_winnings = user_before["winnings"]
        
        print(f"Initial user winnings: {initial_winnings}")
        
        # Place a new bet
        if not hasattr(self, 'test_match'):
            self.test_05_get_sports_matches()
            
        bet_data = {
            "match_id": self.test_match["id"],
            "match_description": f"{self.test_match['home_team']} vs {self.test_match['away_team']}",
            "bet_type": "home_win",
            "odds": self.test_match["home_odds"],
            "stake": 20.0,
            "is_free_bet": False
        }
        
        response = requests.post(f"{API_URL}/bet/place", headers=headers, json=bet_data)
        bet_response = response.json()
        new_bet_id = bet_response["bet"]["id"]
        potential_winnings = bet_response["bet"]["potential_winnings"]
        
        print(f"Placed new bet with potential winnings: {potential_winnings}")
        
        # Settle the bet as won using special account
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.post(f"{API_URL}/bet/{new_bet_id}/settle?result=won", headers=headers)
        settle_response = response.json()
        
        print(f"Bet settlement response: {json.dumps(settle_response, indent=2)}")
        
        # Check user profile after bet settlement
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        user_after = response.json()
        final_winnings = user_after["winnings"]
        
        print(f"Final user winnings: {final_winnings}")
        
        # Verify winnings increased by the potential winnings amount
        self.assertEqual(final_winnings, initial_winnings + potential_winnings)
        
        print(f"Winnings correctly tracked after bet settlement. Increased by {potential_winnings}")
        
    def test_15_usdt_withdrawal_valid_amount(self):
        """Test USDT withdrawal with valid amount from winnings"""
        print("\n=== Testing USDT Withdrawal with Valid Amount ===")
        
        # Ensure we have the special account token (which has winnings)
        if not self.special_user_token:
            self.test_02_login_special_account()
            self.test_13_verify_special_account_winnings()
        
        # Get current winnings
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        user_before = response.json()
        initial_winnings = user_before["winnings"]
        
        print(f"Initial winnings: {initial_winnings}")
        
        # Request withdrawal (less than available winnings)
        withdrawal_amount = 100.0
        withdrawal_data = {
            "amount": withdrawal_amount
        }
        
        response = requests.post(f"{API_URL}/withdrawal/request", headers=headers, json=withdrawal_data)
        response_data = response.json()
        
        print(f"Withdrawal Request Response Status: {response.status_code}")
        print(f"Withdrawal Request Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        self.assertIn("withdrawal_id", response_data)
        self.assertEqual(response_data["amount"], withdrawal_amount)
        self.assertEqual(response_data["usdt_address"], USDT_WALLET_ADDRESS)
        self.assertEqual(response_data["status"], "pending")
        
        # Store withdrawal ID for later tests
        self.withdrawal_id = response_data["withdrawal_id"]
        
        # Check updated winnings
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        user_after = response.json()
        final_winnings = user_after["winnings"]
        
        print(f"Final winnings after withdrawal: {final_winnings}")
        
        # Verify winnings decreased by the withdrawal amount
        self.assertEqual(final_winnings, initial_winnings - withdrawal_amount)
        
        print(f"Successfully requested USDT withdrawal of {withdrawal_amount}")
        
    def test_16_usdt_withdrawal_insufficient_winnings(self):
        """Test USDT withdrawal with insufficient winnings"""
        print("\n=== Testing USDT Withdrawal with Insufficient Winnings ===")
        
        # Ensure we have the test user token (which has no winnings)
        if not self.test_user_token:
            self.test_01_register_new_user()
        
        # Get current winnings
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        response = requests.get(f"{API_URL}/user/profile", headers=headers)
        user_data = response.json()
        current_winnings = user_data["winnings"]
        
        print(f"Current winnings: {current_winnings}")
        
        # Request withdrawal (more than available winnings)
        withdrawal_amount = current_winnings + 100.0
        withdrawal_data = {
            "amount": withdrawal_amount
        }
        
        response = requests.post(f"{API_URL}/withdrawal/request", headers=headers, json=withdrawal_data)
        
        print(f"Insufficient Winnings Withdrawal Response Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error response: {response.json()}")
        
        self.assertEqual(response.status_code, 400)
        
        print("Successfully verified withdrawal request fails with insufficient winnings")
        
    def test_17_usdt_withdrawal_below_minimum(self):
        """Test USDT withdrawal below minimum amount ($10)"""
        print("\n=== Testing USDT Withdrawal Below Minimum Amount ===")
        
        # Ensure we have the special account token (which has winnings)
        if not self.special_user_token:
            self.test_02_login_special_account()
        
        # Request withdrawal below minimum
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        withdrawal_data = {
            "amount": 5.0  # Below $10 minimum
        }
        
        response = requests.post(f"{API_URL}/withdrawal/request", headers=headers, json=withdrawal_data)
        
        print(f"Below Minimum Withdrawal Response Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error response: {response.json()}")
        
        self.assertEqual(response.status_code, 400)
        
        print("Successfully verified withdrawal request fails when below minimum amount")
        
    def test_18_withdrawal_history(self):
        """Test withdrawal history tracking"""
        print("\n=== Testing Withdrawal History Tracking ===")
        
        # Ensure we have the special account token and have made a withdrawal
        if not self.special_user_token:
            self.test_02_login_special_account()
        if not self.withdrawal_id:
            self.test_15_usdt_withdrawal_valid_amount()
        
        # Get withdrawal history
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.get(f"{API_URL}/withdrawals", headers=headers)
        response_data = response.json()
        
        print(f"Withdrawal History Response Status: {response.status_code}")
        print(f"Withdrawal History Response (count): {len(response_data)}")
        if response_data:
            print(f"Sample withdrawal: {json.dumps(response_data[0], indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response_data, list)
        self.assertGreaterEqual(len(response_data), 1)
        
        # Verify our withdrawal is in the history
        found_withdrawal = False
        for withdrawal in response_data:
            if withdrawal["id"] == self.withdrawal_id:
                found_withdrawal = True
                self.assertEqual(withdrawal["status"], "pending")
                self.assertEqual(withdrawal["usdt_address"], USDT_WALLET_ADDRESS)
                break
        
        self.assertTrue(found_withdrawal, "Created withdrawal not found in history")
        print(f"Successfully retrieved withdrawal history with {len(response_data)} withdrawals")
        
    def test_19_process_withdrawal_special_account(self):
        """Test special account withdrawal processing capabilities"""
        print("\n=== Testing Special Account Withdrawal Processing ===")
        
        # Ensure we have the special account token and a withdrawal
        if not self.special_user_token:
            self.test_02_login_special_account()
        if not self.withdrawal_id:
            self.test_15_usdt_withdrawal_valid_amount()
        
        # Process the withdrawal
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        new_status = "processing"
        
        response = requests.post(f"{API_URL}/withdrawal/{self.withdrawal_id}/process?new_status={new_status}", headers=headers)
        response_data = response.json()
        
        print(f"Process Withdrawal Response Status: {response.status_code}")
        print(f"Process Withdrawal Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response_data)
        self.assertEqual(response_data["withdrawal_id"], self.withdrawal_id)
        self.assertEqual(response_data["status"], new_status)
        
        # Verify regular user can't process withdrawals
        if self.test_user_token:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = requests.post(f"{API_URL}/withdrawal/{self.withdrawal_id}/process?new_status=completed", headers=headers)
            
            print(f"Regular User Process Withdrawal Response Status: {response.status_code}")
            self.assertNotEqual(response.status_code, 200)
            print("Verified regular users cannot process withdrawals")
        
        print(f"Successfully processed withdrawal to status: {new_status}")
        
        # Complete the withdrawal
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        new_status = "completed"
        
        response = requests.post(f"{API_URL}/withdrawal/{self.withdrawal_id}/process?new_status={new_status}", headers=headers)
        response_data = response.json()
        
        print(f"Complete Withdrawal Response Status: {response.status_code}")
        print(f"Complete Withdrawal Response: {json.dumps(response_data, indent=2)}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data["status"], new_status)
        
        print(f"Successfully completed withdrawal process")
        
    def test_20_withdrawal_activity_logging(self):
        """Test logging of withdrawal activities"""
        print("\n=== Testing Withdrawal Activity Logging ===")
        
        # Ensure we have the special account token and have processed a withdrawal
        if not self.special_user_token:
            self.test_02_login_special_account()
        if not self.withdrawal_id:
            self.test_15_usdt_withdrawal_valid_amount()
            self.test_19_process_withdrawal_special_account()
        
        # Get activity logs
        headers = {"Authorization": f"Bearer {self.special_user_token}"}
        response = requests.get(f"{API_URL}/activities", headers=headers)
        activities = response.json()
        
        print(f"Activities Response Status: {response.status_code}")
        print(f"Activities Response (count): {len(activities)}")
        
        self.assertEqual(response.status_code, 200)
        
        # Check for withdrawal-related activities
        withdrawal_request_found = False
        withdrawal_processed_found = False
        
        for activity in activities:
            if activity["action"] == "withdrawal_requested":
                withdrawal_request_found = True
                print(f"Found withdrawal_requested activity: {json.dumps(activity, indent=2)}")
            elif activity["action"] == "withdrawal_processed":
                withdrawal_processed_found = True
                print(f"Found withdrawal_processed activity: {json.dumps(activity, indent=2)}")
        
        self.assertTrue(withdrawal_request_found, "Withdrawal request activity not found")
        self.assertTrue(withdrawal_processed_found, "Withdrawal processed activity not found")
        
        print("Successfully verified withdrawal activities are properly logged")

def run_tests():
    # Create a test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases in order
    test_suite.addTest(Bet365CloneBackendTest('test_01_register_new_user'))
    test_suite.addTest(Bet365CloneBackendTest('test_02_login_special_account'))
    test_suite.addTest(Bet365CloneBackendTest('test_03_verify_special_account_privileges'))
    test_suite.addTest(Bet365CloneBackendTest('test_04_user_profile_endpoint'))
    test_suite.addTest(Bet365CloneBackendTest('test_05_get_sports_matches'))
    test_suite.addTest(Bet365CloneBackendTest('test_06_place_bet_regular_balance'))
    test_suite.addTest(Bet365CloneBackendTest('test_07_place_bet_free_bets'))
    test_suite.addTest(Bet365CloneBackendTest('test_08_get_bet_history'))
    test_suite.addTest(Bet365CloneBackendTest('test_09_settle_bet_special_account'))
    test_suite.addTest(Bet365CloneBackendTest('test_10_get_activities'))
    test_suite.addTest(Bet365CloneBackendTest('test_11_log_activity'))
    test_suite.addTest(Bet365CloneBackendTest('test_12_error_handling'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)

if __name__ == "__main__":
    run_tests()