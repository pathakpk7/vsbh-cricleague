import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    soldPlayers: 0,
    availablePlayers: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch players stats
      const { data: players } = await supabase
        .from('players')
        .select('status');

      // Fetch teams count
      const { data: teams } = await supabase
        .from('teams')
        .select('id');

      // Fetch matches count
      const { data: matches } = await supabase
        .from('matches')
        .select('id');

      if (players) {
        const sold = players.filter(p => p.status === 'sold').length;
        const available = players.filter(p => p.status === 'available').length;
        
        setStats({
          totalPlayers: players.length,
          totalTeams: teams?.length || 0,
          totalMatches: matches?.length || 0,
          soldPlayers: sold,
          availablePlayers: available
        });

        // Check if there's any meaningful data
        const hasAnyData = players.length > 0 || (teams?.length || 0) > 0 || (matches?.length || 0) > 0;
        setHasData(hasAnyData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Empty state when no data available
  if (!hasData) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <img src="/logo_vsbh.png" alt="VSBH-CL" className="dashboard-logo" />
            <h1>VSBH-CL Dashboard</h1>
          </div>
        </div>

        <div className="empty-state">
          <div className="tournament-banner">
            <div className="banner-content">
              <div className="banner-icon">🚀</div>
              <h2>Tournament has not started yet. Stay tuned!</h2>
              <p>The tournament will begin soon. Get ready for exciting cricket action!</p>
            </div>
          </div>

          <div className="empty-content">
            <div className="empty-message">
              <h3>No tournament data available yet</h3>
              <p>Tournament will start soon</p>
            </div>

            <div className="activity-placeholder">
              <h3>Recent Activity</h3>
              <p>No activity yet. Auction and matches will appear here.</p>
            </div>
          </div>

          <div className="empty-actions">
            <Link to="/auction" className="btn btn-primary">
              🎯 Start Auction
            </Link>
            <Link to="/teams" className="btn btn-secondary">
              👥 Create Team
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <img src="/logo_vsbh.png" alt="VSBH-CL" className="dashboard-logo" />
          <h1>VSBH-CL Dashboard</h1>
        </div>
        <p>Welcome to the VSBH-CL Management System</p>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <h3>📊 Total Players</h3>
            <span className="live-indicator"></span>
          </div>
          <div className="card-body">
            <div className="stat-content">
              {stats.totalPlayers > 0 ? (
                <>
                  <div className="stat-number">{stats.totalPlayers}</div>
                  <div className="stat-details">
                    <span className="available">{stats.availablePlayers} Available</span>
                    <span className="sold">{stats.soldPlayers} Sold</span>
                  </div>
                </>
              ) : (
                <div className="stat-empty">
                  <div className="stat-empty-icon">👥</div>
                  <div className="stat-empty-text">Not available yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>🏆 Teams</h3>
          </div>
          <div className="card-body">
            <div className="stat-content">
              {stats.totalTeams > 0 ? (
                <>
                  <div className="stat-number">{stats.totalTeams}</div>
                  <div className="stat-details">
                    <span>Teams Registered</span>
                  </div>
                </>
              ) : (
                <div className="stat-empty">
                  <div className="stat-empty-icon">🏆</div>
                  <div className="stat-empty-text">Not registered yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>📅 Matches</h3>
          </div>
          <div className="card-body">
            <div className="stat-content">
              {stats.totalMatches > 0 ? (
                <>
                  <div className="stat-number">{stats.totalMatches}</div>
                  <div className="stat-details">
                    <span>Tournament Matches</span>
                  </div>
                </>
              ) : (
                <div className="stat-empty">
                  <div className="stat-empty-icon">📅</div>
                  <div className="stat-empty-text">Not scheduled yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/auction" className="btn btn-primary">
              🎯 Start Auction
            </Link>
            <Link to="/teams" className="btn btn-secondary">
              👥 Manage Teams
            </Link>
            <Link to="/fixtures" className="btn btn-success">
              📋 Schedule Matches
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-activity">
        <div className="card">
          <h3>🔔 Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-placeholder-item">
              <p>No activity yet. Auction and matches will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
