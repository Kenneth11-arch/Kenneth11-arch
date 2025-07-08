import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveScores = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchScores();
    // Update scores every 30 seconds
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/live-scores`);
      const matches = response.data;
      
      setLiveMatches(matches.filter(m => m.status === 'live' || m.is_live));
      setUpcomingMatches(matches.filter(m => m.status === 'upcoming'));
      setRecentMatches(matches.filter(m => m.status === 'completed' || m.status === 'settled'));
    } catch (error) {
      console.error('Error fetching live scores:', error);
    } finally {
      setLoading(false);
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

  const getSportIcon = (sport) => {
    const icons = {
      'nfl': '🏈',
      'nba': '🏀',
      'soccer': '⚽',
      'tennis': '🎾'
    };
    return icons[sport] || '🏆';
  };

  const getMatchTime = (match) => {
    if (match.status === 'live' || match.is_live) {
      // Mock live time - in real implementation this would be actual match time
      const elapsed = Math.floor(Math.random() * 90) + 1;
      return `${elapsed}'`;
    }
    return formatDateTime(match.commence_time);
  };

  const renderMatchCard = (match) => (
    <div key={match.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getSportIcon(match.sport)}</span>
          <span className="text-sm font-medium text-gray-600 capitalize">{match.sport}</span>
        </div>
        <div className="flex items-center space-x-2">
          {(match.status === 'live' || match.is_live) && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
              🔴 LIVE
            </span>
          )}
          <span className="text-sm text-gray-500">{getMatchTime(match)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-gray-900">{match.home_team}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {match.home_score !== null ? match.home_score : '-'}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-gray-900">{match.away_team}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {match.away_score !== null ? match.away_score : '-'}
          </div>
        </div>
      </div>

      {/* Match Status Info */}
      {match.status === 'completed' && match.winner && (
        <div className="mt-3 p-2 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-green-600 font-medium">🏆 Winner:</span>
            <span className="font-bold text-green-800">
              {match.winner === 'home' ? match.home_team :
               match.winner === 'away' ? match.away_team : 'Draw'}
            </span>
          </div>
        </div>
      )}

      {/* Live Match Info */}
      {(match.status === 'live' || match.is_live) && (
        <div className="mt-3 space-y-2">
          <div className="flex justify-center space-x-4 text-sm">
            <span className="text-gray-600">⚽ Next goal odds updating...</span>
          </div>
          {match.odds && (
            <div className="grid grid-cols-3 gap-2">
              {match.odds.home && (
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xs text-gray-500">Home</div>
                  <div className="font-bold text-blue-600">{match.odds.home}</div>
                </div>
              )}
              {match.odds.draw && (
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xs text-gray-500">Draw</div>
                  <div className="font-bold text-blue-600">{match.odds.draw}</div>
                </div>
              )}
              {match.odds.away && (
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-xs text-gray-500">Away</div>
                  <div className="font-bold text-blue-600">{match.odds.away}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Scores</h2>
            <p className="text-gray-600">Real-time match results and live updates</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Updates every 30s</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'live'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔴 Live Now ({liveMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏰ Upcoming ({upcomingMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'recent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Recent Results ({recentMatches.length})
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading scores...</p>
        </div>
      )}

      {/* Live Matches */}
      {activeTab === 'live' && (
        <div>
          {liveMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map(renderMatchCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">⚽</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No live matches</h3>
              <p className="text-gray-600">Check back later for live match updates</p>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Matches */}
      {activeTab === 'upcoming' && (
        <div>
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMatches.map(renderMatchCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">⏰</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming matches</h3>
              <p className="text-gray-600">All scheduled matches are either live or completed</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Results */}
      {activeTab === 'recent' && (
        <div>
          {recentMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentMatches.map(renderMatchCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent results</h3>
              <p className="text-gray-600">Recent match results will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 text-2xl mr-3">🔴</span>
            <div>
              <p className="text-sm font-medium text-red-600">Live Now</p>
              <p className="text-2xl font-bold text-red-700">{liveMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-blue-600 text-2xl mr-3">⏰</span>
            <div>
              <p className="text-sm font-medium text-blue-600">Upcoming Today</p>
              <p className="text-2xl font-bold text-blue-700">{upcomingMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm font-medium text-green-600">Completed Today</p>
              <p className="text-2xl font-bold text-green-700">{recentMatches.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScores;