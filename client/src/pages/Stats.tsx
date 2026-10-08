import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { League, Player, Team } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BarChartIcon, GavelIcon, CricketIcon, TrophyIcon, StarIcon } from '../components/Icons';
import './Stats.css';

const Stats: React.FC = () => {
  const { activeLeagueId } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAnalyticsData(selectedLeagueId);
  }, [selectedLeagueId]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && data.data.length > 0) {
        setLeagues(data.data);
        if (!selectedLeagueId) {
          setSelectedLeagueId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load leagues in Stats:', e);
    }
  };

  const fetchAnalyticsData = async (leagueId?: string) => {
    try {
      setLoading(true);
      const pUrl = leagueId ? `/api/players?leagueId=${leagueId}` : '/api/players';
      const tUrl = leagueId ? `/api/teams?leagueId=${leagueId}` : '/api/teams';
      const mUrl = leagueId ? `/api/matches?leagueId=${leagueId}` : '/api/matches';

      const [pRes, tRes, mRes] = await Promise.all([
        fetch(pUrl),
        fetch(tUrl),
        fetch(mUrl)
      ]);

      const playersData = await pRes.json();
      const teamsData = await tRes.json();
      const matchesData = await mRes.json();

      setPlayers(Array.isArray(playersData) ? playersData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setMatches(matchesData?.data && Array.isArray(matchesData.data) ? matchesData.data : []);
    } catch (e) {
      console.error('Failed to load analytics telemetry:', e);
      setPlayers([]);
      setTeams([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const activeLeague = leagues.find(l => l.id === selectedLeagueId);

  // Compute metrics
  const totalPlayers = players.length;
  const soldPlayers = players.filter(p => p.status === 'sold');
  const totalTeams = teams.length;
  const totalMatchesPlayed = matches.filter(m => m.status === 'finished').length;
  const liveMatchesCount = matches.filter(m => m.status === 'live').length;

  const battersCount = players.filter(p => p.role === 'batter').length;
  const bowlersCount = players.filter(p => p.role === 'bowler').length;
  const allroundersCount = players.filter(p => p.role === 'all-rounder').length;
  const wkCount = players.filter(p => p.role === 'wicketkeeper').length;

  const batterPct = totalPlayers > 0 ? Math.round((battersCount / totalPlayers) * 100) : 0;
  const bowlerPct = totalPlayers > 0 ? Math.round((bowlersCount / totalPlayers) * 100) : 0;
  const allrounderPct = totalPlayers > 0 ? Math.round((allroundersCount / totalPlayers) * 100) : 0;
  const wkPct = totalPlayers > 0 ? Math.round((wkCount / totalPlayers) * 100) : 0;

  // Highest Valued / MVP Players
  const topValuedPlayers = [...players].sort((a, b) => {
    const priceA = a.sold_price || a.base_price || 0;
    const priceB = b.sold_price || b.base_price || 0;
    return priceB - priceA;
  }).slice(0, 5);

  const mvpPlayers = players.filter(p => p.is_mvp);

  return (
    <div className="soc-stats-container">
      {/* 1. Header & Controls */}
      <div className="soc-stats-top-bar">
        <div className="stats-headline-group">
          <h2><BarChartIcon size={22} color="#00f0ff" style={{ marginRight: 8 }} /> Tournament Analytics & Scout Radar</h2>
          <p className="stats-subtitle">
            Performance metrics, tactical role distributions, and squad valuation telemetry
          </p>
        </div>

        <div className="fixtures-controls-group">
          {leagues.length > 0 && (
            <div className="league-picker-wrapper">
              <label>Tournament:</label>
              <select 
                className="league-picker-select"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Link to="/auction" className="soc-btn-create-league">
            <GavelIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Auction Arena
          </Link>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="soc-empty-state-card">
          <div className="soc-spinner-pulse"></div>
          <p>AGGREGATING TOURNAMENT TELEMETRY...</p>
        </div>
      ) : totalPlayers === 0 && totalTeams === 0 ? (
        /* 3. Empty State */
        <div className="soc-empty-state-card">
          <div className="soc-empty-radar-icon"><BarChartIcon size={48} color="#64748b" /></div>
          <h3>NO ANALYTICS TELEMETRY AVAILABLE</h3>
          <p>
            {leagues.length === 0 
              ? 'No cricket leagues or registered players exist on the platform yet. When players register and bidding takes place, tactical metrics will synthesize automatically.'
              : `No players have registered under "${activeLeague?.name || 'this league'}" yet. Share the league code with players to initiate scouting telemetry.`
            }
          </p>
          <div className="empty-state-actions">
            <Link to="/register-player" className="soc-btn-create-league">
              <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} /> Register New Player
            </Link>
            <Link to="/league-admin" className="soc-btn-primary-sm">
              <TrophyIcon size={14} color="#facc15" style={{ marginRight: 6 }} /> League Admin
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Top Telemetry Ribbon */}
          <div className="soc-stats-metrics-grid">
            <div className="stats-metric-card">
              <span className="metric-label-chip">Registered Scouting Pool</span>
              <span className="metric-hero-val val-cyan">{totalPlayers}</span>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                {soldPlayers.length} Acquired • {totalPlayers - soldPlayers.length} Available
              </small>
            </div>

            <div className="stats-metric-card">
              <span className="metric-label-chip">Active Squads</span>
              <span className="metric-hero-val val-emerald">{totalTeams}</span>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                {totalTeams * 11} Total Roster Slots
              </small>
            </div>

            <div className="stats-metric-card">
              <span className="metric-label-chip">Matches Documented</span>
              <span className="metric-hero-val val-gold">{totalMatchesPlayed + liveMatchesCount}</span>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                {liveMatchesCount} Live • {totalMatchesPlayed} Completed
              </small>
            </div>

            <div className="stats-metric-card">
              <span className="metric-label-chip">Designated MVP Talents</span>
              <span className="metric-hero-val" style={{ color: '#f43f5e' }}>{mvpPlayers.length}</span>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>
                High-Impact Star Players
              </small>
            </div>
          </div>

          {/* 5. 2-Column Analytics Deck */}
          <div className="soc-stats-deck-columns">
            {/* Tactical Specialization Breakdown */}
            <div className="soc-stats-section-card">
              <div className="section-header-strip">
                <h3 className="section-title"><CricketIcon size={18} color="#00f0ff" style={{ marginRight: 6 }} /> Tactical Role Distribution</h3>
                <span className="squad-count-chip">{totalPlayers} Candidates</span>
              </div>

              <div className="tactical-role-distribution">
                <div className="distribution-row">
                  <div className="distribution-meta">
                    <span style={{ color: '#00f0ff' }}>Batters</span>
                    <span>{battersCount} ({batterPct}%)</span>
                  </div>
                  <div className="distribution-track">
                    <div className="distribution-fill fill-batter" style={{ width: `${batterPct}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="distribution-meta">
                    <span style={{ color: '#f43f5e' }}>Bowlers</span>
                    <span>{bowlersCount} ({bowlerPct}%)</span>
                  </div>
                  <div className="distribution-track">
                    <div className="distribution-fill fill-bowler" style={{ width: `${bowlerPct}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="distribution-meta">
                    <span style={{ color: '#f59e0b' }}>All-Rounders</span>
                    <span>{allroundersCount} ({allrounderPct}%)</span>
                  </div>
                  <div className="distribution-track">
                    <div className="distribution-fill fill-allrounder" style={{ width: `${allrounderPct}%` }}></div>
                  </div>
                </div>

                <div className="distribution-row">
                  <div className="distribution-meta">
                    <span style={{ color: '#c084fc' }}>Wicketkeepers</span>
                    <span>{wkCount} ({wkPct}%)</span>
                  </div>
                  <div className="distribution-track">
                    <div className="distribution-fill fill-wk" style={{ width: `${wkPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Valuation / Scouting Leaderboard */}
            <div className="soc-stats-section-card">
              <div className="section-header-strip">
                <h3 className="section-title"><StarIcon size={18} color="#facc15" style={{ marginRight: 6 }} /> Top Valuation Player Leaderboard</h3>
                <small className="squads-subtitle">Highest Price / Acquired</small>
              </div>

              <div className="stats-scouting-list">
                {topValuedPlayers.length === 0 ? (
                  <div className="soc-empty-radar" style={{ padding: '20px 0' }}>
                    No player bids recorded yet.
                  </div>
                ) : (
                  topValuedPlayers.map((p, idx) => (
                    <div key={p.id} className="scouting-item-row">
                      <div className="scouting-rank-circle">
                        {idx + 1}
                      </div>
                      <div className="scouting-player-details">
                        <span className="scouting-name-text">
                          {p.name} {p.is_mvp && '⭐'}
                        </span>
                        <span className="scouting-role-text">
                          {p.role.toUpperCase()} {p.department && `• ${p.department}`}
                        </span>
                      </div>
                      <span className="scouting-metric-badge">
                        ₹{p.sold_price || p.base_price || 10} Cr
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;
