import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { League, Team } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './PointsTable.css';

interface TeamStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  nrr: number;
  form: ('W' | 'L' | 'T')[];
}

const PointsTable: React.FC = () => {
  const { activeLeagueId } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(activeLeagueId || '');
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTournamentData(selectedLeagueId);
  }, [selectedLeagueId]);

  const fetchLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && data.data.length > 0) {
        setLeagues(data.data);
        if (!selectedLeagueId) {
          setSelectedLeagueId(data.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load leagues in PointsTable:', e);
    }
  };

  const fetchTournamentData = async (leagueId?: string) => {
    try {
      setLoading(true);
      const teamsUrl = leagueId ? `/api/teams?leagueId=${leagueId}` : '/api/teams';
      const matchesUrl = leagueId ? `/api/matches?leagueId=${leagueId}` : '/api/matches';

      const [teamsRes, matchesRes] = await Promise.all([
        fetch(teamsUrl),
        fetch(matchesUrl)
      ]);

      const teamsData: Team[] = await teamsRes.json();
      const matchesJson = await matchesRes.json();
      const matchesData: any[] = matchesJson.data || [];

      if (!Array.isArray(teamsData) || teamsData.length === 0) {
        setStandings([]);
        setLoading(false);
        return;
      }

      // Compute standings dynamically from completed matches
      const computed: TeamStanding[] = teamsData.map(team => {
        let played = 0;
        let won = 0;
        let lost = 0;
        let tied = 0;
        let runsScored = 0;
        let oversFaced = 0;
        let runsConceded = 0;
        let oversBowled = 0;
        const form: ('W' | 'L' | 'T')[] = [];

        matchesData.forEach(m => {
          if (m.status !== 'finished') return;

          const isTeam1 = m.team1_id === team.id || m.team1_name?.toLowerCase() === team.name.toLowerCase();
          const isTeam2 = m.team2_id === team.id || m.team2_name?.toLowerCase() === team.name.toLowerCase();

          if (!isTeam1 && !isTeam2) return;

          played++;
          const myScore = isTeam1 ? (m.team1_score || 0) : (m.team2_score || 0);
          const oppScore = isTeam1 ? (m.team2_score || 0) : (m.team1_score || 0);

          runsScored += myScore;
          runsConceded += oppScore;
          oversFaced += 20; // Normalized 20 overs
          oversBowled += 20;

          if (myScore > oppScore) {
            won++;
            form.push('W');
          } else if (oppScore > myScore) {
            lost++;
            form.push('L');
          } else {
            tied++;
            form.push('T');
          }
        });

        const points = (won * 2) + (tied * 1);
        const nrr = oversFaced > 0 ? ((runsScored / oversFaced) - (runsConceded / oversBowled)) : 0;

        return {
          teamId: team.id,
          teamName: team.name,
          played,
          won,
          lost,
          tied,
          points,
          nrr: parseFloat(nrr.toFixed(3)),
          form: form.slice(-5)
        };
      });

      // Sort by points DESC, then NRR DESC
      computed.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.nrr - a.nrr;
      });

      setStandings(computed);
    } catch (e) {
      console.error('Error computing points table:', e);
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  const activeLeague = leagues.find(l => l.id === selectedLeagueId);

  return (
    <div className="soc-standings-container">
      {/* 1. Header & Controls */}
      <div className="soc-standings-top-bar">
        <div className="standings-headline-group">
          <h2>📊 Tournament Standings & Net Run Rate</h2>
          <p className="standings-subtitle">
            Live points table, qualification thresholds, and recent form telemetry
          </p>
        </div>

        <div className="fixtures-controls-group">
          {leagues.length > 0 && (
            <div className="league-picker-wrapper">
              <label>Tournament:</label>
              <select 
                className="league-picker-select"
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
              >
                {leagues.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Link to="/live-matches" className="soc-btn-create-league">
            🏏 Live Scoresheet
          </Link>
        </div>
      </div>

      {/* 2. Qualification Rule Strip */}
      <div className="soc-qualification-strip">
        <div className="qual-rule-item">
          <span className="qual-indicator-dot dot-finals"></span>
          <span>Rank 1–2: Direct Qualifier to Grand Finals</span>
        </div>
        <div className="qual-rule-item">
          <span className="qual-indicator-dot dot-playoffs"></span>
          <span>Rank 3–4: Eliminator Stage Contenders</span>
        </div>
        <div className="qual-rule-item" style={{ marginLeft: 'auto', color: '#94a3b8' }}>
          <span>Win: +2 Pts • Tied/NR: +1 Pt</span>
        </div>
      </div>

      {/* 3. Loading State */}
      {loading ? (
        <div className="soc-empty-state-card">
          <div className="soc-spinner-pulse"></div>
          <p>CALCULATING TOURNAMENT STANDINGS...</p>
        </div>
      ) : standings.length === 0 ? (
        /* 4. Empty State */
        <div className="soc-empty-state-card">
          <div className="soc-empty-radar-icon">📊</div>
          <h3>NO STANDINGS DATA AVAILABLE</h3>
          <p>
            {leagues.length === 0 
              ? 'No cricket tournament leagues exist yet. Launch a league and register teams to initialize tournament standings.'
              : `No teams are registered under "${activeLeague?.name || 'this league'}". Add squads in League Operations to view the leaderboard.`
            }
          </p>
          <div className="empty-state-actions">
            <Link to="/league-admin" className="soc-btn-create-league">
              ⚡ Open League Operations
            </Link>
            <Link to="/teams" className="soc-btn-primary-sm">
              🛡️ View Squads
            </Link>
          </div>
        </div>
      ) : (
        /* 5. Standings Table */
        <div className="soc-table-glass-wrapper">
          <table className="soc-standings-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Squad / Team</th>
                <th style={{ textAlign: 'center' }}>P</th>
                <th style={{ textAlign: 'center' }}>W</th>
                <th style={{ textAlign: 'center' }}>L</th>
                <th style={{ textAlign: 'center' }}>T/NR</th>
                <th style={{ textAlign: 'center' }}>NRR</th>
                <th style={{ textAlign: 'center' }}>Points</th>
                <th>Recent Form</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => {
                const rank = index + 1;
                const isFinals = rank <= 2;
                const isPlayoffs = rank === 3 || rank === 4;
                const rowClass = isFinals ? 'row-qualified-finals' : isPlayoffs ? 'row-qualified-playoffs' : '';
                const rankBadgeClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

                return (
                  <tr key={team.teamId} className={rowClass}>
                    <td className="col-rank">
                      <span className={`rank-badge-pill ${rankBadgeClass}`}>
                        {rank}
                      </span>
                    </td>
                    <td>
                      <div className="team-entry-cell">
                        <div className="table-team-glyph">
                          {team.teamName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="table-team-name">{team.teamName}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{team.played}</td>
                    <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700 }}>{team.won}</td>
                    <td style={{ textAlign: 'center', color: '#f87171', fontWeight: 600 }}>{team.lost}</td>
                    <td style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 600 }}>{team.tied}</td>
                    <td style={{ textAlign: 'center' }} className={`col-nrr ${team.nrr >= 0 ? 'nrr-positive' : 'nrr-negative'}`}>
                      {team.nrr >= 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'center' }} className="col-pts">
                      {team.points}
                    </td>
                    <td>
                      <div className="form-guide-strip">
                        {team.form.length === 0 ? (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>--</span>
                        ) : (
                          team.form.map((f, fIdx) => (
                            <span 
                              key={fIdx} 
                              className={`form-pill ${f === 'W' ? 'form-w' : f === 'L' ? 'form-l' : 'form-t'}`}
                              title={f === 'W' ? 'Won' : f === 'L' ? 'Lost' : 'Tied'}
                            >
                              {f}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PointsTable;
