import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../config/socket';
import { useAuth } from '../contexts/AuthContext';
import { Player, Team, League } from '../types';
import './Auction.css';

const Auction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, activeLeagueId, setActiveLeagueId, loginCaptain } = useAuth();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeagueId, setCurrentLeagueId] = useState<string>(
    searchParams.get('league') || activeLeagueId || ''
  );
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState(10);
  const [timer, setTimer] = useState(30);
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [leadingTeamId, setLeadingTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Captain Key Modal State (for players wanting to enter bidding mode)
  const [showCaptainModal, setShowCaptainModal] = useState(false);
  const [captainKeyInput, setCaptainKeyInput] = useState('');
  const [selectedTeamForCaptain, setSelectedTeamForCaptain] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Determine if the current session is a captain for this league
  const isCaptain = user?.role === 'captain' && user?.leagueId === currentLeagueId && !!user?.teamId;
  const isLeagueAdmin = user?.role === 'admin' && (!user?.leagueId || user?.leagueId === currentLeagueId);
  const captainTeam = teams.find(t => t.id === user?.teamId);

  const nextBidAmount = currentBid + 5;
  const hasInsufficientFunds = isCaptain && captainTeam ? captainTeam.budget < nextBidAmount : false;

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (currentLeagueId) {
      loadLeagueAuctionData(currentLeagueId);
    }
  }, [currentLeagueId]);

  // Socket.IO event setup
  useEffect(() => {
    if (!currentLeagueId) return;

    socket.connect();
    // Join per-league auction room so multiple auctions don't conflict
    socket.emit('join-auction', { leagueId: currentLeagueId });

    socket.on('bid-updated', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        setCurrentBid(data.current_bid);
        setLeadingTeamId(data.team_id);
        setTimer(data.timer_seconds || 30);
      }
    });

    socket.on('timer-update', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        setTimer(data.timer_seconds);
        if (data.current_bid) setCurrentBid(data.current_bid);
        if (data.current_team_id) setLeadingTeamId(data.current_team_id);
      }
    });

    socket.on('player-sold', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        loadLeagueAuctionData(currentLeagueId);
      }
    });

    socket.on('player-unsold', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        loadLeagueAuctionData(currentLeagueId);
      }
    });

    socket.on('auction-started', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        setIsAuctionActive(true);
        if (data.currentPlayer) setCurrentPlayer(data.currentPlayer);
        if (data.auction?.current_bid) setCurrentBid(data.auction.current_bid);
      }
    });

    socket.on('auction-update', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        if (data.current_bid !== undefined) setCurrentBid(data.current_bid);
        if (data.timer_seconds !== undefined) setTimer(data.timer_seconds);
        if (data.current_team_id !== undefined) setLeadingTeamId(data.current_team_id);
        if (data.is_active !== undefined) setIsAuctionActive(data.is_active);
      }
    });

    return () => {
      socket.off('bid-updated');
      socket.off('timer-update');
      socket.off('player-sold');
      socket.off('player-unsold');
      socket.off('auction-started');
      socket.off('auction-update');
    };
  }, [currentLeagueId]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && data.data.length > 0) {
        setLeagues(data.data);
        if (!currentLeagueId) {
          const defaultId = data.data[0].id;
          setCurrentLeagueId(defaultId);
          setActiveLeagueId(defaultId);
        }
      }
    } catch (e) {
      console.error('Error fetching leagues:', e);
    }
  };

  const loadLeagueAuctionData = async (leagueId: string) => {
    try {
      setIsLoading(true);
      // Fetch league info
      const lRes = await fetch(`/api/leagues/${leagueId}`);
      const lData = await lRes.json();
      if (lRes.ok && lData.success) {
        setCurrentLeague(lData.data);
      }

      // Fetch auction state
      const stateRes = await fetch(`/api/auction/state?leagueId=${leagueId}`);
      const stateData = await stateRes.json();
      if (stateRes.ok && stateData.success && stateData.data) {
        const auction = stateData.data;
        setCurrentBid(auction.current_bid || 10);
        setTimer(auction.timer_seconds !== undefined ? auction.timer_seconds : 30);
        setIsAuctionActive(!!auction.is_active);
        setLeadingTeamId(auction.current_team_id || null);
        setCurrentPlayer(auction.currentPlayer || null);
      }

      // Fetch teams with their bought players
      const teamsRes = await fetch(`/api/teams?leagueId=${leagueId}`);
      const teamsData = await teamsRes.json();
      if (teamsRes.ok) {
        setTeams(teamsData);
      }
    } catch (e) {
      console.error('Error loading auction data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAuction = async () => {
    try {
      const res = await fetch('/api/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: currentLeagueId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuctionActive(true);
        if (data.data?.currentPlayer) setCurrentPlayer(data.data.currentPlayer);
      } else {
        alert(data.message || 'Failed to start auction');
      }
    } catch (e) {
      console.error('Start auction error:', e);
    }
  };

  const handlePlaceBid = async (teamId: string) => {
    if (!isCaptain) {
      setShowCaptainModal(true);
      return;
    }

    if (user?.teamId !== teamId) {
      alert('You can only bid for your own team.');
      return;
    }

    try {
      const res = await fetch('/api/auction/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: currentLeagueId,
          teamId,
          captainKey: user?.captainKey
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Bid failed: ${data.message}`);
      }
    } catch (e) {
      console.error('Bid error:', e);
    }
  };

  const handleSellPlayer = async () => {
    try {
      await fetch('/api/auction/sell-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: currentLeagueId })
      });
    } catch (e) {
      console.error('Sell player error:', e);
    }
  };

  const handleSkipPlayer = async () => {
    try {
      await fetch('/api/auction/skip-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId: currentLeagueId })
      });
    } catch (e) {
      console.error('Skip player error:', e);
    }
  };

  const handleCaptainLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForCaptain || !captainKeyInput) {
      setModalError('Please select your team and enter the Captain Auction Key');
      return;
    }
    setModalError(null);

    const ok = await loginCaptain({
      leagueCodeOrId: currentLeagueId,
      teamId: selectedTeamForCaptain,
      captainKey: captainKeyInput.trim()
    });

    if (ok) {
      setShowCaptainModal(false);
      setCaptainKeyInput('');
    } else {
      setModalError('Invalid Captain Auction Key for this league');
    }
  };

  const getTeamById = (teamId: string) => teams.find(t => t.id === teamId);

  if (isLoading && !currentLeague) {
    return (
      <div className="auction-container">
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          Loading live auction arena...
        </div>
      </div>
    );
  }

  return (
    <div className="auction-container">
      {/* Top Banner & League Switcher */}
      <div className="auction-top-bar">
        <div className="league-info-title">
          <h2>🎯 Live Cricket Auction Arena</h2>
          <div className="league-subname">
            Organization: <strong>{currentLeague?.name || 'Loading...'}</strong> ({currentLeague?.code})
          </div>
        </div>

        <div className="top-bar-controls">
          <div className="league-select-wrapper">
            <label>League:</label>
            <select
              value={currentLeagueId}
              onChange={(e) => {
                setCurrentLeagueId(e.target.value);
                setActiveLeagueId(e.target.value);
              }}
            >
              {leagues.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Indicator */}
          {isCaptain ? (
            <div className="mode-badge captain-mode">
              👑 Captain Bidding Mode: <strong>{captainTeam?.name}</strong>
            </div>
          ) : (
            <div className="mode-badge spectator-mode">
              👀 Live Spectator Mode
              <button className="btn-switch-captain" onClick={() => setShowCaptainModal(true)}>
                Enter as Captain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Captain Key Modal */}
      {showCaptainModal && (
        <div className="captain-key-modal-overlay">
          <div className="captain-key-modal-box">
            <h3>👑 Enter Captain Auction Bidding Mode</h3>
            <p>
              Enter the <strong>Unique Captain Auction Key</strong> shared by the league administrator to bid for your team.
            </p>

            <form onSubmit={handleCaptainLoginSubmit}>
              <div className="modal-input-group">
                <label>Select Your Team:</label>
                <select
                  value={selectedTeamForCaptain}
                  onChange={(e) => setSelectedTeamForCaptain(e.target.value)}
                  required
                >
                  <option value="">-- Choose Your Team --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Budget: ₹{t.budget})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-input-group">
                <label>Captain Auction Key (e.g. CAP-XXXX):</label>
                <input
                  type="text"
                  placeholder="Enter Captain Auction Key"
                  value={captainKeyInput}
                  onChange={(e) => setCaptainKeyInput(e.target.value.toUpperCase())}
                  required
                />
              </div>

              {modalError && <div className="modal-error-alert">{modalError}</div>}

              <div className="modal-buttons-row">
                <button type="submit" className="btn-modal-submit">
                  Enter Bidding Mode
                </button>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowCaptainModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN AUCTION SPLIT LAYOUT */}
      <div className="auction-content-grid">
        {/* LEFT PANEL: LIVE PLAYER & BIDDING */}
        <div className="auction-main-stage">
          <div className="stage-header">
            <h3>Auction Stage</h3>
            {isAuctionActive ? (
              <span className="live-indicator-pulse">🔴 AUCTION LIVE</span>
            ) : (
              <span className="paused-indicator">PAUSED / READY</span>
            )}
          </div>

          {currentPlayer ? (
            <div className="player-stage-card">
              <div className="player-meta-strip">
                <span className="player-role-badge">{currentPlayer.role?.toUpperCase()}</span>
                {currentPlayer.is_mvp && <span className="mvp-badge">★ MVP</span>}
                <span className="dept-tag">{currentPlayer.department || 'Player'}</span>
              </div>

              <h1 className="player-display-name">{currentPlayer.name}</h1>
              <div className="player-stats-sub">
                <span>College ID: {currentPlayer.college_id || 'N/A'}</span> • 
                <span>Year: {currentPlayer.year || '3rd'}</span> • 
                <span>Base Price: ₹{currentPlayer.base_price}</span>
              </div>

              {/* Tactical Cricket Playing Style Badges */}
              <div className="player-tactical-specs-bar">
                {currentPlayer.batting_hand && (
                  <span className="spec-pill">
                    🏏 {currentPlayer.batting_hand === 'left' ? 'LHB' : 'RHB'}
                    {currentPlayer.batting_position ? ` • ${currentPlayer.batting_position.toUpperCase()}` : ''}
                  </span>
                )}
                {(currentPlayer.role === 'bowler' || currentPlayer.role === 'all-rounder') && (currentPlayer.bowling_arm || currentPlayer.bowling_type) && (
                  <span className="spec-pill">
                    🎯 {currentPlayer.bowling_arm === 'left' ? 'Left-Arm' : 'Right-Arm'}{' '}
                    {currentPlayer.bowling_category?.toUpperCase() || ''}{' '}
                    {currentPlayer.bowling_type ? `(${currentPlayer.bowling_type})` : ''}
                  </span>
                )}
                {currentPlayer.allrounder_type && (
                  <span className="spec-pill allrounder-pill">
                    ⚡ {currentPlayer.allrounder_type === 'batting-allrounder' ? 'Batting All-Rounder' : 'Bowling All-Rounder'}
                  </span>
                )}
                {currentPlayer.is_wicketkeeper && (
                  <span className="spec-pill wk-pill">🧤 Wicketkeeper</span>
                )}
                {currentPlayer.jersey_number && (
                  <span className="spec-pill jersey-pill">#{currentPlayer.jersey_number}</span>
                )}
                {currentPlayer.experience_level && (
                  <span className="spec-pill exp-pill">{currentPlayer.experience_level}</span>
                )}
              </div>
              {currentPlayer.special_skills && (
                <div className="player-strengths-box">
                  <span className="strength-label">⚡ Strengths:</span> {currentPlayer.special_skills}
                </div>
              )}

              {/* Real-time Bid & Timer HUD */}
              <div className="bidding-hud">
                <div className={`timer-dial ${timer <= 5 ? 'dial-danger' : ''}`}>
                  <span className="timer-number">{timer}s</span>
                  <span className="timer-label">TIMER</span>
                </div>

                <div className="current-bid-block">
                  <span className="bid-label">Current Leading Bid</span>
                  <div className="bid-amount-display">₹{currentBid}</div>
                  {leadingTeamId ? (
                    <div className="leading-team-banner">
                      👑 Leading: <strong>{getTeamById(leadingTeamId)?.name}</strong>
                    </div>
                  ) : (
                    <div className="no-bid-yet">Awaiting opening bid</div>
                  )}
                </div>
              </div>

              {/* Bidding Controls */}
              <div className="auction-action-hub">
                {!isAuctionActive ? (
                  isLeagueAdmin ? (
                    <button className="btn-launch-auction" onClick={handleStartAuction}>
                      ▶ Start Live Auction
                    </button>
                  ) : (
                    <div className="awaiting-admin-box">
                      ⌛ Auction is scheduled. Waiting for the league administrator to start.
                    </div>
                  )
                ) : (
                  <div className="bidding-interactive-zone">
                    {/* Notice for Spectators vs Captains */}
                    {!isCaptain && (
                      <div className="spectator-notice-banner">
                        <span>👀 You are viewing as a spectator. Captains use their unique auction key to bid.</span>
                        <button className="btn-captain-unlock" onClick={() => setShowCaptainModal(true)}>
                          Enter as Captain
                        </button>
                      </div>
                    )}

                    {isCaptain && hasInsufficientFunds && (
                      <div className="insufficient-funds-alert">
                        ⚠️ Insufficient budget! Your team ({captainTeam?.name}) has ₹{captainTeam?.budget}, but next bid is ₹{nextBidAmount}.
                      </div>
                    )}

                    {/* Team Bid Buttons Grid */}
                    <div className="team-bid-buttons-grid">
                      {teams.map(team => {
                        const isMyTeam = isCaptain && user?.teamId === team.id;
                        const isLeading = team.id === leadingTeamId;
                        return (
                          <button
                            key={team.id}
                            onClick={() => handlePlaceBid(team.id)}
                            disabled={!isAuctionActive || !isMyTeam || hasInsufficientFunds}
                            className={`auction-bid-btn ${isMyTeam ? 'my-team-btn' : 'other-team-btn'} ${isLeading ? 'is-leading' : ''}`}
                          >
                            <div className="btn-team-title">{team.name}</div>
                            <div className="btn-team-budget">Budget: ₹{team.budget}</div>
                            {isLeading && <div className="leading-badge">👑 Current Bidder</div>}
                            {isMyTeam && <div className="bid-action-text">+ Bid ₹{nextBidAmount}</div>}
                          </button>
                        );
                      })}
                    </div>

                    {/* League Admin Direct Controls */}
                    {isLeagueAdmin && (
                      <div className="admin-inline-controls">
                        <span className="admin-inline-label">Admin Controls:</span>
                        <button className="btn-sell-direct" onClick={handleSellPlayer}>
                          ✓ Sell to {getTeamById(leadingTeamId || '')?.name || 'Leader'}
                        </button>
                        <button className="btn-skip-direct" onClick={handleSkipPlayer}>
                          ✕ Mark Unsold
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-players-stage">
              <h3>No active players in auction round.</h3>
              <p>Either all players have been auctioned or auction hasn't started yet.</p>
              {isLeagueAdmin && (
                <button className="btn-launch-auction" onClick={handleStartAuction}>
                  Start Auction
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE TEAM COMPOSITION (VISIBLE TO ALL PLAYERS & SPECTATORS) */}
        <div className="auction-team-composition-panel">
          <div className="composition-header">
            <h3>🏏 Team Composition & Rosters</h3>
            <p>Track live squad rosters and remaining budgets in real-time.</p>
          </div>

          <div className="teams-composition-list">
            {teams.map(team => {
              const boughtPlayers = team.team_players || [];
              const isLeading = team.id === leadingTeamId;
              return (
                <div key={team.id} className={`team-roster-card ${isLeading ? 'highlight-leading' : ''}`}>
                  <div className="team-roster-header">
                    <div>
                      <h4 className="roster-team-name">{team.name}</h4>
                      <span className="roster-captain-name">Captain: {team.captain_name || 'Assigned'}</span>
                    </div>
                    <div className="roster-budget-pill">
                      ₹{team.budget} Left
                    </div>
                  </div>

                  <div className="roster-squad-count">
                    Squad: {boughtPlayers.length} / 11 Players
                  </div>

                  {boughtPlayers.length > 0 ? (
                    <div className="bought-players-chips">
                      {boughtPlayers.map((tp, idx) => (
                        <div key={idx} className="player-chip">
                          <span className="chip-name">{tp.player?.name || `Player ${idx + 1}`}</span>
                          <span className="chip-price">₹{tp.sold_price}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-roster-hint">No players bought yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;