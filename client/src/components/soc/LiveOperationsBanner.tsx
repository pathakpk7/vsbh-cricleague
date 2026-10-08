import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LiveOperationsBanner.css';

interface LiveOperationsBannerProps {
  activeLeagueName?: string;
  activeLeagueCode?: string;
  totalLeaguesCount?: number;
  totalLiveMatches?: number;
  isAuctionActive?: boolean;
}

const LiveOperationsBanner: React.FC<LiveOperationsBannerProps> = ({
  activeLeagueName,
  activeLeagueCode,
  totalLeaguesCount = 1,
  totalLiveMatches = 0,
  isAuctionActive = false
}) => {
  const navigate = useNavigate();

  return (
    <div className="soc-hero-banner">
      <div className="hero-stadium-mesh"></div>
      <div className="hero-grid-overlay"></div>

      <div className="hero-content-wrapper">
        <div className="hero-telemetry-meta">
          <div className="ops-status-chip">
            <span className="ops-pulse-beacon"></span>
            <span>CRICKET OPERATIONS COMMAND CENTER</span>
          </div>

          {activeLeagueName && (
            <div className="active-league-pill">
              <span className="pill-dot">●</span>
              <span>ACTIVE LEAGUE: <strong>{activeLeagueName}</strong></span>
              {activeLeagueCode && <code className="league-code-tag">{activeLeagueCode}</code>}
            </div>
          )}
        </div>

        <div className="hero-main-headline">
          <h1 className="hero-title">
            PitchBid Pro <span className="headline-gradient">Live Auction & League Arena</span>
          </h1>
          <p className="hero-subtitle">
            Next-gen cricket operations center. High-speed real-time auctions, captain-secured bidding rooms, dynamic roster telemetry, and ball-by-ball match play.
          </p>
        </div>

        {/* Quick Command Launchpads */}
        <div className="hero-action-launchpads">
          <button 
            className="launchpad-btn btn-auction-arena"
            onClick={() => navigate('/auction')}
          >
            <div className="btn-glow-layer"></div>
            <span className="btn-icon">🎯</span>
            <div className="btn-text-block">
              <span className="btn-label">Live Auction Arena</span>
              <small>{isAuctionActive ? '🔴 Bidding in progress' : 'Captains & Spectators'}</small>
            </div>
          </button>

          <button 
            className="launchpad-btn btn-match-center"
            onClick={() => navigate('/live-matches')}
          >
            <div className="btn-glow-layer"></div>
            <span className="btn-icon">🔴</span>
            <div className="btn-text-block">
              <span className="btn-label">Match Center</span>
              <small>{totalLiveMatches > 0 ? `${totalLiveMatches} Active Match` : 'Ball-by-ball Scoring'}</small>
            </div>
          </button>

          <button 
            className="launchpad-btn btn-player-reg"
            onClick={() => navigate('/register-player')}
          >
            <div className="btn-glow-layer"></div>
            <span className="btn-icon">🏏</span>
            <div className="btn-text-block">
              <span className="btn-label">Register Player</span>
              <small>Choose Playing Styles</small>
            </div>
          </button>

          <button 
            className="launchpad-btn btn-league-admin"
            onClick={() => navigate('/league-admin')}
          >
            <div className="btn-glow-layer"></div>
            <span className="btn-icon">🏆</span>
            <div className="btn-text-block">
              <span className="btn-label">League Hub</span>
              <small>{totalLeaguesCount} Leagues Managed</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveOperationsBanner;
