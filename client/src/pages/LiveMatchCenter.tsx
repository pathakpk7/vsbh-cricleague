import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../config/socket';
import { useAuth } from '../contexts/AuthContext';
import { Match, League } from '../types';
import './LiveMatchCenter.css';

const LiveMatchCenter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, activeLeagueId } = useAuth();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(
    searchParams.get('league') || activeLeagueId || ''
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [customStriker, setCustomStriker] = useState('');
  const [customBowler, setCustomBowler] = useState('');
  const [commentaryText, setCommentaryText] = useState('');
  const [documentationNotes, setDocumentationNotes] = useState('');
  const [adminStatus, setAdminStatus] = useState<string | null>(null);

  // New match form state
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    team1_name: '',
    team2_name: '',
    venue: '',
    match_date: ''
  });

  const isLeagueAdmin = user?.role === 'admin' && (
    !user.leagueId || user.leagueId === selectedMatch?.league_id || user.leagueId === selectedLeagueId
  );

  useEffect(() => {
    fetchLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedLeagueId) {
      fetchMatches(selectedLeagueId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueId]);

  useEffect(() => {
    socket.connect();

    socket.on('match-score-update', (updatedMatch: Match) => {
      setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
      setSelectedMatch(prev => prev?.id === updatedMatch.id ? updatedMatch : prev);
    });

    socket.on('match-commentary-update', ({ matchId, commentary }: any) => {
      setSelectedMatch(prev => {
        if (prev && prev.id === matchId) {
          return {
            ...prev,
            commentary: [commentary, ...(prev.commentary || [])]
          };
        }
        return prev;
      });
    });

    socket.on('match-documentation-update', ({ matchId, play_documentation }: any) => {
      setSelectedMatch(prev => {
        if (prev && prev.id === matchId) {
          return {
            ...prev,
            play_documentation
          };
        }
        return prev;
      });
    });

    return () => {
      socket.off('match-score-update');
      socket.off('match-commentary-update');
      socket.off('match-documentation-update');
    };
  }, []);

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
      console.error('Error fetching leagues:', e);
    }
  };

  const fetchMatches = async (leagueId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/matches?leagueId=${leagueId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMatches(data.data);
        if (data.data.length > 0) {
          const liveMatch = data.data.find((m: Match) => m.status === 'live');
          const chosen = liveMatch || data.data[0];
          setSelectedMatch(chosen);
          setDocumentationNotes(chosen.play_documentation || '');
          setCustomStriker(chosen.current_striker || '');
          setCustomBowler(chosen.current_bowler || '');
        } else {
          setSelectedMatch(null);
        }
      }
    } catch (e) {
      console.error('Error fetching matches:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setDocumentationNotes(match.play_documentation || '');
    setCustomStriker(match.current_striker || '');
    setCustomBowler(match.current_bowler || '');
    socket.emit('join-match', { matchId: match.id });
  };

  // Admin Action: Quick Score Runs
  const handleScoreAddRuns = async (runs: number, isWicket: boolean = false) => {
    if (!selectedMatch) return;
    const isTeam1Batting = selectedMatch.current_batting_team_id === selectedMatch.team1_id || !selectedMatch.current_batting_team_id;
    
    const currentScore = isTeam1Batting ? selectedMatch.team1_score : selectedMatch.team2_score;
    const currentWickets = isTeam1Batting ? selectedMatch.team1_wickets : selectedMatch.team2_wickets;
    
    // Calculate new overs
    const currentOversStr = String(isTeam1Batting ? selectedMatch.team1_overs : selectedMatch.team2_overs || '0.0');
    const [ovs, bls] = currentOversStr.split('.').map(n => parseInt(n || '0', 10));
    let nextBalls = (bls || 0) + 1;
    let nextOvers = ovs || 0;
    if (nextBalls >= 6) {
      nextOvers += 1;
      nextBalls = 0;
    }
    const newOversStr = `${nextOvers}.${nextBalls}`;

    const updates: Partial<Match> = isTeam1Batting
      ? {
          team1_score: currentScore + runs,
          team1_wickets: isWicket ? currentWickets + 1 : currentWickets,
          team1_overs: newOversStr,
          status: 'live'
        }
      : {
          team2_score: currentScore + runs,
          team2_wickets: isWicket ? currentWickets + 1 : currentWickets,
          team2_overs: newOversStr,
          status: 'live'
        };

    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedMatch(data.data);

        // Add ball commentary entry
        const commText = isWicket
          ? `WICKET! Dismissal in over ${newOversStr}!`
          : runs === 4
          ? `FOUR! Beautiful boundary struck through the covers!`
          : runs === 6
          ? `SIX! Huge maximum straight down the ground!`
          : `${runs} run(s) added off over ${newOversStr}.`;

        await fetch(`/api/matches/${selectedMatch.id}/commentary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            over: newOversStr,
            runs,
            isWicket,
            text: commText
          })
        });
      }
    } catch (e) {
      console.error('Error updating score:', e);
    }
  };

  // Admin Action: Save Play Documentation
  const handleSaveDocumentation = async () => {
    if (!selectedMatch) return;
    setAdminStatus('Saving play documentation...');
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/documentation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ play_documentation: documentationNotes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminStatus('✅ Play documentation updated live!');
        setSelectedMatch(data.data);
        setTimeout(() => setAdminStatus(null), 3000);
      }
    } catch (e) {
      setAdminStatus('❌ Failed to save documentation');
    }
  };

  // Admin Action: Update Batting & Bowling Players
  const handleUpdatePlayersAndStatus = async (newStatus?: 'upcoming' | 'live' | 'finished') => {
    if (!selectedMatch) return;
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_striker: customStriker,
          current_bowler: customBowler,
          status: newStatus || selectedMatch.status
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedMatch(data.data);
        setAdminStatus('Match details updated!');
        setTimeout(() => setAdminStatus(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Action: Create New Match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeagueId) return;
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id: selectedLeagueId,
          ...newMatchData
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateMatch(false);
        fetchMatches(selectedLeagueId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="match-center-container">
      {/* Header & League Selector */}
      <div className="match-center-header">
        <div className="header-titles">
          <span className="live-pill">🔴 LIVE MATCH CENTER</span>
          <h1>Cricket Match Play & Live Scoring Space</h1>
          <p>Real-time scores, ball-by-ball updates, and match play documentation edited by league admins.</p>
        </div>

        <div className="league-picker-box">
          <label>Select League:</label>
          <select
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
      </div>

      {/* Matches Ribbon */}
      <div className="matches-ribbon">
        <div className="ribbon-scroll">
          {matches.map(m => (
            <div
              key={m.id}
              className={`ribbon-item ${selectedMatch?.id === m.id ? 'active' : ''} ${m.status}`}
              onClick={() => handleSelectMatch(m)}
            >
              <div className="ribbon-status">
                {m.status === 'live' ? '🔴 LIVE' : m.status === 'finished' ? 'FINAL' : 'UPCOMING'}
              </div>
              <div className="ribbon-teams">
                <span>{m.team1_name || 'Team 1'}</span> vs <span>{m.team2_name || 'Team 2'}</span>
              </div>
              <div className="ribbon-scores">
                {m.team1_score}/{m.team1_wickets} ({m.team1_overs} ov)
                {m.team2_overs && ` - ${m.team2_score}/${m.team2_wickets} (${m.team2_overs} ov)`}
              </div>
            </div>
          ))}

          {isLeagueAdmin && (
            <button
              className="btn-add-match-card"
              onClick={() => setShowCreateMatch(!showCreateMatch)}
            >
              + Create Match
            </button>
          )}
        </div>
      </div>

      {showCreateMatch && isLeagueAdmin && (
        <div className="create-match-modal">
          <h3>Create New Match for League</h3>
          <form onSubmit={handleCreateMatch} className="create-match-form">
            <input
              type="text"
              placeholder="Team 1 Name (e.g. Warriors)"
              value={newMatchData.team1_name}
              onChange={e => setNewMatchData({ ...newMatchData, team1_name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Team 2 Name (e.g. Titans)"
              value={newMatchData.team2_name}
              onChange={e => setNewMatchData({ ...newMatchData, team2_name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Venue (e.g. Stadium Pitch 1)"
              value={newMatchData.venue}
              onChange={e => setNewMatchData({ ...newMatchData, venue: e.target.value })}
            />
            <button type="submit" className="btn-primary">Create Match</button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreateMatch(false)}>Cancel</button>
          </form>
        </div>
      )}

      {selectedMatch ? (
        <div className="match-main-grid">
          {/* LEFT COLUMN: LIVE SCORECARD & PLAY DOCUMENTATION */}
          <div className="match-display-column">
            {/* Main Score Hero Card */}
            <div className="score-hero-card">
              <div className="score-hero-header">
                <span className="venue-tag">📍 {selectedMatch.venue || 'Campus Main Ground'}</span>
                <span className={`match-state-badge ${selectedMatch.status}`}>
                  {selectedMatch.status.toUpperCase()}
                </span>
              </div>

              <div className="teams-score-board">
                <div className="team-score-block">
                  <div className="team-name-title">{selectedMatch.team1_name || 'Team 1'}</div>
                  <div className="score-digits">
                    {selectedMatch.team1_score} <span className="wickets-slash">/ {selectedMatch.team1_wickets}</span>
                  </div>
                  <div className="overs-text">({selectedMatch.team1_overs} Overs)</div>
                </div>

                <div className="versus-divider">VS</div>

                <div className="team-score-block">
                  <div className="team-name-title">{selectedMatch.team2_name || 'Team 2'}</div>
                  <div className="score-digits">
                    {selectedMatch.team2_score} <span className="wickets-slash">/ {selectedMatch.team2_wickets}</span>
                  </div>
                  <div className="overs-text">({selectedMatch.team2_overs || '0.0'} Overs)</div>
                </div>
              </div>

              {/* Batsmen & Bowlers strip */}
              <div className="players-live-strip">
                <div className="active-player-box">
                  <span className="label">Striker:</span>
                  <strong>{selectedMatch.current_striker || 'Striker at crease'}</strong>
                </div>
                <div className="active-player-box">
                  <span className="label">Bowler:</span>
                  <strong>{selectedMatch.current_bowler || 'Current Bowler'}</strong>
                </div>
              </div>

              {/* Recent Balls Strip */}
              {selectedMatch.recent_balls && selectedMatch.recent_balls.length > 0 && (
                <div className="recent-balls-row">
                  <span className="recent-label">This Over / Recent:</span>
                  <div className="balls-list">
                    {selectedMatch.recent_balls.map((b, i) => (
                      <span
                        key={i}
                        className={`ball-bubble ${b === 'W' ? 'wicket' : b === '4' || b === '6' ? 'boundary' : ''}`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DEDICATED LIVE PLAY DOCUMENTATION SPACE */}
            <div className="play-documentation-card">
              <div className="doc-card-header">
                <div className="doc-icon">📝</div>
                <div>
                  <h3>Live Match Play Documentation</h3>
                  <p>Documented in real-time by the League Admin as the match unfolds.</p>
                </div>
              </div>

              <div className="doc-body-content">
                {selectedMatch.play_documentation ? (
                  <div className="doc-text-display">
                    {selectedMatch.play_documentation}
                  </div>
                ) : (
                  <div className="doc-empty-state">
                    No play notes documented yet. The league administrator will document live game turning points, strategies, and match analysis here.
                  </div>
                )}
              </div>
            </div>

            {/* Ball-by-ball Commentary Feed */}
            <div className="commentary-card">
              <h3>🎙️ Ball-by-Ball Live Commentary</h3>
              <div className="commentary-feed">
                {selectedMatch.commentary && selectedMatch.commentary.length > 0 ? (
                  selectedMatch.commentary.map((c) => (
                    <div key={c.id} className="commentary-row">
                      <div className="comm-over-badge">Ov {c.over}</div>
                      <div className="comm-text-body">
                        {c.text}
                      </div>
                      {c.isWicket && <span className="comm-event-pill wicket">W</span>}
                      {c.runs === 4 && <span className="comm-event-pill four">4</span>}
                      {c.runs === 6 && <span className="comm-event-pill six">6</span>}
                    </div>
                  ))
                ) : (
                  <p className="no-comm">No commentary entries yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ADMIN LIVE SCORING & DOCUMENTATION CONSOLE */}
          {isLeagueAdmin && (
            <div className="admin-console-column">
              <div className="admin-console-card">
                <div className="admin-console-header">
                  <span className="shield-icon">🛡️</span>
                  <h3>League Admin Live Console</h3>
                  <p>Edit scores & document live play in real-time</p>
                </div>

                {adminStatus && (
                  <div className="admin-status-toast">{adminStatus}</div>
                )}

                {/* Quick Score Buttons */}
                <div className="admin-section-box">
                  <label className="section-title">⚡ Quick Score Increment</label>
                  <div className="quick-buttons-grid">
                    <button className="btn-score-dot" onClick={() => handleScoreAddRuns(0)}>Dot (0)</button>
                    <button className="btn-score-run" onClick={() => handleScoreAddRuns(1)}>+1 Run</button>
                    <button className="btn-score-run" onClick={() => handleScoreAddRuns(2)}>+2 Runs</button>
                    <button className="btn-score-four" onClick={() => handleScoreAddRuns(4)}>+4 FOUR</button>
                    <button className="btn-score-six" onClick={() => handleScoreAddRuns(6)}>+6 SIX</button>
                    <button className="btn-score-wicket" onClick={() => handleScoreAddRuns(0, true)}>⚡ WICKET</button>
                  </div>
                </div>

                {/* Batting & Bowling Form */}
                <div className="admin-section-box">
                  <label className="section-title">🏏 Current Batter & Bowler</label>
                  <div className="input-group">
                    <label>Striker Name & Score</label>
                    <input
                      type="text"
                      placeholder="e.g. Virat Kohli 45*(28)"
                      value={customStriker}
                      onChange={e => setCustomStriker(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Bowler Name & Figures</label>
                    <input
                      type="text"
                      placeholder="e.g. Bumrah 3.2-0-18-2"
                      value={customBowler}
                      onChange={e => setCustomBowler(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-admin-save"
                    onClick={() => handleUpdatePlayersAndStatus()}
                  >
                    Update Batter/Bowler
                  </button>
                </div>

                {/* Live Play Documentation Edit Box */}
                <div className="admin-section-box">
                  <label className="section-title">📝 Edit Live Play Documentation</label>
                  <p className="field-hint">
                    Document live game analysis, pitch behavior, strategy, and turning points. This updates live for all spectators!
                  </p>
                  <textarea
                    rows={6}
                    placeholder="Document live play details, match dynamics, target situation..."
                    value={documentationNotes}
                    onChange={e => setDocumentationNotes(e.target.value)}
                  />
                  <button
                    className="btn-admin-primary"
                    onClick={handleSaveDocumentation}
                  >
                    💾 Save & Broadcast Play Notes
                  </button>
                </div>

                {/* Live Commentary Entry */}
                <div className="admin-section-box">
                  <label className="section-title">🎙️ Add Live Commentary Line</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. Magnificent pull shot for six!"
                      value={commentaryText}
                      onChange={e => setCommentaryText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-admin-save"
                      style={{ width: 'auto', whiteSpace: 'nowrap' }}
                      onClick={async () => {
                        if (!selectedMatch || !commentaryText.trim()) return;
                        try {
                          await fetch(`/api/matches/${selectedMatch.id}/commentary`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              over: String(selectedMatch.team1_overs || '0.0'),
                              runs: 0,
                              isWicket: false,
                              text: commentaryText.trim()
                            })
                          });
                          setCommentaryText('');
                          setAdminStatus('Commentary line posted live!');
                          setTimeout(() => setAdminStatus(null), 2000);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Match Status Toggle */}
                <div className="admin-section-box">
                  <label className="section-title">Status Management</label>
                  <div className="status-buttons-row">
                    <button
                      className={`btn-state ${selectedMatch.status === 'live' ? 'active-live' : ''}`}
                      onClick={() => handleUpdatePlayersAndStatus('live')}
                    >
                      Set LIVE
                    </button>
                    <button
                      className={`btn-state ${selectedMatch.status === 'finished' ? 'active-finished' : ''}`}
                      onClick={() => handleUpdatePlayersAndStatus('finished')}
                    >
                      End Match
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-matches-state">
          <h3>No matches scheduled yet for this league.</h3>
          {isLeagueAdmin && (
            <p>Use the "Create Match" button above to schedule your first match and start live scoring.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMatchCenter;
