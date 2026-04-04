import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <button 
            className="hamburger-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
            <span className={menuOpen ? 'open' : ''}></span>
          </button>
          <div className="navbar-brand">
            <img src="/logo_vsbh.png" alt="VSBH-CL" className="navbar-logo" />
          </div>
        </div>
        
        <div className={`navbar-links ${menuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Dashboard
          </Link>
          <Link 
            to="/auction" 
            className={`nav-link ${isActive('/auction') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Auction
          </Link>
          <Link 
            to="/teams" 
            className={`nav-link ${isActive('/teams') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Teams
          </Link>
          <Link 
            to="/fixtures" 
            className={`nav-link ${isActive('/fixtures') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Fixtures
          </Link>
          <Link 
            to="/points-table" 
            className={`nav-link ${isActive('/points-table') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Points Table
          </Link>
          <Link 
            to="/stats" 
            className={`nav-link ${isActive('/stats') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            Stats
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            History
          </Link>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.role === 'admin' ? 'Admin' : 
                   user.role === 'captain' ? 'Captain' : 'Player'}
                </span>
              </div>
              <button className="btn btn-logout" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
