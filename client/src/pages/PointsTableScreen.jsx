import React, { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabaseClient';
import './PointsTableScreen.css';

const PointsTableScreen = () => {
  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'A' | 'B'>('all');

  const fetchPointsTable = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch teams and points data
      const [teamsData, pointsData] = await Promise.all([
        supabaseService.getTeams(),
        supabaseService.getPointsTable()
      ]);
      
      // Mock points data if not available from database
      if (!pointsData || pointsData.length === 0) {
        const mockPointsData = generateMockPointsData(teamsData);
        setPointsData(mockPointsData);
      } else {
        setPointsData(pointsData);
      }
    } catch (err) {
      console.error('Error fetching points table:', err);
      setError('Failed to load points table');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPointsTable();
  }, [fetchPointsTable]);

  const generateMockPointsData = (teamsList) => {
    if (!teamsList || teamsList.length === 0) return [];

    // Assign teams to groups (3 teams per group)
    const groupA = teamsList.slice(0, 3);
    const groupB = teamsList.slice(3, 6);

    // Generate mock points data
    const generateTeamPoints = (team, groupId) => {
      const matchesPlayed = Math.floor(Math.random() * 4) + 1; // 1-4 matches
      const wins = Math.floor(Math.random() * (matchesPlayed + 1));
      const losses = matchesPlayed - wins;
      const points = wins * 2; // 2 points per win
      const nrr = (Math.random() * 2 - 1).toFixed(3); // Random NRR between -1 and 1

      return {
        id: team.id,
        team_id: team.id,
        team_name: team.name,
        group: groupId,
        matches_played: matchesPlayed,
        wins,
        losses,
        ties: 0,
        points,
        net_run_rate: parseFloat(nrr)
      };
    };

    const groupAPoints = groupA.map(team => generateTeamPoints(team, 'A'));
    const groupBPoints = groupB.map(team => generateTeamPoints(team, 'B'));

    // Sort by points, then by NRR
    const sortByPoints = (a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.net_run_rate - a.net_run_rate;
    };

    groupAPoints.sort(sortByPoints);
    groupBPoints.sort(sortByPoints);

    return [...groupAPoints, ...groupBPoints];
  };

  const getGroupData = (group) => {
    if (group === 'all') return pointsData;
    return pointsData.filter(team => team.group === group);
  };

  const getQualifiedTeams = () => {
    const groupA = pointsData.filter(team => team.group === 'A').slice(0, 2);
    const groupB = pointsData.filter(team => team.group === 'B').slice(0, 2);
    return [...groupA, ...groupB];
  };

  const getGroupWinner = (group) => {
    const groupData = pointsData.filter(team => team.group === group);
    return groupData.length > 0 ? groupData[0] : null;
  };

  if (loading) {
    return (
      <div className="points-table-screen">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading points table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="points-table-screen">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchPointsTable}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const qualifiedTeams = getQualifiedTeams();
  const groupAWinner = getGroupWinner('A');
  const groupBWinner = getGroupWinner('B');

  return (
    <div className="points-table-screen">
      <div className="points-header">
        <h1>📊 Points Table</h1>
        <p>Tournament standings and qualification status</p>
      </div>

      <div className="qualification-status">
        <div className="qualification-card">
          <h3>🏆 Semi-Final Qualification</h3>
          <div className="qualification-info">
            <p>Top 2 teams from each group qualify for semi-finals</p>
            <div className="qualified-teams">
              <div className="group-qualification">
                <h4>Group A</h4>
                <div className="qualified-list">
                  {qualifiedTeams.filter(t => t.group === 'A').map((team, index) => (
                    <div key={team.id} className="qualified-team">
                      <span className="position">{index + 1}</span>
                      <span className="team-name">{team.team_name}</span>
                      <span className="points">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="group-qualification">
                <h4>Group B</h4>
                <div className="qualified-list">
                  {qualifiedTeams.filter(t => t.group === 'B').map((team, index) => (
                    <div key={team.id} className="qualified-team">
                      <span className="position">{index + 1}</span>
                      <span className="team-name">{team.team_name}</span>
                      <span className="points">{team.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="group-selector">
        <button 
          className={`group-btn ${selectedGroup === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedGroup('all')}
        >
          All Teams
        </button>
        <button 
          className={`group-btn ${selectedGroup === 'A' ? 'active' : ''}`}
          onClick={() => setSelectedGroup('A')}
        >
          Group A
        </button>
        <button 
          className={`group-btn ${selectedGroup === 'B' ? 'active' : ''}`}
          onClick={() => setSelectedGroup('B')}
        >
          Group B
        </button>
      </div>

      <div className="points-table-container">
        <table className="points-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              {selectedGroup !== 'all' && <th>Group</th>}
              <th>Played</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Points</th>
              <th>NRR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {getGroupData(selectedGroup).map((team, index) => {
              const isQualified = qualifiedTeams.some(t => t.team_id === team.team_id);
              const isGroupWinner = team.group === 'A' ? 
                groupAWinner?.team_id === team.team_id : 
                groupBWinner?.team_id === team.team_id;

              return (
                <tr key={team.id} className={isQualified ? 'qualified' : ''}>
                  <td className="position">
                    {index + 1}
                    {isGroupWinner && <span className="crown">👑</span>}
                  </td>
                  <td className="team-name">
                    {team.team_name}
                    {isGroupWinner && <span className="winner-badge">Winner</span>}
                  </td>
                  {selectedGroup !== 'all' && <td className="group">{team.group}</td>}
                  <td>{team.matches_played}</td>
                  <td className="wins">{team.wins}</td>
                  <td className="losses">{team.losses}</td>
                  <td className="points">{team.points}</td>
                  <td className={`nrr ${team.net_run_rate >= 0 ? 'positive' : 'negative'}`}>
                    {team.net_run_rate >= 0 ? '+' : ''}{team.net_run_rate}
                  </td>
                  <td>
                    {isQualified ? (
                      <span className="status qualified-status">🏆 Qualified</span>
                    ) : (
                      <span className="status eliminated-status">❌ Eliminated</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {getGroupData(selectedGroup).length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Data Available</h3>
          <p>No points data available for this group</p>
        </div>
      )}

      <div className="tournament-bracket">
        <h3>🏆 Tournament Path</h3>
        <div className="bracket-diagram">
          <div className="group-stage">
            <h4>Group Stage</h4>
            <div className="groups">
              <div className="group">
                <h5>Group A</h5>
                <div className="teams">
                  {pointsData.filter(t => t.group === 'A').slice(0, 3).map(team => (
                    <div key={team.id} className={`bracket-team ${qualifiedTeams.some(t => t.team_id === team.team_id) ? 'qualified' : ''}`}>
                      {team.team_name}
                    </div>
                  ))}
                </div>
              </div>
              <div className="group">
                <h5>Group B</h5>
                <div className="teams">
                  {pointsData.filter(t => t.group === 'B').slice(0, 3).map(team => (
                    <div key={team.id} className={`bracket-team ${qualifiedTeams.some(t => t.team_id === team.team_id) ? 'qualified' : ''}`}>
                      {team.team_name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="arrow">→</div>

          <div className="semi-finals">
            <h4>Semi-Finals</h4>
            <div className="semi-final-matches">
              <div className="match">
                <div className="team-slot">A1</div>
                <span>VS</span>
                <div className="team-slot">B2</div>
              </div>
              <div className="match">
                <div className="team-slot">B1</div>
                <span>VS</span>
                <div className="team-slot">A2</div>
              </div>
            </div>
          </div>

          <div className="arrow">→</div>

          <div className="final">
            <h4>Final</h4>
            <div className="final-match">
              <div className="team-slot">SF1 Winner</div>
              <span>VS</span>
              <div className="team-slot">SF2 Winner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsTableScreen;
