import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { League, Player } from '../types';
import LiveOperationsBanner from '../components/soc/LiveOperationsBanner';
import StatTelemetryCard from '../components/soc/StatTelemetryCard';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    soldPlayers: 0,
    availablePlayers: 0,
    liveMatchesCount: 0
  });
  const [leagues, setLeagues] = useState<League[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch leagues
      const lRes = await fetch('/api/leagues');
      const lData = await lRes.json();
      if (lRes.ok && lData.success) {
        setLeagues(lData.data);
      }

      // Fetch players
      const pRes = await fetch('/api/players');
      const players = await pRes.json();

      // Fetch teams
      const tRes = await fetch('/api/teams');
      const teams = await tRes.json();

      // Fetch matches
      const mRes = await fetch('/api/matches');
      const mData = await mRes.json();
      const matches = mData.data || [];

      if (Array.isArray(players)) {
        const sold = players.filter((p: any) => p.status === 'sold').length;
        const available = players.filter((p: any) => p.status === 'available').length;
        
        setStats({
          totalPlayers: players.length,
          totalTeams: Array.isArray(teams) ? teams.length : 0,
          totalMatches: Array.isArray(matches) ? matches.length : 0,
          soldPlayers: sold,
          availablePlayers: available,
          liveMatchesCount: Array.isArray(matches) ? matches.filter((m: any) => m.status === 'live').length : 0
        });

        // Take last 4 players
        setRecentPlayers(players.slice(-4).reverse());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="soc-dashboard-loading">
        <div className="soc-spinner-pulse"></div>
        <p>INITIALIZING SPORTS OPERATIONS DECK...</p>
      </div>
    );
  }

  const primaryLeague = leagues[0];
  const soldPercent = stats.totalPlayers > 0 ? Math.round((stats.soldPlayers / stats.totalPlayers) * 100) : 0;

  return (
    <div className="soc-dashboard-container">
      {/* 1. Command Hero Deck */}
      <LiveOperationsBanner 
        activeLeagueName={primaryLeague?.name}
        activeLeagueCode={primaryLeague?.code}
        totalLeaguesCount={leagues.length}
        totalLiveMatches={stats.liveMatchesCount}
        isAuctionActive={primaryLeague?.auction_status === 'live'}
      />

      {/* 2. Real-Time Telemetry HUD Grid */}
      <div className="soc-telemetry-grid">
        <StatTelemetryCard 
          icon="🏏"
          title="Auction Pool Velocity"
          value={stats.totalPlayers}
          subValue={`${stats.availablePlayers} Available • ${stats.soldPlayers} Signed`}
          badge={{ text: 'ROSTER POOL', type: 'info' }}
          progress={{ percent: soldPercent, color: 'cyan' }}
          accentColor="cyan"
          onClick={() => navigate('/register-player')}
        />

        <StatTelemetryCard 
          icon="🛡️"
          title="Franchise Squads"
          value={stats.totalTeams}
          subValue={`Multi-tenant franchise squads across leagues`}
          badge={{ text: 'CONCURRENT', type: 'ready' }}
          progress={{ percent: 100, color: 'emerald' }}
          accentColor="emerald"
          onClick={() => navigate('/teams')}
        />

        <StatTelemetryCard 
          icon="⚡"
          title="Active Tournament Hubs"
          value={leagues.length}
          subValue={`Isolated rooms with Captain Key security`}
          badge={{ text: 'ISOLATED', type: 'ready' }}
          progress={{ percent: 80, color: 'gold' }}
          accentColor="gold"
          onClick={() => navigate('/league-admin')}
        />

        <StatTelemetryCard 
          icon="🔴"
          title="Match Operations"
          value={stats.totalMatches}
          subValue={`${stats.liveMatchesCount} In-play • Ball-by-ball play doc`}
          badge={{ text: stats.liveMatchesCount > 0 ? 'LIVE ON AIR' : 'READY', type: stats.liveMatchesCount > 0 ? 'live' : 'ready' }}
          progress={{ percent: stats.totalMatches > 0 ? 100 : 0, color: 'rose' }}
          accentColor="rose"
          onClick={() => navigate('/live-matches')}
        />
      </div>

      {/* 3. Main Dashboard Operations Deck: Two Columns */}
      <div className="soc-deck-columns">
        {/* Left Column: Active Leagues Command Deck */}
        <div className="soc-deck-left">
          <div className="soc-card-wrapper">
            <div className="soc-card-header">
              <div className="header-title-group">
                <span className="header-glyph">🏆</span>
                <div>
                  <h3>Cricket Tournaments & Leagues</h3>
                  <small>Independent concurrent leagues with unique player codes</small>
                </div>
              </div>
              <Link to="/league-admin" className="soc-btn-primary-sm">
                + New League
              </Link>
            </div>

            <div className="soc-leagues-deck-grid">
              {leagues.map(league => (
                <div key={league.id} className="soc-league-unit-card">
                  <div className="unit-header-strip">
                    <span className="unit-title">{league.name}</span>
                    <span className={`soc-status-chip-sm chip-${league.registration_status}`}>
                      {league.registration_status === 'open' ? 'REG OPEN' : 'REG CLOSED'}
                    </span>
                  </div>

                  <div className="unit-data-pills">
                    <div className="data-pill">
                      <span className="pill-k">KEY</span>
                      <code className="pill-v-code">{league.code}</code>
                    </div>
                    <div className="data-pill">
                      <span className="pill-k">SQUADS</span>
                      <span className="pill-v">{league.number_of_teams}</span>
                    </div>
                    <div className="data-pill">
                      <span className="pill-k">AUCTION</span>
                      <span className="pill-v uppercase">{league.auction_status || 'DRAFT'}</span>
                    </div>
                  </div>

                  <div className="unit-actions-row">
                    <Link to={`/register-player?league=${league.code}`} className="soc-unit-action-btn reg-btn">
                      🏏 Register Player
                    </Link>
                    <Link to={`/auction?league=${league.id}`} className="soc-unit-action-btn auction-btn">
                      🎯 Arena Entry
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Player Scouting & Tactical Radar */}
        <div className="soc-deck-right">
          <div className="soc-card-wrapper">
            <div className="soc-card-header">
              <div className="header-title-group">
                <span className="header-glyph">📡</span>
                <div>
                  <h3>Player Scouting Radar</h3>
                  <small>Recent registrations with playing styles</small>
                </div>
              </div>
              <Link to="/register-player" className="soc-link-accent">
                Register Self →
              </Link>
            </div>

            <div className="soc-recent-players-list">
              {recentPlayers.length > 0 ? (
                recentPlayers.map(player => (
                  <div key={player.id} className="soc-scouting-player-item">
                    <div className="player-avatar-badge">
                      {player.role === 'batter' ? '🏏' : 
                       player.role === 'bowler' ? '🎯' : 
                       player.role === 'wicketkeeper' ? '🧤' : '⚡'}
                    </div>

                    <div className="player-info-meta">
                      <div className="player-name-row">
                        <strong>{player.name}</strong>
                        <span className="player-role-tag">{player.role.toUpperCase()}</span>
                      </div>
                      
                      <div className="player-tactical-specs">
                        {player.batting_hand && (
                          <span className="mini-spec">
                            {player.batting_hand.toUpperCase()} Bat
                            {player.batting_position ? ` (${player.batting_position})` : ''}
                          </span>
                        )}
                        {(player.role === 'bowler' || player.role === 'all-rounder') && (player.bowling_arm || player.bowling_type) && (
                          <span className="mini-spec">
                            • {player.bowling_arm || 'Right'}-arm {player.bowling_category || ''} ({player.bowling_type || 'Medium'})
                          </span>
                        )}
                      </div>

                      {player.special_skills && (
                        <div className="player-skills-snippet">
                          ⚡ {player.special_skills}
                        </div>
                      )}
                    </div>

                    <div className="player-price-tag">
                      <span className="price-label">BASE</span>
                      <span className="price-val">₹{player.base_price}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="soc-empty-radar">
                  <p>Awaiting player registrations under active league keys.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Operations Command Grid */}
      <div className="soc-quick-operations-panel">
        <div className="panel-header">
          <h3>⚡ Quick Operations Matrix</h3>
          <span>One-click access to all tournament command centers</span>
        </div>

        <div className="operations-matrix-grid">
          <Link to="/auction" className="matrix-tile">
            <span className="tile-icon">🎯</span>
            <div className="tile-text">
              <strong>Live Auction Arena</strong>
              <p>Captain Bidding Mode with unique key, real-time timer countdown, and squad rosters</p>
            </div>
          </Link>

          <Link to="/live-matches" className="matrix-tile">
            <span className="tile-icon">🔴</span>
            <div className="tile-text">
              <strong>Match Center & Scoring</strong>
              <p>Ball-by-ball commentary, runs tracker, and live play documentation</p>
            </div>
          </Link>

          <Link to="/register-player" className="matrix-tile">
            <span className="tile-icon">🏏</span>
            <div className="tile-text">
              <strong>Direct Player Registration</strong>
              <p>In-website registration with Batting, Bowling, and All-Rounder specifications</p>
            </div>
          </Link>

          <Link to="/league-admin" className="matrix-tile">
            <span className="tile-icon">🏆</span>
            <div className="tile-text">
              <strong>League Administration Hub</strong>
              <p>Configure number of teams, set registration deadlines, and reveal Captain Auction Keys</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
