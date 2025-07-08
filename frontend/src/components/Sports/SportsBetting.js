import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SportsBetting = () => {
  const [sports, setSports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [settledMatches, setSettledMatches] = useState([]);
  const [selectedSport, setSelectedSport] = useState('all');
  const [loading, setLoading] = useState(false);
  const [settledLoading, setSettledLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'settled'
  const [error, setError] = useState('');
  const [placingBet, setPlacingBet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState(null);
  const [isFreeBet, setIsFreeBet] = useState(false);
  const { user, refreshBalance } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSports();
    fetchMatches();
    if (activeTab === 'settled') {
      fetchSettledMatches();
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedSport]);

  useEffect(() => {
    if (activeTab === 'settled') {
      fetchSettledMatches();
    }
  }, [activeTab]);

  // Auto-refresh matches every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedSport]);

  const fetchSports = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sports`);
      setSports(response.data);
    } catch (error) {
      console.error('Error fetching sports:', error);
      setError('Failed to load sports');
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = selectedSport !== 'all' ? { sport: selectedSport } : {};
      const response = await axios.get(`${API_BASE}/api/matches`, { params });
      setMatches(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettledMatches = async () => {
    setSettledLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/bets/settled`);
      setSettledMatches(response.data);
    } catch (error) {
      console.error('Error fetching settled matches:', error);
    } finally {
      setSettledLoading(false);
    }
  };

  const openBetModal = (match, selection, odds) => {
    setSelectedBet({
      match,
      selection,
      odds,
      type: 'back', // Default to back bet
      isFreebet: user?.role === 'special' // VIP users get free bet option
    });
    setBetAmount(user?.role === 'special' ? '0' : '10'); // Start with 0 for VIP (unlimited free bets)
    setShowBetModal(true);
  };

  const placeBet = async () => {
    if (!selectedBet || !betAmount || parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    // For VIP users with free bets, no balance check needed
    if (!(isFreeBet && user.role === 'special')) {
      // Check real USDT balance for non-free bets
      if (parseFloat(betAmount) > (user.real_balance_usdt || 0)) {
        alert('Insufficient real USDT balance');
        return;
      }
    }

    setPlacingBet(true);
    try {
      const betData = {
        match_id: selectedBet.match.id,
        bet_type: selectedBet.type,
        selection: selectedBet.selection,
        stake: parseFloat(betAmount),
        odds: selectedBet.odds,
        is_free_bet: isFreeBet && user.role === 'special'
      };

      await axios.post(`${API_BASE}/api/bets`, betData);
      
      // Refresh balance
      await refreshBalance();
      
      // Close modal
      setShowBetModal(false);
      setSelectedBet(null);
      setBetAmount('');
      setIsFreeBet(false);
      
      const betType = isFreeBet && user.role === 'special' ? 'FREE BET' : 'Real USDT bet';
      alert(`${betType.toUpperCase()} placed successfully! ${isFreeBet ? 'Winnings will be added to your real USDT balance!' : 'Good luck!'}`);
    } catch (error) {
      console.error('Error placing bet:', error);
      alert(error.response?.data?.detail || 'Failed to place bet');
    } finally {
      setPlacingBet(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchStatus = (match) => {
    if (match.is_live) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          🔴 LIVE
        </span>
      );
    }
    if (match.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ✅ FINAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ⏰ UPCOMING
      </span>
    );
  };

  const getSportIcon = (sport) => {
    const icons = {
      'nfl': '🏈',
      'nba': '🏀',
      'soccer': '⚽',
      'tennis': '🎾',
      'all': '🏆'
    };
    return icons[sport] || '🏆';
  };

  const getProfitLossColor = (profitLoss) => {
    if (profitLoss > 0) return 'text-green-600';
    if (profitLoss < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (profitLoss) => {
    if (profitLoss > 0) return '✅';
    if (profitLoss < 0) return '❌';
    return '➖';
  };

  const getWinnerDisplay = (match) => {
    if (!match.winner) return 'No winner determined';
    
    switch (match.winner) {
      case 'home':
        return `🏆 ${match.home_team}`;
      case 'away':
        return `🏆 ${match.away_team}`;
      case 'draw':
        return '🤝 Draw';
      default:
        return match.winner;
    }
  };

  const liveMatches = matches.filter(m => m.is_live).length;
  const upcomingMatches = matches.filter(m => m.status === 'upcoming').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">🔴</span>
            <div>
              <p className="text-sm font-medium text-red-600">Live Now</p>
              <p className="text-2xl font-bold text-red-700">{liveMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 text-2xl mr-3">⏰</span>
            <div>
              <p className="text-sm font-medium text-green-600">Upcoming</p>
              <p className="text-2xl font-bold text-green-700">{upcomingMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-blue-600 text-2xl mr-3">🏆</span>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Matches</p>
              <p className="text-2xl font-bold text-blue-700">{matches.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSport === sport.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{sport.icon}</span>
              <span>{sport.name}</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                {sport.id === 'all' 
                  ? matches.length 
                  : matches.filter(m => m.sport === sport.id).length
                }
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {sports.find(s => s.id === selectedSport)?.name || 'All Sports'} Matches
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Auto-updating every 30s</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading matches...</p>
        </div>
      )}

      {/* Matches Grid */}
      <div className="grid gap-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              {/* Match Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getSportIcon(match.sport)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {match.home_team} vs {match.away_team}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(match.commence_time)}
                    </p>
                  </div>
                </div>
                {getMatchStatus(match)}
              </div>

              {/* Live Score */}
              {match.is_live && (match.home_score !== null || match.away_score !== null) && (
                <div className="mb-3 p-2 bg-red-50 rounded-lg">
                  <div className="flex justify-center items-center space-x-4">
                    <span className="font-semibold">{match.home_team}</span>
                    <span className="text-2xl font-bold text-red-600">
                      {match.home_score || 0} - {match.away_score || 0}
                    </span>
                    <span className="font-semibold">{match.away_team}</span>
                  </div>
                </div>
              )}

              {/* Betting options available for upcoming and live matches */}
              {(match.status === 'upcoming' || match.status === 'live') && match.odds && Object.keys(match.odds).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {match.odds.home && (
                    <button
                      onClick={() => openBetModal(match, 'home', match.odds.home)}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="text-sm text-gray-600">Home Win</div>
                      <div className="font-bold text-lg text-blue-600">{match.odds.home}</div>
                      <div className="text-xs text-gray-500">{match.home_team}</div>
                    </button>
                  )}

                  {match.odds.draw && (
                    <button
                      onClick={() => openBetModal(match, 'draw', match.odds.draw)}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="text-sm text-gray-600">Draw</div>
                      <div className="font-bold text-lg text-blue-600">{match.odds.draw}</div>
                      <div className="text-xs text-gray-500">Tie</div>
                    </button>
                  )}

                  {match.odds.away && (
                    <button
                      onClick={() => openBetModal(match, 'away', match.odds.away)}
                      className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-center"
                    >
                      <div className="text-sm text-gray-600">Away Win</div>
                      <div className="font-bold text-lg text-blue-600">{match.odds.away}</div>
                      <div className="text-xs text-gray-500">{match.away_team}</div>
                    </button>
                  )}
                </div>
              )}

              {/* No betting available */}
              {(match.status === 'completed' || match.status === 'settled' || !match.odds || Object.keys(match.odds).length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  {match.status === 'completed' || match.status === 'settled' ? 'Betting closed' : 'Odds not available'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No matches */}
      {!loading && matches.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🏟️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches available</h3>
          <p className="text-gray-600">Check back later for upcoming matches.</p>
        </div>
      )}

      {/* Bet Modal */}
      {showBetModal && selectedBet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Place Bet</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold">{selectedBet.match.home_team} vs {selectedBet.match.away_team}</p>
              <p className="text-sm text-gray-600">
                Selection: <span className="font-medium">
                  {selectedBet.selection === 'home' ? selectedBet.match.home_team :
                   selectedBet.selection === 'away' ? selectedBet.match.away_team : 'Draw'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Odds: <span className="font-bold text-blue-600">{selectedBet.odds}</span>
              </p>
            </div>

            {/* Free Bet Option for VIP */}
            {user?.role === 'special' && (
              <div className="mb-4 p-3 bg-gradient-to-r from-gold-50 to-yellow-50 border border-gold-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsFreeBet(!isFreeBet)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isFreeBet 
                        ? 'bg-gold-500 text-white' 
                        : 'bg-white border border-gold-300 text-gold-700 hover:bg-gold-50'
                    }`}
                  >
                    <span className="text-lg">🎁</span>
                    <span className="font-medium">Free Bet</span>
                  </button>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gold-800">VIP Unlimited Free Bets</p>
                    <p className="text-xs text-gold-600">Winnings withdrawable in USDT</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFreeBet && user?.role === 'special' ? 'Free Bet Amount (£)' : 'Bet Amount (£)'}
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isFreeBet && user?.role === 'special' ? 'Enter any amount (unlimited)' : 'Enter amount'}
                min="1"
                step="0.01"
              />
              <div className="mt-1 text-sm text-gray-600">
                {isFreeBet && user?.role === 'special' ? (
                  <span className="text-gold-600 font-medium">
                    🎁 Unlimited Free Bet - Winnings paid in real USDT
                  </span>
                ) : (
                  `Real USDT Balance: £${user?.real_balance_usdt?.toFixed(2) || '0.00'}`
                )}
              </div>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Potential Return: <span className="font-bold text-green-600">
                  £{betAmount && !isNaN(betAmount) ? (parseFloat(betAmount) * selectedBet.odds).toFixed(2) : '0.00'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Potential Profit: <span className="font-bold text-green-600">
                  £{betAmount && !isNaN(betAmount) ? ((parseFloat(betAmount) * selectedBet.odds) - parseFloat(betAmount)).toFixed(2) : '0.00'}
                </span>
              </p>
              {isFreeBet && user?.role === 'special' && (
                <p className="text-xs text-gold-600 mt-1 font-medium">
                  🎯 Free bet winnings are withdrawable in real USDT!
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBetModal(false);
                  setIsFreeBet(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={placeBet}
                disabled={placingBet || !betAmount || parseFloat(betAmount) <= 0}
                className={`flex-1 px-4 py-2 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFreeBet && user?.role === 'special'
                    ? 'bg-gradient-to-r from-gold-500 to-yellow-600 hover:from-gold-600 hover:to-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {placingBet ? 'Placing...' : (isFreeBet && user?.role === 'special' ? '🎁 Place Free Bet' : 'Place Bet')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsBetting;