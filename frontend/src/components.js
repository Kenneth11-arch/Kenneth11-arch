import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Header Component
const Header = ({ user, onLoginClick, onRegisterClick, onLogout, onShowBettingHistory, onShowActivities, onShowDeposit, onShowWithdrawal, onShowSettledBets, onShowMatchSettlements }) => {
  return (
    <header className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">bet365</div>
          <div className="text-sm">
            <span className="bg-yellow-400 text-black px-2 py-1 rounded">LIVE</span>
          </div>
          <div className="text-xs bg-red-600 px-2 py-1 rounded">REAL MONEY ONLY</div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span>Welcome, {user.name}</span>
                {user.is_special_account && (
                  <span className="ml-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs">ADMIN</span>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                  USDT Balance: ${user.balance ? user.balance.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={onShowDeposit}
                  className="bg-green-700 text-white px-2 py-1 rounded text-xs hover:bg-green-800"
                >
                  Deposit
                </button>
                <button
                  onClick={onShowBettingHistory}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  My Bets
                </button>
                <button
                  onClick={onShowSettledBets}
                  className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                >
                  Settled Bets
                </button>
                <button
                  onClick={onShowWithdrawal}
                  className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700"
                >
                  Withdraw
                </button>
                {user.is_special_account && (
                  <button
                    onClick={onShowMatchSettlements}
                    className="bg-yellow-600 text-black px-2 py-1 rounded text-xs hover:bg-yellow-700"
                  >
                    Settlements
                  </button>
                )}
                <button
                  onClick={onShowActivities}
                  className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700"
                >
                  Activities
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
          <h1 className="text-4xl font-bold mb-4">Real Money Betting Platform</h1>
          <p className="text-xl mb-6">Legitimate USDT deposits and withdrawals • No fake money • Real settlements</p>
          <div className="flex space-x-4">
            <button className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500">
              Deposit USDT
            </button>
            <button className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-green-600">
              View Settlements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sports Menu Component
const SportsMenu = ({ sports, selectedSport, onSelectSport, allSportsData, liveMatches, upcomingMatches }) => {
  
  // Calculate real match counts for each sport
  const getMatchCountForSport = (sportName) => {
    if (!allSportsData || !allSportsData[sportName]) return 0;
    return allSportsData[sportName].length;
  };
  
  const getTotalMatches = () => {
    return (liveMatches ? liveMatches.length : 0) + (upcomingMatches ? upcomingMatches.length : 0);
  };
  
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
          <div className="flex justify-between items-center">
            <span>All Sports</span>
            <span className="text-sm text-gray-400">{getTotalMatches()}</span>
          </div>
        </button>
        {sports.map((sport, index) => {
          const matchCount = getMatchCountForSport(sport.name);
          return (
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
              <span className="text-sm text-gray-400">{matchCount}</span>
            </button>
          );
        })}
      </div>
      
      {/* Live indicator */}
      <div className="mt-6 p-3 bg-red-900 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold">LIVE NOW</span>
        </div>
        <div className="text-red-200 text-xs mt-1">
          {liveMatches ? liveMatches.length : 0} live matches
        </div>
      </div>
      
      {/* Real money indicator */}
      <div className="mt-3 p-2 bg-green-900 rounded text-center">
        <div className="text-green-200 text-xs">
          💰 Real USDT Only
        </div>
      </div>
    </div>
  );
};

// Live Betting Component
const LiveBetting = ({ matches, onAddToBetSlip, selectedSport }) => {
  if (!matches) matches = [];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="bg-red-500 text-white px-2 py-1 rounded text-sm mr-2 animate-pulse">LIVE</span>
          Live In-Play
          {selectedSport && selectedSport !== 'All Sports' && (
            <span className="ml-2 text-green-400">({selectedSport})</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {matches.length} live {matches.length === 1 ? 'match' : 'matches'}
        </div>
      </h2>
      
      {matches.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <div className="text-lg mb-2">🎮 No live matches</div>
          <p className="text-sm">
            {selectedSport && selectedSport !== 'All Sports' 
              ? `No live ${selectedSport} matches right now` 
              : 'No live matches at the moment'
            }
          </p>
          <p className="text-xs mt-2">Check back in a few minutes - matches update automatically!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-400 font-semibold">{match.sport}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-400">{match.time}</span>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="font-semibold">
                      {match.home_team || match.homeTeam} vs {match.away_team || match.awayTeam}
                    </div>
                    <div className="text-lg text-yellow-400 font-bold">{match.score}</div>
                    {match.tournament && (
                      <div className="text-xs text-gray-400 mt-1">{match.tournament}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds, 'bet365')}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors transform hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="text-xs">{match.home_team || match.homeTeam}</div>
                      <div className="font-bold">{match.home_odds || match.homeOdds}</div>
                    </div>
                  </button>
                  {(match.draw_odds || match.drawOdds) && (
                    <button
                      onClick={() => onAddToBetSlip(match, 'draw', match.draw_odds || match.drawOdds, 'bet365')}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors transform hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-xs">Draw</div>
                        <div className="font-bold">{match.draw_odds || match.drawOdds}</div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds, 'bet365')}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors transform hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="text-xs">{match.away_team || match.awayTeam}</div>
                      <div className="font-bold">{match.away_odds || match.awayOdds}</div>
                    </div>
                  </button>
                  
                  {/* Matchbook Lay Betting */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds, 'matchbook')}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      LAY {match.home_team || match.homeTeam}
                    </button>
                    <button
                      onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds, 'matchbook')}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      LAY {match.away_team || match.awayTeam}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Featured Matches Component
const FeaturedMatches = ({ matches, onAddToBetSlip, selectedSport }) => {
  if (!matches) matches = [];
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
        <div className="flex items-center">
          Upcoming Matches
          {selectedSport && selectedSport !== 'All Sports' && (
            <span className="ml-2 text-blue-400">({selectedSport})</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {matches.length} upcoming {matches.length === 1 ? 'match' : 'matches'}
        </div>
      </h2>
      
      {matches.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <div className="text-lg mb-2">📅 No upcoming matches</div>
          <p className="text-sm">
            {selectedSport && selectedSport !== 'All Sports' 
              ? `No upcoming ${selectedSport} matches scheduled` 
              : 'No upcoming matches scheduled'
            }
          </p>
          <p className="text-xs mt-2">New matches are added regularly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-700 rounded-lg p-4 border-l-4 border-blue-500">
              <div 
                className="h-32 bg-cover bg-center rounded-lg mb-4 relative"
                style={{
                  backgroundImage: match.sport === 'Football' 
                    ? 'url(https://images.unsplash.com/photo-1600442715978-d0268caa17f5)'
                    : match.sport === 'Basketball'
                    ? 'url(https://images.unsplash.com/photo-1531593773601-7a75ca4cd915)'
                    : match.sport === 'Tennis'
                    ? 'url(https://images.unsplash.com/photo-1548920168-70d61248a912)'
                    : 'url(https://images.unsplash.com/photo-1600442715978-d0268caa17f5)'
                }}
              >
                <div className="bg-black bg-opacity-50 h-full rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{match.sport}</span>
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  UPCOMING
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-400 font-semibold">{match.sport}</span>
                <span className="text-gray-400 text-sm">
                  {match.date} {match.time}
                </span>
              </div>
              
              <div className="text-white font-semibold mb-3">
                {match.home_team || match.homeTeam} vs {match.away_team || match.awayTeam}
              </div>
              
              {match.tournament && (
                <div className="text-xs text-gray-400 mb-3">{match.tournament}</div>
              )}
              
              <div className="flex space-x-1 mb-2">
                <button
                  onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds, 'bet365')}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors text-sm"
                >
                  <div className="text-center">
                    <div className="text-xs">{(match.home_team || match.homeTeam).split(' ').slice(-1)[0]}</div>
                    <div className="font-bold">{match.home_odds || match.homeOdds}</div>
                  </div>
                </button>
                {(match.draw_odds || match.drawOdds) && (
                  <button
                    onClick={() => onAddToBetSlip(match, 'draw', match.draw_odds || match.drawOdds, 'bet365')}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    <div className="text-center">
                      <div className="text-xs">Draw</div>
                      <div className="font-bold">{match.draw_odds || match.drawOdds}</div>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds, 'bet365')}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors text-sm"
                >
                  <div className="text-center">
                    <div className="text-xs">{(match.away_team || match.awayTeam).split(' ').slice(-1)[0]}</div>
                    <div className="font-bold">{match.away_odds || match.awayOdds}</div>
                  </div>
                </button>
              </div>
              
              {/* Matchbook Lay Options */}
              <div className="flex space-x-1">
                <button
                  onClick={() => onAddToBetSlip(match, 'home', match.home_odds || match.homeOdds, 'matchbook')}
                  className="flex-1 bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition-colors text-xs"
                >
                  LAY {(match.home_team || match.homeTeam).split(' ').slice(-1)[0]}
                </button>
                <button
                  onClick={() => onAddToBetSlip(match, 'away', match.away_odds || match.awayOdds, 'matchbook')}
                  className="flex-1 bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition-colors text-xs"
                >
                  LAY {(match.away_team || match.awayTeam).split(' ').slice(-1)[0]}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
          <h3 className="text-2xl font-bold mb-2 text-white">Real Money Platform</h3>
          <p className="text-lg mb-4 text-white">Legitimate USDT deposits and withdrawals • No fake money!</p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
            Deposit USDT
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Bet Slip Component
const BetSlip = ({ items, placedBets, user, onRemoveItem, onUpdateStake, onUpdateBetType, onPlaceBet, onPlaceAllBets }) => {
  const [activeTab, setActiveTab] = useState('betslip');
  
  const calculateTotalStake = () => {
    return items.reduce((total, item) => total + parseFloat(item.stake || 0), 0).toFixed(2);
  };
  
  const calculatePotentialWinnings = () => {
    return items.reduce((total, item) => {
      const stake = parseFloat(item.stake || 0);
      const odds = parseFloat(item.odds);
      if (item.betType === 'back') {
        return total + (stake * odds);
      } else { // lay bet
        return total + stake; // For lay bets, you win the stake if selection loses
      }
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
    
    if (user.balance < betItem.stake) {
      alert('Insufficient balance. Please deposit USDT first.');
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
          Bet Slip ({items ? items.length : 0})
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
          {!items || items.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p>Your bet slip is empty</p>
              <p className="text-sm mt-2">Click on odds to add selections</p>
              <div className="mt-4 p-3 bg-red-900 rounded text-center">
                <div className="text-red-200 text-xs">
                  💰 Real USDT bets only
                </div>
              </div>
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
                        {item.betType === 'back' ? 'BACK' : 'LAY'} {item.selection} @ {item.odds}
                      </div>
                      <div className="text-blue-400 text-xs">
                        Platform: {item.platform || 'bet365'}
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
                      <span className="text-white text-sm">Stake (USDT):</span>
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
                          type="radio"
                          name={`betType_${item.id}`}
                          checked={item.betType === 'back'}
                          onChange={() => onUpdateBetType(item.id, 'back')}
                          className="text-green-600"
                        />
                        <span className="text-green-400 text-sm">Back Bet</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`betType_${item.id}`}
                          checked={item.betType === 'lay'}
                          onChange={() => onUpdateBetType(item.id, 'lay')}
                          className="text-blue-600"
                        />
                        <span className="text-blue-400 text-sm">Lay Bet</span>
                      </label>
                    </div>
                  </div>
                  
                  {item.stake > 0 && (
                    <div className="mt-2">
                      <div className="text-yellow-400 text-sm">
                        {item.betType === 'back' 
                          ? `To win: $${(item.stake * item.odds).toFixed(2)}` 
                          : `Win if loses: $${item.stake.toFixed(2)}`
                        }
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
                    <span>Total Stake (USDT):</span>
                    <span>${calculateTotalStake()}</span>
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
                    {bet.bet_type.toUpperCase()} {bet.selection} @ {bet.odds} - ${bet.stake} USDT
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
          <p className="text-sm">Admin Account:</p>
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
          <p>🎉 Real money betting platform with USDT!</p>
        </div>
      </div>
    </div>
  );
};

// Deposit Modal Component
const DepositModal = ({ onClose, onDeposit, user }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const depositAmount = parseFloat(amount);
    
    if (depositAmount < 10) {
      setError('Minimum deposit amount is $10 USDT');
      setLoading(false);
      return;
    }
    
    const result = await onDeposit(depositAmount);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Deposit USDT</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        <div className="bg-blue-900 text-blue-200 p-3 rounded mb-4 text-sm">
          <div className="font-semibold mb-1">💰 Current Balance: ${user?.balance?.toFixed(2) || '0.00'} USDT</div>
          <div className="text-xs">Minimum deposit: $10 USDT</div>
        </div>
        
        <div className="bg-gray-700 text-gray-300 p-3 rounded mb-4 text-sm">
          <div className="font-semibold mb-1">🔗 Send USDT to this address:</div>
          <div className="text-xs font-mono break-all bg-gray-600 p-2 rounded">
            TG1Yr5GGpQ51Vf4L6PfCfqu7AgYsUm2HsQ
          </div>
          <div className="text-xs mt-2">Network: TRC-20 (TRON)</div>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDeposit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Deposit Amount (USDT)</label>
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
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Deposit Request'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>⚡ Send exact amount to the address above</p>
          <p>Processing time: 1-10 minutes</p>
        </div>
      </div>
    </div>
  );
};

// Withdrawal Modal Component
const WithdrawalModal = ({ onClose, onWithdraw, user }) => {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount < 10) {
      setError('Minimum withdrawal amount is $10 USDT');
      setLoading(false);
      return;
    }
    
    if (withdrawAmount > user.balance) {
      setError('Insufficient balance');
      setLoading(false);
      return;
    }
    
    if (!address) {
      setError('Please enter USDT address');
      setLoading(false);
      return;
    }
    
    const result = await onWithdraw(withdrawAmount, address);
    
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
          <div className="font-semibold mb-1">💰 Available Balance: ${user?.balance?.toFixed(2) || '0.00'} USDT</div>
          <div className="text-xs">Minimum withdrawal: $10 USDT</div>
        </div>
        
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleWithdraw}>
          <div className="mb-4">
            <label className="block text-white mb-2">Withdrawal Amount (USDT)</label>
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
          
          <div className="mb-4">
            <label className="block text-white mb-2">USDT Address (TRC-20)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              placeholder="Enter your USDT address"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !user?.balance || user.balance < 10}
            className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>⚡ Withdrawals processed to USDT (TRC-20)</p>
          <p>Processing time: 1-24 hours</p>
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
                    <div className="text-gray-400 text-sm">
                      {bet.bet_type.toUpperCase()} {bet.selection} @ {bet.odds} - ${bet.stake} USDT
                    </div>
                    <div className="text-blue-400 text-sm">Platform: {bet.bet_platform}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(bet.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400">
                      Potential: ${bet.potential_winnings.toFixed(2)}
                    </div>
                    <div className={`text-sm px-2 py-1 rounded ${
                      bet.status === 'won' ? 'bg-green-600 text-white' : 
                      bet.status === 'lost' ? 'bg-red-600 text-white' : 
                      'bg-yellow-600 text-black'
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

// Settled Bets Modal Component
const SettledBetsModal = ({ onClose, settledBets }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Settled Bets - Wins & Losses</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {!settledBets || settledBets.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No settled bets yet</p>
            <p className="text-sm mt-2">Your wins and losses will appear here when matches are settled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settledBets.map((bet) => (
              <div key={bet.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{bet.match_description}</div>
                    <div className="text-gray-400 text-sm">
                      {bet.bet_type.toUpperCase()} {bet.selection} @ {bet.odds} - ${bet.stake} USDT
                    </div>
                    <div className="text-blue-400 text-sm">Platform: {bet.bet_platform}</div>
                    <div className="text-sm text-gray-400">
                      Settled: {new Date(bet.settled_at).toLocaleString()}
                    </div>
                    {bet.settlement_reason && (
                      <div className="text-sm text-gray-400">
                        Reason: {bet.settlement_reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      bet.status === 'won' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {bet.status === 'won' 
                        ? `+$${bet.potential_winnings.toFixed(2)}` 
                        : `-$${bet.stake.toFixed(2)}`
                      }
                    </div>
                    <div className={`text-sm px-2 py-1 rounded ${
                      bet.status === 'won' ? 'bg-green-600 text-white' : 
                      bet.status === 'lost' ? 'bg-red-600 text-white' : 
                      'bg-gray-600 text-white'
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

// Match Settlements Modal Component (Admin Only)
const MatchSettlementsModal = ({ onClose, token }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSettlements();
  }, []);
  
  const fetchSettlements = async () => {
    try {
      const response = await axios.get(`${API}/match-settlements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettlements(response.data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Match Settlements</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : settlements.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No matches settled yet</p>
            <p className="text-sm mt-2">Match settlements will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map((settlement) => (
              <div key={settlement.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{settlement.match_description}</div>
                    <div className="text-green-400 text-sm">Result: {settlement.result.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-gray-400 text-sm">
                      Settled: {new Date(settlement.settled_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">
                      Bets settled: {settlement.total_bets_settled}
                    </div>
                    <div className="text-yellow-400">
                      Total payouts: ${settlement.total_payouts.toFixed(2)}
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
          <p>&copy; 2025 bet365 Clone. All rights reserved.</p>
          <p className="mt-2 text-yellow-400">💰 Real USDT Betting Platform - No Fake Money</p>
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
  AccountActivities,
  DepositModal,
  WithdrawalModal,
  SettledBetsModal,
  MatchSettlementsModal
};

export default Components;