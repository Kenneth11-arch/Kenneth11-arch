import React, { useState } from 'react';

// Header Component
const Header = ({ user, onLoginClick, onRegisterClick }) => {
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
              <span>Welcome, {user.name}</span>
              <div className="bg-yellow-400 text-black px-3 py-1 rounded">
                Balance: ${user.balance}
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
          <p className="text-xl mb-6">Join millions of customers worldwide and bet on your favorite sports</p>
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
                  <div className="font-semibold">{match.homeTeam} vs {match.awayTeam}</div>
                  <div className="text-lg text-yellow-400">{match.score}</div>
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => onAddToBetSlip(match, 'home', match.homeOdds)}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                >
                  {match.homeTeam} {match.homeOdds}
                </button>
                {match.drawOdds && (
                  <button
                    onClick={() => onAddToBetSlip(match, 'draw', match.drawOdds)}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                  >
                    Draw {match.drawOdds}
                  </button>
                )}
                <button
                  onClick={() => onAddToBetSlip(match, 'away', match.awayOdds)}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                >
                  {match.awayTeam} {match.awayOdds}
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
              {match.homeTeam} vs {match.awayTeam}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onAddToBetSlip(match, 'home', match.homeOdds)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                {match.homeTeam} {match.homeOdds}
              </button>
              {match.drawOdds && (
                <button
                  onClick={() => onAddToBetSlip(match, 'draw', match.drawOdds)}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                  Draw {match.drawOdds}
                </button>
              )}
              <button
                onClick={() => onAddToBetSlip(match, 'away', match.awayOdds)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                {match.awayTeam} {match.awayOdds}
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
            <button className="w-full bg-yellow-400 text-black py-2 rounded hover:bg-yellow-500">
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
          <h3 className="text-2xl font-bold mb-2 text-white">Welcome Bonus</h3>
          <p className="text-lg mb-4 text-white">Get up to $100 in Bet Credits for new customers</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
            Claim Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Bet Slip Component
const BetSlip = ({ items, onRemoveItem, onUpdateStake }) => {
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
                        {item.match.homeTeam} vs {item.match.awayTeam}
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
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">Stake:</span>
                    <input
                      type="number"
                      value={item.stake}
                      onChange={(e) => onUpdateStake(item.id, e.target.value)}
                      className="flex-1 bg-gray-600 text-white px-2 py-1 rounded text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {item.stake > 0 && (
                    <div className="text-yellow-400 text-sm mt-1">
                      To win: ${(item.stake * item.odds).toFixed(2)}
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
                  <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Place Bet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'mybets' && (
        <div className="text-center text-gray-400 py-8">
          <p>No bets placed yet</p>
          <p className="text-sm mt-2">Your betting history will appear here</p>
        </div>
      )}
    </div>
  );
};

// Login Modal Component
const LoginModal = ({ onClose, onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  
  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login
    onLogin({ name: 'John Doe', balance: 1000 });
    onClose();
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
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
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
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// Register Modal Component
const RegisterModal = ({ onClose, onRegister }) => {
  const [details, setDetails] = useState({ name: '', email: '', password: '' });
  
  const handleRegister = (e) => {
    e.preventDefault();
    // Mock registration
    onRegister({ name: details.name, balance: 100 });
    onClose();
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
        
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-white mb-2">Name</label>
            <input
              type="text"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
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
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Register
          </button>
        </form>
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
  RegisterModal
};

export default Components;