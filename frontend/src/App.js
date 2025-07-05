import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Components from './components';

const {
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
} = Components;

// Mock data for sports betting
const mockSportsData = {
  liveMatches: [
    {
      id: 1,
      sport: 'Football',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      homeOdds: '2.50',
      drawOdds: '3.20',
      awayOdds: '2.80',
      time: '45\' + 2',
      score: '1-1',
      isLive: true
    },
    {
      id: 2,
      sport: 'Basketball',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      homeOdds: '1.85',
      awayOdds: '1.95',
      time: '3Q 8:45',
      score: '89-92',
      isLive: true
    },
    {
      id: 3,
      sport: 'Tennis',
      homeTeam: 'Djokovic',
      awayTeam: 'Nadal',
      homeOdds: '1.75',
      awayOdds: '2.10',
      time: 'Set 2',
      score: '6-4, 3-2',
      isLive: true
    }
  ],
  upcomingMatches: [
    {
      id: 4,
      sport: 'Football',
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      homeOdds: '2.30',
      drawOdds: '3.10',
      awayOdds: '3.00',
      time: '15:00',
      date: 'Today'
    },
    {
      id: 5,
      sport: 'Basketball',
      homeTeam: 'Celtics',
      awayTeam: 'Heat',
      homeOdds: '1.90',
      awayOdds: '1.90',
      time: '20:30',
      date: 'Today'
    }
  ],
  sportsCategories: [
    { name: 'Football', icon: '⚽', count: 120 },
    { name: 'Basketball', icon: '🏀', count: 45 },
    { name: 'Tennis', icon: '🎾', count: 78 },
    { name: 'Baseball', icon: '⚾', count: 32 },
    { name: 'Hockey', icon: '🏒', count: 28 },
    { name: 'American Football', icon: '🏈', count: 15 }
  ]
};

const App = () => {
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [betSlipItems, setBetSlipItems] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState(null);

  const addToBetSlip = (match, betType, odds) => {
    const newBet = {
      id: Date.now(),
      match,
      betType,
      odds,
      stake: 0
    };
    setBetSlipItems([...betSlipItems, newBet]);
  };

  const removeBetSlipItem = (id) => {
    setBetSlipItems(betSlipItems.filter(item => item.id !== id));
  };

  const updateStake = (id, stake) => {
    setBetSlipItems(betSlipItems.map(item => 
      item.id === id ? { ...item, stake } : item
    ));
  };

  return (
    <div className="App bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <div className="flex flex-col min-h-screen">
              {/* Header */}
              <Header 
                user={user}
                onLoginClick={() => setShowLoginModal(true)}
                onRegisterClick={() => setShowRegisterModal(true)}
              />
              
              {/* Navigation */}
              <Navigation />
              
              {/* Main Content */}
              <div className="flex-1 flex">
                {/* Left Sidebar - Sports Menu */}
                <div className="w-64 bg-gray-800 border-r border-gray-700">
                  <SportsMenu 
                    sports={mockSportsData.sportsCategories}
                    selectedSport={selectedSport}
                    onSelectSport={setSelectedSport}
                  />
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 flex">
                  <div className="flex-1 p-4">
                    {/* Hero Section */}
                    <HeroSection />
                    
                    {/* Live Betting Section */}
                    <LiveBetting 
                      matches={mockSportsData.liveMatches}
                      onAddToBetSlip={addToBetSlip}
                    />
                    
                    {/* Featured Matches */}
                    <FeaturedMatches 
                      matches={mockSportsData.upcomingMatches}
                      onAddToBetSlip={addToBetSlip}
                    />
                    
                    {/* Casino Section */}
                    <CasinoSection />
                    
                    {/* Promotional Banner */}
                    <PromotionalBanner />
                  </div>
                  
                  {/* Right Sidebar - Bet Slip */}
                  <div className="w-80 bg-gray-800 border-l border-gray-700">
                    <BetSlip 
                      items={betSlipItems}
                      onRemoveItem={removeBetSlipItem}
                      onUpdateStake={updateStake}
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <Footer />
              
              {/* Modals */}
              {showLoginModal && (
                <LoginModal 
                  onClose={() => setShowLoginModal(false)}
                  onLogin={setUser}
                />
              )}
              
              {showRegisterModal && (
                <RegisterModal 
                  onClose={() => setShowRegisterModal(false)}
                  onRegister={setUser}
                />
              )}
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;