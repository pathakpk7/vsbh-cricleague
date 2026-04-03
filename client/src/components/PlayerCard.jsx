import React from 'react';
import './PlayerCard.css';

const PlayerCard = ({ 
  player, 
  onClick = null, 
  isSelected = false, 
  isSold = false,
  showPrice = true 
}) => {
  const {
    name,
    role,
    year,
    is_mvp,
    base_price,
    sold_price,
    jersey_number,
    college
  } = player;

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'batter':
        return '#4a90e2';
      case 'bowler':
        return '#e74c3c';
      case 'all-rounder':
        return '#f39c12';
      case 'wicketkeeper':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'batter':
        return '🏏';
      case 'bowler':
        return '⚾';
      case 'all-rounder':
        return '🏏⚾';
      case 'wicketkeeper':
        return '🧤';
      default:
        return '👤';
    }
  };

  const currentPrice = sold_price || base_price;

  return (
    <div 
      className={`player-card ${isSelected ? 'selected' : ''} ${isSold ? 'sold' : ''} ${is_mvp ? 'mvp' : ''}`}
      onClick={onClick}
    >
      {/* Jersey Number */}
      {jersey_number && (
        <div className="jersey-number">
          {jersey_number}
        </div>
      )}

      {/* MVP Badge */}
      {is_mvp && (
        <div className="mvp-badge">
          <span className="mvp-icon">⭐</span>
          <span className="mvp-text">MVP</span>
        </div>
      )}

      {/* Player Info */}
      <div className="player-info">
        <div className="player-header">
          <h3 className="player-name">{name}</h3>
          <div className="role-badge" style={{ backgroundColor: getRoleColor(role) }}>
            <span className="role-icon">{getRoleIcon(role)}</span>
            <span className="role-text">{role?.toUpperCase()}</span>
          </div>
        </div>

        <div className="player-details">
          {year && (
            <div className="player-year">
              <span className="year-label">Year</span>
              <span className="year-value">{year}</span>
            </div>
          )}

          {college && (
            <div className="player-college">
              <span className="college-label">College</span>
              <span className="college-value">{college}</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Section */}
      {showPrice && (
        <div className="price-section">
          <div className="price-label">
            {sold_price ? 'Sold Price' : 'Base Price'}
          </div>
          <div className="price-amount">
            ₹{currentPrice}
          </div>
          {isSold && (
            <div className="sold-indicator">
              <span className="sold-text">SOLD</span>
            </div>
          )}
        </div>
      )}

      {/* Hover Overlay */}
      <div className="hover-overlay">
        <div className="overlay-content">
          <span className="view-details">View Details</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
