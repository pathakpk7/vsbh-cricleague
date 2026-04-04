import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <img src="/logo_vsbh.png" alt="VSBH-CL" className="navbar-logo" />
        </div>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/auction" 
            className={`nav-link ${isActive('/auction') ? 'active' : ''}`}
          >
            Auction
          </Link>
          <Link 
            to="/teams" 
            className={`nav-link ${isActive('/teams') ? 'active' : ''}`}
          >
            Teams
          </Link>
          <Link 
            to="/fixtures" 
            className={`nav-link ${isActive('/fixtures') ? 'active' : ''}`}
          >
            Fixtures
          </Link>
          <Link 
            to="/points-table" 
            className={`nav-link ${isActive('/points-table') ? 'active' : ''}`}
          >
            Points Table
          </Link>
          <Link 
            to="/stats" 
            className={`nav-link ${isActive('/stats') ? 'active' : ''}`}
          >
            Stats
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
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
              <button className="btn btn-secondary logout-btn" onClick={logout}>
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
