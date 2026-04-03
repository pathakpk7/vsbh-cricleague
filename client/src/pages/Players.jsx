import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseClient';
import './Players.css';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await supabaseService.getPlayers();
      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'batter': 'Batter',
      'bowler': 'Bowler', 
      'all-rounder': 'All-Rounder',
      'wicketkeeper': 'Wicketkeeper'
    };
    return roleMap[role] || role;
  };

  const getYearDisplay = (year) => {
    const yearMap = {
      '1st': '1st Year',
      '2nd': '2nd Year',
      '3rd': '3rd Year',
      '4th': '4th Year'
    };
    return yearMap[year] || year;
  };

  if (loading) {
    return (
      <div className="players-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchPlayers}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="players-container">
      <div className="players-header">
        <h1>🏏 Players</h1>
        <p>Manage and view all registered players</p>
        <div className="players-stats">
          <span className="stat">
            <strong>{players.length}</strong> Total Players
          </span>
          <span className="stat">
            <strong>{players.filter(p => p.is_mvp).length}</strong> MVP Players
          </span>
          <span className="stat">
            <strong>{players.filter(p => p.status === 'available').length}</strong> Available
          </span>
        </div>
      </div>

      <div className="players-grid">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`player-card ${player.is_mvp ? 'mvp-card' : ''} ${player.status === 'sold' ? 'sold-card' : ''}`}
          >
            {player.is_mvp && (
              <div className="mvp-badge">
                ⭐ MVP
              </div>
            )}
            
            {player.status === 'sold' && (
              <div className="sold-badge">
                ✅ Sold
              </div>
            )}

            <div className="player-header">
              <h3 className="player-name">{player.name}</h3>
              <div className="player-id">ID: {player.college_id}</div>
            </div>

            <div className="player-details">
              <div className="detail-item">
                <span className="label">Year:</span>
                <span className="value">{getYearDisplay(player.year)}</span>
              </div>
              
              <div className="detail-item">
                <span className="label">Role:</span>
                <span className={`value role-badge ${player.role}`}>
                  {getRoleDisplay(player.role)}
                </span>
              </div>

              <div className="detail-item">
                <span className="label">MVP:</span>
                <span className={`value ${player.is_mvp ? 'mvp-yes' : 'mvp-no'}`}>
                  {player.is_mvp ? 'Yes ⭐' : 'No'}
                </span>
              </div>

              <div className="detail-item price-item">
                <span className="label">Base Price:</span>
                <span className="value price">₹{player.base_price}</span>
              </div>

              {player.sold_price && (
                <div className="detail-item sold-price-item">
                  <span className="label">Sold Price:</span>
                  <span className="value sold-price">₹{player.sold_price}</span>
                </div>
              )}

              {player.department && (
                <div className="detail-item">
                  <span className="label">Department:</span>
                  <span className="value">{player.department}</span>
                </div>
              )}
            </div>

            <div className="player-footer">
              <span className={`status-indicator ${player.status}`}>
                {player.status === 'available' ? '🟢 Available' : player.status === 'sold' ? '🔴 Sold' : '⚪ Unavailable'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏏</div>
          <h3>No Players Found</h3>
          <p>No players have been registered yet.</p>
        </div>
      )}
    </div>
  );
};

export default Players;