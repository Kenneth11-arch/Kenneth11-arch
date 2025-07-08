import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BetHistory = () => {
  const [bets, setBets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, settled
  const { user } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchBets();
    fetchStats();
  }, []);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/bets`);
      setBets(response.data);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/bets/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'pending') return bet.status === 'pending' || bet.status === 'matched';
    if (filter === 'settled') return bet.status === 'settled';
    return true;
  });

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBetStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      matched: 'bg-blue-100 text-blue-800', 
      settled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getProfitLossColor = (profitLoss) => {
    if (profitLoss > 0) return 'text-green-600';
    if (profitLoss < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossIcon = (profitLoss) => {
    if (profitLoss > 0) return '📈';
    if (profitLoss < 0) return '📉';
    return '➖';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Betting History</h2>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <span className="text-blue-600 text-2xl mr-3">🎯</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_bets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">💰</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staked</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.total_staked.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <span className={`text-2xl mr-3 ${stats.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.total_profit_loss >= 0 ? '📈' : '📉'}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
                <p className={`text-2xl font-bold ${getProfitLossColor(stats.total_profit_loss)}`}>
                  £{stats.total_profit_loss >= 0 ? '+' : ''}{stats.total_profit_loss.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <span className="text-purple-600 text-2xl mr-3">🏆</span>
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.win_rate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Bets ({bets.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({bets.filter(b => b.status === 'pending' || b.status === 'matched').length})
          </button>
          <button
            onClick={() => setFilter('settled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'settled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Settled ({bets.filter(b => b.status === 'settled').length})
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading bets...</p>
        </div>
      )}

      {/* Bets List */}
      <div className="space-y-4">
        {filteredBets.map((bet) => (
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
              {getBetStatusBadge(bet.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Bet Type</p>
                <p className="font-medium">
                  {bet.bet_type.toUpperCase()} 
                  <span className="ml-1 text-blue-600">
                    {bet.selection === 'home' ? bet.match_home_team :
                     bet.selection === 'away' ? bet.match_away_team : 'Draw'}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Stake</p>
                <p className="font-medium">£{bet.stake.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Odds</p>
                <p className="font-medium text-blue-600">{bet.odds}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Potential Return</p>
                <p className="font-medium text-green-600">£{bet.potential_return.toFixed(2)}</p>
              </div>
            </div>

            {/* Match Status */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">Matched Amount</p>
                <p className="font-medium">£{bet.matched_amount.toFixed(2)}</p>
              </div>
              
              {bet.unmatched_amount > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Unmatched</p>
                  <p className="font-medium text-orange-600">£{bet.unmatched_amount.toFixed(2)}</p>
                </div>
              )}
              
              {bet.profit_loss !== null && (
                <div>
                  <p className="text-xs text-gray-500">Profit/Loss</p>
                  <p className={`font-bold ${getProfitLossColor(bet.profit_loss)}`}>
                    {getProfitLossIcon(bet.profit_loss)}
                    £{bet.profit_loss >= 0 ? '+' : ''}{bet.profit_loss.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <span>Placed: {formatDateTime(bet.created_at)}</span>
              {bet.settled_at && (
                <span className="ml-4">Settled: {formatDateTime(bet.settled_at)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No bets */}
      {!loading && filteredBets.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🎯</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No bets yet' : `No ${filter} bets`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Start betting on your favorite sports!' 
              : `You don't have any ${filter} bets at the moment.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default BetHistory;