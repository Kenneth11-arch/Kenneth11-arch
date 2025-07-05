import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Components from './components';

const {
  Header,
  Navigation,
  HeroSection,
  SportsMenu,
  LiveBetting,
  FeaturedMatches,
  CasinoSection,
  PromotionalBanner,
  Footer,
  BetSlip,
  LoginModal,
  RegisterModal,
  BettingHistory,
  AccountActivities,
  DepositModal,
  WithdrawalModal,
  SettledBetsModal,
  MatchSettlementsModal
} = Components;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [betSlipItems, setBetSlipItems] = useState([]);
  const [placedBets, setPlacedBets] = useState([]);
  const [settledBets, setSettledBets] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBettingHistory, setShowBettingHistory] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSettledBets, setShowSettledBets] = useState(false);
  const [showMatchSettlements, setShowMatchSettlements] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sportsData, setSportsData] = useState({
    liveMatches: [],
    upcomingMatches: [],
    allSportsData: {},
    filteredSport: null,
    sportsCategories: [
      { name: 'Football', icon: '⚽', count: 0 },
      { name: 'Basketball', icon: '🏀', count: 0 },
      { name: 'Tennis', icon: '🎾', count: 0 },
      { name: 'Baseball', icon: '⚾', count: 0 },
      { name: 'Hockey', icon: '🏒', count: 0 },
      { name: 'American Football', icon: '🏈', count: 0 }
    ]
  });

  // Auto-refresh sports data every 30 seconds
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchPlacedBets();
      fetchSettledBets();
    }
    fetchSportsData();
    
    // Set up auto-refresh for live data
    const interval = setInterval(fetchSportsData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch sports data when sport filter changes
  useEffect(() => {
    if (selectedSport !== 'All Sports') {
      fetchSportsByCategory(selectedSport);
    }
  }, [selectedSport]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const fetchSportsData = async () => {
    try {
      const response = await axios.get(`${API}/sports/matches`);
      setSportsData(prevData => ({
        ...prevData,
        liveMatches: response.data.live_matches || [],
        upcomingMatches: response.data.upcoming_matches || [],
        allSportsData: response.data.by_sport || {}
      }));
    } catch (error) {
      console.error('Error fetching sports data:', error);
    }
  };

  const fetchSportsByCategory = async (sport) => {
    try {
      const sportName = sport.toLowerCase().replace(' ', '');
      const response = await axios.get(`${API}/sports/matches/${sportName}`);
      
      // Update the live and upcoming matches with filtered data
      const filteredMatches = response.data.matches || [];
      const liveFiltered = filteredMatches.filter(m => m.is_live);
      const upcomingFiltered = filteredMatches.filter(m => !m.is_live);
      
      setSportsData(prevData => ({
        ...prevData,
        liveMatches: liveFiltered,
        upcomingMatches: upcomingFiltered,
        filteredSport: sport
      }));
      
      // Log activity
      logActivity('sport_filter_applied', {
        sport: sport,
        matches_found: filteredMatches.length,
        live_matches: liveFiltered.length,
        upcoming_matches: upcomingFiltered.length
      });
    } catch (error) {
      console.error('Error fetching filtered sports data:', error);
    }
  };

  const fetchPlacedBets = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlacedBets(response.data);
    } catch (error) {
      console.error('Error fetching placed bets:', error);
    }
  };

  const fetchSettledBets = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API}/bets/settled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettledBets(response.data);
    } catch (error) {
      console.error('Error fetching settled bets:', error);
    }
  };

  const logActivity = async (action, details) => {
    if (!token) return;
    try {
      await axios.post(`${API}/activity/log`, {
        action,
        details
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API}/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setShowLoginModal(false);
      
      await logActivity('user_login', { email, login_time: new Date().toISOString() });
      
      // Fetch placed bets after login
      setTimeout(fetchPlacedBets, 1000);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const response = await axios.post(`${API}/register`, { name, email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setShowRegisterModal(false);
      
      await logActivity('user_registered', { name, email, registration_time: new Date().toISOString() });
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setBetSlipItems([]);
    setPlacedBets([]);
    logActivity('user_logout', { logout_time: new Date().toISOString() });
  };

  const addToBetSlip = (match, betType, odds, platform = 'bet365') => {
    const newBet = {
      id: Date.now(),
      match,
      betType: 'back', // Default to back bet
      selection: betType, // home, away, draw
      odds,
      stake: 0,
      platform
    };
    setBetSlipItems([...betSlipItems, newBet]);
    
    // Log activity
    logActivity('bet_added_to_slip', {
      match_id: match.id,
      match_description: `${match.homeTeam || match.home_team} vs ${match.awayTeam || match.away_team}`,
      selection: betType,
      odds: odds,
      platform: platform
    });
  };

  const removeBetSlipItem = (id) => {
    setBetSlipItems(betSlipItems.filter(item => item.id !== id));
    logActivity('bet_removed_from_slip', { bet_slip_id: id });
  };

  const updateStake = (id, stake) => {
    setBetSlipItems(betSlipItems.map(item => 
      item.id === id ? { ...item, stake: parseFloat(stake) || 0 } : item
    ));
  };

  const updateBetType = (id, betType) => {
    setBetSlipItems(betSlipItems.map(item => 
      item.id === id ? { ...item, betType } : item
    ));
  };

  const placeBet = async (betItem) => {
    if (!token) {
      alert('Please login to place bets');
      return { success: false, error: 'Not logged in' };
    }

    try {
      const response = await axios.post(`${API}/bet/place`, {
        match_id: betItem.match.id,
        match_description: `${betItem.match.homeTeam || betItem.match.home_team} vs ${betItem.match.awayTeam || betItem.match.away_team}`,
        bet_type: betItem.betType,
        selection: betItem.selection,
        odds: betItem.odds,
        stake: betItem.stake,
        bet_platform: betItem.platform
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user balance
      setUser(prevUser => ({
        ...prevUser,
        balance: response.data.remaining_balance
      }));

      // Remove bet from slip
      removeBetSlipItem(betItem.id);

      // Refresh placed bets
      fetchPlacedBets();

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error placing bet:', error);
      return { success: false, error: error.response?.data?.detail || 'Failed to place bet' };
    }
  };

  const placeAllBets = async () => {
    if (betSlipItems.length === 0) {
      alert('No bets in slip');
      return;
    }

    const results = [];
    for (const bet of betSlipItems) {
      if (bet.stake > 0) {
        const result = await placeBet(bet);
        results.push(result);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      alert(`${successCount} bet(s) placed successfully!`);
    }
    if (failCount > 0) {
      alert(`${failCount} bet(s) failed to place`);
    }
  };

  const handleDeposit = async (amount) => {
    try {
      const response = await axios.post(`${API}/deposit/request`, {
        amount: amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Deposit request created! Send exactly ${amount} USDT to: ${response.data.send_to_address} on TRC-20 network`);
      setShowDepositModal(false);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Deposit error:', error);
      return { success: false, error: error.response?.data?.detail || 'Deposit failed' };
    }
  };

  const handleWithdrawal = async (amount, address) => {
    try {
      const response = await axios.post(`${API}/withdrawal/request`, {
        amount: amount,
        usdt_address: address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user balance
      setUser(prevUser => ({
        ...prevUser,
        balance: prevUser.balance - amount
      }));

      alert(`Withdrawal request submitted! ${amount} USDT will be sent to: ${address}`);
      setShowWithdrawalModal(false);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Withdrawal error:', error);
      return { success: false, error: error.response?.data?.detail || 'Withdrawal failed' };
    }
  };

  return (
    <div className="App bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col min-h-screen">
              {/* Header */}
              <Header 
                user={user}
                onLoginClick={() => setShowLoginModal(true)}
                onRegisterClick={() => setShowRegisterModal(true)}
                onLogout={handleLogout}
                onShowBettingHistory={() => setShowBettingHistory(true)}
                onShowActivities={() => setShowActivities(true)}
                onShowDeposit={() => setShowDepositModal(true)}
                onShowWithdrawal={() => setShowWithdrawalModal(true)}
                onShowSettledBets={() => setShowSettledBets(true)}
                onShowMatchSettlements={() => setShowMatchSettlements(true)}
              />
              
              {/* Navigation */}
              <Navigation />
              
              {/* Main Content */}
              <div className="flex-1 flex">
                {/* Left Sidebar - Sports Menu */}
                <div className="w-64 bg-gray-800 border-r border-gray-700">
                  <SportsMenu 
                    sports={sportsData.sportsCategories}
                    selectedSport={selectedSport}
                    onSelectSport={setSelectedSport}
                    allSportsData={sportsData.allSportsData}
                    liveMatches={sportsData.liveMatches}
                    upcomingMatches={sportsData.upcomingMatches}
                  />
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 flex">
                  <div className="flex-1 p-4">
                    {/* Hero Section */}
                    <HeroSection />
                    
                    {/* Live Betting Section */}
                    <LiveBetting 
                      matches={sportsData.liveMatches}
                      onAddToBetSlip={addToBetSlip}
                      selectedSport={selectedSport}
                    />
                    
                    {/* Featured Matches */}
                    <FeaturedMatches 
                      matches={sportsData.upcomingMatches}
                      onAddToBetSlip={addToBetSlip}
                      selectedSport={selectedSport}
                    />
                    
                    {/* Casino Section */}
                    <CasinoSection />
                    
                    {/* Promotional Banner */}
                    <PromotionalBanner />
                  </div>
                  
                  {/* Right Sidebar - Bet Slip */}
                  <div className="w-80 bg-gray-800 border-l border-gray-700">
                    <BetSlip 
                      items={betSlipItems}
                      placedBets={placedBets}
                      user={user}
                      onRemoveItem={removeBetSlipItem}
                      onUpdateStake={updateStake}
                      onUpdateBetType={updateBetType}
                      onPlaceBet={placeBet}
                      onPlaceAllBets={placeAllBets}
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <Footer />
              
              {/* Modals */}
              {showLoginModal && (
                <LoginModal 
                  onClose={() => setShowLoginModal(false)}
                  onLogin={handleLogin}
                />
              )}
              
              {showRegisterModal && (
                <RegisterModal 
                  onClose={() => setShowRegisterModal(false)}
                  onRegister={handleRegister}
                />
              )}

              {showBettingHistory && (
                <BettingHistory 
                  onClose={() => setShowBettingHistory(false)}
                  token={token}
                />
              )}

              {showActivities && (
                <AccountActivities 
                  onClose={() => setShowActivities(false)}
                  token={token}
                />
              )}

              {showDepositModal && (
                <DepositModal 
                  onClose={() => setShowDepositModal(false)}
                  onDeposit={handleDeposit}
                  user={user}
                />
              )}

              {showWithdrawalModal && (
                <WithdrawalModal 
                  onClose={() => setShowWithdrawalModal(false)}
                  onWithdraw={handleWithdrawal}
                  user={user}
                />
              )}

              {showSettledBets && (
                <SettledBetsModal 
                  onClose={() => setShowSettledBets(false)}
                  settledBets={settledBets}
                />
              )}

              {showMatchSettlements && (
                <MatchSettlementsModal 
                  onClose={() => setShowMatchSettlements(false)}
                  token={token}
                />
              )}
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;