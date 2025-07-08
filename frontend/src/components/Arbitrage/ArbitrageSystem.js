import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ArbitrageSystem = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculator, setCalculator] = useState({
    bet365_stake: '',
    bet365_odd: '',
    ultra_lay_odd: '',
    result: null
  });
  const [autoLaying, setAutoLaying] = useState(null);
  const { user, refreshBalance } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (user?.role === 'special') {
      fetchOpportunities();
    }
  }, [user]);

  // Auto-refresh opportunities every 60 seconds
  useEffect(() => {
    if (user?.role === 'special') {
      const interval = setInterval(() => {
        fetchOpportunities();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/arbitrage/opportunities`);
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching arbitrage opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLayAmount = async () => {
    if (!calculator.bet365_stake || !calculator.bet365_odd || !calculator.ultra_lay_odd) {
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/arbitrage/calculate`, {
        bet365_stake: parseFloat(calculator.bet365_stake),
        bet365_odd: parseFloat(calculator.bet365_odd),
        ultra_lay_odd: parseFloat(calculator.ultra_lay_odd)
      });
      setCalculator({ ...calculator, result: response.data });
    } catch (error) {
      console.error('Error calculating lay amount:', error);
    }
  };

  const autoLayBet = async (opportunity) => {
    setAutoLaying(opportunity.match_id);
    try {
      const response = await axios.post(`${API_BASE}/api/arbitrage/auto-lay`, {
        match_id: opportunity.match_id,
        selection: opportunity.outcome,
        lay_odds: opportunity.ultra_lay_odd,
        lay_stake: opportunity.stake_ultra_lay
      });

      if (response.data.success) {
        alert(`✅ Auto-lay bet placed successfully!\n\nGuaranteed profit: £${opportunity.guaranteed_profit}\nLay bet placed on UltraExchange.`);
        await refreshBalance();
        await fetchOpportunities();
      }
    } catch (error) {
      console.error('Error placing auto-lay bet:', error);
      alert('Failed to place auto-lay bet: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setAutoLaying(null);
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

  const getProfitColor = (percentage) => {
    if (percentage >= 5) return 'text-green-600';
    if (percentage >= 3) return 'text-blue-600';
    return 'text-gray-600';
  };

  // Check if user has VIP access
  if (user?.role !== 'special') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔒</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">VIP Access Required</h3>
          <p className="text-gray-600">
            The Risk-Free Arbitrage System is only available to VIP accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Risk-Free Arbitrage System</h2>
            <p className="text-gray-600">Guaranteed profit betting - VIP Exclusive</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Auto-refresh every 60s</span>
          </div>
        </div>
      </div>

      {/* VIP Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-yellow-50 border border-gold-200 rounded-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">👑</span>
          <div>
            <h3 className="font-semibold text-gold-800">VIP Arbitrage Access</h3>
            <p className="text-sm text-gold-700">
              🎯 Risk-free betting • 💰 Guaranteed profits • 🤖 Auto-lay functionality • 📊 Real-time analysis
            </p>
          </div>
        </div>
      </div>

      {/* Quick Calculator */}
      <div className="mb-6 bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Arbitrage Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bet365 Stake (£)
            </label>
            <input
              type="number"
              value={calculator.bet365_stake}
              onChange={(e) => setCalculator({ ...calculator, bet365_stake: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bet365 Odds
            </label>
            <input
              type="number"
              value={calculator.bet365_odd}
              onChange={(e) => setCalculator({ ...calculator, bet365_odd: e.target.value })}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2.50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UltraExchange Lay Odds
            </label>
            <input
              type="number"
              value={calculator.ultra_lay_odd}
              onChange={(e) => setCalculator({ ...calculator, ultra_lay_odd: e.target.value })}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2.65"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={calculateLayAmount}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>
          </div>
        </div>

        {calculator.result && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Calculation Results:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Lay Stake:</span>
                <p className="font-bold text-blue-800">£{calculator.result.lay_stake}</p>
              </div>
              <div>
                <span className="text-blue-700">Lay Liability:</span>
                <p className="font-bold text-red-600">£{calculator.result.lay_liability}</p>
              </div>
              <div>
                <span className="text-blue-700">Total Risk:</span>
                <p className="font-bold text-orange-600">£{calculator.result.total_risk}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Arbitrage Opportunities */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🎯 Current Arbitrage Opportunities ({opportunities.length})
          </h3>
          <button
            onClick={fetchOpportunities}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Scanning for arbitrage opportunities...</p>
          </div>
        )}

            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <div key={`${opportunity.match_id}-${opportunity.outcome}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">
                          {opportunity.match_home_team} vs {opportunity.match_away_team}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(opportunity.match_commence_time)} • Risk-Free Arbitrage
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +£{opportunity.guaranteed_profit}
                        </div>
                        <div className="text-sm text-green-700">
                          {opportunity.profit_percentage}% Guaranteed Profit
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-step Instructions (Outplayed Style) */}
                  <div className="p-6">
                    
                    {/* Step 1: Bet365 Free Bet */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                          <div>
                            <h5 className="font-bold text-blue-800">Go to Bet365 and place your £{opportunity.stake_bet365} free bet on {opportunity.outcome === 'home' ? opportunity.match_home_team : opportunity.outcome === 'away' ? opportunity.match_away_team : 'Draw'}</h5>
                            <p className="text-sm text-blue-600">Odds: {opportunity.bet365_odd} • Free bet (no balance deduction)</p>
                          </div>
                        </div>
                        <div className="text-blue-600 font-bold text-lg">
                          🎁 FREE BET
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Auto-navigate to sports betting and pre-fill the bet
                          localStorage.setItem('autoBet', JSON.stringify({
                            match_id: opportunity.match_id,
                            selection: opportunity.outcome,
                            odds: opportunity.bet365_odd,
                            stake: opportunity.stake_bet365,
                            isFreeBet: true
                          }));
                          window.location.href = '#sports';
                        }}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        🎯 Go to Bet365 and Place Free Bet
                      </button>
                    </div>

                    {/* Account Status */}
                    <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600 text-xl">✅</span>
                          <span className="font-medium text-green-800">UltraExchange account connected</span>
                        </div>
                        <span className="text-green-600 font-bold">£{user?.balance?.toFixed(2)} available</span>
                      </div>
                    </div>

                    {/* Step 2: UltraExchange Lay Bet */}
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                          <div>
                            <h5 className="font-bold text-red-800">Click here to place a £{opportunity.stake_ultra_lay} lay bet against {opportunity.outcome === 'home' ? opportunity.match_home_team : opportunity.outcome === 'away' ? opportunity.match_away_team : 'Draw'} on UltraExchange</h5>
                            <p className="text-sm text-red-600">Lay Odds: {opportunity.ultra_lay_odd} • Liability: £{opportunity.liability_ultra}</p>
                          </div>
                        </div>
                        <div className="text-red-600 font-bold text-lg">
                          LAY BET
                        </div>
                      </div>
                      
                      {user.balance >= opportunity.liability_ultra ? (
                        <button
                          onClick={() => autoLayBet(opportunity)}
                          disabled={autoLaying === opportunity.match_id}
                          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {autoLaying === opportunity.match_id ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Placing Lay Bet...
                            </span>
                          ) : (
                            `📈 Click here to place £{opportunity.stake_ultra_lay} lay bet on UltraExchange`
                          )}
                        </button>
                      ) : (
                        <div className="text-center">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                            <p className="text-yellow-800 font-medium">
                              ⚠️ Insufficient balance. Need £{opportunity.liability_ultra} to cover liability.
                            </p>
                          </div>
                          <button
                            onClick={() => window.location.href = '#wallet'}
                            className="bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                          >
                            💰 Add Funds to Wallet
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Profit Breakdown (Outplayed Style) */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h6 className="font-bold text-gray-800 mb-3">📊 Profit Breakdown:</h6>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-gray-600">If {opportunity.outcome === 'home' ? opportunity.match_home_team : opportunity.outcome === 'away' ? opportunity.match_away_team : 'Draw'} wins:</div>
                          <div className="font-bold text-green-600">+£{opportunity.profit_if_bet365_wins}</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-gray-600">If {opportunity.outcome === 'home' ? opportunity.match_home_team : opportunity.outcome === 'away' ? opportunity.match_away_team : 'Draw'} loses:</div>
                          <div className="font-bold text-green-600">+£{opportunity.profit_if_ultra_wins}</div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-green-100 rounded text-center">
                        <span className="font-bold text-green-800">
                          🎯 Guaranteed Profit: +£{opportunity.guaranteed_profit} regardless of outcome
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

        {!loading && opportunities.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Arbitrage Opportunities</h3>
            <p className="text-gray-600">
              The system is constantly scanning for profitable opportunities. Check back in a few minutes.
            </p>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎓 How Risk-Free Arbitrage Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Step-by-Step Process:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>System finds odds discrepancies between platforms</li>
              <li>Calculates exact stakes for guaranteed profit</li>
              <li>You back the selection on Bet365 (free bet)</li>
              <li>Auto-lay places opposing bet on UltraExchange</li>
              <li>You profit regardless of match outcome</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Example:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Bet365:</strong> Back Liverpool Win @ 2.50 (£100)</p>
              <p>• <strong>UltraExchange:</strong> Lay Liverpool Win @ 2.65 (£94.34)</p>
              <p>• <strong>Liverpool Wins:</strong> +£150 - £155.66 = -£5.66</p>
              <p>• <strong>Liverpool Loses:</strong> -£100 + £94.34 = -£5.66</p>
              <p>• <strong>Net Profit:</strong> £94.34 - £5.66 = <strong>+£88.68</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageSystem;