import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../config/socket';
import { useAuth } from '../contexts/AuthContext';
import { Player, Team, League } from '../types';
import {
  CricketIcon,
  CrownIcon,
  CoinsIcon,
  UsersIcon,
  CalendarIcon,
  StadiumIcon,
  TargetIcon,
  LightningIcon,
  GloveIcon,
  TrophyIcon,
  RocketIcon,
  SpinIcon,
  EyeIcon,
  SearchIcon,
  GavelIcon,
  CrossIcon,
  ClipboardIcon,
  GraduationCapIcon,
  StarIcon,
  PlayIcon
} from '../components/Icons';
import { supabase } from '../config/supabase';
import './Auction.css';

interface DisclosedPools {
  batters: Player[];
  wicketkeepers: Player[];
  allrounders: Player[];
  pacers: Player[];
  spinners: Player[];
  other?: Player[];
}

const Auction: React.FC = () => {
  const navigate = useNavigate();
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

  // Disclosed Pools State
  const [pools, setPools] = useState<DisclosedPools>({
    batters: [],
    wicketkeepers: [],
    allrounders: [],
    pacers: [],
    spinners: []
  });
  const [activePoolTab, setActivePoolTab] = useState<'batters' | 'wicketkeepers' | 'allrounders' | 'pacers' | 'spinners'>('batters');
  const [poolSearchQuery, setPoolSearchQuery] = useState('');

  // Captain Key Modal State (for players wanting to enter bidding mode)
  const [showCaptainModal, setShowCaptainModal] = useState(false);
  const [captainKeyInput, setCaptainKeyInput] = useState('');
  const [selectedTeamForCaptain, setSelectedTeamForCaptain] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Determine if the current session is a captain for this league
  const isCaptain = user?.role === 'captain' && user?.leagueId === currentLeagueId && !!user?.teamId;
  const isLeagueAdmin = user?.role === 'admin' && (!user?.leagueId || user?.leagueId === currentLeagueId);
  const captainTeam = teams.find(t => t.id === user?.teamId);

  const squadLimit = currentLeague?.max_players_per_team || 15;
  const defaultPurse = currentLeague?.default_team_purse || 100;
  const isCaptainSquadFull = captainTeam ? (captainTeam.team_players?.length || 0) >= squadLimit : false;
  const nextBidAmount = currentBid + 5;
  const hasInsufficientFunds = isCaptain && captainTeam ? captainTeam.budget < nextBidAmount : false;

  const getPlayerCategory = (p: Player | null): 'batters' | 'wicketkeepers' | 'allrounders' | 'pacers' | 'spinners' => {
    if (!p) return 'batters';
    const role = (p.role || '').toLowerCase();
    const isWk = p.is_wicketkeeper || role === 'wicketkeeper' || p.batting_position === 'wk-batter';
    if (isWk) return 'wicketkeepers';
    if (role === 'all-rounder') return 'allrounders';
    if (role === 'bowler') {
      const isSpin = p.bowling_category === 'spin' ||
        (p.bowling_type && (p.bowling_type.includes('spin') || p.bowling_type.includes('orthodox') || p.bowling_type.includes('chinaman')));
      return isSpin ? 'spinners' : 'pacers';
    }
    return 'batters';
  };

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentLeagueId) {
      loadLeagueAuctionData(currentLeagueId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (data.currentPlayer) {
          setCurrentPlayer(data.currentPlayer);
          setActivePoolTab(getPlayerCategory(data.currentPlayer));
        }
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

    socket.on('auction-reset', (data) => {
      if (!data.leagueId || data.leagueId === currentLeagueId) {
        loadLeagueAuctionData(currentLeagueId);
      }
    });

    return () => {
      socket.off('bid-updated');
      socket.off('timer-update');
      socket.off('player-sold');
      socket.off('player-unsold');
      socket.off('auction-started');
      socket.off('auction-update');
      socket.off('auction-reset');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLeagueId]);

  const fetchLeagues = async () => {
    try {
      let list: League[] = [];
      try {
        const res = await fetch('/api/leagues');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            list = data.data;
          }
        }
      } catch (e) {}

      if (list.length === 0 && supabase) {
        try {
          const { data: sbLeagues } = await supabase.from('leagues').select('*').order('created_at', { ascending: false });
          if (sbLeagues && sbLeagues.length > 0) list = sbLeagues;
        } catch (e) {}
      }

      if (list.length > 0) {
        setLeagues(list);
        const savedId = currentLeagueId || localStorage.getItem('vsbh_active_league');
        const selected = (savedId ? list.find((l: League) => l.id === savedId) : null) || list[0];
        setCurrentLeagueId(selected.id);
        setActiveLeagueId(selected.id);
        localStorage.setItem('vsbh_active_league', selected.id);
      }
    } catch (e) {
      console.error('Error fetching leagues:', e);
    }
  };

  const loadLeagueAuctionData = async (leagueId: string) => {
    try {
      setIsLoading(true);
      // Fetch league info
      let leagueInfo: any = null;
      try {
        const lRes = await fetch(`/api/leagues/${leagueId}`);
        if (lRes.ok) {
          const lData = await lRes.json();
          if (lData.success) leagueInfo = lData.data;
        }
      } catch (e) {}
      if (!leagueInfo && supabase) {
        try {
          const { data: sbL } = await supabase.from('leagues').select('*').eq('id', leagueId).single();
          if (sbL) leagueInfo = sbL;
        } catch (e) {}
      }
      if (leagueInfo) setCurrentLeague(leagueInfo);

      // Fetch auction state
      try {
        const stateRes = await fetch(`/api/auction/state?leagueId=${leagueId}`);
        const stateData = await stateRes.json();
        if (stateRes.ok && stateData.success && stateData.data) {
          const auction = stateData.data;
          setCurrentBid(auction.current_bid || 10);
          setTimer(auction.timer_seconds !== undefined ? auction.timer_seconds : 30);
          setIsAuctionActive(!!auction.is_active);
          setLeadingTeamId(auction.current_team_id || null);
          setCurrentPlayer(auction.currentPlayer || null);
          if (auction.currentPlayer) {
            setActivePoolTab(getPlayerCategory(auction.currentPlayer));
          }
        }
      } catch (e) {}

      // Fetch teams with their bought players
      let teamsList: any[] = [];
      try {
        const teamsRes = await fetch(`/api/teams?leagueId=${leagueId}`);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          if (Array.isArray(teamsData) && teamsData.length > 0) teamsList = teamsData;
        }
      } catch (e) {}
      if (teamsList.length === 0 && supabase) {
        try {
          const { data: sbTeams } = await supabase.from('teams').select('*').eq('league_id', leagueId);
          if (sbTeams) teamsList = sbTeams;
        } catch (e) {}
      }
      setTeams(teamsList);

      // Fetch disclosed category pools or players from Supabase
      let poolsLoaded = false;
      try {
        const poolsRes = await fetch(`/api/auction/pools?leagueId=${leagueId}`);
        const poolsData = await poolsRes.json();
        if (poolsRes.ok && poolsData.success && poolsData.data?.pools) {
          setPools(poolsData.data.pools);
          poolsLoaded = true;
        }
      } catch (e) {}

      if (!poolsLoaded && supabase) {
        try {
          const { data: sbPlayers } = await supabase.from('players').select('*').eq('league_id', leagueId);
          if (sbPlayers && sbPlayers.length > 0) {
            const categorized: DisclosedPools = {
              batters: sbPlayers.filter(p => p.role === 'batter'),
              wicketkeepers: sbPlayers.filter(p => p.role === 'wicketkeeper' || p.is_wicketkeeper),
              allrounders: sbPlayers.filter(p => p.role === 'all-rounder'),
              pacers: sbPlayers.filter(p => p.role === 'bowler' && p.bowling_category === 'pace'),
              spinners: sbPlayers.filter(p => p.role === 'bowler' && p.bowling_category === 'spin'),
              other: []
            };
            setPools(categorized);
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error loading auction data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAuction = async (poolCategory?: string, playerId?: string) => {
    try {
      const res = await fetch('/api/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: currentLeagueId,
          poolCategory,
          playerId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuctionActive(true);
        if (data.data?.currentPlayer) {
          setCurrentPlayer(data.data.currentPlayer);
          setActivePoolTab(getPlayerCategory(data.data.currentPlayer));
        }
        await loadLeagueAuctionData(currentLeagueId);
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

    const myTeam = getTeamById(teamId);
    if (myTeam && (myTeam.team_players?.length || 0) >= squadLimit) {
      alert(`Your team squad is full! Max ${squadLimit} players allowed.`);
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

  // Filtered pool players based on search query
  const filteredPoolPlayers = (pools[activePoolTab] || []).filter(p => {
    if (!poolSearchQuery.trim()) return true;
    const query = poolSearchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.college_id?.toLowerCase().includes(query) ||
      p.department?.toLowerCase().includes(query) ||
      p.special_skills?.toLowerCase().includes(query)
    );
  });

  if (isLoading && leagues.length === 0) {
    return (
      <div className="auction-container">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <div className="loading-spinner-pulse"><LightningIcon size={44} color="#00f0ff" /></div>
          <p style={{ marginTop: '16px', fontSize: '16px', fontWeight: 600 }}>Entering PitchBid Pro Auction Arena...</p>
        </div>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="auction-container">
        <div className="auction-empty-state-card">
          <div className="empty-state-icon"><CricketIcon size={56} color="#00f0ff" /></div>
          <h2>No Active Tournaments or Leagues Found</h2>
          <p>
            The auction floor starts completely fresh with zero mock data. Create a tournament league from the League Management desk to initialize team purses, squads, and bidding pools.
          </p>
          <div className="empty-state-actions">
            <button onClick={() => navigate('/league-admin')} className="btn-primary-action">
              + Create Tournament League
            </button>
            <button onClick={() => navigate('/register-player')} className="btn-secondary-action">
              Register New Player
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-container">
      {/* Top Banner & League Switcher */}
      <div className="auction-top-bar">
        <div className="top-bar-left">
          <div className="league-info-title">
            <div className="title-row">
              <span className="stadium-live-dot" />
              <h2>PitchBid Pro Live Auction Arena</h2>
            </div>
            <div className="league-subname">
              Tournament: <strong>{currentLeague?.name || 'Loading...'}</strong>
              <span className="code-pill">{currentLeague?.code}</span>
            </div>
          </div>

          {/* Tournament Rules Chips */}
          <div className="rules-chip-bar">
            <div className="rule-chip-item">
              <span className="rule-chip-icon"><CoinsIcon size={15} color="#00f0ff" /></span>
              <span>Default Purse: <strong>₹{defaultPurse} Cr</strong></span>
            </div>
            <div className="rule-chip-item">
              <span className="rule-chip-icon"><UsersIcon size={15} color="#00f0ff" /></span>
              <span>Squad Limit: <strong>{squadLimit} Players</strong></span>
            </div>
            {currentLeague?.auction_date_time && (
              <div className="rule-chip-item">
                <span className="rule-chip-icon"><CalendarIcon size={15} color="#00f0ff" /></span>
                <span>Date: <strong>{new Date(currentLeague.auction_date_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</strong></span>
              </div>
            )}
            <div className="rule-chip-item">
              <span className="rule-chip-icon"><StadiumIcon size={15} color="#00f0ff" /></span>
              <span>Teams: <strong>{teams.length}</strong></span>
            </div>
          </div>
        </div>

        <div className="top-bar-controls">
          <div className="league-select-wrapper">
            <label>Tournament</label>
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
              <CrownIcon size={15} color="#fbbf24" style={{ marginRight: 6 }} />
              <span>Captain Bidding: <strong>{captainTeam?.name}</strong></span>
            </div>
          ) : (
            <div className="mode-badge spectator-mode">
              <EyeIcon size={15} color="#00f0ff" style={{ marginRight: 6 }} />
              <span>Spectator</span>
              <button className="btn-switch-captain" onClick={() => setShowCaptainModal(true)}>
                Enter Captain Key
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Captain Key Modal */}
      {showCaptainModal && (
        <div className="captain-key-modal-overlay">
          <div className="captain-key-modal-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CrownIcon size={24} color="#facc15" />
              <h3 style={{ margin: 0 }}>Enter Captain Auction Bidding Mode</h3>
            </div>
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
                      {t.name} (Budget: ₹{t.budget} Cr)
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
            <div className="stage-title-group">
              <span className="stage-header-title">Auction Spotlight</span>
              {currentPlayer && (
                <span className="live-on-block-badge">
                  LOT ON BLOCK: {getPlayerCategory(currentPlayer).toUpperCase()}
                </span>
              )}
            </div>
            {isAuctionActive ? (
              <span className="live-indicator-pulse">
                <span className="pulse-circle" /> LIVE BIDDING
              </span>
            ) : (
              <span className="paused-indicator">FLOOR STANDBY</span>
            )}
          </div>

          {currentPlayer ? (
            <div className="player-stage-card">
              {/* Player Spotlight Header Banner */}
              <div className="player-spotlight-header">
                <div className="player-avatar-badge">
                  {currentPlayer.jersey_number ? (
                    <span className="jersey-badge-text">#{currentPlayer.jersey_number}</span>
                  ) : (
                    <span className="avatar-icon"><CricketIcon size={38} color="#00f0ff" /></span>
                  )}
                </div>

                <div className="player-title-info">
                  <div className="player-meta-strip">
                    <span className="player-role-badge">{currentPlayer.role?.toUpperCase()}</span>
                    {currentPlayer.is_mvp && (
                      <span className="mvp-badge">
                        <StarIcon size={11} color="#f43f5e" style={{ marginRight: 3 }} /> MVP
                      </span>
                    )}
                    <span className="dept-tag">{currentPlayer.department || 'Cricket Squad'}</span>
                    <span className="pool-indicator-tag">POOL: {getPlayerCategory(currentPlayer).toUpperCase()}</span>
                  </div>

                  <h1 className="player-display-name">{currentPlayer.name}</h1>

                  <div className="player-stats-sub">
                    <span className="stat-sub-item">
                      <GraduationCapIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} />
                      <strong>College ID:</strong> {currentPlayer.college_id || 'N/A'}
                    </span>
                    <span className="stat-sub-divider">•</span>
                    <span className="stat-sub-item">
                      <CalendarIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} />
                      <strong>Year:</strong> {currentPlayer.year || '3rd Year'}
                    </span>
                    <span className="stat-sub-divider">•</span>
                    <span className="stat-sub-item">
                      <CoinsIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} />
                      <strong>Base Price:</strong> ₹{currentPlayer.base_price} Cr
                    </span>
                  </div>
                </div>
              </div>

              {/* Tactical Cricket Playing Style Badges */}
              <div className="player-tactical-specs-bar">
                {currentPlayer.batting_hand && (
                  <span className="spec-pill">
                    <CricketIcon size={13} style={{ marginRight: 4 }} />
                    {currentPlayer.batting_hand === 'left' ? 'LHB' : 'RHB'}
                    {currentPlayer.batting_position ? ` • ${currentPlayer.batting_position.toUpperCase()}` : ''}
                  </span>
                )}
                {(currentPlayer.role === 'bowler' || currentPlayer.role === 'all-rounder') && (currentPlayer.bowling_arm || currentPlayer.bowling_type) && (
                  <span className="spec-pill">
                    <TargetIcon size={13} style={{ marginRight: 4 }} />
                    {currentPlayer.bowling_arm === 'left' ? 'Left-Arm' : 'Right-Arm'}{' '}
                    {currentPlayer.bowling_category?.toUpperCase() || ''}{' '}
                    {currentPlayer.bowling_type ? `(${currentPlayer.bowling_type})` : ''}
                  </span>
                )}
                {currentPlayer.allrounder_type && (
                  <span className="spec-pill allrounder-pill">
                    <LightningIcon size={13} style={{ marginRight: 4 }} />
                    {currentPlayer.allrounder_type === 'batting-allrounder' ? 'Batting All-Rounder' : 'Bowling All-Rounder'}
                  </span>
                )}
                {currentPlayer.is_wicketkeeper && (
                  <span className="spec-pill wk-pill">
                    <GloveIcon size={13} style={{ marginRight: 4 }} /> Wicketkeeper
                  </span>
                )}
                {currentPlayer.experience_level && (
                  <span className="spec-pill exp-pill">
                    <TrophyIcon size={13} style={{ marginRight: 4 }} /> {currentPlayer.experience_level}
                  </span>
                )}
              </div>

              {currentPlayer.special_skills && (
                <div className="player-strengths-box">
                  <span className="strength-label">
                    <LightningIcon size={13} color="#38bdf8" style={{ marginRight: 4 }} />
                    Scouting Report:
                  </span>
                  <span>{currentPlayer.special_skills}</span>
                </div>
              )}

              {/* Real-time Bid & Timer HUD (High-Tech 3-Block Scoreboard) */}
              <div className="bidding-hud">
                {/* Dial Card */}
                <div className="hud-card hud-timer-card">
                  <div className={`timer-dial ${timer <= 5 ? 'dial-danger' : ''}`}>
                    <span className="timer-number">{timer}</span>
                    <span className="timer-unit">SEC</span>
                  </div>
                  <div className="hud-card-label">ROUND TIMER</div>
                </div>

                {/* Bid Card */}
                <div className="hud-card hud-bid-card">
                  <span className="hud-card-label">CURRENT LEADING BID</span>
                  <div className="bid-amount-display">
                    <span className="currency-symbol">₹</span>
                    <span className="amount-num">{currentBid}</span>
                    <span className="amount-unit">Cr</span>
                  </div>
                  <div className="bid-next-step">
                    Next Minimum Bid: <strong>₹{nextBidAmount} Cr</strong>
                  </div>
                </div>

                {/* Leader Card */}
                <div className="hud-card hud-leader-card">
                  <span className="hud-card-label">CURRENT HIGH BIDDER</span>
                  {leadingTeamId ? (
                    <div className="leading-team-box">
                      <div className="leader-crown-badge">
                        <CrownIcon size={13} color="#facc15" style={{ marginRight: 4 }} />
                        HIGH BIDDER
                      </div>
                      <div className="leading-team-name">{getTeamById(leadingTeamId)?.name}</div>
                      <div className="leader-purse-left">
                        Purse Left: <strong>₹{getTeamById(leadingTeamId)?.budget} Cr</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="no-bid-box">
                      <div className="no-bid-pulse-icon">
                        <LightningIcon size={22} color="#64748b" />
                      </div>
                      <div className="no-bid-yet">Awaiting Opening Bid</div>
                      <div className="no-bid-sub">Opening Base: ₹{currentPlayer.base_price || 10} Cr</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bidding Controls Hub */}
              <div className="auction-action-hub">
                {!isAuctionActive ? (
                  isLeagueAdmin ? (
                    <button className="btn-launch-auction-hero" onClick={() => handleStartAuction(activePoolTab)}>
                      ▶ Start Live Auction Round
                    </button>
                  ) : (
                    <div className="awaiting-admin-box">
                      ⌛ Auction round is paused. Waiting for the league administrator to call the next lot.
                    </div>
                  )
                ) : (
                  <div className="bidding-interactive-zone">
                    {/* Notice for Spectators vs Captains */}
                    {!isCaptain && (
                      <div className="spectator-notice-banner">
                        <div className="notice-left">
                          <span className="notice-icon"><EyeIcon size={18} color="#00f0ff" /></span>
                          <span>You are viewing in <strong>Live Spectator Mode</strong>. Captains bid directly using their unique captain key.</span>
                        </div>
                        <button className="btn-captain-unlock" onClick={() => setShowCaptainModal(true)}>
                          Enter as Captain
                        </button>
                      </div>
                    )}

                    {isCaptain && hasInsufficientFunds && (
                      <div className="insufficient-funds-alert">
                        Insufficient budget! Your team ({captainTeam?.name}) has ₹{captainTeam?.budget} Cr left, but the next minimum bid is ₹{nextBidAmount} Cr.
                      </div>
                    )}

                    {isCaptain && isCaptainSquadFull && (
                      <div className="insufficient-funds-alert" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' }}>
                        Squad Full! Your team ({captainTeam?.name}) has reached the tournament squad limit of {squadLimit} players.
                      </div>
                    )}

                    {/* Team Bid Buttons Grid */}
                    <div className="team-bid-section-header">
                      <span>Bidding Floor Teams</span>
                      <span className="sub-helper">Click team button to place next bid increment of ₹5 Cr</span>
                    </div>

                    <div className="team-bid-buttons-grid">
                      {teams.map(team => {
                        const isMyTeam = isCaptain && user?.teamId === team.id;
                        const isLeading = team.id === leadingTeamId;
                        const isTeamFull = (team.team_players?.length || 0) >= squadLimit;
                        const pursePercent = Math.max(0, Math.min(100, (team.budget / defaultPurse) * 100));

                        return (
                          <button
                            key={team.id}
                            onClick={() => handlePlaceBid(team.id)}
                            disabled={!isAuctionActive || !isMyTeam || hasInsufficientFunds || isTeamFull}
                            className={`auction-bid-btn ${isMyTeam ? 'my-team-btn' : 'other-team-btn'} ${isLeading ? 'is-leading' : ''}`}
                          >
                            <div className="bid-btn-header">
                              <div className="bid-btn-avatar">
                                {team.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="bid-btn-team-info">
                                <div className="btn-team-title">{team.name}</div>
                                {isMyTeam && <span className="my-team-pill">YOUR TEAM</span>}
                              </div>
                            </div>

                            <div className="bid-btn-stats">
                              <div className="btn-stat-row">
                                <span className="btn-stat-label">Purse:</span>
                                <span className="btn-stat-val">₹{team.budget} Cr</span>
                              </div>
                              <div className="btn-purse-mini-track">
                                <div className="btn-purse-mini-fill" style={{ width: `${pursePercent}%` }} />
                              </div>
                              <div className="btn-stat-row" style={{ marginTop: '4px' }}>
                                <span className="btn-stat-label">Squad:</span>
                                <span className="btn-stat-val">{(team.team_players?.length || 0)}/{squadLimit}</span>
                              </div>
                            </div>

                            <div className="bid-btn-footer">
                              {isLeading && (
                                <div className="leading-badge">
                                  <CrownIcon size={12} color="#facc15" style={{ marginRight: 4 }} />
                                  Current High Bidder
                                </div>
                              )}
                              {isTeamFull && <div className="squad-full-warning">Squad Full</div>}
                              {isMyTeam && !isTeamFull && !hasInsufficientFunds && (
                                <div className="bid-action-text">+ Bid ₹{nextBidAmount} Cr</div>
                              )}
                              {!isMyTeam && !isLeading && !isTeamFull && (
                                <div className="team-status-inactive">Captain Managed</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* League Admin Direct Controls */}
                    {isLeagueAdmin && (
                      <div className="admin-inline-controls">
                        <span className="admin-inline-label">Admin Bidding Controls:</span>
                        <button className="btn-sell-direct" onClick={handleSellPlayer}>
                          <GavelIcon size={14} style={{ marginRight: 6 }} />
                          Hammer Down (Sell to {getTeamById(leadingTeamId || '')?.name || 'Leader'})
                        </button>
                        <button className="btn-skip-direct" onClick={handleSkipPlayer}>
                          <CrossIcon size={13} style={{ marginRight: 6 }} />
                          Pass / Mark Unsold
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-players-stage">
              <div className="podium-icon"><StadiumIcon size={56} color="#00f0ff" /></div>
              <h3>Auction Floor Standby</h3>
              <p>The bidding floor is currently waiting for the next player lot. Select an upcoming category pool below to review registered players and place a player on the block.</p>

              <div className="standby-pools-quick-launch">
                <span className="quick-launch-label">Category Pools:</span>
                <div className="quick-launch-buttons">
                  {(['batters', 'wicketkeepers', 'allrounders', 'pacers', 'spinners'] as const).map(cat => (
                    <button
                      key={cat}
                      className={`btn-quick-pool ${activePoolTab === cat ? 'active' : ''}`}
                      onClick={() => setActivePoolTab(cat)}
                    >
                      {cat === 'batters' && <><CricketIcon size={14} style={{ marginRight: 4 }} /> Batters</>}
                      {cat === 'wicketkeepers' && <><GloveIcon size={14} style={{ marginRight: 4 }} /> Wicketkeepers</>}
                      {cat === 'allrounders' && <><LightningIcon size={14} style={{ marginRight: 4 }} /> All-Rounders</>}
                      {cat === 'pacers' && <><RocketIcon size={14} style={{ marginRight: 4 }} /> Fast Bowlers</>}
                      {cat === 'spinners' && <><SpinIcon size={14} style={{ marginRight: 4 }} /> Spinners</>}
                      <span className="pool-count-tag">{pools[cat]?.length || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isLeagueAdmin ? (
                <div className="admin-standby-actions">
                  <button className="btn-launch-auction-hero" onClick={() => handleStartAuction(activePoolTab)}>
                    <PlayIcon size={14} style={{ marginRight: 6 }} /> Launch Bidding with {activePoolTab.toUpperCase()} Pool
                  </button>
                </div>
              ) : (
                <div className="awaiting-admin-pill">
                  Waiting for the League Administrator to call the next lot.
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE TEAM COMPOSITION */}
        <div className="auction-team-composition-panel">
          <div className="composition-header">
            <div className="comp-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon size={18} color="#00f0ff" />
                <h3 style={{ margin: 0 }}>Team Rosters & Purses</h3>
              </div>
              <span className="teams-count-pill">{teams.length} Teams</span>
            </div>
            <p>Live squad rosters (Max {squadLimit} players) and remaining purse.</p>
          </div>

          <div className="teams-composition-list">
            {teams.map(team => {
              const boughtPlayers = team.team_players || [];
              const isLeading = team.id === leadingTeamId;
              const isFull = boughtPlayers.length >= squadLimit;
              const pursePercent = Math.max(0, Math.min(100, (team.budget / defaultPurse) * 100));
              const isMyTeam = isCaptain && user?.teamId === team.id;

              return (
                <div key={team.id} className={`team-roster-card ${isLeading ? 'highlight-leading' : ''} ${isMyTeam ? 'highlight-my-team' : ''}`}>
                  <div className="team-roster-header">
                    <div className="team-roster-identity">
                      <div className="team-avatar-mini">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="roster-team-name">
                          {team.name}
                          {isMyTeam && <span className="my-team-indicator">YOU</span>}
                          {isLeading && <CrownIcon size={12} color="#facc15" style={{ marginLeft: 4 }} />}
                        </h4>
                        <span className="roster-captain-name">Captain: {team.captain_name || 'Assigned'}</span>
                      </div>
                    </div>
                    <div className="roster-budget-pill">
                      ₹{team.budget} Cr
                    </div>
                  </div>

                  {/* Purse Progress Bar */}
                  <div className="roster-budget-bar-wrapper">
                    <div className="roster-bar-track">
                      <div
                        className="roster-bar-fill"
                        style={{ width: `${pursePercent}%` }}
                      />
                    </div>
                    <div className="roster-bar-labels">
                      <span>Purse: {Math.round(pursePercent)}% Left</span>
                      <span>Squad: {boughtPlayers.length}/{squadLimit}{isFull ? ' (FULL)' : ''}</span>
                    </div>
                  </div>

                  {boughtPlayers.length > 0 ? (
                    <div className="bought-players-chips">
                      {boughtPlayers.map((tp, idx) => (
                        <div key={idx} className="player-chip">
                          <span className="chip-role-icon">
                            {tp.player?.role === 'bowler' ? (
                              <TargetIcon size={11} color="#38bdf8" />
                            ) : tp.player?.role === 'all-rounder' ? (
                              <LightningIcon size={11} color="#facc15" />
                            ) : tp.player?.is_wicketkeeper ? (
                              <GloveIcon size={11} color="#c084fc" />
                            ) : (
                              <CricketIcon size={11} color="#34d399" />
                            )}
                          </span>
                          <span className="chip-name">{tp.player?.name || `Player ${idx + 1}`}</span>
                          <span className="chip-price">₹{tp.sold_price} Cr</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-roster-hint">No players drafted yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DISCLOSED CATEGORY POOLS PREVIEW DECK */}
      <div className="disclosed-pools-section">
        <div className="pools-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardIcon size={20} color="#00f0ff" />
              <h3 style={{ margin: 0 }}>Disclosed Category Player Pools</h3>
            </div>
            <p>Full list of players in each pool disclosed before and during bidding.</p>
          </div>
          <div className="pools-header-controls">
            <div className="pool-search-input-wrapper">
              <span className="search-icon"><SearchIcon size={14} color="#94a3b8" /></span>
              <input
                type="text"
                placeholder="Search player, college ID..."
                value={poolSearchQuery}
                onChange={(e) => setPoolSearchQuery(e.target.value)}
                className="pool-search-input"
              />
              {poolSearchQuery && (
                <button className="clear-search-btn" onClick={() => setPoolSearchQuery('')}>
                  <CrossIcon size={11} color="#94a3b8" />
                </button>
              )}
            </div>

            {isLeagueAdmin && !isAuctionActive && (
              <button
                className="btn-launch-auction-pool"
                onClick={() => handleStartAuction(activePoolTab)}
              >
                <PlayIcon size={12} style={{ marginRight: 6 }} /> Start {activePoolTab.toUpperCase()} Pool
              </button>
            )}
          </div>
        </div>

        {/* Category Pool Tabs */}
        <div className="pool-category-tabs">
          {[
            { id: 'batters', label: 'Batters', icon: <CricketIcon size={14} /> },
            { id: 'wicketkeepers', label: 'Wicketkeepers', icon: <GloveIcon size={14} /> },
            { id: 'allrounders', label: 'All-Rounders', icon: <LightningIcon size={14} /> },
            { id: 'pacers', label: 'Fast Bowlers', icon: <RocketIcon size={14} /> },
            { id: 'spinners', label: 'Spinners', icon: <SpinIcon size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              className={`pool-tab-btn ${activePoolTab === tab.id ? 'active' : ''}`}
              onClick={() => setActivePoolTab(tab.id as any)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="pool-badge-count">{pools[tab.id as keyof DisclosedPools]?.length || 0}</span>
            </button>
          ))}
        </div>

        {/* Disclosed Pool Table */}
        <div className="pool-table-wrapper">
          <table className="disclosed-pool-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Role & Playing Style</th>
                <th>Dept / College ID</th>
                <th>Base Price</th>
                <th>Registered At</th>
                <th>Status</th>
                {isLeagueAdmin && <th>Admin Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPoolPlayers.length > 0 ? (
                filteredPoolPlayers.map(p => {
                  const isCurrent = currentPlayer?.id === p.id;
                  const styleDetails = [
                    p.batting_hand ? `${p.batting_hand === 'left' ? 'LHB' : 'RHB'} (${p.batting_position || 'Middle Order'})` : null,
                    p.bowling_arm || p.bowling_type ? `${p.bowling_arm === 'left' ? 'Left' : 'Right'}-Arm ${p.bowling_category || ''} (${p.bowling_type || ''})` : null,
                    p.is_wicketkeeper ? 'WK' : null,
                    p.allrounder_type ? (p.allrounder_type === 'batting-allrounder' ? 'Batting AR' : 'Bowling AR') : null
                  ].filter(Boolean).join(' • ');

                  return (
                    <tr key={p.id} className={isCurrent ? 'current-live-row' : ''}>
                      <td>
                        <div className="table-player-cell">
                          <div className="table-player-avatar">
                            {p.jersey_number ? `#${p.jersey_number}` : p.name.substring(0, 1)}
                          </div>
                          <div>
                            <strong>{p.name}</strong>
                            {isCurrent && <span className="live-on-block-badge table-badge">ON BLOCK</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: '#cbd5e1' }}>{styleDetails || p.role?.toUpperCase()}</td>
                      <td>{p.department || '-'} / {p.college_id || '-'}</td>
                      <td>
                        <span className="table-price-tag">₹{p.base_price} Cr</span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td>
                        <span className={`status-pill ${p.status}`}>
                          {p.status === 'sold' ? `Sold: ₹${p.sold_price} Cr` : p.status}
                        </span>
                      </td>
                      {isLeagueAdmin && (
                        <td>
                          {p.status === 'available' && !isCurrent && (
                            <button
                              onClick={() => handleStartAuction(undefined, p.id)}
                              className="btn-table-block"
                            >
                              Put on Block
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isLeagueAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    {poolSearchQuery ? `No players found matching "${poolSearchQuery}"` : `No players currently registered in the ${activePoolTab.toUpperCase()} pool for this league.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Auction;