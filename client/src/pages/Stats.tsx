import React, { useState, useEffect } from 'react';

import { supabase } from '../config/supabase';
import './Stats.css';

const Stats: React.FC = () => {
  const [hasMatches, setHasMatches] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForMatches();
  }, []);

  const checkForMatches = async () => {
    try {
      setLoading(true);
      
      // Check if there are any completed matches
      const { data: matches, error } = await supabase
        .from('matches')
        .select('id, status')
        .limit(1);

      if (!error && matches && matches.length > 0) {
        setHasMatches(true);
      } else {
        setHasMatches(false);
      }
    } catch (error) {
      console.error('Error checking for matches:', error);
      setHasMatches(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stats">
        <div className="loading-container">
          <div className="stats-loader"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!hasMatches) {
    return (
      <div className="stats">
        <div className="dashboard-header">
          <h1>📈 Statistics</h1>
          <p>Player performance metrics and tournament stats</p>
        </div>

        <div className="empty-stats">
          <div className="stats-empty-state">
            <div className="stats-icon">📊</div>
            <h2>Stats will be available once matches begin</h2>
            <p>Match statistics and player performance data will appear here after the tournament starts.</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <h3>🏏 Top Run Scorers</h3>
            <div className="stats-table">
              <div className="placeholder-content">
                <p>Waiting for match data...</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>🎯 Top Wicket Takers</h3>
            <div className="stats-table">
              <div className="placeholder-content">
                <p>Waiting for match data...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🏆 Tournament Highlights</h3>
          <div className="highlights">
            <div className="placeholder-content">
              <p>Highlights will appear after matches are played...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have matches, show the normal stats (future implementation)
  return (
    <div className="stats">
      <div className="dashboard-header">
        <h1>📈 Statistics</h1>
        <p>Player performance metrics and tournament stats</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>🏏 Top Run Scorers</h3>
          <div className="stats-table">
            <div className="coming-soon">
              <p>Stats will be available after matches</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🎯 Top Wicket Takers</h3>
          <div className="stats-table">
            <div className="coming-soon">
              <p>Stats will be available after matches</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🏆 Tournament Highlights</h3>
        <div className="highlights">
          <div className="coming-soon">
            <p>Highlights will appear after matches are played</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
