import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ setActiveSection, activeSection, betSlipCount, onOpenBetSlip }) => {
  const { user, logout, refreshBalance } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRefreshBalance = async () => {
    await refreshBalance();
  };

  // Different menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { id: 'sports', label: 'Sports Betting', icon: '🏆' },
      { id: 'history', label: 'Bet History', icon: '📊' },
      { id: 'settled', label: 'Settled Matches', icon: '✅' },
      { id: 'wallet', label: 'Wallet', icon: '💰' },
    ];

    // Add UltraExchange and Arbitrage for all users
    const enhancedItems = [
      ...baseItems,
      { id: 'ultra', label: 'UltraExchange', icon: '📈' },
    ];

    // Add arbitrage system for VIP users only
    if (user?.role === 'special') {
      enhancedItems.push(
        { id: 'arbitrage', label: 'Arbitrage System', icon: '🎯' }
      );
    }

    return enhancedItems;
  };

  const menuItems = getMenuItems();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Bet365 Clone</h1>
            <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded-full">
              LIVE
            </span>
            {user?.role === 'special' && (
              <span className="ml-2 text-xs bg-gold-500 px-2 py-1 rounded-full">
                VIP
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex space-x-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="flex items-center space-x-4">
          {/* Balance Display */}
          <div className="flex items-center space-x-3">
            {/* Real USDT Balance */}
            <div className="bg-green-600 px-3 py-1 rounded-full">
              <div className="text-xs text-green-100">Real USDT</div>
              <div className="text-sm font-semibold text-white">
                £{user?.real_balance_usdt?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            {/* Free Bet Balance (VIP only) */}
            {user?.role === 'special' && (
              <div className="bg-gold-500 px-3 py-1 rounded-full">
                <div className="text-xs text-gold-100">Free Bets</div>
                <div className="text-sm font-semibold text-white">
                  ∞ Unlimited
                </div>
              </div>
            )}
            
            <button
              onClick={handleRefreshBalance}
              className="text-xs hover:underline text-blue-100"
              title="Refresh Balance"
            >
              🔄
            </button>
          </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 bg-blue-700 px-3 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <span className="text-sm font-medium">{user?.username}</span>
                {user?.role === 'special' && <span className="text-xs">👑</span>}
                <span className="text-xs">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {user?.role === 'special' && (
                      <span className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-2 py-1 rounded-full mt-1">
                        👑 VIP Account
                      </span>
                    )}
                  </div>
                  
                  {/* Quick Navigation */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onSectionChange('settings');
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⚙️ Settings
                    </button>
                    
                    <button
                      onClick={() => {
                        onSectionChange('wallet');
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💰 Wallet
                    </button>

                    {user?.role === 'special' && (
                      <button
                        onClick={() => {
                          onSectionChange('arbitrage');
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        🎯 Arbitrage System
                      </button>
                    )}
                  </div>
                  
                  <div className="border-t">
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-blue-700 p-2 rounded-md"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showDropdown && (
          <div className="lg:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setShowDropdown(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              
              <button
                onClick={() => {
                  onSectionChange('settings');
                  setShowDropdown(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition-colors"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;