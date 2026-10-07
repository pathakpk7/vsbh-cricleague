import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { League } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    soldPlayers: 0,
    availablePlayers: 0
  });
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch leagues
      const lRes = await fetch('/api/leagues');
      const lData = await lRes.json();
      if (lRes.ok && lData.success) {
        setLeagues(lData.data);
      }

      // Fetch players
      const pRes = await fetch('/api/players');
      const players = await pRes.json();

      // Fetch teams
      const tRes = await fetch('/api/teams');
      const teams = await tRes.json();

      // Fetch matches
      const mRes = await fetch('/api/matches');
      const mData = await mRes.json();
      const matches = mData.data || [];

      if (Array.isArray(players)) {
        const sold = players.filter((p: any) => p.status === 'sold').length;
        const available = players.filter((p: any) => p.status === 'available').length;
        
        setStats({
          totalPlayers: players.length,
          totalTeams: Array.isArray(teams) ? teams.length : 0,
          totalMatches: Array.isArray(matches) ? matches.length : 0,
          soldPlayers: sold,
          availablePlayers: available
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading cricket leagues dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <img src="/logo_vsbh.png" alt="VSBH-CL" className="dashboard-logo" />
          <div>
            <h1>VSBH Cricket League System</h1>
            <p className="dashboard-subtitle">Multi-League Auction & Live Match Documentation Arena</p>
          </div>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <h3>📊 Registered Players</h3>
            <span className="live-indicator"></span>
          </div>
          <div className="card-body">
            <div className="stat-content">
              <div className="stat-number">{stats.totalPlayers}</div>
              <div className="stat-details">
                <span className="available">{stats.availablePlayers} Available for Auction</span>
                <span className="sold">{stats.soldPlayers} Sold</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>🏆 Active Teams</h3>
          </div>
          <div className="card-body">
            <div className="stat-content">
              <div className="stat-number">{stats.totalTeams}</div>
              <div className="stat-details">
                <span>Teams Registered Across Leagues</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📅 Live & Upcoming Matches</h3>
          </div>
          <div className="card-body">
            <div className="stat-content">
              <div className="stat-number">{stats.totalMatches}</div>
              <div className="stat-details">
                <span>Documented Matches</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Leagues Directory */}
      <div className="dashboard-leagues-section">
        <div className="card">
          <div className="card-header-flex">
            <h3>🏆 Active Cricket Leagues</h3>
            <Link to="/league-admin" className="btn btn-sm btn-primary">
              + Register New League
            </Link>
          </div>
          <div className="leagues-cards-grid">
            {leagues.map(league => (
              <div key={league.id} className="league-overview-card">
                <div className="league-name-row">
                  <h4>{league.name}</h4>
                  <span className={`status-pill ${league.registration_status}`}>
                    {league.registration_status === 'open' ? '🟢 Registration Open' : '🔴 Closed'}
                  </span>
                </div>
                <div className="league-code-row">
                  <span className="code-label">Player Key:</span>
                  <span className="code-badge">{league.code}</span>
                </div>
                <div className="league-meta-row">
                  <span>Teams: {league.number_of_teams}</span> • 
                  <span>Auction: {league.auction_status?.toUpperCase() || 'SCHEDULED'}</span>
                </div>
                <div className="league-card-actions">
                  <Link to={`/register-player?league=${league.code}`} className="btn-link">
                    Register as Player →
                  </Link>
                  <Link to={`/auction?league=${league.id}`} className="btn-link-highlight">
                    Join Auction →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="dashboard-actions">
        <div className="card">
          <h3>⚡ Quick Operations</h3>
          <div className="action-buttons-grid">
            <Link to="/auction" className="btn btn-action-card">
              <span className="action-icon">🎯</span>
              <div>
                <strong>Live Auction Arena</strong>
                <p>Bid as Captain or Spectate live team compositions</p>
              </div>
            </Link>

            <Link to="/live-matches" className="btn btn-action-card">
              <span className="action-icon">🔴</span>
              <div>
                <strong>Live Match Center</strong>
                <p>Follow live scoring & read admin play documentation</p>
              </div>
            </Link>

            <Link to="/register-player" className="btn btn-action-card">
              <span className="action-icon">🏏</span>
              <div>
                <strong>Player Registration</strong>
                <p>Register yourself directly under your league key</p>
              </div>
            </Link>

            <Link to="/league-admin" className="btn btn-action-card">
              <span className="action-icon">🛡️</span>
              <div>
                <strong>League Administration</strong>
                <p>Manage teams, deadlines, and captain keys</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
