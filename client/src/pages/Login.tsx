import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { League, Team } from '../types';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAdmin, loginCaptain, loginPlayer, error: authError, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'captain' | 'player'>('admin');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeagueCode, setSelectedLeagueCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin form
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Captain form
  const [captainKey, setCaptainKey] = useState('');
  const [captainTeamId, setCaptainTeamId] = useState('');

  // Player form
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPassword, setPlayerPassword] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && data.data.length > 0) {
        setLeagues(data.data);
        setSelectedLeagueCode(data.data[0].code);
        fetchTeamsForLeague(data.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load leagues:', e);
    }
  };

  const fetchTeamsForLeague = async (leagueId: string) => {
    try {
      const res = await fetch(`/api/teams?leagueId=${leagueId}`);
      const data = await res.json();
      if (res.ok) {
        setTeams(data);
        if (data.length > 0) {
          setCaptainTeamId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeagueChange = (leagueCode: string) => {
    setSelectedLeagueCode(leagueCode);
    const found = leagues.find(l => l.code === leagueCode);
    if (found) {
      fetchTeamsForLeague(found.id);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!adminEmail || !adminPassword) {
      setErrorMessage('Email and Password are required');
      return;
    }

    const success = await loginAdmin({
      email: adminEmail,
      password: adminPassword
    });

    if (success) {
      navigate('/league-admin');
    } else {
      setErrorMessage(authError || 'Invalid admin credentials');
    }
  };

  const handleCaptainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedLeagueCode || !captainTeamId || !captainKey) {
      setErrorMessage('Please select league, team, and enter your Captain Auction Key');
      return;
    }

    const success = await loginCaptain({
      leagueCodeOrId: selectedLeagueCode,
      teamId: captainTeamId,
      captainKey: captainKey.trim()
    });

    if (success) {
      navigate('/auction');
    } else {
      setErrorMessage(authError || 'Invalid Captain Auction Key');
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!playerEmail) {
      setErrorMessage('Player email is required');
      return;
    }

    const success = await loginPlayer({
      email: playerEmail,
      password: playerPassword
    });

    if (success) {
      navigate('/auction');
    } else {
      setErrorMessage(authError || 'Invalid player credentials');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-box">
        <div className="login-header">
          <img src="/logo_vsbh.png" alt="VSBH-CL" className="login-logo-img" />
          <h2>VSBH-CL Cricket League</h2>
          <p>Native Authentication System for Leagues, Captains & Players</p>
        </div>

        {/* Navigation Tabs for Roles */}
        <div className="login-role-tabs">
          <button
            className={`role-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); setErrorMessage(null); }}
          >
            🛡️ League Admin
          </button>
          <button
            className={`role-tab ${activeTab === 'captain' ? 'active' : ''}`}
            onClick={() => { setActiveTab('captain'); setErrorMessage(null); }}
          >
            👑 Captain Auction
          </button>
          <button
            className={`role-tab ${activeTab === 'player' ? 'active' : ''}`}
            onClick={() => { setActiveTab('player'); setErrorMessage(null); }}
          >
            🏏 Player
          </button>
        </div>

        {errorMessage && (
          <div className="login-error-badge">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* TAB 1: LEAGUE ADMIN LOGIN */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="login-form-content">
            <div className="form-group-field">
              <label>League Admin Email</label>
              <input
                type="email"
                placeholder="admin@vsbh.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group-field">
              <label>Password / Admin Key</label>
              <input
                type="password"
                placeholder="Enter your admin password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Sign In as League Admin'}
            </button>

            <div className="login-footer-links">
              <span>Want to start an organization? </span>
              <Link to="/league-admin">Register New Cricket League</Link>
            </div>
          </form>
        )}

        {/* TAB 2: CAPTAIN AUCTION LOGIN */}
        {activeTab === 'captain' && (
          <form onSubmit={handleCaptainSubmit} className="login-form-content">
            <div className="form-group-field">
              <label>Select Cricket League</label>
              <select
                value={selectedLeagueCode}
                onChange={e => handleLeagueChange(e.target.value)}
                required
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.code}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-field">
              <label>Select Your Team</label>
              <select
                value={captainTeamId}
                onChange={e => setCaptainTeamId(e.target.value)}
                required
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Budget: ₹{t.budget})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-field">
              <label>Unique Captain Auction Key (e.g. CAP-XXXX)</label>
              <input
                type="text"
                placeholder="Enter Captain Auction Key"
                value={captainKey}
                onChange={e => setCaptainKey(e.target.value.toUpperCase())}
                required
              />
              <small className="help-text">Provided exclusively by your League Administrator to enter bidding mode.</small>
            </div>

            <button type="submit" className="btn-login-submit btn-captain" disabled={isLoading}>
              {isLoading ? 'Verifying Key...' : 'Enter Auction Bidding Mode'}
            </button>
          </form>
        )}

        {/* TAB 3: PLAYER LOGIN */}
        {activeTab === 'player' && (
          <form onSubmit={handlePlayerSubmit} className="login-form-content">
            <div className="form-group-field">
              <label>Registered Player Email</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={playerEmail}
                onChange={e => setPlayerEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={playerPassword}
                onChange={e => setPlayerPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In as Player'}
            </button>

            <div className="login-footer-links">
              <span>Not registered for a league yet? </span>
              <Link to="/register-player">Register as Player</Link>
            </div>
          </form>
        )}

        {/* Quick Spectator Entry */}
        <div className="spectator-quick-entry">
          <p>Just want to watch the auction or live match?</p>
          <button
            type="button"
            className="btn-spectator-guest"
            onClick={() => navigate('/auction')}
          >
            👀 Continue as Spectator (No Login Required)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
