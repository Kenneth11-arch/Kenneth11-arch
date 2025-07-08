import React, { useState } from 'react';
import axios from 'axios';

const CashOut = ({ bet, onCashOut }) => {
  const [cashingOut, setCashingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  // Calculate cash out value (simplified - in real implementation this would come from backend)
  const calculateCashOutValue = () => {
    if (bet.status !== 'pending' && bet.status !== 'matched') return 0;
    
    // Simple cash out calculation: 70-90% of potential return based on time remaining
    const potentialReturn = bet.stake * bet.odds;
    const profit = potentialReturn - bet.stake;
    
    // Mock calculation - in reality this would be much more complex
    const timeBasedMultiplier = 0.75; // Assume 75% of profit + original stake
    const cashOutValue = bet.stake + (profit * timeBasedMultiplier);
    
    return Math.max(cashOutValue, bet.stake * 0.5); // Minimum 50% of stake
  };

  const executeCashOut = async () => {
    setCashingOut(true);
    try {
      const cashOutValue = calculateCashOutValue();
      
      await axios.post(`${API_BASE}/api/bets/${bet.id}/cashout`, {
        cash_out_value: cashOutValue
      });

      if (onCashOut) {
        onCashOut(bet.id, cashOutValue);
      }

      setShowConfirm(false);
    } catch (error) {
      console.error('Error cashing out bet:', error);
      alert('Failed to cash out bet');
    } finally {
      setCashingOut(false);
    }
  };

  const cashOutValue = calculateCashOutValue();
  const originalStake = bet.stake;
  const potentialProfit = (bet.stake * bet.odds) - bet.stake;
  const cashOutProfit = cashOutValue - originalStake;

  // Don't show cash out if bet is not eligible
  if (bet.status !== 'pending' && bet.status !== 'matched') {
    return null;
  }

  // Don't show if cash out value is too low
  if (cashOutValue < originalStake * 0.3) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors"
      >
        💰 Cash Out £{cashOutValue.toFixed(2)}
      </button>

      {/* Cash Out Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Cash Out Bet</h3>
            
            {/* Bet Details */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {bet.match_home_team} vs {bet.match_away_team}
              </h4>
              <p className="text-sm text-gray-600">
                Selection: <span className="font-medium">
                  {bet.selection === 'home' ? bet.match_home_team :
                   bet.selection === 'away' ? bet.match_away_team : 'Draw'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Odds: <span className="font-bold text-blue-600">{bet.odds}</span>
              </p>
            </div>

            {/* Cash Out Comparison */}
            <div className="mb-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">If bet wins</p>
                  <p className="font-bold text-blue-800">£{(originalStake * bet.odds).toFixed(2)}</p>
                  <p className="text-xs text-blue-600">Profit: £{potentialProfit.toFixed(2)}</p>
                </div>
                <div className="text-blue-600 text-xl">🏆</div>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div>
                  <p className="text-sm text-orange-700">Cash out now</p>
                  <p className="font-bold text-orange-800">£{cashOutValue.toFixed(2)}</p>
                  <p className="text-xs text-orange-600">
                    {cashOutProfit >= 0 ? `Profit: £${cashOutProfit.toFixed(2)}` : `Loss: £${Math.abs(cashOutProfit).toFixed(2)}`}
                  </p>
                </div>
                <div className="text-orange-600 text-xl">💰</div>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-red-700">If bet loses</p>
                  <p className="font-bold text-red-800">£0.00</p>
                  <p className="text-xs text-red-600">Loss: £{originalStake.toFixed(2)}</p>
                </div>
                <div className="text-red-600 text-xl">❌</div>
              </div>
            </div>

            {/* Cash Out Benefits */}
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">💡 Cash Out Benefits</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Guarantee a return before the match ends</li>
                <li>• {cashOutProfit >= 0 ? 'Secure your profit now' : 'Minimize your potential loss'}</li>
                <li>• Remove the risk of the bet losing</li>
                <li>• Instant payout to your account</li>
              </ul>
            </div>

            {/* Warning if loss */}
            {cashOutProfit < 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ <strong>Note:</strong> This cash out will result in a loss of £{Math.abs(cashOutProfit).toFixed(2)} compared to your original stake.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Keep Bet
              </button>
              <button
                onClick={executeCashOut}
                disabled={cashingOut}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cashingOut ? 'Cashing Out...' : `Cash Out £${cashOutValue.toFixed(2)}`}
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500 text-center">
              Cash out values are calculated in real-time and may change
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CashOut;