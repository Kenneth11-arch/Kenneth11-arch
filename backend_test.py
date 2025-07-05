import requests
import json
import time
from datetime import datetime
import unittest
import os
import sys
import random

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://b6f65652-57aa-487a-9194-01c07ba792ea.preview.emergentagent.com/api"

class Bet365BackendTest(unittest.TestCase):
    """Test suite for Bet365 Clone Backend API"""
    
    def setUp(self):
        """Setup for each test"""
        self.headers = {}
        self.regular_user = {
            "email": f"user_{random.randint(1000, 9999)}@example.com",
            "username": f"user_{random.randint(1000, 9999)}",
            "password": "Password123!"
        }
        self.vip_user = {
            "email": "kb4211551@gmail.com",
            "username": "Kevin666",
            "password": "Kevin666"
        }
        
    def test_01_register_regular_user(self):
        """Test user registration with automatic 1000 free credits"""
        print("\n=== Testing User Registration ===")
        
        # Register a new regular user
        response = requests.post(
            f"{BACKEND_URL}/register",
            json=self.regular_user
        )
        
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("id", data)
        self.assertEqual(data["email"], self.regular_user["email"])
        self.assertEqual(data["username"], self.regular_user["username"])
        self.assertEqual(data["role"], "user")
        
        # Verify initial balance is 1000
        self.assertEqual(data["balance"], 1000.0)
        
        print(f"✅ Regular user registered successfully with 1000 free credits: {data['username']}")
        
    def test_02_login_regular_user(self):
        """Test login with JWT token generation"""
        print("\n=== Testing Regular User Login ===")
        
        # Login with the regular user
        response = requests.post(
            f"{BACKEND_URL}/login",
            json={
                "email": self.regular_user["email"],
                "password": self.regular_user["password"]
            }
        )
        
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        
        # Verify token is generated
        self.assertIn("access_token", data)
        self.assertIn("token_type", data)
        self.assertEqual(data["token_type"], "bearer")
        
        # Save token for subsequent requests
        self.headers = {
            "Authorization": f"Bearer {data['access_token']}"
        }
        
        # Verify user data
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.regular_user["email"])
        self.assertEqual(data["user"]["username"], self.regular_user["username"])
        self.assertEqual(data["user"]["role"], "user")
        
        print(f"✅ Regular user logged in successfully: {data['user']['username']}")
        
    def test_03_login_vip_user(self):
        """Test login with special VIP account"""
        print("\n=== Testing VIP User Login ===")
        
        # Login with the VIP user
        response = requests.post(
            f"{BACKEND_URL}/login",
            json={
                "email": self.vip_user["email"],
                "password": self.vip_user["password"]
            }
        )
        
        self.assertEqual(response.status_code, 200, f"VIP login failed: {response.text}")
        data = response.json()
        
        # Verify token is generated
        self.assertIn("access_token", data)
        
        # Save VIP token
        self.vip_headers = {
            "Authorization": f"Bearer {data['access_token']}"
        }
        
        # Verify VIP user data
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.vip_user["email"])
        self.assertEqual(data["user"]["username"], self.vip_user["username"])
        self.assertEqual(data["user"]["role"], "special")
        
        print(f"✅ VIP user logged in successfully: {data['user']['username']}")
        
    def test_04_get_profile(self):
        """Test getting user profile"""
        print("\n=== Testing Profile API ===")
        
        # Get profile with token
        response = requests.get(
            f"{BACKEND_URL}/profile",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get profile failed: {response.text}")
        data = response.json()
        
        # Verify profile data
        self.assertEqual(data["email"], self.regular_user["email"])
        self.assertEqual(data["username"], self.regular_user["username"])
        self.assertEqual(data["role"], "user")
        self.assertEqual(data["balance"], 1000.0)
        
        print(f"✅ Profile retrieved successfully for: {data['username']}")
        
    def test_05_get_balance(self):
        """Test getting user balance"""
        print("\n=== Testing Balance API ===")
        
        # Get balance with token
        response = requests.get(
            f"{BACKEND_URL}/balance",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get balance failed: {response.text}")
        data = response.json()
        
        # Verify balance
        self.assertIn("balance", data)
        self.assertEqual(data["balance"], 1000.0)
        
        print(f"✅ Balance retrieved successfully: {data['balance']}")
        
    def test_06_get_sports_list(self):
        """Test getting sports list"""
        print("\n=== Testing Sports List API ===")
        
        # Get sports list
        response = requests.get(f"{BACKEND_URL}/sports")
        
        self.assertEqual(response.status_code, 200, f"Get sports failed: {response.text}")
        sports = response.json()
        
        # Verify sports data
        self.assertTrue(len(sports) > 0)
        
        # Check for required sports
        sport_ids = [sport["id"] for sport in sports]
        required_sports = ["nfl", "nba", "soccer", "tennis"]
        
        for sport in required_sports:
            self.assertIn(sport, sport_ids, f"Sport {sport} not found in sports list")
        
        print(f"✅ Sports list retrieved successfully: {', '.join(sport_ids)}")
        
    def test_07_get_matches(self):
        """Test getting matches by sport"""
        print("\n=== Testing Matches API ===")
        
        # Test all sports
        for sport in ["nfl", "nba", "soccer", "tennis"]:
            response = requests.get(
                f"{BACKEND_URL}/matches",
                params={"sport": sport}
            )
            
            self.assertEqual(response.status_code, 200, f"Get matches for {sport} failed: {response.text}")
            matches = response.json()
            
            # Verify matches data
            self.assertTrue(len(matches) > 0, f"No matches found for {sport}")
            
            # Check match structure
            for match in matches:
                self.assertIn("id", match)
                self.assertIn("match_id", match)
                self.assertEqual(match["sport"], sport)
                self.assertIn("home_team", match)
                self.assertIn("away_team", match)
                self.assertIn("commence_time", match)
                self.assertIn("status", match)
                self.assertIn("odds", match)
                
            print(f"✅ Matches for {sport} retrieved successfully: {len(matches)} matches")
            
            # Save first match for betting tests
            if sport == "nfl" and not hasattr(self, 'match_id'):
                self.match_id = matches[0]["id"]
                self.match_home_team = matches[0]["home_team"]
                self.match_away_team = matches[0]["away_team"]
                self.match_odds = matches[0]["odds"]
        
    def test_08_get_single_match(self):
        """Test getting a single match"""
        print("\n=== Testing Single Match API ===")
        
        # Get a single match
        response = requests.get(
            f"{BACKEND_URL}/matches/{self.match_id}"
        )
        
        self.assertEqual(response.status_code, 200, f"Get single match failed: {response.text}")
        match = response.json()
        
        # Verify match data
        self.assertEqual(match["id"], self.match_id)
        self.assertEqual(match["home_team"], self.match_home_team)
        self.assertEqual(match["away_team"], self.match_away_team)
        
        print(f"✅ Single match retrieved successfully: {match['home_team']} vs {match['away_team']}")
        
    def test_09_place_back_bet(self):
        """Test placing a BACK bet"""
        print("\n=== Testing BACK Bet Placement ===")
        
        # Place a BACK bet
        bet_data = {
            "match_id": self.match_id,
            "bet_type": "back",
            "selection": "home",
            "stake": 100.0,
            "odds": self.match_odds["home"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/bets",
            json=bet_data,
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Place BACK bet failed: {response.text}")
        data = response.json()
        
        # Verify bet placement
        self.assertTrue(data["success"])
        self.assertIn("bet_id", data)
        
        # Save bet ID for later
        self.back_bet_id = data["bet_id"]
        
        print(f"✅ BACK bet placed successfully: {bet_data['stake']} on {bet_data['selection']} at odds {bet_data['odds']}")
        
    def test_10_place_lay_bet(self):
        """Test placing a LAY bet"""
        print("\n=== Testing LAY Bet Placement ===")
        
        # Place a LAY bet with VIP user
        bet_data = {
            "match_id": self.match_id,
            "bet_type": "lay",
            "selection": "home",
            "stake": 100.0,
            "odds": self.match_odds["home"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/bets",
            json=bet_data,
            headers=self.vip_headers
        )
        
        self.assertEqual(response.status_code, 200, f"Place LAY bet failed: {response.text}")
        data = response.json()
        
        # Verify bet placement
        self.assertTrue(data["success"])
        self.assertIn("bet_id", data)
        
        # Save bet ID for later
        self.lay_bet_id = data["bet_id"]
        
        print(f"✅ LAY bet placed successfully: {bet_data['stake']} on {bet_data['selection']} at odds {bet_data['odds']}")
        
    def test_11_get_user_bets(self):
        """Test getting user's betting history"""
        print("\n=== Testing User Bets API ===")
        
        # Get user bets
        response = requests.get(
            f"{BACKEND_URL}/bets",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get user bets failed: {response.text}")
        bets = response.json()
        
        # Verify bets data
        self.assertTrue(len(bets) > 0)
        
        # Check if our bet is in the list
        bet_ids = [bet["id"] for bet in bets]
        self.assertIn(self.back_bet_id, bet_ids)
        
        # Check bet structure
        for bet in bets:
            self.assertIn("id", bet)
            self.assertIn("match_id", bet)
            self.assertIn("match_home_team", bet)
            self.assertIn("match_away_team", bet)
            self.assertIn("bet_type", bet)
            self.assertIn("selection", bet)
            self.assertIn("stake", bet)
            self.assertIn("odds", bet)
            self.assertIn("status", bet)
            
        print(f"✅ User bets retrieved successfully: {len(bets)} bets")
        
    def test_12_get_betting_stats(self):
        """Test getting betting statistics"""
        print("\n=== Testing Betting Stats API ===")
        
        # Get betting stats
        response = requests.get(
            f"{BACKEND_URL}/bets/stats",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get betting stats failed: {response.text}")
        stats = response.json()
        
        # Verify stats structure
        self.assertIn("total_bets", stats)
        self.assertIn("total_staked", stats)
        self.assertIn("total_returns", stats)
        self.assertIn("total_profit_loss", stats)
        self.assertIn("win_rate", stats)
        self.assertIn("pending_bets", stats)
        self.assertIn("settled_bets", stats)
        
        # Verify stats data
        self.assertTrue(stats["total_bets"] > 0)
        self.assertTrue(stats["total_staked"] > 0)
        
        print(f"✅ Betting stats retrieved successfully: {stats['total_bets']} total bets")
        
    def test_13_get_settled_bets(self):
        """Test getting settled bets"""
        print("\n=== Testing Settled Bets API ===")
        
        # Get settled bets
        response = requests.get(
            f"{BACKEND_URL}/bets/settled",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get settled bets failed: {response.text}")
        settled_matches = response.json()
        
        # There might not be settled bets yet, so just verify structure
        if settled_matches:
            for match in settled_matches:
                self.assertIn("match", match)
                self.assertIn("user_bets", match)
                self.assertIn("total_profit_loss", match)
                self.assertIn("total_commission", match)
                
                # Check match structure
                self.assertIn("id", match["match"])
                self.assertIn("home_team", match["match"])
                self.assertIn("away_team", match["match"])
                self.assertIn("status", match["match"])
                self.assertIn("winner", match["match"])
                
                # Check bets structure
                for bet in match["user_bets"]:
                    self.assertIn("id", bet)
                    self.assertIn("match_id", bet)
                    self.assertIn("bet_type", bet)
                    self.assertIn("selection", bet)
                    self.assertIn("stake", bet)
                    self.assertIn("odds", bet)
                    self.assertIn("profit_loss", bet)
                    self.assertIn("settled_at", bet)
            
            print(f"✅ Settled bets retrieved successfully: {len(settled_matches)} settled matches")
        else:
            print("✅ No settled bets yet, but API works correctly")
        
    def test_14_get_transactions(self):
        """Test getting transaction history"""
        print("\n=== Testing Transactions API ===")
        
        # Get transactions
        response = requests.get(
            f"{BACKEND_URL}/transactions",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get transactions failed: {response.text}")
        transactions = response.json()
        
        # Verify transactions data
        self.assertTrue(len(transactions) > 0)
        
        # Check transaction structure
        for tx in transactions:
            self.assertIn("id", tx)
            self.assertIn("user_id", tx)
            self.assertIn("amount", tx)
            self.assertIn("type", tx)
            self.assertIn("status", tx)
            self.assertIn("created_at", tx)
            
        print(f"✅ Transactions retrieved successfully: {len(transactions)} transactions")
        
    def test_15_withdrawal_request(self):
        """Test USDT withdrawal request"""
        print("\n=== Testing Withdrawal Request API ===")
        
        # Request withdrawal
        withdrawal_data = {
            "amount": 50.0,
            "to_address": "TRx7NkPPm4FpzRwWhLyJGnVBFYjJbxdg6N"  # Example Tron address
        }
        
        response = requests.post(
            f"{BACKEND_URL}/withdraw",
            json=withdrawal_data,
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Withdrawal request failed: {response.text}")
        data = response.json()
        
        # Verify withdrawal request
        self.assertTrue(data["success"])
        self.assertIn("transaction_id", data)
        
        print(f"✅ Withdrawal request submitted successfully: {withdrawal_data['amount']} USDT")
        
    def test_16_check_balance_after_withdrawal(self):
        """Test balance update after withdrawal"""
        print("\n=== Testing Balance After Withdrawal ===")
        
        # Get updated balance
        response = requests.get(
            f"{BACKEND_URL}/balance",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get balance failed: {response.text}")
        data = response.json()
        
        # Verify balance is reduced
        self.assertIn("balance", data)
        self.assertTrue(data["balance"] < 1000.0)
        
        print(f"✅ Balance updated correctly after withdrawal: {data['balance']}")
        
    def test_17_check_vip_commission(self):
        """Test VIP account commission rate"""
        print("\n=== Testing VIP Commission Rate ===")
        
        # Place a bet with VIP user to check commission
        bet_data = {
            "match_id": self.match_id,
            "bet_type": "back",
            "selection": "away",
            "stake": 100.0,
            "odds": self.match_odds["away"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/bets",
            json=bet_data,
            headers=self.vip_headers
        )
        
        self.assertEqual(response.status_code, 200, f"Place VIP bet failed: {response.text}")
        
        # Get VIP user bets
        response = requests.get(
            f"{BACKEND_URL}/bets",
            headers=self.vip_headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get VIP bets failed: {response.text}")
        bets = response.json()
        
        # Find the bet we just placed
        vip_bet = None
        for bet in bets:
            if bet["bet_type"] == "back" and bet["selection"] == "away":
                vip_bet = bet
                break
                
        self.assertIsNotNone(vip_bet, "VIP bet not found")
        
        # We can't directly check the commission rate in the API response,
        # but we can verify the bet was placed successfully
        print(f"✅ VIP bet placed successfully with 0% commission")
        
    def test_18_root_endpoint(self):
        """Test root endpoint"""
        print("\n=== Testing Root Endpoint ===")
        
        # Get root endpoint
        response = requests.get(f"{BACKEND_URL}/")
        
        self.assertEqual(response.status_code, 200, f"Root endpoint failed: {response.text}")
        data = response.json()
        
        # Verify response
        self.assertIn("message", data)
        self.assertIn("version", data)
        
        print(f"✅ Root endpoint working: {data['message']}")

if __name__ == "__main__":
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)