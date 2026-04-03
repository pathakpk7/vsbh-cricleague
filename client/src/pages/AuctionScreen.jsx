import React, { useState, useEffect } from 'react';
import { socket } from '../config/socket';
import './AuctionScreen.css';

const AuctionScreen = () => {
  const [auctionData, setAuctionData] = useState({
    currentPlayer: null,
    currentBid: 0,
    currentTeam: null,
    timerSeconds: 30,
    isAuctionActive: false
  });

  const [teamData, setTeamData] = useState({
    players: [],
    purseRemaining: 1000,
    roleCounts: {
      batters: 0,
      bowlers: 0,
      wicketkeepers: 0
    }
  });

  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    // Initialize socket connection
    socket.connect();
    socket.emit('join-auction');

    // Listen for auction updates
    socket.on('auction-update', (data) => {
      setAuctionData({
        currentPlayer: data.current_player,
        currentBid: data.current_bid,
        currentTeam: data.current_team,
        timerSeconds: data.timer_seconds,
        isAuctionActive: true
      });
    });

    // Listen for timer updates
    socket.on('timer-update', (data) => {
      setAuctionData(prev => ({
        ...prev,
        timerSeconds: data.timer_seconds
      }));
    });

    // Listen for bid updates
    socket.on('bid-updated', (data) => {
      setAuctionData(prev => ({
        ...prev,
        currentBid: data.bid.amount,
        currentTeam: data.bid.teamId
      }));
    });

    // Listen for player sold
    socket.on('player-sold', (data) => {
      setAuctionData(prev => ({
        ...prev,
        currentPlayer: data.nextPlayer,
        currentBid: data.nextPlayer?.base_price || 10,
        currentTeam: null,
        timerSeconds: 30
      }));
    });

    // Listen for player skipped
    socket.on('player-skipped', (data) => {
      setAuctionData(prev => ({
        ...prev,
        currentPlayer: data.nextPlayer,
        currentBid: data.nextPlayer?.base_price || 10,
        currentTeam: null,
        timerSeconds: 30
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleBid = () => {
    const bid = parseInt(bidAmount);
    if (bid && bid > auctionData.currentBid) {
      socket.emit('place-bid', { teamId: 1 }); // Assuming team ID 1 for demo
      setBidAmount('');
    }
  };

  const handleSkip = () => {
    socket.emit('skip-player');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auction-container">
      {/* Left Panel - Auction Panel (75% width) */}
      <div className="auction-panel">
        <div className="auction-header">
          <h1 className="auction-title">IPL AUCTION 2024</h1>
          <div className="auction-status">
            {auctionData.isAuctionActive ? (
              <span className="status-live">● LIVE</span>
            ) : (
              <span className="status-paused">● PAUSED</span>
            )}
          </div>
        </div>

        {/* Current Player Card */}
        <div className="player-card">
          <div className="player-header">
            <h2>CURRENT PLAYER</h2>
            <div className="player-role">{auctionData.currentPlayer?.role?.toUpperCase() || 'UNKNOWN'}</div>
          </div>
          <div className="player-info">
            <div className="player-name">
              {auctionData.currentPlayer?.name || 'No Player'}
            </div>
            <div className="player-details">
              <span>Base Price: ₹{auctionData.currentPlayer?.base_price || 10}</span>
              <span>Role: {auctionData.currentPlayer?.role || 'Unknown'}</span>
              {auctionData.currentPlayer?.is_mvp && (
                <span className="mvp-badge">MVP</span>
              )}
            </div>
          </div>
        </div>

        {/* Bid Amount Display */}
        <div className="bid-display">
          <div className="current-bid">
            <span className="bid-label">CURRENT BID</span>
            <span className="bid-amount">₹{auctionData.currentBid}</span>
          </div>
          {auctionData.currentTeam && (
            <div className="current-team">
              Team {auctionData.currentTeam} is leading
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="timer-container">
          <div className="timer-display">
            <span className="timer-label">TIME REMAINING</span>
            <span className={`timer-value ${auctionData.timerSeconds <= 10 ? 'timer-warning' : ''}`}>
              {formatTime(auctionData.timerSeconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <div className="bid-input-container">
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter bid amount"
              className="bid-input"
              disabled={!auctionData.isAuctionActive}
            />
            <span className="currency">₹</span>
          </div>
          
          <button
            onClick={handleBid}
            className="btn btn-primary"
            disabled={!auctionData.isAuctionActive || !bidAmount || parseInt(bidAmount) <= auctionData.currentBid}
          >
            PLACE BID
          </button>
          
          <button
            onClick={handleSkip}
            className="btn btn-secondary"
            disabled={!auctionData.isAuctionActive}
          >
            SKIP PLAYER
          </button>
        </div>

        {/* Auction Stats */}
        <div className="auction-stats">
          <div className="stat-item">
            <span className="stat-label">Players Sold</span>
            <span className="stat-value">12/25</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">₹{1000 - teamData.purseRemaining}</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Team Panel (25% width) */}
      <div className="team-panel">
        <div className="team-header">
          <h2>YOUR TEAM</h2>
          <div className="purse-info">
            <span className="purse-label">PURSE REMAINING</span>
            <span className="purse-amount">₹{teamData.purseRemaining}</span>
          </div>
        </div>

        {/* Team Players List */}
        <div className="players-list">
          <h3>YOUR SQUAD</h3>
          <div className="players-grid">
            {teamData.players.map((player, index) => (
              <div key={index} className="team-player">
                <div className="player-number">{player.jersey}</div>
                <div className="player-info-small">
                  <div className="player-name-small">{player.name}</div>
                  <div className="player-role-small">{player.role}</div>
                  <div className="player-price">₹{player.price}</div>
                  {player.is_mvp && (
                    <div className="mvp-badge-small">MVP</div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty slots for remaining players */}
            {Array.from({ length: 11 - teamData.players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="empty-slot">
                <div className="empty-icon">+</div>
                <div className="empty-label">Empty Slot</div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Counts */}
        <div className="role-counts">
          <h3>ROLE COUNTS</h3>
          <div className="role-grid">
            <div className="role-item">
              <span className="role-label">BATSMEN</span>
              <span className="role-count">{teamData.roleCounts.batters}/5</span>
            </div>
            <div className="role-item">
              <span className="role-label">BOWLERS</span>
              <span className="role-count">{teamData.roleCounts.bowlers}/5</span>
            </div>
            <div className="role-item">
              <span className="role-label">WICKETKEEPERS</span>
              <span className="role-count">{teamData.roleCounts.wicketkeepers}/1</span>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="team-stats">
          <h3>TEAM STATS</h3>
          <div className="stats-list">
            <div className="team-stat">
              <span>Players Bought</span>
              <span>{teamData.players.length}/11</span>
            </div>
            <div className="team-stat">
              <span>Avg Price</span>
              <span>₹{teamData.players.length > 0 ? Math.round(teamData.players.reduce((sum, p) => sum + p.price, 0) / teamData.players.length) : 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionScreen;

      // Fetch initial data from API
      const response = await fetch('/api/auction/init');
      const data = await response.json();

      if (response.ok) {
        setPlayers(data.players || []);
        setTeams(data.teams || []);
        
        if (data.auctionState) {
          setAuctionState(data.auctionState);
          setCurrentBid(data.auctionState.current_bid || 10);
          setTimer(data.auctionState.timer_seconds || 30);
          setIsAuctionActive(data.auctionState.is_active || false);
          
          if (data.auctionState.current_player_id) {
            const player = data.players.find(p => p.id === data.auctionState.current_player_id);
            setCurrentPlayer(player);
          } else if (data.players.length > 0) {
            setCurrentPlayer(data.players[0]);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to initialize auction');
      }

      // Socket listeners
      socket.on('bid-update', handleBidUpdate);
      socket.on('timer-update', handleTimerUpdate);
      socket.on('player-sold', handlePlayerSold);

    } catch (err) {
      console.error('Error initializing auction:', err);
      setError('Failed to initialize auction');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (bidData) => {
    // Backend sends full state update
    setCurrentBid(bidData.current_bid);
    setSelectedTeam(bidData.current_team_id);
    setTimer(bidData.timer_seconds || 30);
    setIsAuctionActive(bidData.is_active);
    
    if (bidData.current_player) {
      setCurrentPlayer(bidData.current_player);
    }
    
    if (bidData.teams) {
      setTeams(bidData.teams);
    }
  };

  const handlePlayerSold = (soldData) => {
    // Backend sends updated state when player is sold
    setCurrentPlayer(soldData.current_player || null);
    setCurrentBid(soldData.current_bid || 10);
    setSelectedTeam(soldData.current_team_id || null);
    setTimer(soldData.timer_seconds || 30);
    setIsAuctionActive(soldData.is_active || false);
    
    if (soldData.teams) {
      setTeams(soldData.teams);
    }
    
    if (soldData.players) {
      setPlayers(soldData.players);
    }
  };

  const handleTimerUpdate = (timerData) => {
    setTimer(timerData.timer_seconds);
    
    // Backend might send full state with timer update
    if (timerData.current_bid !== undefined) {
      setCurrentBid(timerData.current_bid);
    }
    if (timerData.current_team_id !== undefined) {
      setSelectedTeam(timerData.current_team_id);
    }
    if (timerData.is_active !== undefined) {
      setIsAuctionActive(timerData.is_active);
    }
    if (timerData.current_player) {
      setCurrentPlayer(timerData.current_player);
    }
    if (timerData.teams) {
      setTeams(timerData.teams);
    }
  };

  const startAuction = async () => {
    if (!currentPlayer) return;

    try {
      const response = await fetch('/api/auction/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start auction');
      }

      // Socket will update UI automatically
      setIsAuctionActive(true);

    } catch (err) {
      console.error('Error starting auction:', err);
      setError(err.message || 'Failed to start auction');
    }
  };

  const placeBid = async (teamId) => {
    if (!isAuctionActive || !currentPlayer) return;

    try {
      const response = await fetch('/api/auction/place-bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: teamId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place bid');
      }

      // Socket will update UI automatically - no manual state updates
      setError(null);

    } catch (err) {
      console.error('Error placing bid:', err);
      setError(err.message || 'Failed to place bid');
    }
  };

  const skipPlayer = async () => {
    if (!currentPlayer) return;

    try {
      const response = await fetch('/api/auction/skip-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to skip player');
      }

      // Socket will update UI automatically
      setIsAuctionActive(false);

    } catch (err) {
      console.error('Error skipping player:', err);
      setError(err.message || 'Failed to skip player');
    }
  };


  const getTeamConstraints = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !team.team_players) return { batters: 0, bowlers: 0, wicketkeepers: 0, total: 0 };

    const constraints = {
      batters: team.team_players.filter(tp => tp.players.role === 'batter').length,
      bowlers: team.team_players.filter(tp => tp.players.role === 'bowler').length,
      all_rounders: team.team_players.filter(tp => tp.players.role === 'all-rounder').length,
      wicketkeepers: team.team_players.filter(tp => tp.players.role === 'wicketkeeper').length,
      total: team.team_players.length
    };

    constraints.bowlers += constraints.all_rounders;
    return constraints;
  };

  const canTeamBid = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !currentPlayer) return { canBid: false, reason: 'Team or player not found' };

    const constraints = getTeamConstraints(teamId);
    
    // Check if team is full
    if (constraints.total >= 11) {
      return { canBid: false, reason: 'Team full (11/11 players)' };
    }

    // Check budget
    if (team.budget < currentBid + 5) {
      return { canBid: false, reason: 'Insufficient budget' };
    }

    // Check role-specific constraints
    if (currentPlayer.role === 'batter' && constraints.batters >= 5) {
      return { canBid: false, reason: 'Batter limit reached (5/5)' };
    }

    if (currentPlayer.role === 'wicketkeeper' && constraints.wicketkeepers >= 1) {
      return { canBid: false, reason: 'Wicketkeeper limit reached (1/1)' };
    }

    if ((currentPlayer.role === 'bowler' || currentPlayer.role === 'all-rounder') && constraints.bowlers >= 5) {
      return { canBid: false, reason: 'Bowler limit reached (5/5)' };
    }

    // Check MVP limit
    if (currentPlayer.is_mvp) {
      const mvpCount = team.team_players?.filter(tp => tp.players.is_mvp).length || 0;
      if (mvpCount >= 3) {
        return { canBid: false, reason: 'MVP limit reached (3/3)' };
      }
    }

    return { canBid: true, reason: 'Can bid' };
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

  if (loading) {
    return (
      <div className="auction-screen">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Initializing auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-screen">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Auction Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-screen">
      {/* 🔴 LEFT SIDE - AUCTION PANEL (3/4) */}
      <div className="auction-panel">
        <div className="auction-header">
          <h1>🎯 LIVE AUCTION</h1>
          {isAuctionActive && <span className="live-indicator">🔴 LIVE</span>}
        </div>

        {currentPlayer ? (
          <div className="current-player-section">
            <div className="player-card">
              <div className="player-header">
                <h2 className="player-name">{currentPlayer.name}</h2>
                <div className="player-id">ID: {currentPlayer.college_id}</div>
              </div>

              <div className="player-details">
                <div className="detail-row">
                  <span className="label">Year:</span>
                  <span className="value">{currentPlayer.year}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Role:</span>
                  <span className={`value role-badge ${currentPlayer.role}`}>
                    {getRoleDisplay(currentPlayer.role)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">MVP:</span>
                  <span className={`value ${currentPlayer.is_mvp ? 'mvp-yes' : 'mvp-no'}`}>
                    {currentPlayer.is_mvp ? 'Yes ⭐' : 'No'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Base Price:</span>
                  <span className="value base-price">₹{currentPlayer.base_price}</span>
                </div>
              </div>

              {currentPlayer.is_mvp && (
                <div className="mvp-banner">⭐ MVP PLAYER ⭐</div>
              )}
            </div>

            {/* Timer Section */}
            <div className="timer-section">
              <div className={`timer-display ${timer <= 10 ? 'warning' : ''}`}>
                <div className="timer-value">{timer}</div>
                <div className="timer-label">SECONDS</div>
              </div>
              
              <div className="current-bid-display">
                <div className="bid-label">Current Bid</div>
                <div className="bid-value">₹{currentBid}</div>
                {selectedTeam && (
                  <div className="leading-team">
                    Leading: {teams.find(t => t.id === selectedTeam)?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {!isAuctionActive ? (
                <button className="btn btn-success btn-large" onClick={startAuction}>
                  🎯 START AUCTION
                </button>
              ) : (
                <div className="bid-controls">
                  <h3>Place Your Bid</h3>
                  <div className="team-bid-buttons">
                    {teams.map(team => {
                      const constraints = getTeamConstraints(team.id);
                      const bidValidation = canTeamBid(team.id);
                      const canBid = bidValidation.canBid;

                      return (
                        <button
                          key={team.id}
                          className={`btn btn-primary team-btn ${!canBid ? 'disabled' : ''}`}
                          onClick={() => placeBid(team.id)}
                          disabled={!canBid}
                          title={bidValidation.reason}
                        >
                          <div className="team-name">{team.name}</div>
                          <div className="team-budget">₹{team.budget}</div>
                          {!canBid && (
                            <div className="constraint-warning">
                              {bidValidation.reason}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button className="btn btn-danger btn-skip" onClick={skipPlayer}>
                    ⏭️ SKIP PLAYER
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-players-section">
            <div className="no-players-icon">🏏</div>
            <h3>No Players Available</h3>
            <p>All players have been auctioned!</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Start New Auction
            </button>
          </div>
        )}
      </div>

      {/* 🔵 RIGHT SIDE - TEAM PANEL (1/4) */}
      <div className="team-panel">
        <h3>🏆 Team Status</h3>
        
        <div className="teams-list">
          {teams.map(team => {
            const constraints = getTeamConstraints(team.id);
            const isLeading = selectedTeam === team.id;

            return (
              <div key={team.id} className={`team-status-card ${isLeading ? 'leading' : ''}`}>
                <div className="team-header-info">
                  <h4 className="team-name">{team.name}</h4>
                  {isLeading && <div className="leading-badge">🔴 LEADING</div>}
                </div>

                <div className="team-budget-info">
                  <div className="budget-amount">💰 ₹{team.budget}</div>
                  <div className="budget-label">Purse Remaining</div>
                </div>

                <div className="team-constraints">
                  <div className="constraint-item">
                    <span className="constraint-label">Players:</span>
                    <span className={`constraint-value ${constraints.total >= 11 ? 'max' : ''}`}>
                      {constraints.total}/11
                    </span>
                  </div>
                  
                  <div className="constraint-item">
                    <span className="constraint-label">Batters:</span>
                    <span className={`constraint-value ${constraints.batters >= 5 ? 'max' : ''}`}>
                      {constraints.batters}/5
                    </span>
                  </div>
                  
                  <div className="constraint-item">
                    <span className="constraint-label">Bowlers:</span>
                    <span className={`constraint-value ${constraints.bowlers >= 5 ? 'max' : ''}`}>
                      {constraints.bowlers}/5
                    </span>
                  </div>
                  
                  <div className="constraint-item">
                    <span className="constraint-label">WK:</span>
                    <span className={`constraint-value ${constraints.wicketkeepers >= 1 ? 'max' : ''}`}>
                      {constraints.wicketkeepers}/1
                    </span>
                  </div>
                </div>

                {team.team_players && team.team_players.length > 0 && (
                  <div className="selected-players">
                    <h5>Selected Players ({team.team_players.length})</h5>
                    <div className="players-mini-list">
                      {team.team_players.slice(0, 3).map(tp => (
                        <div key={tp.player_id} className="player-mini">
                          <span className="player-name">{tp.players.name}</span>
                          <span className="player-price">₹{tp.sold_price}</span>
                        </div>
                      ))}
                      {team.team_players.length > 3 && (
                        <div className="more-players">+{team.team_players.length - 3} more...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuctionScreen;
