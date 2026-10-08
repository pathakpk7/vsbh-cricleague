import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { League } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CalendarIcon, CricketIcon, LightningIcon, ShieldIcon, LocationPinIcon, ActivityIcon, CheckIcon, ClockIcon } from '../components/Icons';
import './Fixtures.css';

interface MatchItem {
  id: string;
  league_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team1_wickets: number;
  team1_overs: string;
  team2_score: number;
  team2_wickets: number;
  team2_overs: string;
  status: 'upcoming' | 'live' | 'finished';
  venue?: string;
  match_date?: string;
  play_documentation?: string;
  recent_balls?: string[];
  winner_team_name?: string;
}

const Fixtures: React.FC = () => {
  const { activeLeagueId } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId || '');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMatches(selectedLeagueId);
  }, [selectedLeagueId]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && data.data.length > 0) {
        setLeagues(data.data);
        if (!selectedLeagueId) {
          setSelectedLeagueId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load leagues for fixtures:', e);
    }
  };

  const fetchMatches = async (leagueId?: string) => {
    try {
      setLoading(true);
      const url = leagueId ? `/api/matches?leagueId=${leagueId}` : '/api/matches';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setMatches(data.data);
      } else {
        setMatches([]);
      }
    } catch (e) {
      console.error('Failed to load fixtures:', e);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filterTab === 'all') return true;
    return m.status === filterTab;
  });

  const liveCount = matches.filter(m => m.status === 'live').length;
  const upcomingCount = matches.filter(m => m.status === 'upcoming').length;
  const finishedCount = matches.filter(m => m.status === 'finished').length;

  return (
    <div className="soc-fixtures-container">
      {/* 1. Header & Controls */}
      <div className="soc-fixtures-top-bar">
        <div className="fixtures-headline-group">
          <h2><CalendarIcon size={22} color="#00f0ff" style={{ marginRight: 8 }} /> Match Schedule & Operations Hub</h2>
          <p className="fixtures-subtitle">
            Live tournament fixtures, digital scoresheets, and pitch documentation
          </p>
        </div>

        <div className="fixtures-controls-group">
          {leagues.length > 0 && (
            <div className="league-picker-wrapper">
              <label>Tournament:</label>
              <select 
                className="league-picker-select"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                <option value="">All Leagues</option>
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="soc-filter-tabs">
            <button 
              className={`soc-filter-tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              All ({matches.length})
            </button>
            <button 
              className={`soc-filter-tab ${filterTab === 'live' ? 'active' : ''}`}
              onClick={() => setFilterTab('live')}
            >
              Live ({liveCount})
            </button>
            <button 
              className={`soc-filter-tab ${filterTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFilterTab('upcoming')}
            >
              Upcoming ({upcomingCount})
            </button>
            <button 
              className={`soc-filter-tab ${filterTab === 'finished' ? 'active' : ''}`}
              onClick={() => setFilterTab('finished')}
            >
              Completed ({finishedCount})
            </button>
          </div>

          <Link to="/live-matches" className="soc-btn-create-league">
            + Match Center
          </Link>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="soc-empty-state-card">
          <div className="soc-spinner-pulse"></div>
          <p>RETRIEVING TOURNAMENT FIXTURES...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        /* 3. Empty State */
        <div className="soc-empty-state-card">
          <div className="soc-empty-radar-icon"><CricketIcon size={48} color="#64748b" /></div>
          <h3>NO FIXTURES SCHEDULED</h3>
          <p>
            {matches.length === 0 
              ? 'No matches have been scheduled yet for this tournament. League administrators can create and score matches in the Live Match Center.'
              : `No matches match the filter "${filterTab.toUpperCase()}". Check other filter tabs or schedule a new match.`
            }
          </p>
          <div className="empty-state-actions">
            <Link to="/live-matches" className="soc-btn-create-league">
              <LightningIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Open Live Match Center
            </Link>
            <Link to="/teams" className="soc-btn-primary-sm">
              <ShieldIcon size={14} color="#10b981" style={{ marginRight: 6 }} /> View Squads
            </Link>
          </div>
        </div>
      ) : (
        /* 4. Fixtures Grid */
        <div className="soc-fixtures-grid">
          {filteredMatches.map(match => {
            const isLive = match.status === 'live';
            const isFinished = match.status === 'finished';
            const statusBadgeClass = isLive 
              ? 'badge-live-match' 
              : isFinished 
              ? 'badge-finished-match' 
              : 'badge-upcoming-match';

            return (
              <div key={match.id} className="soc-fixture-card">
                {/* Meta Bar */}
                <div className="fixture-top-meta">
                  <span className="fixture-venue-text">
                    <LocationPinIcon size={13} color="#00f0ff" style={{ marginRight: 4 }} /> {match.venue || 'Campus Sports Ground'} • {match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBD'}
                  </span>
                  <span className={`fixture-status-badge ${statusBadgeClass}`}>
                    {isLive ? <><ActivityIcon size={12} color="#ef4444" style={{ marginRight: 4 }} /> LIVE</> : isFinished ? <><CheckIcon size={12} color="#10b981" style={{ marginRight: 4 }} /> FINISHED</> : <><ClockIcon size={12} color="#facc15" style={{ marginRight: 4 }} /> UPCOMING</>}
                  </span>
                </div>

                {/* Scoreboard Arena */}
                <div className="fixture-versus-arena">
                  <div className="versus-team-row">
                    <div className="team-info-side">
                      <div className="team-badge-circle">
                        {match.team1_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="team-name-label">{match.team1_name}</span>
                    </div>
                    <div className="team-score-side">
                      <span className="team-score-value">
                        {match.team1_score || 0}/{match.team1_wickets || 0}
                      </span>
                      <span className="team-overs-value">
                        ({match.team1_overs || '0.0'} ov)
                      </span>
                    </div>
                  </div>

                  <div className="versus-divider">vs</div>

                  <div className="versus-team-row">
                    <div className="team-info-side">
                      <div className="team-badge-circle" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        {match.team2_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="team-name-label">{match.team2_name}</span>
                    </div>
                    <div className="team-score-side">
                      <span className="team-score-value">
                        {match.team2_score || 0}/{match.team2_wickets || 0}
                      </span>
                      <span className="team-overs-value">
                        ({match.team2_overs || '0.0'} ov)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Documentation / Status Equation */}
                {match.play_documentation && (
                  <div className="fixture-equation-strip">
                    <span><LightningIcon size={13} color="#00f0ff" style={{ marginRight: 4 }} /> {match.play_documentation}</span>
                  </div>
                )}

                {/* Recent Balls Trail if available */}
                {match.recent_balls && match.recent_balls.length > 0 && (
                  <div className="fixture-recent-balls-strip">
                    <span>Recent:</span>
                    {match.recent_balls.map((b, idx) => (
                      <span 
                        key={idx} 
                        className={`ball-pip ${b === '4' ? 'is-four' : b === '6' ? 'is-six' : b.toUpperCase() === 'W' ? 'is-wicket' : ''}`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* Match Center Action */}
                <Link to="/live-matches" className="fixture-action-link">
                  <span>Enter Live Match Center</span>
                  <span>→</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Fixtures;
