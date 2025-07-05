import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component
const Header = ({ user, onLoginClick, onRegisterClick, onLogout, onShowBettingHistory, onShowActivities, onShowWithdrawal, onShowWithdrawalHistory }) => {
  return (
    <header className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">bet365</div>
          <div className="text-sm">
            <span className="bg-yellow-400 text-black px-2 py-1 rounded">LIVE</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span>Welcome, {user.name}</span>
                {user.is_special_account && (
                  <span className="ml-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs">SPECIAL</span>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                  Balance: ${user.balance.toFixed(2)}
                </div>
                <div className="bg-yellow-400 text-black px-3 py-1 rounded text-sm">
                  Free Bets: ${user.free_bets.toFixed(2)}
                </div>
                <div className="bg-green-700 text-white px-3 py-1 rounded text-sm">
                  Winnings: ${user.winnings ? user.winnings.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={onShowBettingHistory}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  My Bets
                </button>
                <button
                  onClick={onShowActivities}
                  className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                >
                  Activities
                </button>
                <button
                  onClick={onShowWithdrawal}
                  className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                >
                  Withdraw USDT
                </button>
                <button
                  onClick={onShowWithdrawalHistory}
                  className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700"
                >
                  Withdrawals
                </button>
                <button
                  onClick={onLogout}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button 
                onClick={onLoginClick}
                className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
              >
                Login
              </button>
              <button 
                onClick={onRegisterClick}
                className="border border-white px-4 py-2 rounded hover:bg-white hover:text-green-600"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Navigation Component
const Navigation = () => {
  const navItems = ['Sports', 'Live In-Play', 'Casino', 'Live Casino', 'Games', 'Poker', 'Promotions'];
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto">
        <div className="flex space-x-8">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`px-4 py-3 text-white hover:bg-green-600 transition-colors ${
                index === 0 ? 'bg-green-600' : ''
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <div className="mb-6">
      <div 
        className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-8 text-white relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1709540243565-628f0e335b38)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">Welcome to bet365</h1>
          <p className="text-xl mb-6">Join millions of customers worldwide and bet on your favorite sports with unlimited free bets!</p>
          <div className="flex space-x-4">
            <button className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500">
              Join Now
            </button>
            <button className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-green-600">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sports Menu Component
const SportsMenu = ({ sports, selectedSport, onSelectSport }) => {
  return (
    <div className="p-4">
      <h3 className="text-white font-semibold mb-4">Sports</h3>
      <div className="space-y-2">
        <button
          onClick={() => onSelectSport('All Sports')}
          className={`w-full text-left px-3 py-2 rounded transition-colors ${
            selectedSport === 'All Sports' 
              ? 'bg-green-600 text-white' 
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Sports
        </button>
        {sports.map((sport, index) => (
          <button
            key={index}
            onClick={() => onSelectSport(sport.name)}
            className={`w-full text-left px-3 py-2 rounded transition-colors flex justify-between items-center ${
              selectedSport === sport.name 
                ? 'bg-green-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>{sport.icon}</span>
              <span>{sport.name}</span>
            </span>
            <span className="text-sm text-gray-400">{sport.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Live Betting Component
const LiveBetting = ({ matches, onAddToBetSlip }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <span className="bg-red-500 text-white px-2 py-1 rounded text-sm mr-2">LIVE</span>
        Live In-Play
      </h2>
      
      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 font-semibold">{match.sport}</span>
                  <span className="text-yellow-400">{match.time}</span>
                </div>
                <div className="text-white">
                  <div className="font-semibold">
                    {match.home_team || match.homeTeam} vs {match.away_team || match.awayTeam}
                  </div>
                  <div className="text-lg text-yellow-400">{match.score}</div>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds)}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  {match.home_team || match.homeTeam} {match.home_odds || match.homeOdds}
                </button>
                {(match.draw_odds || match.drawOdds) && (
                  <button
                    onClick={() => onAddToBetSlip(match, 'draw', match.draw_odds || match.drawOdds)}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Draw {match.draw_odds || match.drawOdds}
                  </button>
                )}
                <button
                  onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds)}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  {match.away_team || match.awayTeam} {match.away_odds || match.awayOdds}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Featured Matches Component
const FeaturedMatches = ({ matches, onAddToBetSlip }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Featured Matches</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <div key={match.id} className="bg-gray-700 rounded-lg p-4">
            <div 
              className="h-32 bg-cover bg-center rounded-lg mb-4"
              style={{
                backgroundImage: match.sport === 'Football' 
                  ? 'url(https://images.unsplash.com/photo-1600442715978-d0268caa17f5)'
                  : 'url(https://images.unsplash.com/photo-1531593773601-7a75ca4cd915)'
              }}
            >
              <div className="bg-black bg-opacity-50 h-full rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{match.sport}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-green-400 font-semibold">{match.sport}</span>
              <span className="text-gray-400">{match.date} {match.time}</span>
            </div>
            
            <div className="text-white font-semibold mb-3">
              {match.home_team || match.homeTeam} vs {match.away_team || match.awayTeam}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                {match.home_team || match.homeTeam} {match.home_odds || match.homeOdds}
              </button>
              {(match.draw_odds || match.drawOdds) && (
                <button
                  onClick={() => onAddToBetSlip(match, 'draw', match.draw_odds || match.drawOdds)}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Draw {match.draw_odds || match.drawOdds}
                </button>
              )}
              <button
                onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                {match.away_team || match.awayTeam} {match.away_odds || match.awayOdds}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Casino Section Component
const CasinoSection = () => {
  const casinoGames = [
    { name: 'Blackjack', image: 'https://images.unsplash.com/photo-1709540242515-7d572260947d' },
    { name: 'Roulette', image: 'https://images.pexels.com/photos/1686790/pexels-photo-1686790.jpeg' },
    { name: 'Poker', image: 'https://images.unsplash.com/photo-1709540242515-7d572260947d' },
    { name: 'Slots', image: 'https://images.pexels.com/photos/1686790/pexels-photo-1686790.jpeg' }
  ];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4">Casino Games</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {casinoGames.map((game, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 cursor-pointer transition-colors">
            <div 
              className="h-24 bg-cover bg-center rounded-lg mb-3"
              style={{ backgroundImage: `url(${game.image})` }}
            >
              <div className="bg-black bg-opacity-50 h-full rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{game.name}</span>
              </div>
            </div>
            <button className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-500 transition-colors">
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Promotional Banner Component
const PromotionalBanner = () => {
  return (
    <div className="mb-6">
      <div 
        className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-6 text-black relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1707994747189-1f5733270b55)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2 text-white">Unlimited Free Bets!</h3>
          <p className="text-lg mb-4 text-white">Every account gets unlimited free bets - start betting now!</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Start Betting
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Bet Slip Component
const BetSlip = ({ items, placedBets, user, onRemoveItem, onUpdateStake, onUpdateBetType, onPlaceBet, onPlaceAllBets }) => {
  const [activeTab, setActiveTab] = useState('betslip');
  
  const calculateTotalOdds = () => {
    return items.reduce((total, item) => total * parseFloat(item.odds), 1).toFixed(2);
  };
  
  const calculateTotalStake = () => {
    return items.reduce((total, item) => total + parseFloat(item.stake || 0), 0).toFixed(2);
  };
  
  const calculatePotentialWinnings = () => {
    return items.reduce((total, item) => {
      const stake = parseFloat(item.stake || 0);
      const odds = parseFloat(item.odds);
      return total + (stake * odds);
    }, 0).toFixed(2);
  };
  
  const placeSingleBet = async (betItem) => {
    if (!user) {
      alert('Please login to place bets');
      return;
    }
    
    if (betItem.stake <= 0) {
      alert('Please enter a stake amount');
      return;
    }
    
    const result = await onPlaceBet(betItem);
    if (result.success) {
      alert('Bet placed successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('betslip')}
          className={`px-4 py-2 rounded ${
            activeTab === 'betslip' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Bet Slip ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('mybets')}
          className={`px-4 py-2 rounded ${
            activeTab === 'mybets' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          My Bets
        </button>
      </div>
      
      {activeTab === 'betslip' && (
        <div>
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>Your bet slip is empty</p>
              <p className="text-sm mt-2">Click on odds to add selections</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-white font-semibold text-sm">
                        {item.match.homeTeam || item.match.home_team} vs {item.match.awayTeam || item.match.away_team}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.betType} @ {item.odds}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">Stake:</span>
                      <input
                        type="number"
                        value={item.stake}
                        onChange={(e) => onUpdateStake(item.id, e.target.value)}
                        className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isFreeBet}
                          onChange={(e) => onUpdateBetType(item.id, e.target.checked)}
                          className="text-green-600"
                        />
                        <span className="text-yellow-400 text-sm">Use Free Bet</span>
                      </label>
                    </div>
                  </div>
                  
                  {item.stake > 0 && (
                    <div className="mt-2">
                      <div className="text-yellow-400 text-sm">
                        To win: ${(item.stake * item.odds).toFixed(2)}
                      </div>
                      <button
                        onClick={() => placeSingleBet(item)}
                        className="w-full bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700 transition-colors mt-1"
                      >
                        Place This Bet
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {items.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mt-4">
                  <div className="flex justify-between text-white mb-2">
                    <span>Total Stake:</span>
                    <span>${calculateTotalStake()}</span>
                  </div>
                  <div className="flex justify-between text-white mb-2">
                    <span>Total Odds:</span>
                    <span>{calculateTotalOdds()}</span>
                  </div>
                  <div className="flex justify-between text-yellow-400 mb-4">
                    <span>Potential Winnings:</span>
                    <span>${calculatePotentialWinnings()}</span>
                  </div>
                  <button 
                    onClick={onPlaceAllBets}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Place All Bets
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'mybets' && (
        <div>
          {placedBets && placedBets.length > 0 ? (
            <div className="space-y-3">
              <div className="text-white font-semibold mb-3">Your Recent Bets</div>
              {placedBets.slice(0, 5).map((bet) => (
                <div key={bet.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-white text-sm font-semibold">
                    {bet.match_description}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {bet.bet_type} @ {bet.odds} - ${bet.stake}
                    {bet.is_free_bet && ' (Free Bet)'}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className={`text-xs px-2 py-1 rounded ${
                      bet.status === 'won' ? 'bg-green-600 text-white' :
                      bet.status === 'lost' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-black'
                    }`}>
                      {bet.status.toUpperCase()}
                    </div>
                    <div className="text-yellow-400 text-xs">
                      Potential: ${bet.potential_winnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p>No bets placed yet</p>
              <p className="text-sm mt-2">Your recent bets will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Login Modal Component
const LoginModal = ({ onClose, onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await onLogin(credentials.email, credentials.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Login</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400">
          <p className="text-sm">Special Account for Testing:</p>
          <p className="text-xs">Email: kb4211551@gmail.com</p>
          <p className="text-xs">Password: Kevin666</p>
        </div>
      </div>
    </div>
  );
};

// Register Modal Component
const RegisterModal = ({ onClose, onRegister }) => {
  const [details, setDetails] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await onRegister(details.name, details.email, details.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Register</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-white mb-2">Name</label>
            <input
              type="text"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              value={details.password}
              onChange={(e) => setDetails({ ...details, password: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>🎉 Every account gets unlimited free bets!</p>
        </div>
      </div>
    </div>
  );
};

// Betting History Component
const BettingHistory = ({ onClose, token }) => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBets();
  }, []);
  
  const fetchBets = async () => {
    try {
      const response = await axios.get(`${API}/bets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBets(response.data);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Betting History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : bets.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No bets placed yet</p>
            <p className="text-sm mt-2">Start betting to see your history here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map((bet) => (
              <div key={bet.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{bet.match_description}</div>
                    <div className="text-gray-400 text-sm">{bet.bet_type} @ {bet.odds}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(bet.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">
                      Stake: ${bet.stake} {bet.is_free_bet && '(Free Bet)'}
                    </div>
                    <div className="text-yellow-400">
                      Potential: ${bet.potential_winnings.toFixed(2)}
                    </div>
                    <div className={`text-sm ${
                      bet.status === 'won' ? 'text-green-400' : 
                      bet.status === 'lost' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {bet.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Account Activities Component
const AccountActivities = ({ onClose, token }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchActivities();
  }, []);
  
  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Account Activities</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No activities yet</p>
            <p className="text-sm mt-2">Your account activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-white font-semibold capitalize">
                      {activity.action.replace('_', ' ')}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {JSON.stringify(activity.details, null, 2)}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Withdrawal Modal Component
const WithdrawalModal = ({ onClose, onWithdraw, user }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount < 10) {
      setError('Minimum withdrawal amount is $10');
      setLoading(false);
      return;
    }
    
    if (withdrawAmount > user.winnings) {
      setError('Insufficient winnings balance');
      setLoading(false);
      return;
    }
    
    const result = await onWithdraw(withdrawAmount);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Withdraw USDT</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="bg-blue-900 text-blue-200 p-3 rounded mb-4 text-sm">
          <div className="font-semibold mb-1">💰 Available Winnings: ${user.winnings ? user.winnings.toFixed(2) : '0.00'}</div>
          <div className="text-xs">Only winnings can be withdrawn. Minimum withdrawal: $10</div>
        </div>
        
        <div className="bg-gray-700 text-gray-300 p-3 rounded mb-4 text-sm">
          <div className="font-semibold mb-1">🔗 USDT Wallet Address:</div>
          <div className="text-xs font-mono break-all bg-gray-600 p-2 rounded">
            TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ
          </div>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleWithdraw}>
          <div className="mb-4">
            <label className="block text-white mb-2">Withdrawal Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              placeholder="Enter amount"
              min="10"
              step="0.01"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !user.winnings || user.winnings < 10}
            className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>⚡ Withdrawals are processed to USDT (TRC-20)</p>
          <p>Processing time: 1-24 hours</p>
        </div>
      </div>
    </div>
  );
};

// Withdrawal History Component
const WithdrawalHistory = ({ onClose, token }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchWithdrawals();
  }, []);
  
  const fetchWithdrawals = async () => {
    try {
      const response = await axios.get(`${API}/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Withdrawal History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No withdrawals yet</p>
            <p className="text-sm mt-2">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-white font-semibold">
                      ${withdrawal.amount.toFixed(2)} USDT
                    </div>
                    <div className="text-gray-400 text-sm font-mono">
                      To: {withdrawal.usdt_address}
                    </div>
                    <div className="text-sm text-gray-400">
                      Requested: {new Date(withdrawal.created_at).toLocaleString()}
                    </div>
                    {withdrawal.processed_at && (
                      <div className="text-sm text-gray-400">
                        Processed: {new Date(withdrawal.processed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded text-sm ${
                      withdrawal.status === 'completed' ? 'bg-green-600 text-white' :
                      withdrawal.status === 'processing' ? 'bg-blue-600 text-white' :
                      withdrawal.status === 'failed' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-black'
                    }`}>
                      {withdrawal.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-8 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-4">About bet365</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Rules</a></li>
              <li><a href="#" className="hover:text-white">Payments</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Responsible Gaming</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Safer Gambling</a></li>
              <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-2xl hover:text-white">📘</a>
              <a href="#" className="text-2xl hover:text-white">🐦</a>
              <a href="#" className="text-2xl hover:text-white">📷</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
          <p>&copy; 2025 bet365. All rights reserved.</p>
          <p className="mt-2 text-yellow-400">🎉 Unlimited Free Bets Available!</p>
        </div>
      </div>
    </footer>
  );
};

// Export all components
const Components = {
  Header,
  Navigation,
  HeroSection,
  SportsMenu,
  LiveBetting,
  FeaturedMatches,
  CasinoSection,
  PromotionalBanner,
  Footer,
  BetSlip,
  LoginModal,
  RegisterModal,
  BettingHistory,
  AccountActivities
};

export default Components;