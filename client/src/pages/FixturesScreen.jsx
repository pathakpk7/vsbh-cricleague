import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseClient';
import './FixturesScreen.css';

const FixturesScreen = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live' | 'finished'>('upcoming');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getMatches();
      setMatches(data || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const getMatchesByStatus = (status) => {
    return matches.filter(match => match.status === status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTeamName = (teamId) => {
    // Return empty until auction is complete and teams are assigned
    return '';
  };

  if (loading) {
    return (
      <div className="fixtures-screen">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixtures-screen">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchMatches}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixtures-screen">
      <div className="fixtures-header">
        <h1>📅 Fixtures</h1>
        <p>Match schedules and results</p>
      </div>

      <div className="fixtures-tabs">
        <button 
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          UPCOMING
        </button>
        <button 
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <span className="live-indicator"></span>
          LIVE
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          FINISHED
        </button>
      </div>

      <div className="fixtures-content">
        {activeTab === 'upcoming' && (
          <div className="matches-list">
            {getMatchesByStatus('upcoming').map(match => (
              <div key={match.id} className="match-card upcoming">
                <div className="match-header">
                  <div className="match-date">{formatDate(match.match_date)}</div>
                  <div className="match-venue">{match.venue}</div>
                </div>
                
                <div className="match-teams">
                  <div className="team">
                    <h3>{getTeamName(match.team1_id)}</h3>
                    <div className="team-group">Group {match.group_stage?.toUpperCase()}</div>
                  </div>
                  
                  <div className="vs">VS</div>
                  
                  <div className="team">
                    <h3>{getTeamName(match.team2_id)}</h3>
                    <div className="team-group">Group {match.group_stage?.toUpperCase()}</div>
                  </div>
                </div>

                <div className="match-footer">
                  <span className="match-type">
                    {match.group_stage === 'semi-final' ? '🏆 Semi-Final' : 
                     match.group_stage === 'final' ? '🏆 Final' : 
                     `📊 Group ${match.group_stage?.toUpperCase()}`}
                  </span>
                </div>
              </div>
            ))}
            
            {getMatchesByStatus('upcoming').length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Upcoming Matches</h3>
                <p>Check back later for scheduled matches</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="matches-list">
            {getMatchesByStatus('live').map(match => (
              <div key={match.id} className="match-card live">
                <div className="live-header">
                  <span className="live-badge">🔴 LIVE</span>
                  <div className="match-venue">{match.venue}</div>
                </div>
                
                <div className="match-teams">
                  <div className="team">
                    <h3>{getTeamName(match.team1_id)}</h3>
                    <div className="live-score">
                      {match.team1_score || 0}/{match.team1_wickets || 0}
                      <span className="overs">({match.team1_overs || 0} ov)</span>
                    </div>
                  </div>
                  
                  <div className="vs">VS</div>
                  
                  <div className="team">
                    <h3>{getTeamName(match.team2_id)}</h3>
                    <div className="live-score">
                      {match.team2_score || 0}/{match.team2_wickets || 0}
                      <span className="overs">({match.team2_overs || 0} ov)</span>
                    </div>
                  </div>
                </div>

                <div className="match-footer">
                  <div className="live-status">
                    <span className="status-text">Match in Progress</span>
                    <span className="current-over">Current Over: {Math.max(match.team1_overs || 0, match.team2_overs || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {getMatchesByStatus('live').length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔴</div>
                <h3>No Live Matches</h3>
                <p>No matches are currently in progress</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finished' && (
          <div className="matches-list">
            {getMatchesByStatus('finished').map(match => {
              const team1Score = match.team1_score || 0;
              const team2Score = match.team2_score || 0;
              const winner = team1Score > team2Score ? match.team1_id : 
                           team2Score > team1Score ? match.team2_id : null;

              return (
                <div key={match.id} className="match-card finished">
                  <div className="match-header">
                    <div className="match-date">{formatDate(match.match_date)}</div>
                    <div className="match-venue">{match.venue}</div>
                  </div>
                  
                  <div className="match-teams">
                    <div className={`team ${winner === match.team1_id ? 'winner' : ''}`}>
                      <h3>{getTeamName(match.team1_id)}</h3>
                      <div className="final-score">
                        {team1Score}/{match.team1_wickets || 0}
                        <span className="overs">({match.team1_overs || 0} ov)</span>
                      </div>
                    </div>
                    
                    <div className="vs">VS</div>
                    
                    <div className={`team ${winner === match.team2_id ? 'winner' : ''}`}>
                      <h3>{getTeamName(match.team2_id)}</h3>
                      <div className="final-score">
                        {team2Score}/{match.team2_wickets || 0}
                        <span className="overs">({match.team2_overs || 0} ov)</span>
                      </div>
                    </div>
                  </div>

                  <div className="match-footer">
                    {winner && (
                      <div className="result">
                        🏆 {getTeamName(winner)} won by {Math.abs(team1Score - team2Score)} runs
                      </div>
                    )}
                    <span className="match-type">
                      {match.group_stage === 'semi-final' ? '🏆 Semi-Final' : 
                       match.group_stage === 'final' ? '🏆 Final' : 
                       `📊 Group ${match.group_stage?.toUpperCase()}`}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {getMatchesByStatus('finished').length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Finished Matches</h3>
                <p>No matches have been completed yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FixturesScreen;
