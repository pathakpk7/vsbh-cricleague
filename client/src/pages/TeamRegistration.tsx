import React, { useState } from 'react';
import TeamCreation from '../components/TeamCreation';
import './TeamRegistration.css';

const TeamRegistration: React.FC = () => {
  const [currentView, setCurrentView] = useState<'creation' | 'login'>('creation');
  const [hasTeam, setHasTeam] = useState(false);

  React.useEffect(() => {
    // Check if user already has a team in localStorage
    const savedTeamId = localStorage.getItem('teamId');
    const savedCaptainCode = localStorage.getItem('captainCode');
    
    if (savedTeamId && savedCaptainCode) {
      setHasTeam(true);
    }
  }, []);

  const handleTeamCreated = (teamData: { teamId: string; captainCode: string; teamName: string }) => {
    // Team created successfully, show success message
    setHasTeam(true);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('teamId');
    localStorage.removeItem('captainCode');
    localStorage.removeItem('teamName');
    
    setHasTeam(false);
    setCurrentView('creation');
  };

  if (hasTeam) {
    return (
      <div className="team-registration">
        <div className="team-dashboard">
          <div className="dashboard-header">
            <h1>🏆 Team Dashboard</h1>
            <p>Manage your team for the auction</p>
          </div>
          
          <div className="team-status-card">
            <div className="status-header">
              <h2>✅ Team Registered</h2>
              <p>Your team is ready for the auction</p>
            </div>
            
            <div className="team-details">
              <div className="detail-item">
                <label>Team Name:</label>
                <span>{localStorage.getItem('teamName') || 'Unknown'}</span>
              </div>
              
              <div className="detail-item">
                <label>Captain Code:</label>
                <span className="captain-code-display">
                  {localStorage.getItem('captainCode') || 'Unknown'}
                </span>
              </div>
              
              <div className="detail-item">
                <label>Team ID:</label>
                <span className="team-id-display">
                  {localStorage.getItem('teamId') || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="auction-btn"
                onClick={() => window.location.href = '/auction'}
              >
                🎯 Go to Auction
              </button>
              
              <button 
                className="logout-btn"
                onClick={handleLogout}
              >
                🚪 Logout / Create New Team
              </button>
            </div>
            
            <div className="instructions">
              <h3>📋 Next Steps:</h3>
              <ul>
                <li>Save your captain code securely</li>
                <li>Use your captain code to place bids during auction</li>
                <li>Monitor your team budget and player limits</li>
                <li>Good luck in the auction!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-registration">
      <div className="registration-header">
        <h1>🏏 Cricket Auction Registration</h1>
        <p>Create your team to participate in the player auction</p>
      </div>
      
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${currentView === 'creation' ? 'active' : ''}`}
          onClick={() => setCurrentView('creation')}
        >
          🆕 Create Team
        </button>
        <button 
          className={`toggle-btn ${currentView === 'login' ? 'active' : ''}`}
          onClick={() => setCurrentView('login')}
        >
          🔐 Login with Captain Code
        </button>
      </div>

      {currentView === 'creation' ? (
        <TeamCreation onTeamCreated={handleTeamCreated} />
      ) : (
        <CaptainLogin onTeamCreated={handleTeamCreated} />
      )}
    </div>
  );
};

// Captain Login Component
interface CaptainLoginProps {
  onTeamCreated: (teamData: { teamId: string; captainCode: string; teamName: string }) => void;
}

const CaptainLogin: React.FC<CaptainLoginProps> = ({ onTeamCreated }) => {
  const [captainCode, setCaptainCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captainCode.trim()) {
      setError('Captain code is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auction/login-captain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ captainCode: captainCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // Save to localStorage
        localStorage.setItem('captainCode', data.data.captainCode);
        localStorage.setItem('teamId', data.data.teamId);
        localStorage.setItem('teamName', data.data.teamName);

        // Notify parent component
        onTeamCreated(data.data);
      } else {
        setError(data.message || 'Failed to login');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Captain login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="captain-login">
      <div className="login-card">
        <h2>🔐 Captain Login</h2>
        <p>Enter your captain code to access your team</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="captainCode">Captain Code</label>
            <input
              type="text"
              id="captainCode"
              value={captainCode}
              onChange={(e) => setCaptainCode(e.target.value)}
              placeholder="Enter your captain code..."
              required
              disabled={isLoading}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading || !captainCode.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login to Team'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamRegistration;
