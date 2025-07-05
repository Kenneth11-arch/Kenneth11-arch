import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onSectionChange, activeSection }) => {
  const { user, logout, refreshBalance } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleRefreshBalance = async () => {
    await refreshBalance();
  };

  const menuItems = [
    { id: 'sports', label: 'Sports Betting', icon: '🏆' },
    { id: 'history', label: 'Bet History', icon: '📊' },
    { id: 'settled', label: 'Settled Matches', icon: '✅' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
  ];

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
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
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
            {/* Balance */}
            <div className="flex items-center space-x-2 bg-green-600 px-3 py-1 rounded-full">
              <span className="text-sm font-semibold">
                ${user?.balance?.toFixed(2) || '0.00'}
              </span>
              <button
                onClick={handleRefreshBalance}
                className="text-xs hover:underline"
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
                <span className="text-xs">▼</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    {user?.role === 'special' && (
                      <span className="inline-block bg-gold-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                        VIP
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      onSectionChange('wallet');
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    💰 Wallet
                  </button>
                  
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
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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
          <div className="md:hidden pb-4">
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;