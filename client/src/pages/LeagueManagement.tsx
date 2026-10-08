import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { League, Team, Player } from '../types';
import { 
  TrophyIcon, 
  ClipboardIcon, 
  PlusIcon, 
  CricketIcon, 
  CrossIcon, 
  CheckIcon, 
  SpinIcon, 
  SettingsIcon, 
  UsersIcon, 
  GavelIcon, 
  BarChartIcon 
} from '../components/Icons';
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
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New League Form State
  const [newLeague, setNewLeague] = useState({
    name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    number_of_teams: '' as number | string,
    default_team_purse: 100,
    max_players_per_team: 15,
    registration_deadline: '',
    auction_date_time: ''
  });

  const [initialTeamNames, setInitialTeamNames] = useState<string[]>(['', '']);

  // Edit Team State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamBudget, setNewTeamBudget] = useState(100);

  // Tournament Rules & Schedule State
  const [editDefaultPurse, setEditDefaultPurse] = useState<number>(100);
  const [editMaxPlayers, setEditMaxPlayers] = useState<number>(15);
  const [auctionDateTime, setAuctionDateTime] = useState('');
  const [regDeadline, setRegDeadline] = useState('');

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeLeagueId) {
      loadLeagueDetails(activeLeagueId);
    } else if (leagues.length > 0 && !currentLeague) {
      loadLeagueDetails(leagues[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeagueId, leagues]);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success) {
        setLeagues(data.data);
        if (data.data.length === 0) {
          setActiveTab('create');
        } else if (!currentLeague) {
          const selected = activeLeagueId 
            ? data.data.find((l: League) => l.id === activeLeagueId) || data.data[0]
            : data.data[0];
          setCurrentLeague(selected);
          setActiveLeagueId(selected.id);
        }
      }
    } catch (e) {
      console.error('Error fetching leagues:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadLeagueDetails = async (leagueId: string) => {
    if (!leagueId) return;
    try {
      setLoading(true);
      const leagueRes = await fetch(`/api/leagues/${leagueId}`);
      const leagueData = await leagueRes.json();
      if (leagueRes.ok && leagueData.success) {
        setCurrentLeague(leagueData.data);
        setActiveLeagueId(leagueData.data.id);
        if (leagueData.data.default_team_purse !== undefined) {
          setEditDefaultPurse(leagueData.data.default_team_purse);
          setNewTeamBudget(leagueData.data.default_team_purse);
        }
        if (leagueData.data.max_players_per_team !== undefined) {
          setEditMaxPlayers(leagueData.data.max_players_per_team);
        }
        if (leagueData.data.auction_date_time) {
          setAuctionDateTime(leagueData.data.auction_date_time.slice(0, 16));
        }
        if (leagueData.data.registration_deadline) {
          setRegDeadline(leagueData.data.registration_deadline.slice(0, 16));
        }
      }

      // Fetch teams
      const teamsRes = await fetch(`/api/teams?leagueId=${leagueId}`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }

      // Fetch players
      const playersRes = await fetch(`/api/players?leagueId=${leagueId}`);
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(Array.isArray(playersData) ? playersData : []);
      }
    } catch (e) {
      console.error('Error loading league details:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setLoading(true);

    const validTeams = initialTeamNames.map(t => t.trim()).filter(t => t.length > 0);

    try {
      const res = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeague,
          default_team_purse: Number(newLeague.default_team_purse) || 100,
          max_players_per_team: Number(newLeague.max_players_per_team) || 15,
          auction_date_time: newLeague.auction_date_time ? new Date(newLeague.auction_date_time).toISOString() : undefined,
          registration_deadline: newLeague.registration_deadline ? new Date(newLeague.registration_deadline).toISOString() : undefined,
          number_of_teams: newLeague.number_of_teams ? Number(newLeague.number_of_teams) : (validTeams.length || undefined),
          team_names: validTeams
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const createdLeague = data.data;
        setCurrentLeague(createdLeague);
        setActiveLeagueId(createdLeague.id);
        setStatusMessage({
          text: `League "${createdLeague.name}" registered! Unique Player Key: ${createdLeague.code} | Captain Key: ${createdLeague.captain_auction_key}`,
          type: 'success'
        });
        setNewLeague({
          name: '',
          admin_name: '',
          admin_email: '',
          admin_password: '',
          number_of_teams: '',
          default_team_purse: 100,
          max_players_per_team: 15,
          registration_deadline: '',
          auction_date_time: ''
        });
        setInitialTeamNames(['', '']);
        await fetchLeagues();
        await loadLeagueDetails(createdLeague.id);
        setActiveTab('manage');
      } else {
        setStatusMessage({ text: data.message || 'Failed to create league', type: 'error' });
      }
    } catch (e) {
      console.error('Error creating league:', e);
      setStatusMessage({ text: 'Error connecting to server. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !currentLeague) return;
    setLoading(true);
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
      const data = await res.json();
      if (res.ok) {
        const addedName = newTeamName.trim();
        setNewTeamName('');
        await loadLeagueDetails(currentLeague.id);
        setStatusMessage({ text: `Team "${addedName}" registered successfully!`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || data.message || 'Failed to add team', type: 'error' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to add team', type: 'error' });
    } finally {
      setLoading(false);
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
          default_team_purse: Number(editDefaultPurse) || 100,
          max_players_per_team: Number(editMaxPlayers) || 15,
          auction_date_time: auctionDateTime ? new Date(auctionDateTime).toISOString() : undefined,
          registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentLeague(data.data);
        setStatusMessage({ text: 'Tournament purse (₹ Cr), squad size & schedule updated!', type: 'success' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to update settings', type: 'error' });
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setStatusMessage({ text: `${label} copied to clipboard!`, type: 'success' });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="league-mgmt-container">
      <div className="league-mgmt-header">
        <h1><TrophyIcon size={24} color="#facc15" style={{ marginRight: 8 }} /> Cricket League Administration Hub</h1>
        <p>Create and manage independent cricket leagues, team rosters, auction deadlines, and captain keys.</p>

        <div className="mgmt-tabs">
          <button
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <ClipboardIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Manage Active League
          </button>
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <PlusIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Register New Cricket League
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
          <h2><CricketIcon size={22} color="#00f0ff" style={{ marginRight: 8 }} /> Register New Cricket League</h2>
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
                <label>Expected Number of Teams (Optional)</label>
                <input
                  type="number"
                  min="2"
                  max="32"
                  placeholder="e.g. 4, 6, 8 (or leave blank)"
                  value={newLeague.number_of_teams}
                  onChange={(e) => setNewLeague({ ...newLeague, number_of_teams: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Default Team Purse / Price Pool (₹ Cr) *</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="e.g. 100"
                  value={newLeague.default_team_purse}
                  onChange={(e) => setNewLeague({ ...newLeague, default_team_purse: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Squad Capacity (Players / Team) *</label>
                <input
                  type="number"
                  min="5"
                  max="35"
                  placeholder="e.g. 15"
                  value={newLeague.max_players_per_team}
                  onChange={(e) => setNewLeague({ ...newLeague, max_players_per_team: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Deadline (Date & Time)</label>
                <input
                  type="datetime-local"
                  value={newLeague.registration_deadline}
                  onChange={(e) => setNewLeague({ ...newLeague, registration_deadline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Auction Date & Time</label>
                <input
                  type="datetime-local"
                  value={newLeague.auction_date_time}
                  onChange={(e) => setNewLeague({ ...newLeague, auction_date_time: e.target.value })}
                />
              </div>
            </div>

            <div className="teams-initial-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0, fontWeight: 600 }}>Initial Team Names (Optional)</label>
                <button
                  type="button"
                  onClick={() => setInitialTeamNames(prev => [...prev, ''])}
                  style={{
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    color: '#00f0ff',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Team Field
                </button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '14px' }}>
                Optionally enter your tournament team names now, or leave blank to add teams later in the Manage tab.
              </p>
              <div className="team-names-grid">
                {initialTeamNames.map((name, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={name}
                      placeholder={`Team ${idx + 1} Name (e.g. Royal Strikers)`}
                      onChange={(e) => {
                        const updated = [...initialTeamNames];
                        updated[idx] = e.target.value;
                        setInitialTeamNames(updated);
                      }}
                    />
                    {initialTeamNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setInitialTeamNames(prev => prev.filter((_, i) => i !== idx))}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          cursor: 'pointer'
                        }}
                        title="Remove team"
                      >
                        <CrossIcon size={14} color="#ef4444" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-create-submit" disabled={loading}>
              {loading ? 'Registering League & Generating Keys...' : 'Register League & Generate Unique Keys'}
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
                    {copiedKey === 'League Player Key' ? (
                      <><CheckIcon size={14} color="#10b981" style={{ marginRight: 4 }} /> Copied!</>
                    ) : (
                      <><ClipboardIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Copy Player Key</>
                    )}
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
                      {copiedKey === 'Captain Auction Key' ? (
                        <><CheckIcon size={14} color="#10b981" style={{ marginRight: 4 }} /> Copied!</>
                      ) : (
                        <><ClipboardIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Copy Captain Key</>
                      )}
                    </button>
                    <button className="btn-regen" onClick={handleRegenerateCaptainKey}>
                      <SpinIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Regenerate Key
                    </button>
                  </div>
                </div>
              </div>

              {/* Tournament Rules, Price Pool & Schedule Settings */}
              <div className="admin-panel-card">
                <h3><SettingsIcon size={18} color="#00f0ff" style={{ marginRight: 6 }} /> Tournament Rules, Price Pool & Schedule</h3>
                <div className="schedule-controls-grid">
                  <div className="control-item">
                    <label>Player Registration Status:</label>
                    <div className="status-toggle-row">
                      <span className={`status-pill ${currentLeague.registration_status}`}>
                        {currentLeague.registration_status === 'open' ? 'Registration OPEN' : 'Registration CLOSED'}
                      </span>
                      <button className="btn-toggle" onClick={handleToggleRegistration}>
                        {currentLeague.registration_status === 'open' ? 'Close Registrations' : 'Open Registrations'}
                      </button>
                    </div>
                  </div>

                  <div className="control-item">
                    <label>Default Team Purse / Price Pool (₹ Cr):</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={editDefaultPurse}
                      onChange={(e) => setEditDefaultPurse(Number(e.target.value))}
                    />
                  </div>

                  <div className="control-item">
                    <label>Max Squad Capacity (Players / Team):</label>
                    <input
                      type="number"
                      min="5"
                      max="35"
                      value={editMaxPlayers}
                      onChange={(e) => setEditMaxPlayers(Number(e.target.value))}
                    />
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
                    Save Rules, Purse & Schedule
                  </button>
                  <button className="btn-danger-reset" onClick={handleResetAuction}>
                    Reset Auction System for this League
                  </button>
                </div>
              </div>

              {/* Team Management */}
              <div className="admin-panel-card">
                <div className="panel-header-row">
                  <div>
                    <h3><CricketIcon size={18} color="#00f0ff" style={{ marginRight: 6 }} /> Team Configuration ({teams.length} / {currentLeague.number_of_teams} Teams)</h3>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
                      Default Team Purse: <strong style={{ color: '#00f0ff' }}>₹{currentLeague.default_team_purse || 100} Cr</strong> | Squad Limit: <strong style={{ color: '#00f0ff' }}>{currentLeague.max_players_per_team || 15} Players</strong>
                    </p>
                  </div>
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
                    placeholder="Budget (₹ Cr)"
                    value={newTeamBudget}
                    onChange={(e) => setNewTeamBudget(Number(e.target.value))}
                    style={{ width: '130px' }}
                  />
                  <button className="btn-add-team" onClick={handleAddTeam} disabled={loading}>
                    {loading ? 'Adding...' : '+ Add Team'}
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
                          <td>₹{t.budget} Cr</td>
                          <td>{t.captain_name || 'Unassigned'}</td>
                          <td>{t.team_players?.length || 0} / {currentLeague.max_players_per_team || 15}</td>
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
                <h3><UsersIcon size={18} color="#00f0ff" style={{ marginRight: 6 }} /> Registered Players ({players.length} Total)</h3>
                <div className="teams-table-container">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th>Player Name</th>
                        <th>Role</th>
                        <th>Playing Style / Position</th>
                        <th>Dept / ID</th>
                        <th>Base Price</th>
                        <th>Registered At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => {
                        const styleInfo = [
                          p.batting_hand ? `${p.batting_hand === 'left' ? 'LHB' : 'RHB'} (${p.batting_position || 'Middle Order'})` : null,
                          p.bowling_arm || p.bowling_type ? `${p.bowling_arm === 'left' ? 'Left' : 'Right'}-Arm ${p.bowling_category || ''} (${p.bowling_type || ''})` : null,
                          p.is_wicketkeeper ? 'WK (Keeper)' : null,
                          p.allrounder_type ? (p.allrounder_type === 'batting-allrounder' ? 'Batting AR' : 'Bowling AR') : null
                        ].filter(Boolean).join(' • ');

                        return (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.role?.toUpperCase()}</td>
                            <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{styleInfo || '-'}</td>
                            <td>{p.department || '-'} / {p.college_id || '-'}</td>
                            <td>₹{p.base_price}</td>
                            <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                            </td>
                            <td>
                              <span className={`status-pill ${p.status}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
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
                  <GavelIcon size={16} color="#000" style={{ marginRight: 6 }} /> Launch Live Auction Arena
                </button>
                <button
                  className="btn-nav-secondary"
                  onClick={() => navigate(`/live-matches?league=${currentLeague.id}`)}
                >
                  <BarChartIcon size={16} color="#00f0ff" style={{ marginRight: 6 }} /> Live Match Center & Scoring Console
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-leagues-prompt" style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(16,23,38,0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ color: '#38bdf8', fontSize: '20px', marginBottom: '10px' }}>No Active Leagues Found</h3>
              <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Register your cricket league to automatically generate the Player Registration Key and Captain Auction Key.</p>
              <button 
                className="btn-create-submit"
                style={{ width: 'auto', padding: '14px 32px', display: 'inline-block' }}
                onClick={() => setActiveTab('create')}
              >
                <PlusIcon size={16} color="#000" style={{ marginRight: 6 }} /> Register New Cricket League Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeagueManagement;
