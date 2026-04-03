import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Team } from '../types';
import './Teams.css';

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await supabase
        .from('teams')
        .select(`
          *,
          team_players (
            player_id,
            sold_price,
            players (
              id,
              name,
              role,
              base_price
            )
          )
        `);

      if (data) {
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading teams...</div>;
  }

  return (
    <div className="teams">
      <div className="dashboard-header">
        <h1>🏆 Teams</h1>
        <p>Manage your cricket league teams</p>
      </div>

      <div className="grid grid-2">
        {teams.map(team => (
          <div key={team.id} className={`card team-${team.name.toLowerCase()}`}>
            <div className="team-header">
              <h2>{team.name}</h2>
              <div className="team-budget">Budget: ₹{team.budget}</div>
            </div>
            
            <div className="team-stats">
              <div>Players: {team.team_players?.length || 0}/11</div>
              <div>Total Spent: ₹{team.team_players?.reduce((sum, tp) => sum + tp.sold_price, 0) || 0}</div>
            </div>

            <div className="players-list">
              <h4>Players</h4>
              {team.team_players?.map(tp => (
                <div key={tp.player_id} className="player-item">
                  <span>{tp.players?.name}</span>
                  <span>{tp.players?.role}</span>
                  <span>{tp.players?.college_id}</span>
                  <span>₹{tp.sold_price}</span>
                  <span className="picked-by">By: {tp.picked_by}</span>
                </div>
              ))}
              {(!team.team_players || team.team_players.length === 0) && (
                <p>No players yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teams;
