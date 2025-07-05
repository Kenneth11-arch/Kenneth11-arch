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