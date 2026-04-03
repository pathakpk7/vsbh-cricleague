import React, { useState } from 'react';
import './TeamPanel.css';

const TeamPanel = ({ 
  team, 
  players = [], 
  purseRemaining = 0,
  maxPurse = 1000,
  maxPlayers = 11,
  isAuctionActive = true 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  // Calculate role counts
  const roleCounts = players.reduce((counts, player) => {
    const role = player.role?.toLowerCase();
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});

  const batters = roleCounts.batter || 0;
  const bowlers = roleCounts.bowler || 0;
  const allRounders = roleCounts['all-rounder'] || 0;
  const wicketkeepers = roleCounts.wicketkeeper || 0;
  const totalBowlers = bowlers + allRounders;
  
  const mvpCount = players.filter(p => p.is_mvp).length;

  // Check if limits are reached
  const isBattersFull = batters >= 5;
  const isBowlersFull = totalBowlers >= 5;
  const isWicketkeepersFull = wicketkeepers >= 1;
  const isMvpFull = mvpCount >= 3;
  const isTeamFull = players.length >= maxPlayers;

  // Filter players
  const filteredPlayers = filterRole === 'all' 
    ? players 
    : players.filter(p => p.role?.toLowerCase() === filterRole);

  // Calculate team statistics
  const totalSpent = players.reduce((sum, p) => sum + (p.sold_price || 0), 0);
  const averagePrice = players.length > 0 ? Math.round(totalSpent / players.length) : 0;
  const pursePercentage = (purseRemaining / maxPurse) * 100;

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'batter': return '#4a90e2';
      case 'bowler': return '#e74c3c';
      case 'all-rounder': return '#f39c12';
      case 'wicketkeeper': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'batter': return '🏏';
      case 'bowler': return '⚾';
      case 'all-rounder': return '🏏⚾';
      case 'wicketkeeper': return '🧤';
      default: return '👤';
    }
  };

  const getPurseColor = () => {
    if (pursePercentage <= 10) return '#e74c3c';
    if (pursePercentage <= 25) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div className="team-panel">
      {/* Team Header */}
      <div className="team-header">
        <div className="team-info">
          <h2 className="team-name">{team?.name || 'Your Team'}</h2>
          <div className="team-badge">
            <span className="badge-text">{team?.shortName || 'TEAM'}</span>
          </div>
        </div>
        
        <div className="purse-section">
          <div className="purse-label">PURSE REMAINING</div>
          <div className="purse-amount" style={{ color: getPurseColor() }}>
            ₹{purseRemaining.toLocaleString('en-IN')}
          </div>
          <div className="purse-bar">
            <div 
              className="purse-fill" 
              style={{ 
                width: `${pursePercentage}%`,
                backgroundColor: getPurseColor()
              }}
            />
          </div>
        </div>
      </div>

      {/* Role Counts */}
      <div className="role-counts">
        <h3 className="section-title">TEAM COMPOSITION</h3>
        <div className="role-grid">
          <div className={`role-item ${isBattersFull ? 'limit-reached' : ''}`}>
            <div className="role-header">
              <span className="role-icon">🏏</span>
              <span className="role-name">BATSMEN</span>
            </div>
            <div className="role-count">
              <span className="current-count">{batters}</span>
              <span className="separator">/</span>
              <span className="max-count">5</span>
            </div>
            {isBattersFull && (
              <div className="limit-indicator">
                <span className="indicator-icon">⚠️</span>
                <span className="indicator-text">Full</span>
              </div>
            )}
          </div>

          <div className={`role-item ${isBowlersFull ? 'limit-reached' : ''}`}>
            <div className="role-header">
              <span className="role-icon">⚾</span>
              <span className="role-name">BOWLERS</span>
            </div>
            <div className="role-count">
              <span className="current-count">{totalBowlers}</span>
              <span className="separator">/</span>
              <span className="max-count">5</span>
            </div>
            {isBowlersFull && (
              <div className="limit-indicator">
                <span className="indicator-icon">⚠️</span>
                <span className="indicator-text">Full</span>
              </div>
            )}
          </div>

          <div className={`role-item ${isWicketkeepersFull ? 'limit-reached' : ''}`}>
            <div className="role-header">
              <span className="role-icon">🧤</span>
              <span className="role-name">WICKETKEEPERS</span>
            </div>
            <div className="role-count">
              <span className="current-count">{wicketkeepers}</span>
              <span className="separator">/</span>
              <span className="max-count">1</span>
            </div>
            {isWicketkeepersFull && (
              <div className="limit-indicator">
                <span className="indicator-icon">⚠️</span>
                <span className="indicator-text">Full</span>
              </div>
            )}
          </div>

          <div className={`role-item ${isMvpFull ? 'limit-reached' : ''}`}>
            <div className="role-header">
              <span className="role-icon">⭐</span>
              <span className="role-name">MVP</span>
            </div>
            <div className="role-count">
              <span className="current-count">{mvpCount}</span>
              <span className="separator">/</span>
              <span className="max-count">3</span>
            </div>
            {isMvpFull && (
              <div className="limit-indicator">
                <span className="indicator-icon">⚠️</span>
                <span className="indicator-text">Full</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="team-stats">
        <h3 className="section-title">TEAM STATISTICS</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Players</span>
            <span className={`stat-value ${isTeamFull ? 'limit-reached' : ''}`}>
              {players.length}/{maxPlayers}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Spent</span>
            <span className="stat-value">₹{totalSpent.toLocaleString('en-IN')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Price</span>
            <span className="stat-value">₹{averagePrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Player Filter */}
      <div className="player-filter">
        <h3 className="section-title">SQUAD</h3>
        <div className="filter-buttons">
          <button
            onClick={() => setFilterRole('all')}
            className={`filter-btn ${filterRole === 'all' ? 'active' : ''}`}
          >
            All ({players.length})
          </button>
          <button
            onClick={() => setFilterRole('batter')}
            className={`filter-btn ${filterRole === 'batter' ? 'active' : ''}`}
          >
            🏏 Batters ({batters})
          </button>
          <button
            onClick={() => setFilterRole('bowler')}
            className={`filter-btn ${filterRole === 'bowler' ? 'active' : ''}`}
          >
            ⚾ Bowlers ({bowlers})
          </button>
          <button
            onClick={() => setFilterRole('all-rounder')}
            className={`filter-btn ${filterRole === 'all-rounder' ? 'active' : ''}`}
          >
            🏏⚾ All-Rounders ({allRounders})
          </button>
          <button
            onClick={() => setFilterRole('wicketkeeper')}
            className={`filter-btn ${filterRole === 'wicketkeeper' ? 'active' : ''}`}
          >
            🧤 WK ({wicketkeepers})
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="player-list-section">
        <div className="player-list-header">
          <span className="player-count">
            {filteredPlayers.length} {filterRole === 'all' ? 'Players' : filterRole}
          </span>
          {isTeamFull && (
            <span className="team-full-indicator">
              <span className="full-icon">🔒</span>
              Team Full
            </span>
          )}
        </div>
        
        <div className="player-list scrollable">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, index) => (
              <div
                key={player.id || index}
                className={`player-item ${selectedPlayer === player ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(selectedPlayer === player ? null : player)}
              >
                <div className="player-jersey">
                  {player.jersey_number || index + 1}
                </div>
                
                <div className="player-details">
                  <div className="player-name-row">
                    <span className="player-name">{player.name}</span>
                    {player.is_mvp && (
                      <span className="mvp-badge">⭐ MVP</span>
                    )}
                  </div>
                  
                  <div className="player-meta">
                    <span 
                      className="player-role" 
                      style={{ color: getRoleColor(player.role) }}
                    >
                      {getRoleIcon(player.role)} {player.role?.toUpperCase()}
                    </span>
                    <span className="player-price">₹{player.sold_price?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <div className="player-actions">
                  <button className="action-btn view-btn">
                    👁️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏏</div>
              <div className="empty-text">No {filterRole === 'all' ? 'players' : filterRole} yet</div>
              <div className="empty-subtext">
                {isAuctionActive ? 'Start bidding to build your team' : 'Auction not active'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty Slots Indicator */}
      <div className="empty-slots">
        <div className="slots-header">
          <span className="slots-title">EMPTY SLOTS</span>
          <span className="slots-count">{maxPlayers - players.length} remaining</span>
        </div>
        <div className="slots-grid">
          {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
            <div key={index} className="empty-slot">
              <div className="slot-number">{players.length + index + 1}</div>
              <div className="slot-placeholder">+</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPanel;
