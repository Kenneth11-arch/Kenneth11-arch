import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Wallet = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const { user, refreshBalance } = useAuth();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawalAmount || !withdrawalAddress) {
      alert('Please fill in all fields');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount < 10) {
      alert('Minimum withdrawal amount is $10');
      return;
    }

    if (amount > (user.real_balance_usdt || 0)) {
      alert('Insufficient real USDT balance');
      return;
    }

    setWithdrawing(true);
    try {
      await axios.post(`${API_BASE}/api/withdraw`, {
        amount: amount,
        to_address: withdrawalAddress
      });

      // Refresh balance and transactions
      await refreshBalance();
      await fetchTransactions();

      // Close modal and reset form
      setShowWithdrawModal(false);
      setWithdrawalAmount('');
      setWithdrawalAddress('');

      alert('Withdrawal request submitted successfully! Processing time: 30 seconds');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert(error.response?.data?.detail || 'Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const addFreeCredits = async () => {
    try {
      await axios.post(`${API_BASE}/api/admin/add-free-credits`, {
        user_id: user.id,
        amount: 1000
      });

      await refreshBalance();
      await fetchTransactions();
      alert('1000 free credits added!');
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Failed to add credits');
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

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      withdrawal: '📤',
      bet_stake: '🎯',
      bet_return: '💸',
      commission: '💼'
    };
    return icons[type] || '💳';
  };

  const getTransactionColor = (type, amount) => {
    if (type === 'deposit' || type === 'bet_return') return 'text-green-600';
    if (type === 'withdrawal' || type === 'bet_stake' || type === 'commission') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Real USDT Balance</p>
            <p className="text-3xl font-bold">${user?.real_balance_usdt?.toFixed(2) || '0.00'}</p>
            <p className="text-blue-200 text-sm mt-1">💰 Withdrawable to your wallet</p>
            {user?.role === 'special' && (
              <p className="text-blue-200 text-sm">🎖️ VIP: Unlimited Free Bets + Real USDT Winnings</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-900 mb-2">💸 USDT Deposit</h3>
          <p className="text-sm text-gray-600 mb-3">Send USDT (TRC20) to deposit funds</p>
          <div className="bg-gray-100 p-2 rounded text-xs font-mono break-all">
            TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ
          </div>
          <p className="text-xs text-gray-500 mt-2">⚠️ Only send USDT on Tron network</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-900 mb-2">📤 USDT Withdrawal</h3>
          <p className="text-sm text-gray-600 mb-3">Withdraw to your USDT wallet</p>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Withdraw USDT
          </button>
          <p className="text-xs text-gray-500 mt-2">Minimum: $10 USDT</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-900 mb-2">💸 Add Real USDT</h3>
          <p className="text-sm text-gray-600 mb-3">Add real USDT to your account (testing)</p>
          <button
            onClick={async () => {
              try {
                await axios.post(`${API_BASE}/api/admin/add-real-usdt`, {
                  user_id: user.id,
                  amount: 100
                });
                await refreshBalance();
                alert('$100 real USDT added to your account!');
              } catch (error) {
                alert('Failed to add USDT');
              }
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add $100 Real USDT
          </button>
          <p className="text-xs text-gray-500 mt-2">For testing withdrawals</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button
              onClick={fetchTransactions}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {transactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(transaction.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                    ${transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                  </p>
                  {getStatusBadge(transaction.status)}
                  {transaction.tx_hash && (
                    <p className="text-xs text-blue-600 mt-1">
                      TX: {transaction.tx_hash.substring(0, 10)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && transactions.length === 0 && (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">💳</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600">Your transaction history will appear here.</p>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Withdraw USDT</h3>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ Withdrawals are processed to Tron network (TRC20) only
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDT)
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
                min="10"
                step="0.01"
              />
              <div className="mt-1 text-sm text-gray-600">
                Balance: ${user?.balance?.toFixed(2) || '0.00'} • Min: $10
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Address (TRC20)
              </label>
              <input
                type="text"
                value={withdrawalAddress}
                onChange={(e) => setWithdrawalAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="TRX wallet address"
              />
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Processing Time:</strong> 30 seconds<br/>
                <strong>Network:</strong> Tron (TRC20)<br/>
                <strong>Fee:</strong> Network fees may apply
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawalAmount || !withdrawalAddress || parseFloat(withdrawalAmount) < 10}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;