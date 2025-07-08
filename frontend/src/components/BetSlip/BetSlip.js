import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BetSlip = ({ betSlipBets, setBetSlipBets, isOpen, onClose }) => {
  const [betAmounts, setBetAmounts] = useState({});
  const [accumulatorAmount, setAccumulatorAmount] = useState('');
  const [betType, setBetType] = useState('single'); // 'single' or 'accumulator'
  const [placingBets, setPlacingBets] = useState(false);
  const [isFreeBet, setIsFreeBet] = useState(false);
  const { user, refreshBalance } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Initialize bet amounts
    const amounts = {};
    betSlipBets.forEach(bet => {
      amounts[bet.id] = '10';
    });
    setBetAmounts(amounts);
  }, [betSlipBets]);

  const removeBet = (betId) => {
    setBetSlipBets(prev => prev.filter(bet => bet.id !== betId));
    setBetAmounts(prev => {
      const newAmounts = { ...prev };
      delete newAmounts[betId];
      return newAmounts;
    });
  };

  const updateBetAmount = (betId, amount) => {
    setBetAmounts(prev => ({
      ...prev,
      [betId]: amount
    }));
  };

  const calculateAccumulatorOdds = () => {
    return betSlipBets.reduce((total, bet) => total * bet.odds, 1);
  };

  const calculateAccumulatorReturn = () => {
    if (!accumulatorAmount || isNaN(accumulatorAmount)) return 0;
    return parseFloat(accumulatorAmount) * calculateAccumulatorOdds();
  };

  const calculateSingleBetsTotal = () => {
    return betSlipBets.reduce((total, bet) => {
      const amount = betAmounts[bet.id] || 0;
      return total + (parseFloat(amount) || 0);
    }, 0);
  };

  const calculateSingleBetsReturn = () => {
    return betSlipBets.reduce((total, bet) => {
      const amount = betAmounts[bet.id] || 0;
      return total + ((parseFloat(amount) || 0) * bet.odds);
    }, 0);
  };

  const getAccaBoost = (numSelections) => {
    const boosts = {
      2: 2.5, 3: 5, 4: 7.5, 5: 10, 6: 12.5, 7: 15, 8: 20, 9: 25, 10: 30,
      11: 35, 12: 40, 13: 45, 14: 50, 15: 55, 16: 60, 17: 70, 18: 80, 19: 90, 20: 100
    };
    return Math.min(boosts[numSelections] || 0, 100);
  };

  const placeSingleBets = async () => {
    setPlacingBets(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const bet of betSlipBets) {
        const amount = parseFloat(betAmounts[bet.id] || 0);
        if (amount <= 0) continue;

        try {
          await axios.post(`${API_BASE}/api/bets`, {
            match_id: bet.matchId,
            bet_type: 'back',
            selection: bet.selection,
            stake: amount,
            odds: bet.odds,
            is_free_bet: isFreeBet && user.role === 'special'
          });
          successCount++;
        } catch (error) {
          console.error(`Error placing bet for ${bet.matchTitle}:`, error);
          failCount++;
        }
      }

      await refreshBalance();
      setBetSlipBets([]);
      setBetAmounts({});

      if (successCount > 0) {
        alert(`✅ ${successCount} bet${successCount !== 1 ? 's' : ''} placed successfully!${failCount > 0 ? ` ${failCount} failed.` : ''}`);
      }
    } catch (error) {
      console.error('Error placing bets:', error);
      alert('Failed to place bets');
    } finally {
      setPlacingBets(false);
    }
  };

  const placeAccumulator = async () => {
    setPlacingBets(true);
    try {
      const selections = betSlipBets.map(bet => ({
        match_id: bet.matchId,
        selection: bet.selection,
        odds: bet.odds
      }));

      await axios.post(`${API_BASE}/api/bets/accumulator`, {
        selections,
        stake: parseFloat(accumulatorAmount),
        total_odds: calculateAccumulatorOdds(),
        is_free_bet: isFreeBet && user.role === 'special'
      });

      await refreshBalance();
      setBetSlipBets([]);
      setAccumulatorAmount('');

      const boost = getAccaBoost(betSlipBets.length);
      alert(`✅ Accumulator bet placed successfully!${boost > 0 ? ` Acca Boost: +${boost}% on winnings!` : ''}`);
    } catch (error) {
      console.error('Error placing accumulator:', error);
      alert(error.response?.data?.detail || 'Failed to place accumulator bet');
    } finally {
      setPlacingBets(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayName = days[date.getDay()];
    
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName} ${day}/${month}/${year} time: ${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-md overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Bet Slip</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {betSlipBets.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your bet slip is empty</h3>
            <p className="text-gray-600">Click on odds to add selections to your bet slip</p>
          </div>
        ) : (
          <div className="p-4">
            {/* Bet Type Selector */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setBetType('single')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    betType === 'single'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Single Bets
                </button>
                {betSlipBets.length > 1 && (
                  <button
                    onClick={() => setBetType('accumulator')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      betType === 'accumulator'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Accumulator
                  </button>
                )}
              </div>
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

            {/* Bet Selections */}
            <div className="space-y-3 mb-4">
              {betSlipBets.map((bet) => (
                <div key={bet.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{bet.matchTitle}</h4>
                      <p className="text-xs text-gray-500">{formatDateTime(bet.matchTime)}</p>
                    </div>
                    <button
                      onClick={() => removeBet(bet.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      {bet.selectionName}
                    </span>
                    <span className="font-bold text-blue-600">{bet.odds}</span>
                  </div>
                  {betType === 'single' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={betAmounts[bet.id] || ''}
                        onChange={(e) => updateBetAmount(bet.id, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Stake £"
                        min="1"
                        step="0.01"
                      />
                      <div className="text-xs text-gray-500">
                        Returns: £{((parseFloat(betAmounts[bet.id]) || 0) * bet.odds).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Accumulator Section */}
            {betType === 'accumulator' && betSlipBets.length > 1 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-800">Accumulator</span>
                  <span className="font-bold text-green-600">{calculateAccumulatorOdds().toFixed(2)}</span>
                </div>
                <div className="mb-3">
                  <input
                    type="number"
                    value={accumulatorAmount}
                    onChange={(e) => setAccumulatorAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="Accumulator stake £"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Odds:</span>
                    <span className="font-medium">{calculateAccumulatorOdds().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Return:</span>
                    <span className="font-bold text-green-600">£{calculateAccumulatorReturn().toFixed(2)}</span>
                  </div>
                  {betSlipBets.length >= 2 && (
                    <div className="flex justify-between text-green-600">
                      <span>Acca Boost (+{getAccaBoost(betSlipBets.length)}%):</span>
                      <span className="font-bold">£{(calculateAccumulatorReturn() * getAccaBoost(betSlipBets.length) / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Summary</h3>
              <div className="text-sm space-y-1">
                {betType === 'single' ? (
                  <>
                    <div className="flex justify-between">
                      <span>Total Stake:</span>
                      <span className="font-medium">£{calculateSingleBetsTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potential Returns:</span>
                      <span className="font-bold text-green-600">£{calculateSingleBetsReturn().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potential Profit:</span>
                      <span className="font-bold text-green-600">£{(calculateSingleBetsReturn() - calculateSingleBetsTotal()).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Selections:</span>
                      <span className="font-medium">{betSlipBets.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Odds:</span>
                      <span className="font-medium">{calculateAccumulatorOdds().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stake:</span>
                      <span className="font-medium">£{parseFloat(accumulatorAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potential Return:</span>
                      <span className="font-bold text-green-600">£{calculateAccumulatorReturn().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Place Bet Button */}
            <button
              onClick={betType === 'single' ? placeSingleBets : placeAccumulator}
              disabled={
                placingBets || 
                (betType === 'single' && calculateSingleBetsTotal() === 0) ||
                (betType === 'accumulator' && (!accumulatorAmount || parseFloat(accumulatorAmount) <= 0))
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isFreeBet && user?.role === 'special'
                  ? 'bg-gradient-to-r from-gold-500 to-yellow-600 hover:from-gold-600 hover:to-yellow-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {placingBets ? 'Placing Bets...' : (
                betType === 'single' 
                  ? (isFreeBet && user?.role === 'special' ? '🎁 Place Free Bets' : `Place ${betSlipBets.length} Bet${betSlipBets.length !== 1 ? 's' : ''} - £${calculateSingleBetsTotal().toFixed(2)}`)
                  : (isFreeBet && user?.role === 'special' ? '🎁 Place Free Accumulator' : `Place Accumulator - £${parseFloat(accumulatorAmount || 0).toFixed(2)}`)
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetSlip;