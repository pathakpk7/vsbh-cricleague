import React from 'react';
import './Fixtures.css';

const Fixtures: React.FC = () => {
  return (
    <div className="fixtures">
      <div className="dashboard-header">
        <h1>📅 Fixtures</h1>
        <p>Match schedules and results</p>
      </div>

      <div className="notification-container">
        <div className="notification-card">
          <div className="notification-icon">
            🏏
          </div>
          <div className="notification-content">
            <h2>Match Schedule Coming Soon!</h2>
            <p>We will notify you when the matches will be played.</p>
            <p>The tournament fixtures are being finalized and will be announced shortly.</p>
            <div className="notification-actions">
              <button className="notify-btn">
                🔔 Notify Me
              </button>
              <button className="schedule-btn">
                📋 View Tournament Info
              </button>
            </div>
          </div>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">📅</div>
            <h3>Schedule</h3>
            <p>Complete match schedule will be available once teams are finalized</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🏆</div>
            <h3>Tournament Format</h3>
            <p>Round-robin followed by knockout stages</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📍</div>
            <h3>Venues</h3>
            <p>Multiple grounds across the campus</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Fixtures;
