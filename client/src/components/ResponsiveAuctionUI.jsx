import React, { useState, useEffect } from 'react';
import './ResponsiveAuctionUI.css';

const ResponsiveAuctionUI = ({ 
  children, 
  breakpoint = 768,
  mobileLayout = 'vertical' 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < breakpoint;
      setIsMobile(mobile);
      
      if (width < 480) {
        setScreenSize('mobile');
      } else if (width < 768) {
        setScreenSize('tablet');
      } else if (width < 1024) {
        setScreenSize('tablet-landscape');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  const getLayoutClasses = () => {
    const classes = ['responsive-auction-ui'];
    
    if (isMobile) {
      classes.push('mobile-layout');
      classes.push(`mobile-${screenSize}`);
    } else {
      classes.push('desktop-layout');
      classes.push(`desktop-${screenSize}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={getLayoutClasses()}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <div className="mobile-title">Auction</div>
          <div className="mobile-status">
            <span className="status-dot"></span>
            Live
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="auction-content">
        {children}
      </div>
      
      {/* Mobile Footer */}
      {isMobile && (
        <div className="mobile-footer">
          <div className="footer-info">
            <span className="info-item">Players: 8/11</span>
            <span className="info-item">Purse: ₹350</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive Layout Wrapper
export const ResponsiveLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Mobile Layout - Vertical Stack
    return (
      <div className="mobile-auction-layout">
        {/* Auction Panel - Top */}
        <div className="mobile-auction-panel">
          {children.find(child => child.type?.displayName === 'AuctionPanel')}
        </div>
        
        {/* Team Panel - Below */}
        <div className="mobile-team-panel">
          {children.find(child => child.type?.displayName === 'TeamPanel')}
        </div>
      </div>
    );
  }

  // Desktop Layout - Side by Side
  return (
    <div className="desktop-auction-layout">
      {children}
    </div>
  );
};

// Responsive Auction Panel
export const ResponsiveAuctionPanel = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`responsive-auction-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile Specific Elements */}
      {isMobile && (
        <div className="mobile-auction-header">
          <div className="current-player-mobile">
            <div className="player-avatar">🏏</div>
            <div className="player-info">
              <div className="player-name">John Doe</div>
              <div className="player-role">Batter</div>
            </div>
          </div>
          
          <div className="mobile-bid-display">
            <div className="bid-amount">₹150</div>
            <div className="bid-team">Team 1</div>
          </div>
        </div>
      )}
      
      {/* Main Auction Content */}
      <div className="auction-panel-content">
        {children}
      </div>
      
      {/* Mobile Action Bar */}
      {isMobile && (
        <div className="mobile-action-bar">
          <div className="mobile-timer">
            <div className="timer-display">0:25</div>
            <div className="timer-bar">
              <div className="timer-fill" style={{ width: '83%' }}></div>
            </div>
          </div>
          
          <div className="mobile-bid-actions">
            <button className="mobile-bid-btn primary">
              <span className="btn-icon">💰</span>
              <span className="btn-text">Bid</span>
            </button>
            <button className="mobile-skip-btn secondary">
              <span className="btn-icon">⏭️</span>
              <span className="btn-text">Skip</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive Team Panel
export const ResponsiveTeamPanel = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`responsive-team-panel ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Mobile Team Header */}
      {isMobile && (
        <div className="mobile-team-header">
          <div className="team-info">
            <div className="team-name">Your Team</div>
            <div className="team-badge">MW</div>
          </div>
          
          <div className="team-purse">
            <div className="purse-label">PURSE</div>
            <div className="purse-amount">₹350</div>
          </div>
        </div>
      )}
      
      {/* Team Content */}
      <div className="team-panel-content">
        {children}
      </div>
      
      {/* Mobile Role Summary */}
      {isMobile && (
        <div className="mobile-role-summary">
          <div className="role-item">
            <span className="role-icon">🏏</span>
            <span className="role-count">3/5</span>
          </div>
          <div className="role-item">
            <span className="role-icon">⚾</span>
            <span className="role-count">2/5</span>
          </div>
          <div className="role-item">
            <span className="role-icon">🧤</span>
            <span className="role-count">1/1</span>
          </div>
          <div className="role-item">
            <span className="role-icon">⭐</span>
            <span className="role-count">2/3</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Responsive Button Component
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  fullWidth = false,
  icon = null,
  onClick,
  disabled = false,
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getButtonClasses = () => {
    const classes = ['responsive-button'];
    
    classes.push(variant);
    classes.push(size);
    
    if (isMobile) classes.push('mobile');
    if (fullWidth) classes.push('full-width');
    if (disabled) classes.push('disabled');
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  return (
    <button
      className={getButtonClasses()}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      <span className="button-text">{children}</span>
    </button>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  columns = { desktop: 2, tablet: 1, mobile: 1 },
  gap = 16 
}) => {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize('mobile');
      else if (width < 768) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getColumns = () => {
    switch (screenSize) {
      case 'mobile': return columns.mobile || 1;
      case 'tablet': return columns.tablet || 1;
      default: return columns.desktop || 2;
    }
  };

  return (
    <div 
      className="responsive-grid"
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {children}
    </div>
  );
};

// Responsive Text Component
export const ResponsiveText = ({ 
  children, 
  variant = 'body',
  as: Component = 'span',
  className = ''
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getTextClasses = () => {
    const classes = ['responsive-text', variant];
    
    if (isMobile) classes.push('mobile');
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  return (
    <Component className={getTextClasses()}>
      {children}
    </Component>
  );
};

// Responsive Container
export const ResponsiveContainer = ({ 
  children, 
  maxWidth = '1200px',
  padding = { desktop: 20, tablet: 16, mobile: 12 }
}) => {
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize('mobile');
      else if (width < 768) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getPadding = () => {
    switch (screenSize) {
      case 'mobile': return padding.mobile || 12;
      case 'tablet': return padding.tablet || 16;
      default: return padding.desktop || 20;
    }
  };

  return (
    <div 
      className="responsive-container"
      style={{
        maxWidth: maxWidth,
        padding: `0 ${getPadding()}px`
      }}
    >
      {children}
    </div>
  );
};

// Hook for responsive utilities
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      if (width < 480) setScreenSize('mobile');
      else if (width < 768) setScreenSize('tablet');
      else if (width < 1024) setScreenSize('tablet-landscape');
      else setScreenSize('desktop');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
};

export default ResponsiveAuctionUI;
