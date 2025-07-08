import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SettledMatches = () => {
  const [settledMatches, setSettledMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const { user } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchSettledMatches();
  }, []);

  const fetchSettledMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/bets/settled`);
      setSettledMatches(response.data);
    } catch (error) {
      console.error('Error fetching settled matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const toggleMatchExpansion = (matchId) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  // Calculate total statistics
  const totalProfitLoss = settledMatches.reduce((sum, match) => sum + match.total_profit_loss, 0);
  const totalCommission = settledMatches.reduce((sum, match) => sum + match.total_commission, 0);
  const winningMatches = settledMatches.filter(match => match.total_profit_loss > 0).length;
  const losingMatches = settledMatches.filter(match => match.total_profit_loss < 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settled Matches</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-blue-600 text-2xl mr-3">📊</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{settledMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className={`text-2xl mr-3 ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfitLoss >= 0 ? '📈' : '📉'}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-600">Net Profit/Loss</p>
              <p className={`text-2xl font-bold ${getProfitLossColor(totalProfitLoss)}`}>
                £{totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-green-600 text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Winning Matches</p>
              <p className="text-2xl font-bold text-green-600">{winningMatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">❌</span>
            <div>
              <p className="text-sm font-medium text-gray-600">Losing Matches</p>
              <p className="text-2xl font-bold text-red-600">{losingMatches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Notice */}
      {user?.role !== 'special' && totalCommission > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            <strong>Total Commission Paid:</strong> £{totalCommission.toFixed(2)} (2% on winning bets)
          </p>
        </div>
      )}

      {user?.role === 'special' && (
        <div className="mb-6 p-4 bg-gold-50 border border-gold-200 rounded-lg">
          <p className="text-sm text-gold-700">
            🎖️ <strong>VIP Account:</strong> You pay 0% commission on all bets!
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading settled matches...</p>
        </div>
      )}

      {/* Settled Matches List */}
      <div className="space-y-4">
        {settledMatches.map((settledMatch) => {
          const match = settledMatch.match;
          const isExpanded = expandedMatch === match.id;
          
          return (
            <div key={match.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Match Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleMatchExpansion(match.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getSportIcon(match.sport)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {match.home_team} vs {match.away_team}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Settled: {formatDateTime(match.settled_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total P&L</p>
                      <p className={`font-bold ${getProfitLossColor(settledMatch.total_profit_loss)}`}>
                        {getProfitLossIcon(settledMatch.total_profit_loss)}
                        £{settledMatch.total_profit_loss >= 0 ? '+' : ''}{settledMatch.total_profit_loss.toFixed(2)}
                      </p>
                    </div>
                    
                    <span className="text-gray-400">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* Match Result */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Final Score */}
                    {(match.home_score !== null && match.away_score !== null) && (
                      <div className="bg-gray-100 px-3 py-1 rounded-lg">
                        <span className="font-semibold">
                          {match.home_score} - {match.away_score}
                        </span>
                      </div>
                    )}
                    
                    {/* Winner */}
                    <div className="bg-green-100 px-3 py-1 rounded-lg">
                      <span className="text-sm font-medium text-green-800">
                        {getWinnerDisplay(match)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {settledMatch.user_bets.length} bet{settledMatch.user_bets.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Expanded Bet Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Your Bets on This Match</h4>
                  
                  <div className="space-y-3">
                    {settledMatch.user_bets.map((bet) => (
                      <div key={bet.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Bet Type</p>
                            <p className="font-medium">
                              {bet.bet_type.toUpperCase()}
                              <span className="ml-1 text-blue-600">
                                {bet.selection === 'home' ? match.home_team :
                                 bet.selection === 'away' ? match.away_team : 'Draw'}
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
                            <p className="text-xs text-gray-500">Profit/Loss</p>
                            <p className={`font-bold ${getProfitLossColor(bet.profit_loss)}`}>
                              {getProfitLossIcon(bet.profit_loss)}
                              £{bet.profit_loss >= 0 ? '+' : ''}{bet.profit_loss.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-500">
                          Placed: {formatDateTime(bet.created_at)}
                          {bet.settled_at && (
                            <span className="ml-3">Settled: {formatDateTime(bet.settled_at)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Match Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Staked</p>
                        <p className="font-semibold">
                          £{settledMatch.user_bets.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Total Return</p>
                        <p className="font-semibold">
                          £{(settledMatch.user_bets.reduce((sum, bet) => sum + bet.stake, 0) + settledMatch.total_profit_loss).toFixed(2)}
                        </p>
                      </div>
                      
                      {settledMatch.total_commission > 0 && (
                        <div>
                          <p className="text-gray-500">Commission Paid</p>
                          <p className="font-semibold text-orange-600">
                            £{settledMatch.total_commission.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No settled matches */}
      {!loading && settledMatches.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No settled matches</h3>
          <p className="text-gray-600">
            Your settled match history will appear here once your bets are resolved.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettledMatches;