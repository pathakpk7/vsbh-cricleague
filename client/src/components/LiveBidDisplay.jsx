import React, { useState, useEffect } from 'react';
import './LiveBidDisplay.css';

const LiveBidDisplay = ({ 
  currentBid, 
  currentTeam, 
  teamName, 
  previousBid = 0,
  isActive = true 
}) => {
  const [bidAnimation, setBidAnimation] = useState(false);
  const [displayBid, setDisplayBid] = useState(currentBid);
  const [teamAnimation, setTeamAnimation] = useState(false);

  useEffect(() => {
    if (currentBid > previousBid) {
      // Trigger bid animation
      setBidAnimation(true);
      setDisplayBid(currentBid);
      
      // Reset animation after duration
      setTimeout(() => {
        setBidAnimation(false);
      }, 600);

      // Trigger team change animation
      if (currentTeam) {
        setTeamAnimation(true);
        setTimeout(() => {
          setTeamAnimation(false);
        }, 800);
      }
    }
  }, [currentBid, previousBid, currentTeam]);

  const formatBidAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBidChangeIndicator = () => {
    if (currentBid > previousBid) {
      return 'increase';
    } else if (currentBid < previousBid) {
      return 'decrease';
    }
    return 'none';
  };

  const changeIndicator = getBidChangeIndicator();

  return (
    <div className={`live-bid-display ${isActive ? 'active' : 'inactive'}`}>
      {/* Bid Amount Section */}
      <div className="bid-amount-section">
        <div className="bid-label">
          CURRENT BID
          {changeIndicator === 'increase' && (
            <span className="bid-arrow up">↑</span>
          )}
          {changeIndicator === 'decrease' && (
            <span className="bid-arrow down">↓</span>
          )}
        </div>
        
        <div className={`bid-amount ${bidAnimation ? 'animate' : ''}`}>
          <span className="currency-symbol">₹</span>
          <span className="bid-value">{displayBid.toLocaleString('en-IN')}</span>
        </div>

        {/* Bid Change Animation */}
        {bidAnimation && (
          <div className="bid-change-animation">
            <div className="change-pulse"></div>
            <div className="change-ring"></div>
          </div>
        )}
      </div>

      {/* Leading Team Section */}
      <div className="leading-team-section">
        <div className="team-label">
          LEADING TEAM
          {teamAnimation && (
            <span className="team-pulse">●</span>
          )}
        </div>
        
        {currentTeam ? (
          <div className={`team-info ${teamAnimation ? 'animate' : ''}`}>
            <div className="team-name">
              {teamName || `Team ${currentTeam}`}
            </div>
            <div className="team-badge">
              {currentTeam}
            </div>
          </div>
        ) : (
          <div className="no-bid-placeholder">
            <div className="placeholder-icon">🏏</div>
            <div className="placeholder-text">No Bids Yet</div>
            <div className="placeholder-subtext">Waiting for first bid...</div>
          </div>
        )}
      </div>

      {/* Bid Activity Indicator */}
      {isActive && (
        <div className="activity-indicator">
          <div className="activity-dot"></div>
          <div className="activity-text">LIVE</div>
        </div>
      )}

      {/* Bid History Mini Display */}
      <div className="bid-history">
        <div className="history-item">
          <span className="history-label">Previous:</span>
          <span className="history-value">₹{previousBid.toLocaleString('en-IN')}</span>
        </div>
        {currentBid > previousBid && (
          <div className="history-item increase">
            <span className="history-label">Increase:</span>
            <span className="history-value">+₹{(currentBid - previousBid).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBidDisplay;
