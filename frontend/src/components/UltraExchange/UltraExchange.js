import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UltraExchange = () => {
  const [matches, setMatches] = useState([]);
  const [layBets, setLayBets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('matches');
  const [betFilter, setBetFilter] = useState('all'); // 'all', 'pending', 'settled'
  const [showLayModal, setShowLayModal] = useState(false);
  const [selectedLay, setSelectedLay] = useState(null);
  const [layStake, setLayStake] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const { user, refreshBalance } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchMatches();
    fetchLayBets();
    fetchStatistics();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'matches') {
        fetchMatches();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/ultra/matches`);
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLayBets = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/ultra/my-lay-bets`);
      setLayBets(response.data);
    } catch (error) {
      console.error('Error fetching lay bets:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/ultra/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const openLayModal = (match, selection, layOdds) => {
    setSelectedLay({
      match,
      selection,
      layOdds
    });
    setLayStake('50');
    setShowLayModal(true);
  };

  const placeLayBet = async () => {
    if (!selectedLay || !layStake || parseFloat(layStake) < 10) {
      alert('Minimum lay stake is £10');
      return;
    }

    const liability = (selectedLay.layOdds - 1) * parseFloat(layStake);
    if (liability > (user.real_balance_usdt || 0)) {
      alert('Insufficient real USDT balance to cover liability');
      return;
    }

    setPlacingBet(true);
    try {
      await axios.post(`${API_BASE}/api/ultra/lay-bet`, {
        match_id: selectedLay.match.id,
        selection: selectedLay.selection,
        lay_odds: selectedLay.layOdds,
        lay_stake: parseFloat(layStake)
      });

      // Refresh data
      await Promise.all([
        refreshBalance(),
        fetchLayBets(),
        fetchStatistics()
      ]);

      // Close modal
      setShowLayModal(false);
      setSelectedLay(null);
      setLayStake('');

      alert('Lay bet placed successfully!');
    } catch (error) {
      console.error('Error placing lay bet:', error);
      alert(error.response?.data?.detail || 'Failed to place lay bet');
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

  const getSportIcon = (sport) => {
    const icons = {
      'nfl': '🏈',
      'nba': '🏀',
      'soccer': '⚽',
      'tennis': '🎾'
    };
    return icons[sport] || '🏆';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800',
      settled: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">UltraExchange</h2>
            <p className="text-gray-600">Professional lay betting platform</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live updates every 30s</span>
          </div>
        </div>
      </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Real Balance</div>
                <div className="text-2xl font-bold text-blue-600">£{user?.balance?.toFixed(2) || '0.00'}</div>
                <div className="text-xs text-gray-400">Available for lay bets</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Total Lay Bets</div>
                <div className="text-2xl font-bold text-gray-900">{statistics.total_lay_bets}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Total Liability</div>
                <div className="text-2xl font-bold text-red-600">£{statistics.total_liability}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">P&L</div>
                <div className={`text-2xl font-bold ${statistics.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  £{statistics.total_profit_loss >= 0 ? '+' : ''}{statistics.total_profit_loss}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Win Rate</div>
                <div className="text-2xl font-bold text-blue-600">{statistics.win_rate}%</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500">Pending Liability</div>
                <div className="text-2xl font-bold text-orange-600">£{statistics.pending_liability}</div>
              </div>
            </div>
          )}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'matches'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Lay Markets ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('mybets')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'mybets'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 My Lay Bets ({layBets.length})
          </button>
        </div>
      </div>

      {/* Matches Tab */}
      {activeTab === 'matches' && (
        <div>
          <div className="grid gap-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
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
                    {match.is_live && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        🔴 LIVE
                      </span>
                    )}
                  </div>

                  {/* Lay Odds Grid */}
                  {match.lay_odds && Object.keys(match.lay_odds).length > 0 && (
                    <div>
                      <div className="mb-2 text-sm font-medium text-gray-700">Lay Odds (Click to Lay):</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(match.lay_odds).map(([selection, odds]) => (
                          <button
                            key={selection}
                            onClick={() => openLayModal(match, selection, odds)}
                            className="p-3 border-2 border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors text-center group"
                          >
                            <div className="text-sm text-gray-600">Lay {selection === 'home' ? match.home_team : selection === 'away' ? match.away_team : 'Draw'}</div>
                            <div className="font-bold text-lg text-red-600 group-hover:text-red-700">{odds}</div>
                            <div className="text-xs text-gray-500">
                              Liability: £{((odds - 1) * 50).toFixed(0)} per £50
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Lay Bets Tab */}
      {activeTab === 'mybets' && (
        <div className="space-y-4">
          {layBets.map((bet) => (
            <div key={bet.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {bet.match_home_team} vs {bet.match_away_team}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(bet.match_commence_time)}
                  </p>
                </div>
                {getStatusBadge(bet.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Lay Selection</p>
                  <p className="font-medium text-red-600">
                    {bet.selection === 'home' ? bet.match_home_team :
                     bet.selection === 'away' ? bet.match_away_team : 'Draw'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Lay Stake</p>
                  <p className="font-medium">£{bet.lay_stake}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Lay Odds</p>
                  <p className="font-medium text-red-600">{bet.lay_odds}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Liability</p>
                  <p className="font-medium text-red-600">£{bet.liability}</p>
                </div>
                
                {bet.profit_loss !== null && (
                  <div>
                    <p className="text-xs text-gray-500">Profit/Loss</p>
                    <p className={`font-bold ${bet.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      £{bet.profit_loss >= 0 ? '+' : ''}{bet.profit_loss}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Placed: {formatDateTime(bet.created_at)}
                {bet.settled_at && (
                  <span className="ml-3">Settled: {formatDateTime(bet.settled_at)}</span>
                )}
              </div>
            </div>
          ))}

          {layBets.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No lay bets yet</h3>
              <p className="text-gray-600">Start laying bets on the markets above!</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Lay Bet Modal */}
      {showLayModal && selectedLay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Place Lay Bet</h3>
            
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="font-semibold text-red-800">
                {selectedLay.match.home_team} vs {selectedLay.match.away_team}
              </p>
              <p className="text-sm text-red-700">
                Laying: <span className="font-medium">
                  {selectedLay.selection === 'home' ? selectedLay.match.home_team :
                   selectedLay.selection === 'away' ? selectedLay.match.away_team : 'Draw'}
                </span>
              </p>
              <p className="text-sm text-red-700">
                Lay Odds: <span className="font-bold">{selectedLay.layOdds}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lay Stake (£)
              </label>
              <input
                type="number"
                value={layStake}
                onChange={(e) => setLayStake(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minimum £10"
                min="10"
                step="0.01"
              />
            </div>

            {layStake && !isNaN(layStake) && parseFloat(layStake) >= 10 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <p><strong>Liability:</strong> <span className="text-red-600">£{((selectedLay.layOdds - 1) * parseFloat(layStake)).toFixed(2)}</span></p>
                  <p><strong>Potential Profit:</strong> <span className="text-green-600">£{parseFloat(layStake).toFixed(2)}</span></p>
                  <p className="text-xs text-gray-600 mt-2">
                    You win £{parseFloat(layStake).toFixed(2)} if {selectedLay.selection === 'home' ? selectedLay.match.home_team : selectedLay.selection === 'away' ? selectedLay.match.away_team : 'Draw'} LOSES
                  </p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLayModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={placeLayBet}
                disabled={placingBet || !layStake || parseFloat(layStake) < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingBet ? 'Placing...' : 'Place Lay Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraExchange;