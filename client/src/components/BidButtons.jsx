import React, { useState } from 'react';
import './BidButtons.css';

const BidButtons = ({ 
  onPlaceBid, 
  onSkipPlayer, 
  bidAmount,
  setBidAmount,
  isAuctionActive = true,
  timerSeconds = 0,
  teamPurse = 0,
  teamPlayers = [],
  maxPlayers = 11,
  isPlacingBid = false,
  isSkippingPlayer = false,
  currentBid = 0
}) => {
  const [bidInputFocused, setBidInputFocused] = useState(false);
  const [bidValidationError, setBidValidationError] = useState('');

  // Validation checks
  const isTeamFull = teamPlayers.length >= maxPlayers;
  const isPurseInsufficient = teamPurse <= currentBid;
  const isTimerEnded = timerSeconds <= 0;
  const isBidInvalid = !bidAmount || parseInt(bidAmount) <= currentBid;
  const isBidTooHigh = bidAmount && parseInt(bidAmount) > teamPurse;

  // Disable states
  const isPlaceBidDisabled = 
    !isAuctionActive || 
    isTeamFull || 
    isPurseInsufficient || 
    isTimerEnded || 
    isBidInvalid || 
    isBidTooHigh ||
    isPlacingBid;

  const isSkipDisabled = 
    !isAuctionActive || 
    isTimerEnded || 
    isSkippingPlayer;

  // Handle bid input change
  const handleBidInputChange = (e) => {
    const value = e.target.value;
    setBidAmount(value);
    
    // Validation
    if (!value) {
      setBidValidationError('');
    } else if (parseInt(value) <= currentBid) {
      setBidValidationError(`Bid must be higher than ₹${currentBid}`);
    } else if (parseInt(value) > teamPurse) {
      setBidValidationError(`Insufficient purse. Available: ₹${teamPurse}`);
    } else {
      setBidValidationError('');
    }
  };

  // Handle bid placement
  const handlePlaceBid = () => {
    if (!isPlaceBidDisabled) {
      onPlaceBid(parseInt(bidAmount));
    }
  };

  // Handle skip player
  const handleSkipPlayer = () => {
    if (!isSkipDisabled) {
      onSkipPlayer();
    }
  };

  // Get disable reason for tooltip
  const getPlaceBidReason = () => {
    if (!isAuctionActive) return 'Auction is not active';
    if (isTeamFull) return `Team is full (${teamPlayers.length}/${maxPlayers})`;
    if (isPurseInsufficient) return `Insufficient purse (₹${teamPurse})`;
    if (isTimerEnded) return 'Time has ended';
    if (!bidAmount) return 'Enter bid amount';
    if (parseInt(bidAmount) <= currentBid) return `Bid must be higher than ₹${currentBid}`;
    if (isBidTooHigh) return `Bid exceeds purse (₹${teamPurse})`;
    if (isPlacingBid) return 'Placing bid...';
    return '';
  };

  const getSkipReason = () => {
    if (!isAuctionActive) return 'Auction is not active';
    if (isTimerEnded) return 'Time has ended';
    if (isSkippingPlayer) return 'Skipping player...';
    return '';
  };

  return (
    <div className="bid-buttons-container">
      {/* Bid Input Section */}
      <div className="bid-input-section">
        <div className={`bid-input-wrapper ${bidInputFocused ? 'focused' : ''} ${bidValidationError ? 'error' : ''}`}>
          <span className="currency-symbol">₹</span>
          <input
            type="number"
            value={bidAmount}
            onChange={handleBidInputChange}
            onFocus={() => setBidInputFocused(true)}
            onBlur={() => setBidInputFocused(false)}
            placeholder="Enter bid amount"
            className="bid-input"
            disabled={!isAuctionActive || isPlacingBid}
            min={currentBid + 5}
            max={teamPurse}
          />
          {bidInputFocused && (
            <div className="input-suggestions">
              <button 
                onClick={() => setBidAmount(currentBid + 5)}
                className="suggestion-btn"
                disabled={currentBid + 5 > teamPurse}
              >
                +₹5
              </button>
              <button 
                onClick={() => setBidAmount(currentBid + 10)}
                className="suggestion-btn"
                disabled={currentBid + 10 > teamPurse}
              >
                +₹10
              </button>
              <button 
                onClick={() => setBidAmount(Math.min(currentBid + 20, teamPurse))}
                className="suggestion-btn"
              >
                +₹20
              </button>
            </div>
          )}
        </div>
        
        {/* Validation Error */}
        {bidValidationError && (
          <div className="validation-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{bidValidationError}</span>
          </div>
        )}
        
        {/* Bid Info */}
        <div className="bid-info">
          <span className="info-item">
            <span className="info-label">Current Bid:</span>
            <span className="info-value">₹{currentBid}</span>
          </span>
          <span className="info-item">
            <span className="info-label">Purse:</span>
            <span className="info-value">₹{teamPurse}</span>
          </span>
          <span className="info-item">
            <span className="info-label">Team:</span>
            <span className="info-value">{teamPlayers.length}/{maxPlayers}</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {/* Place Bid Button */}
        <button
          onClick={handlePlaceBid}
          disabled={isPlaceBidDisabled}
          className={`bid-button place-bid ${isPlaceBidDisabled ? 'disabled' : ''} ${isPlacingBid ? 'loading' : ''}`}
          title={getPlaceBidReason()}
        >
          {isPlacingBid ? (
            <>
              <div className="loading-spinner"></div>
              <span>Placing Bid...</span>
            </>
          ) : (
            <>
              <span className="button-icon">💰</span>
              <span>Place Bid</span>
            </>
          )}
        </button>

        {/* Skip Player Button */}
        <button
          onClick={handleSkipPlayer}
          disabled={isSkipDisabled}
          className={`bid-button skip-player ${isSkipDisabled ? 'disabled' : ''} ${isSkippingPlayer ? 'loading' : ''}`}
          title={getSkipReason()}
        >
          {isSkippingPlayer ? (
            <>
              <div className="loading-spinner"></div>
              <span>Skip Player...</span>
            </>
          ) : (
            <>
              <span className="button-icon">⏭️</span>
              <span>Skip Player</span>
            </>
          )}
        </button>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        {isTeamFull && (
          <div className="status-indicator warning">
            <span className="indicator-icon">👥</span>
            <span>Team is full</span>
          </div>
        )}
        
        {isPurseInsufficient && (
          <div className="status-indicator error">
            <span className="indicator-icon">💸</span>
            <span>Low purse</span>
          </div>
        )}
        
        {isTimerEnded && (
          <div className="status-indicator error">
            <span className="indicator-icon">⏰</span>
            <span>Time's up</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          onClick={() => setBidAmount(currentBid + 5)}
          className="quick-action-btn"
          disabled={currentBid + 5 > teamPurse || isPlaceBidDisabled}
        >
          Quick Bid +₹5
        </button>
        <button
          onClick={() => setBidAmount(Math.min(currentBid + 10, teamPurse))}
          className="quick-action-btn"
          disabled={isPlaceBidDisabled}
        >
          Quick Bid +₹10
        </button>
        <button
          onClick={() => setBidAmount(teamPurse)}
          className="quick-action-btn all-in"
          disabled={teamPurse <= currentBid || isPlaceBidDisabled}
        >
          All In ₹{teamPurse}
        </button>
      </div>
    </div>
  );
};

export default BidButtons;
