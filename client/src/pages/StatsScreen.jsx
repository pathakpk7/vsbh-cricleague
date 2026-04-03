import React, { useState, useEffect } from 'react';
import './StatsScreen.css';

const StatsScreen = () => {
  const [stats, setStats] = useState({
    topRunScorers: [],
    topWicketTakers: [],
    tournamentHighlights: [],
    liveMatch: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState<'batting' | 'bowling' | 'highlights'>('batting');

  useEffect(() => {
    fetchStats();
    // Set up real-time updates for live matches
    const interval = setInterval(() => {
      if (stats.liveMatch) {
        updateLiveMatch();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock stats data (in real app, this would come from CricHeroes API)
      const mockStats = {
        topRunScorers: [],
        topWicketTakers: [],
        tournamentHighlights: [],
        liveMatch: null
      };

      setStats(mockStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const updateLiveMatch = () => {
    // Simulate live match updates
    setStats(prev => ({
      ...prev,
      liveMatch: prev.liveMatch ? {
        ...prev.liveMatch,
        team1Score: prev.liveMatch.team1Score + Math.floor(Math.random() * 3),
        team1Overs: prev.liveMatch.team1Overs + 0.1,
        currentOver: prev.liveMatch.currentOver + 0.1,
        batsmanScore: prev.liveMatch.batsmanScore + Math.floor(Math.random() * 2)
      } : null
    }));
  };

  const getHighlightIcon = (type) => {
    const icons = {
      highest_score: '🏏',
      best_bowling: '🎯',
      biggest_win: '🏆',
      fastest_fifty: '⚡',
      most_sixes: '💥'
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div className="stats-screen">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-screen">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <h1>📈 Statistics</h1>
        <p>Player performance metrics and tournament highlights</p>
      </div>

      {/* Live Match Section */}
      {stats.liveMatch && (
        <div className="live-match-section">
          <div className="live-match-header">
            <h2>🔴 LIVE MATCH</h2>
            <div className="live-indicator">LIVE</div>
          </div>
          
          <div className="live-match-card">
            <div className="live-score-board">
              <div className="team-score">
                <h3>{stats.liveMatch.team1}</h3>
                <div className="score">
                  {stats.liveMatch.team1Score}/{stats.liveMatch.team1Wickets}
                  <span className="overs">({stats.liveMatch.team1Overs} ov)</span>
                </div>
              </div>
              
              <div className="vs">VS</div>
              
              <div className="team-score">
                <h3>{stats.liveMatch.team2}</h3>
                <div className="score">
                  {stats.liveMatch.team2Score}/{stats.liveMatch.team2Wickets}
                  <span className="overs">({stats.liveMatch.team2Overs} ov)</span>
                </div>
              </div>
            </div>

            <div className="live-details">
              <div className="current-state">
                <div className="batsman-info">
                  <span className="label">Batting:</span>
                  <span className="player">{stats.liveMatch.batsman}</span>
                  <span className="score">{stats.liveMatch.batsmanScore}*</span>
                </div>
                <div className="bowler-info">
                  <span className="label">Bowling:</span>
                  <span className="player">{stats.liveMatch.bowler}</span>
                  <span className="figures">{stats.liveMatch.bowlerWickets}/{stats.liveMatch.bowlerRuns}</span>
                </div>
              </div>
              <div className="match-info">
                <span className="venue">{stats.liveMatch.venue}</span>
                <span className="over">Over {stats.liveMatch.currentOver}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Tabs */}
      <div className="stats-tabs">
        <button 
          className={`tab-btn ${selectedTab === 'batting' ? 'active' : ''}`}
          onClick={() => setSelectedTab('batting')}
        >
          🏏 Batting
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'bowling' ? 'active' : ''}`}
          onClick={() => setSelectedTab('bowling')}
        >
          🎯 Bowling
        </button>
        <button 
          className={`tab-btn ${selectedTab === 'highlights' ? 'active' : ''}`}
          onClick={() => setSelectedTab('highlights')}
        >
          ⭐ Highlights
        </button>
      </div>

      <div className="stats-content">
        {selectedTab === 'batting' && (
          <div className="batting-stats">
            <div className="stats-table-container">
              <h3>🏏 Top Run Scorers</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Runs</th>
                    <th>Matches</th>
                    <th>Avg</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topRunScorers.map((player, index) => (
                    <tr key={index} className={index < 3 ? 'top-performer' : ''}>
                      <td className="rank">
                        {index + 1}
                        {index === 0 && <span className="crown">👑</span>}
                      </td>
                      <td className="player-name">
                        <div className="player-info">
                          <span className="name">{player.name}</span>
                          <span className="college-id">{player.college_id}</span>
                        </div>
                      </td>
                      <td className="team">{player.team}</td>
                      <td className="runs">{player.runs}</td>
                      <td className="average">{player.average}</td>
                      <td className="strike-rate">{player.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'bowling' && (
          <div className="bowling-stats">
            <div className="stats-table-container">
              <h3>🎯 Top Wicket Takers</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Wickets</th>
                    <th>Matches</th>
                    <th>Avg</th>
                    <th>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topWicketTakers.map((player, index) => (
                    <tr key={index} className={index < 3 ? 'top-performer' : ''}>
                      <td className="rank">
                        {index + 1}
                        {index === 0 && <span className="crown">👑</span>}
                      </td>
                      <td className="player-name">
                        <div className="player-info">
                          <span className="name">{player.name}</span>
                          <span className="college-id">{player.college_id}</span>
                        </div>
                      </td>
                      <td className="team">{player.team}</td>
                      <td className="wickets">{player.wickets}</td>
                      <td className="average">{player.average}</td>
                      <td className="economy">{player.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'highlights' && (
          <div className="highlights-stats">
            <h3>⭐ Tournament Highlights</h3>
            <div className="highlights-grid">
              {stats.tournamentHighlights.map((highlight, index) => (
                <div key={index} className="highlight-card">
                  <div className="highlight-icon">
                    {getHighlightIcon(highlight.type)}
                  </div>
                  <div className="highlight-content">
                    <h4>{highlight.title}</h4>
                    <p>{highlight.description}</p>
                    <div className="highlight-meta">
                      <span className="team">{highlight.team}</span>
                      <span className="match">{highlight.match}</span>
                      <span className="date">{highlight.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CricHeroes Integration Notice */}
      <div className="integration-notice">
        <div className="notice-content">
          <h3>📱 CricHeroes Integration</h3>
          <p>Statistics are updated in real-time from CricHeroes mobile app. Download the app to track detailed player performance and live match updates.</p>
          <div className="app-links">
            <button className="btn btn-primary">
              📥 Download CricHeroes
            </button>
            <button className="btn btn-secondary">
              📊 View Full Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsScreen;
