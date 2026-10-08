import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Team, League } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ShieldIcon, CrownIcon, LightningIcon, CricketIcon } from '../components/Icons';
import './Teams.css';

const Teams: React.FC = () => {
  const { activeLeagueId } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId || '');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all leagues
  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch teams whenever selected league changes
  useEffect(() => {
    if (selectedLeagueId) {
      fetchTeams(selectedLeagueId);
    } else {
      fetchTeams();
    }
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
      console.error('Failed to load leagues in Squads view:', e);
    }
  };

  const fetchTeams = async (leagueId?: string) => {
    try {
      setLoading(true);
      const url = leagueId ? `/api/teams?leagueId=${leagueId}` : '/api/teams';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const activeLeague = leagues.find(l => l.id === selectedLeagueId);
  const totalSquads = teams.length;
  const totalPlayersAcquired = teams.reduce((acc, t) => acc + (t.team_players?.length || 0), 0);
  const totalPurseAllocated = teams.reduce((acc, t) => acc + t.budget, 0);
  const totalPurseSpent = teams.reduce((acc, t) => {
    return acc + (t.team_players?.reduce((sum: number, tp: any) => sum + (tp.sold_price || 0), 0) || 0);
  }, 0);

  if (loading && leagues.length === 0) {
    return (
      <div className="soc-squads-container">
        <div className="soc-empty-state-card">
          <div className="soc-spinner-pulse"></div>
          <p>LOADING SQUAD REGISTRY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soc-squads-container">
      {/* 1. Header Bar with League Selection */}
      <div className="soc-squads-top-bar">
        <div className="squads-headline-group">
          <h2><ShieldIcon size={22} color="#00f0ff" style={{ marginRight: 8 }} /> Squad Command Deck</h2>
          <p className="squads-subtitle">
            Tactical squad compositions, purse balances, and verified player rosters
          </p>
        </div>

        <div className="squads-controls">
          {leagues.length > 0 && (
            <div className="league-picker-wrapper">
              <label>Tournament:</label>
              <select 
                className="league-picker-select"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Link to="/league-admin" className="soc-btn-create-league">
            + Manage Teams
          </Link>
        </div>
      </div>

      {/* 2. Telemetry Metric Ribbon */}
      <div className="soc-squads-telemetry-ribbon">
        <div className="squads-metric-tile">
          <span className="squads-metric-label">Active Squads</span>
          <span className="squads-metric-val val-cyan">{totalSquads}</span>
        </div>
        <div className="squads-metric-tile">
          <span className="squads-metric-label">Players Signed</span>
          <span className="squads-metric-val val-emerald">{totalPlayersAcquired}</span>
        </div>
        <div className="squads-metric-tile">
          <span className="squads-metric-label">Total Purse Pool</span>
          <span className="squads-metric-val">₹{totalPurseAllocated} Cr</span>
        </div>
        <div className="squads-metric-tile">
          <span className="squads-metric-label">Auction Expenditure</span>
          <span className="squads-metric-val val-gold">₹{totalPurseSpent} Cr</span>
        </div>
      </div>

      {/* 3. Empty State if No Squads Exist */}
      {teams.length === 0 ? (
        <div className="soc-empty-state-card">
          <div className="soc-empty-radar-icon"><ShieldIcon size={48} color="#64748b" /></div>
          <h3>NO ACTIVE SQUADS FOUND</h3>
          <p>
            {leagues.length === 0 
              ? 'No cricket leagues have been created yet. Launch your first tournament league to generate teams and begin player scouting.'
              : `No teams have been configured under "${activeLeague?.name || 'this league'}". As league admin, register the team names in League Operations.`
            }
          </p>
          <div className="empty-state-actions">
            <Link to="/league-admin" className="soc-btn-create-league">
              <LightningIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Open League Operations
            </Link>
            <Link to="/register-player" className="soc-btn-primary-sm">
              <CricketIcon size={14} color="#10b981" style={{ marginRight: 6 }} /> Player Registration
            </Link>
          </div>
        </div>
      ) : (
        /* 4. Squads Cards Grid */
        <div className="soc-squads-grid">
          {teams.map((team, idx) => {
            const teamRoster = team.team_players || [];
            const spent = teamRoster.reduce((sum: number, tp: any) => sum + (tp.sold_price || 0), 0);
            const remaining = team.budget;
            const originalPurse = remaining + spent;
            const spendPercentage = originalPurse > 0 ? Math.min(Math.round((spent / originalPurse) * 100), 100) : 0;

            return (
              <div key={team.id} className="soc-team-card">
                {/* Header */}
                <div className="team-card-header">
                  <div className="team-brand-box">
                    <div className="team-avatar-glyph">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="team-name-title">{team.name}</h3>
                      <div className="team-captain-pill">
                        <span className="captain-icon"><CrownIcon size={12} color="#facc15" /></span>
                        <span>Captain: {team.captain_name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="squad-count-chip">
                    {teamRoster.length} / 11 Players
                  </span>
                </div>

                {/* Purse HUD */}
                <div className="team-purse-hud">
                  <div className="purse-row">
                    <span className="purse-label">Available Purse</span>
                    <span className="purse-value">₹{remaining} Cr</span>
                  </div>
                  <div className="purse-track">
                    <div 
                      className="purse-fill" 
                      style={{ width: `${spendPercentage}%` }}
                      title={`Spent: ${spendPercentage}%`}
                    ></div>
                  </div>
                  <div className="purse-row">
                    <span className="purse-label">Spent in Bidding</span>
                    <span className="purse-spent">₹{spent} Cr ({spendPercentage}%)</span>
                  </div>
                </div>

                {/* Roster Section */}
                <div className="team-roster-section">
                  <div className="roster-header-strip">
                    <span className="roster-header-title">Squad Roster</span>
                    <small className="squads-subtitle">{11 - teamRoster.length} slots open</small>
                  </div>

                  <div className="roster-players-list">
                    {teamRoster.length === 0 ? (
                      <div className="soc-empty-radar" style={{ padding: '20px 0', fontSize: '12px' }}>
                        No players acquired yet. Bidding opens in live auction.
                      </div>
                    ) : (
                      teamRoster.map((tp: any, rIdx: number) => {
                        const player = tp.player || tp.players || {};
                        const roleClass = player.role === 'batter' ? 'role-batter'
                          : player.role === 'bowler' ? 'role-bowler'
                          : player.role === 'all-rounder' ? 'role-allrounder'
                          : player.role === 'wicketkeeper' ? 'role-wk'
                          : 'role-batter';

                        return (
                          <div key={tp.player_id || rIdx} className="roster-player-row">
                            <div className="player-main-col">
                              <span className="player-name-text">
                                {player.name || `Player #${rIdx + 1}`}
                              </span>
                              <div className="player-meta-badges">
                                <span className={`role-badge-sm ${roleClass}`}>
                                  {player.role || 'Player'}
                                </span>
                                {player.batting_style && (
                                  <span className="spec-badge-sm">
                                    • {player.batting_style}
                                  </span>
                                )}
                                {player.department && (
                                  <span className="spec-badge-sm">
                                    ({player.department})
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="price-chip-sm">
                              ₹{tp.sold_price || player.base_price || 10} Cr
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Teams;
