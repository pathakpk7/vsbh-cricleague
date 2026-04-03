import React, { useState, useEffect } from 'react';
import './LiveIndicators.css';

const LiveIndicators = ({ 
  isAuctionActive = false,
  currentPlayer = null,
  playerStatus = null,
  lastAction = null,
  timerSeconds = 0
}) => {
  const [showPulse, setShowPulse] = useState(false);
  const [showSoldAnimation, setShowSoldAnimation] = useState(false);
  const [showUnsoldAnimation, setShowUnsoldAnimation] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);

  // Handle auction state changes
  useEffect(() => {
    if (isAuctionActive) {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 1000);
    }
  }, [isAuctionActive]);

  // Handle player status changes
  useEffect(() => {
    if (playerStatus === 'sold') {
      setShowSoldAnimation(true);
      addToHistory('SOLD', currentPlayer);
      setTimeout(() => setShowSoldAnimation(false), 2000);
    } else if (playerStatus === 'unsold') {
      setShowUnsoldAnimation(true);
      addToHistory('UNSOLD', currentPlayer);
      setTimeout(() => setShowUnsoldAnimation(false), 2000);
    }
  }, [playerStatus, currentPlayer]);

  // Add action to history
  const addToHistory = (action, player) => {
    const newAction = {
      id: Date.now(),
      type: action,
      player: player?.name || 'Unknown Player',
      timestamp: new Date(),
      price: player?.sold_price || player?.base_price || 0
    };
    
    setActionHistory(prev => [newAction, ...prev.slice(0, 4)]);
  };

  // Get indicator configuration
  const getIndicatorConfig = () => {
    if (playerStatus === 'sold') {
      return {
        text: 'SOLD',
        color: '#27ae60',
        bgColor: 'rgba(39, 174, 96, 0.2)',
        borderColor: '#27ae60',
        icon: '🏷️',
        animation: 'sold'
      };
    }
    
    if (playerStatus === 'unsold') {
      return {
        text: 'UNSOLD',
        color: '#e74c3c',
        bgColor: 'rgba(231, 76, 60, 0.2)',
        borderColor: '#e74c3c',
        icon: '❌',
        animation: 'unsold'
      };
    }
    
    if (isAuctionActive) {
      return {
        text: 'LIVE',
        color: '#00ff00',
        bgColor: 'rgba(0, 255, 0, 0.2)',
        borderColor: '#00ff00',
        icon: '🔴',
        animation: 'live'
      };
    }
    
    return {
      text: 'PAUSED',
      color: '#f39c12',
      bgColor: 'rgba(243, 156, 18, 0.2)',
      borderColor: '#f39c12',
      icon: '⏸️',
      animation: 'paused'
    };
  };

  const config = getIndicatorConfig();

  return (
    <div className="live-indicators">
      {/* Main Status Badge */}
      <div className="status-badge-container">
        <div 
          className={`status-badge ${config.animation}`}
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            color: config.color
          }}
        >
          <div className="badge-content">
            <span className="badge-icon">{config.icon}</span>
            <span className="badge-text">{config.text}</span>
          </div>
          
          {/* Live Pulse Effect */}
          {isAuctionActive && (
            <div className="pulse-ring">
              <div className="pulse-ring-1"></div>
              <div className="pulse-ring-2"></div>
              <div className="pulse-ring-3"></div>
            </div>
          )}
          
          {/* Blinking Dot for Live */}
          {isAuctionActive && (
            <div className="live-dot">
              <div className="dot-inner"></div>
            </div>
          )}
        </div>
        
        {/* Timer Context */}
        {isAuctionActive && (
          <div className="timer-context">
            <span className="timer-text">{timerSeconds}s</span>
            <div className="timer-bar">
              <div 
                className="timer-fill" 
                style={{ 
                  width: `${(timerSeconds / 30) * 100}%`,
                  backgroundColor: timerSeconds <= 5 ? '#e74c3c' : 
                                   timerSeconds <= 15 ? '#f39c12' : '#27ae60'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Current Player Context */}
      {currentPlayer && (
        <div className="player-context">
          <span className="context-label">CURRENT PLAYER</span>
          <span className="player-name">{currentPlayer.name}</span>
          {currentPlayer.is_mvp && (
            <span className="mvp-indicator">⭐ MVP</span>
          )}
        </div>
      )}

      {/* Action Animations */}
      {showSoldAnimation && (
        <div className="sold-animation">
          <div className="sold-content">
            <div className="sold-icon">🏷️</div>
            <div className="sold-text">SOLD!</div>
            <div className="sold-price">₹{currentPlayer?.sold_price?.toLocaleString('en-IN')}</div>
          </div>
          <div className="confetti">
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
          </div>
        </div>
      )}

      {showUnsoldAnimation && (
        <div className="unsold-animation">
          <div className="unsold-content">
            <div className="unsold-icon">❌</div>
            <div className="unsold-text">UNSOLD</div>
          </div>
        </div>
      )}

      {/* Action History */}
      {actionHistory.length > 0 && (
        <div className="action-history">
          <div className="history-header">RECENT ACTIONS</div>
          <div className="history-list">
            {actionHistory.map((action) => (
              <div key={action.id} className={`history-item ${action.type.toLowerCase()}`}>
                <div className="history-indicator">
                  {action.type === 'SOLD' ? '🏷️' : '❌'}
                </div>
                <div className="history-details">
                  <span className="history-action">{action.type}</span>
                  <span className="history-player">{action.player}</span>
                  {action.price > 0 && (
                    <span className="history-price">₹{action.price.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <div className="history-time">
                  {new Date(action.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="connection-status">
        <div className="status-indicator-small">
          <div className={`connection-dot ${isAuctionActive ? 'connected' : 'disconnected'}`}></div>
          <span className="connection-text">
            {isAuctionActive ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Glow Effect for Live */}
      {isAuctionActive && (
        <div className="live-glow">
          <div className="glow-effect"></div>
        </div>
      )}
    </div>
  );
};

export default LiveIndicators;
