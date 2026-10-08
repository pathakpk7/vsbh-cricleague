import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PitchBidLogo from './PitchBidLogo';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="soc-navbar">
      <div className="soc-navbar-container">
        {/* Brand Left */}
        <div className="soc-nav-left">
          <button 
            className={`soc-hamburger ${menuOpen ? 'is-active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className="soc-nav-brand" onClick={() => navigate('/')}>
            <div className="brand-logo-frame">
              <PitchBidLogo size={36} className="soc-brand-logo" />
            </div>
            <div className="brand-text-block">
              <span className="soc-brand-title">PitchBid<span className="brand-accent">_Pro</span></span>
              <span className="soc-edition-tag">CRICKET OPS & AUCTION DECK</span>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className={`soc-nav-links ${menuOpen ? 'mobile-drawer-open' : ''}`}>
          <Link 
            to="/" 
            className={`soc-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-link-dot"></span>
            Command Deck
          </Link>
          
          <Link 
            to="/auction" 
            className={`soc-nav-link live-pulse-link ${isActive('/auction') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-beacon-live"></span>
            Live Auction
          </Link>

          <Link 
            to="/live-matches" 
            className={`soc-nav-link ${isActive('/live-matches') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Match Center
          </Link>

          <Link 
            to="/register-player" 
            className={`soc-nav-link ${isActive('/register-player') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Register Player
          </Link>

          <Link 
            to="/league-admin" 
            className={`soc-nav-link ${isActive('/league-admin') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            League Hub
          </Link>

          <Link 
            to="/teams" 
            className={`soc-nav-link ${isActive('/teams') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Squads
          </Link>

          <Link 
            to="/fixtures" 
            className={`soc-nav-link ${isActive('/fixtures') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Fixtures
          </Link>

          <Link 
            to="/points-table" 
            className={`soc-nav-link ${isActive('/points-table') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Standings
          </Link>

          <Link 
            to="/stats" 
            className={`soc-nav-link ${isActive('/stats') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Analytics
          </Link>
        </div>

        {/* Actions / Auth Right */}
        <div className="soc-nav-actions">
          {user ? (
            <div className="soc-user-badge-container">
              <div className="soc-user-pill">
                <span className="user-avatar-initial">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                <div className="user-details-mini">
                  <span className="user-name-label">{user.name}</span>
                  <span className={`user-role-chip role-${user.role}`}>
                    {user.role === 'admin' ? '🛡️ LEAGUE ADMIN' : 
                     user.role === 'captain' ? `👑 CAPTAIN` : 
                     user.role === 'player' ? '🏏 SQUAD PLAYER' : 'SPECTATOR'}
                  </span>
                </div>
              </div>
              <button className="soc-btn-logout" onClick={logout} title="Sign Out">
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="soc-btn-signin" 
              onClick={() => navigate('/login')}
            >
              <span className="signin-icon">🔑</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
