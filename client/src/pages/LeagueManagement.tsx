import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { League, Team, Player } from '../types';
import './LeagueManagement.css';

const LeagueManagement: React.FC = () => {
  const { activeLeagueId, setActiveLeagueId } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New League Form State
  const [newLeague, setNewLeague] = useState({
    name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    number_of_teams: 6,
    team_names: ['Warriors', 'Titans', 'Royals', 'Superstars', 'Champions', 'Legends']
  });

  // Edit Team State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBudget, setNewTeamBudget] = useState(100);

  // Auction Date & Deadline State
  const [auctionDateTime, setAuctionDateTime] = useState('');
  const [regDeadline, setRegDeadline] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (activeLeagueId) {
      loadLeagueDetails(activeLeagueId);
    } else if (leagues.length > 0) {
      loadLeagueDetails(leagues[0].id);
    }
  }, [activeLeagueId, leagues]);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success) {
        setLeagues(data.data);
      }
    } catch (e) {
      console.error('Error fetching leagues:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLeagueDetails = async (leagueId: string) => {
    try {
      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      const leagueData = await leagueRes.json();
      if (leagueRes.ok && leagueData.success) {
        setCurrentLeague(leagueData.data);
        setActiveLeagueId(leagueData.data.id);
        if (leagueData.data.auction_date_time) {
          setAuctionDateTime(leagueData.data.auction_date_time.slice(0, 16));
        }
        if (leagueData.data.registration_deadline) {
          setRegDeadline(leagueData.data.registration_deadline.slice(0, 16));
        }
      }

      // Fetch teams
      const teamsRes = await fetch(`/api/teams?leagueId=${leagueId}`);
      const teamsData = await teamsRes.json();
      if (teamsRes.ok) {
        setTeams(teamsData);
      }

      // Fetch players
      const playersRes = await fetch(`/api/players?leagueId=${leagueId}`);
      const playersData = await playersRes.json();
      if (playersRes.ok) {
        setPlayers(playersData);
      }
    } catch (e) {
      console.error('Error loading league details:', e);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeague)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({ text: `League created! Share Code: ${data.data.code}`, type: 'success' });
        await fetchLeagues();
        loadLeagueDetails(data.data.id);
        setActiveTab('manage');
      } else {
        setStatusMessage({ text: data.message || 'Failed to create league', type: 'error' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Error connecting to server', type: 'error' });
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !currentLeague) return;
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id: currentLeague.id,
          name: newTeamName.trim(),
          budget: newTeamBudget
        })
      });
      if (res.ok) {
        setNewTeamName('');
        loadLeagueDetails(currentLeague.id);
        setStatusMessage({ text: 'Team added successfully', type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to add team', type: 'error' });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok && currentLeague) {
        loadLeagueDetails(currentLeague.id);
        setStatusMessage({ text: 'Team removed', type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to delete team', type: 'error' });
    }
  };

  const handleToggleRegistration = async () => {
    if (!currentLeague) return;
    const newStatus = currentLeague.registration_status === 'open' ? 'closed' : 'open';
    try {
      const res = await fetch(`/api/leagues/${currentLeague.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentLeague(data.data);
        setStatusMessage({
          text: `Player registrations are now ${newStatus.toUpperCase()}`,
          type: 'success'
        });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to update registration status', type: 'error' });
    }
  };

  const handleSaveAuctionSchedule = async () => {
    if (!currentLeague) return;
    try {
      const res = await fetch(`/api/leagues/${currentLeague.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_date_time: auctionDateTime ? new Date(auctionDateTime).toISOString() : undefined,
          registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentLeague(data.data);
        setStatusMessage({ text: 'Auction schedule & deadline updated!', type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to update schedule', type: 'error' });
    }
  };

  const handleRegenerateCaptainKey = async () => {
    if (!currentLeague) return;
    if (!window.confirm('Regenerate Captain Auction Key? Existing key will be invalidated.')) return;
    try {
      const res = await fetch(`/api/leagues/${currentLeague.id}/generate-captain-key`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentLeague(data.data);
        setStatusMessage({ text: `New Captain Key generated: ${data.captain_auction_key}`, type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to generate key', type: 'error' });
    }
  };

  const handleResetAuction = async () => {
    if (!currentLeague) return;
    if (!window.confirm('Reset auction for this league? All sold statuses and team budgets will be reset.')) return;
    try {
      const res = await fetch('/api/auction/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: currentLeague.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loadLeagueDetails(currentLeague.id);
        setStatusMessage({ text: 'Auction reset successfully for this league', type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to reset auction', type: 'error' });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage({ text: `${label} copied to clipboard!`, type: 'success' });
  };

  return (
    <div className="league-mgmt-container">
      <div className="league-mgmt-header">
        <h1>🏆 Cricket League Administration Hub</h1>
        <p>Create and manage independent cricket leagues, team rosters, auction deadlines, and captain keys.</p>

        <div className="mgmt-tabs">
          <button
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            📋 Manage Active League
          </button>
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            ➕ Register New Cricket League
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-toast ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {activeTab === 'create' ? (
        <div className="create-league-card">
          <h2>🏏 Register New Cricket League</h2>
          <p className="subtext">
            Each league gets a Unique League ID for player registrations and a Unique Captain Key for auction bidding.
          </p>

          <form onSubmit={handleCreateLeague}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Cricket League / Tournament Name *</label>
                <input
                  type="text"
                  placeholder="e.g. VSBH Premier League Season 2"
                  value={newLeague.name}
                  onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  placeholder="Tournament Director / Organizer Name"
                  value={newLeague.admin_name}
                  onChange={(e) => setNewLeague({ ...newLeague, admin_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Email Address *</label>
                <input
                  type="email"
                  placeholder="admin@yourcollege.edu"
                  value={newLeague.admin_email}
                  onChange={(e) => setNewLeague({ ...newLeague, admin_email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Admin Password *</label>
                <input
                  type="password"
                  placeholder="Password for league admin login"
                  value={newLeague.admin_password}
                  onChange={(e) => setNewLeague({ ...newLeague, admin_password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Number of Teams (e.g. 4, 6, 8) *</label>
                <input
                  type="number"
                  min="2"
                  max="16"
                  value={newLeague.number_of_teams}
                  onChange={(e) => {
                    const count = parseInt(e.target.value, 10) || 6;
                    const defaultNames = Array.from({ length: count }, (_, i) => newLeague.team_names[i] || `Team ${i + 1}`);
                    setNewLeague({ ...newLeague, number_of_teams: count, team_names: defaultNames });
                  }}
                  required
                />
              </div>
            </div>

            <div className="teams-initial-list">
              <label>Initial Team Names</label>
              <div className="team-names-grid">
                {newLeague.team_names.slice(0, newLeague.number_of_teams).map((name, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={name}
                    placeholder={`Team ${idx + 1}`}
                    onChange={(e) => {
                      const updated = [...newLeague.team_names];
                      updated[idx] = e.target.value;
                      setNewLeague({ ...newLeague, team_names: updated });
                    }}
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="btn-create-submit">
              Register League & Generate Unique Keys
            </button>
          </form>
        </div>
      ) : (
        <div className="league-details-dashboard">
          {/* League Selector Bar */}
          <div className="league-selector-bar">
            <label>Select Active League:</label>
            <select
              value={currentLeague?.id || ''}
              onChange={(e) => loadLeagueDetails(e.target.value)}
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {currentLeague ? (
            <div className="dashboard-sections">
              {/* Top Key Banners */}
              <div className="key-banners-grid">
                <div className="key-banner player-key-card">
                  <div className="key-banner-label">PLAYER REGISTRATION KEY</div>
                  <div className="key-banner-value">{currentLeague.code}</div>
                  <p>Share this key with all players so they can register under this league.</p>
                  <button
                    className="btn-copy"
                    onClick={() => copyToClipboard(currentLeague.code, 'League Player Key')}
                  >
                    📋 Copy Player Key
                  </button>
                </div>

                <div className="key-banner captain-key-card">
                  <div className="key-banner-label">CAPTAIN AUCTION BIDDING KEY</div>
                  <div className="key-banner-value">{currentLeague.captain_auction_key}</div>
                  <p>Share ONLY with team captains to let them enter Auction Mode & place bids.</p>
                  <div className="banner-actions">
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(currentLeague.captain_auction_key || '', 'Captain Auction Key')}
                    >
                      📋 Copy Captain Key
                    </button>
                    <button className="btn-regen" onClick={handleRegenerateCaptainKey}>
                      🔄 Regenerate Key
                    </button>
                  </div>
                </div>
              </div>

              {/* Auction & Deadline Settings */}
              <div className="admin-panel-card">
                <h3>⏰ Registration Deadline & Auction Schedule</h3>
                <div className="schedule-controls-grid">
                  <div className="control-item">
                    <label>Player Registration Status:</label>
                    <div className="status-toggle-row">
                      <span className={`status-pill ${currentLeague.registration_status}`}>
                        {currentLeague.registration_status === 'open' ? '🟢 Registration OPEN' : '🔴 Registration CLOSED'}
                      </span>
                      <button className="btn-toggle" onClick={handleToggleRegistration}>
                        {currentLeague.registration_status === 'open' ? 'Close Registrations' : 'Open Registrations'}
                      </button>
                    </div>
                  </div>

                  <div className="control-item">
                    <label>Registration Deadline Date/Time:</label>
                    <input
                      type="datetime-local"
                      value={regDeadline}
                      onChange={(e) => setRegDeadline(e.target.value)}
                    />
                  </div>

                  <div className="control-item">
                    <label>Auction Date & Time:</label>
                    <input
                      type="datetime-local"
                      value={auctionDateTime}
                      onChange={(e) => setAuctionDateTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="schedule-action-bar">
                  <button className="btn-save-schedule" onClick={handleSaveAuctionSchedule}>
                    Save Dates & Deadlines
                  </button>
                  <button className="btn-danger-reset" onClick={handleResetAuction}>
                    Reset Auction System for this League
                  </button>
                </div>
              </div>

              {/* Team Management */}
              <div className="admin-panel-card">
                <div className="panel-header-row">
                  <h3>🏏 Team Configuration ({teams.length} / {currentLeague.number_of_teams} Teams)</h3>
                </div>

                <div className="add-team-inline-form">
                  <input
                    type="text"
                    placeholder="New Team Name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Budget (₹)"
                    value={newTeamBudget}
                    onChange={(e) => setNewTeamBudget(Number(e.target.value))}
                    style={{ width: '120px' }}
                  />
                  <button className="btn-add-team" onClick={handleAddTeam}>
                    + Add Team
                  </button>
                </div>

                <div className="teams-table-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>Team Name</th>
                        <th>Initial Budget</th>
                        <th>Captain Name</th>
                        <th>Players Bought</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t) => (
                        <tr key={t.id}>
                          <td><strong>{t.name}</strong></td>
                          <td>₹{t.budget}</td>
                          <td>{t.captain_name || 'Unassigned'}</td>
                          <td>{t.team_players?.length || 0}</td>
                          <td>
                            <button
                              className="btn-delete-item"
                              onClick={() => handleDeleteTeam(t.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Registered Players List */}
              <div className="admin-panel-card">
                <h3>👥 Registered Players ({players.length} Total)</h3>
                <div className="teams-table-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Dept / College ID</th>
                        <th>Base Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.role?.toUpperCase()}</td>
                          <td>{p.department || '-'} / {p.college_id || '-'}</td>
                          <td>₹{p.base_price}</td>
                          <td>
                            <span className={`status-pill ${p.status}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="quick-nav-actions">
                <button
                  className="btn-nav-primary"
                  onClick={() => navigate(`/auction?league=${currentLeague.id}`)}
                >
                  🎯 Launch Live Auction Arena
                </button>
                <button
                  className="btn-nav-secondary"
                  onClick={() => navigate(`/live-matches?league=${currentLeague.id}`)}
                >
                  📊 Live Match Center & Scoring Console
                </button>
              </div>
            </div>
          ) : (
            <p>No leagues found. Register your first league above!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LeagueManagement;
