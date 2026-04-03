import React, { useState } from 'react';
import './TeamCreation.css';

interface TeamCreationProps {
  onTeamCreated?: (teamData: { teamId: string; captainCode: string; teamName: string }) => void;
}

const TeamCreation: React.FC<TeamCreationProps> = ({ onTeamCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [teamData, setTeamData] = useState<{ teamId: string; captainCode: string; teamName: string } | null>(null);

  // Validation function
  const validateTeamName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    // Check if empty
    if (!trimmedName) {
      return 'Team name is required';
    }
    
    // Check if too short
    if (trimmedName.length < 3) {
      return 'Team name must be at least 3 characters long';
    }
    
    // Check if too long
    if (trimmedName.length > 50) {
      return 'Team name must be less than 50 characters';
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      return 'Team name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    
    return null; // Valid
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = teamName.trim();
    
    // Client-side validation
    const validationError = validateTeamName(teamName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auction/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName: trimmedName }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTeamData(data.data);
        
        // Save to localStorage
        localStorage.setItem('captainCode', data.data.captainCode);
        localStorage.setItem('teamId', data.data.teamId);
        localStorage.setItem('teamName', data.data.teamName);

        // Notify parent component
        if (onTeamCreated) {
          onTeamCreated(data.data);
        }
      } else {
        // Handle specific API errors
        if (data.message === 'Team name already taken') {
          setError('This team name is already taken. Please choose another name.');
        } else if (data.message === 'Team limit reached') {
          setError('Team registration is currently full. Maximum 6 teams allowed.');
        } else {
          setError(data.message || 'Failed to create team');
        }
      }
    } catch (err) {
      setError('Failed to connect to server. Please check your internet connection.');
      console.error('Team creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamName(value);
    
    // Clear error when user starts typing
    if (error && validateTeamName(value) === null) {
      setError('');
    }
  };

  if (success && teamData) {
    return (
      <div className="team-creation-success">
        <div className="success-card">
          <h2>🎉 Team Created Successfully!</h2>
          <div className="team-info">
            <p><strong>Team Name:</strong> {teamData.teamName}</p>
            <p><strong>Your Captain Code:</strong> <span className="captain-code">{teamData.captainCode}</span></p>
          </div>
          <div className="instructions">
            <h3>📝️ Important:</h3>
            <p>Save your captain code securely! You'll need it to place bids during the auction.</p>
            <p>Your code has been automatically saved to this browser.</p>
          </div>
          <button 
            className="create-another-btn"
            onClick={() => {
              setSuccess(false);
              setTeamData(null);
              setTeamName('');
            }}
          >
            Create Another Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team-creation">
      <div className="creation-card">
        <h2>🏏� Create Your Team</h2>
        <p>Enter your team name to get started with the auction</p>
        
        <form onSubmit={handleSubmit} className="team-form">
          <div className="form-group">
            <label htmlFor="teamName">Team Name</label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={handleInputChange}
              placeholder="Enter your team name..."
              required
              disabled={isLoading}
              maxLength={50}
              className={error ? 'error' : ''}
            />
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>

          <div className="validation-info">
            <p className="validation-hint">
              • Minimum 3 characters<br/>
              • Maximum 50 characters<br/>
              • Letters, numbers, spaces, hyphens, and underscores only
            </p>
          </div>

          <button 
            type="submit" 
            className="create-btn"
            disabled={isLoading || !teamName.trim() || validateTeamName(teamName) !== null}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Team...
              </>
            ) : (
              'Create Team'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamCreation;
