import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { League } from '../types';
import { 
  CricketIcon, 
  TargetIcon, 
  LightningIcon, 
  GloveIcon, 
  TrophyIcon, 
  RocketIcon, 
  SpinIcon, 
  ClockIcon, 
  CalendarIcon, 
  GavelIcon, 
  CoinsIcon, 
  CheckIcon, 
  PlusIcon, 
  AlertTriangleIcon 
} from '../components/Icons';
import './PlayerRegistration.css';

const PlayerRegistration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setActiveLeagueId } = useAuth();

  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [leagueCode, setLeagueCode] = useState(searchParams.get('league') || '');
  const [leagueInfo, setLeagueInfo] = useState<League | null>(null);
  const [isVerifyingLeague, setIsVerifyingLeague] = useState(false);
  const [leagueError, setLeagueError] = useState<string | null>(null);
  const [showCustomCode, setShowCustomCode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'batter' as 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper',
    department: '',
    college_id: '',
    year: '3rd',
    base_price: 10,
    password: '',
    is_available: true,
    // Detailed cricket playing style specs
    batting_hand: 'right' as 'right' | 'left',
    batting_position: 'middle-order' as 'opener' | 'top-order' | 'middle-order' | 'finisher' | 'wk-batter',
    bowling_arm: 'right' as 'right' | 'left',
    bowling_category: 'pace' as 'pace' | 'spin',
    bowling_type: 'fast-medium',
    allrounder_type: 'batting-allrounder' as 'batting-allrounder' | 'bowling-allrounder',
    is_wicketkeeper: false,
    experience_level: 'Hostel League',
    jersey_number: '',
    special_skills: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fetch open leagues on component mount
  useEffect(() => {
    fetchOpenLeagues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOpenLeagues = async () => {
    try {
      const res = await fetch('/api/leagues');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setAllLeagues(data.data);
        const queryLeague = searchParams.get('league');
        if (queryLeague) {
          const match = data.data.find(
            (l: League) => l.code?.toUpperCase() === queryLeague.toUpperCase() || l.id === queryLeague
          );
          if (match) {
            selectLeague(match);
            return;
          }
        }
        // Auto-select open league or first available league
        const defaultOpen = data.data.find((l: League) => l.registration_status === 'open') || data.data[0];
        if (defaultOpen) {
          selectLeague(defaultOpen);
        }
      }
    } catch (e) {
      console.error('Error fetching leagues:', e);
    }
  };

  const selectLeague = (league: League) => {
    setLeagueInfo(league);
    setLeagueCode(league.code);
    setActiveLeagueId(league.id);
    setLeagueError(null);
  };

  const verifyLeagueCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsVerifyingLeague(true);
    setLeagueError(null);
    try {
      const res = await fetch(`/api/leagues/${codeToVerify.trim()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        selectLeague(data.data);
        setShowCustomCode(false);
      } else {
        setLeagueInfo(null);
        setLeagueError(data.message || 'Invalid League Key. Please verify with tournament organizer.');
      }
    } catch (err: any) {
      setLeagueError('Could not verify league key. Please check connection.');
    } finally {
      setIsVerifyingLeague(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRoleSelect = (role: 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper') => {
    setFormData(prev => {
      let updated = { ...prev, role };
      if (role === 'batter') {
        updated.is_wicketkeeper = false;
        if (updated.batting_position === 'wk-batter') updated.batting_position = 'middle-order';
      } else if (role === 'bowler') {
        updated.is_wicketkeeper = false;
        updated.bowling_category = prev.bowling_category || 'pace';
        updated.bowling_type = prev.bowling_type || (updated.bowling_category === 'spin' ? 'off-spin' : 'fast-medium');
      } else if (role === 'wicketkeeper') {
        updated.is_wicketkeeper = true;
        updated.batting_position = 'wk-batter';
      } else if (role === 'all-rounder') {
        updated.is_wicketkeeper = false;
        updated.allrounder_type = prev.allrounder_type || 'batting-allrounder';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueInfo) {
      setErrorMessage('Please select a valid tournament league first.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Full Name and Email Address are required.');
      return;
    }

    if (!formData.is_available) {
      setErrorMessage('Please confirm your availability for the auction.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/player-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueCode: leagueInfo.code,
          ...formData
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitSuccess(data.data);
      } else {
        setErrorMessage(data.message || 'Player registration failed');
      }
    } catch (err: any) {
      setErrorMessage('Network error during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="player-reg-container">
      <div className="player-reg-card">
        <div className="player-reg-header">
          <span className="badge-tag"><LightningIcon size={13} color="#00f0ff" style={{ marginRight: 4 }} /> Fast Track Cricket Registration</span>
          <h2><CricketIcon size={24} color="#00f0ff" style={{ marginRight: 8 }} /> League Player Registration</h2>
          <p>Register your profile and tactical cricket playing style for the upcoming auction in under 30 seconds.</p>
        </div>

        {submitSuccess ? (
          <div className="registration-success-card">
            <div className="success-icon"><CheckIcon size={44} color="#10b981" /></div>
            <h3>Registration Confirmed!</h3>
            <p>You are officially registered for the auction in <strong>{submitSuccess.league?.name}</strong>.</p>

            <div className="player-summary-box">
              <div><strong>Player Name:</strong> {submitSuccess.player?.name}</div>
              <div><strong>Primary Role:</strong> {submitSuccess.player?.role?.toUpperCase()}</div>
              <div>
                <strong>Batting Profile:</strong> {submitSuccess.player?.batting_hand?.toUpperCase()} Hand ({submitSuccess.player?.batting_position?.toUpperCase() || 'MIDDLE ORDER'})
              </div>
              {(submitSuccess.player?.role === 'bowler' || submitSuccess.player?.role === 'all-rounder') && (
                <div>
                  <strong>Bowling Profile:</strong> {submitSuccess.player?.bowling_arm?.toUpperCase()} Arm {submitSuccess.player?.bowling_category?.toUpperCase()} ({submitSuccess.player?.bowling_type})
                </div>
              )}
              {submitSuccess.player?.allrounder_type && (
                <div><strong>All-Rounder Type:</strong> {submitSuccess.player?.allrounder_type === 'batting-allrounder' ? 'Batting All-Rounder' : 'Bowling All-Rounder'}</div>
              )}
              {submitSuccess.player?.is_wicketkeeper && (
                <div><strong>Wicketkeeper:</strong> <GloveIcon size={14} color="#10b981" style={{ marginRight: 4 }} /> Designated Wicketkeeper</div>
              )}
              <div><strong>Base Price:</strong> ₹{submitSuccess.player?.base_price}</div>
              
              {/* Registration Timestamp & Auction Schedule */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <strong><ClockIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Registered At:</strong>{' '}
                <span style={{ color: '#00f0ff' }}>
                  {submitSuccess.player?.registered_at 
                    ? new Date(submitSuccess.player.registered_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <strong><GavelIcon size={14} color="#a7f3d0" style={{ marginRight: 4 }} /> Scheduled Auction:</strong>{' '}
                <span style={{ color: '#a7f3d0' }}>
                  {submitSuccess.league?.auction_date_time
                    ? new Date(submitSuccess.league.auction_date_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                    : 'To be declared by tournament admin'}
                </span>
              </div>
              <div><strong>League Code:</strong> {submitSuccess.league?.code}</div>
            </div>

            <div className="success-actions">
              <button className="btn-primary" onClick={() => navigate(`/auction?league=${submitSuccess.league?.id}`)}>
                <GavelIcon size={16} color="#000" style={{ marginRight: 6 }} /> Go to Live Auction Arena
              </button>
              <button className="btn-secondary" onClick={() => { setSubmitSuccess(null); }}>
                <PlusIcon size={16} color="#00f0ff" style={{ marginRight: 6 }} /> Register Another Player
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="player-reg-form">
            {/* STEP 1: Fast Tournament Selection & Schedule Display */}
            <div className="form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>1. Select Cricket Tournament</h3>
                <button
                  type="button"
                  onClick={() => setShowCustomCode(!showCustomCode)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  {showCustomCode ? 'Choose from list' : 'Have a custom league key?'}
                </button>
              </div>

              {showCustomCode ? (
                <div className="league-verify-input-group" style={{ marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Enter League Key (e.g. VSBH-XXXX)"
                    value={leagueCode}
                    onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    onClick={() => verifyLeagueCode(leagueCode)}
                    disabled={isVerifyingLeague || !leagueCode}
                    className="btn-verify"
                  >
                    {isVerifyingLeague ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              ) : (
                allLeagues.length > 0 && (
                  <div className="tournament-picker-row">
                    {allLeagues.map((l) => (
                      <div
                        key={l.id}
                        className={`tournament-pick-card ${leagueInfo?.id === l.id ? 'active' : ''}`}
                        onClick={() => selectLeague(l)}
                      >
                        <div className="t-name"><TrophyIcon size={14} color="#facc15" style={{ marginRight: 6 }} />{l.name}</div>
                        <div className="t-code">Key: {l.code}</div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {leagueError && (
                <div className="league-error-banner" style={{ marginBottom: '14px' }}>
                  <AlertTriangleIcon size={14} color="#ef4444" style={{ marginRight: 6 }} />{leagueError}
                </div>
              )}

              {/* Tournament Schedule & Deadline Banner */}
              {leagueInfo && (
                <div className="schedule-banner-box">
                  <div className="schedule-banner-header">
                    <span className="tournament-name-tag"><TrophyIcon size={14} color="#facc15" style={{ marginRight: 6 }} />{leagueInfo.name}</span>
                    <span className={`status-pill ${leagueInfo.registration_status}`}>
                      {leagueInfo.registration_status === 'open' ? 'Registration Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="schedule-grid-pills">
                    <div className="schedule-pill-item">
                      <div className="pill-label"><CalendarIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Registration Deadline</div>
                      <div className="pill-val">
                        {leagueInfo.registration_deadline
                          ? new Date(leagueInfo.registration_deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Open until auction date'}
                      </div>
                    </div>

                    <div className="schedule-pill-item">
                      <div className="pill-label"><GavelIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Auction Date & Time</div>
                      <div className="pill-val">
                        {leagueInfo.auction_date_time
                          ? new Date(leagueInfo.auction_date_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'To be announced'}
                      </div>
                    </div>

                    <div className="schedule-pill-item">
                      <div className="pill-label"><CoinsIcon size={14} color="#00f0ff" style={{ marginRight: 4 }} /> Team Purse / Squad Limit</div>
                      <div className="pill-val">
                        ₹{leagueInfo.default_team_purse || 100} Cr • Max {leagueInfo.max_players_per_team || 15} Players
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Basic Contact & Identity */}
            <div className="form-section">
              <h3>2. Player Identity</h3>
              <p className="section-hint">Only Name and Email are strictly required. Everything else is quick and optional.</p>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Virat Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="player@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Department / Branch (Optional)</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. CS / Mechanical / ECE"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>College Roll No / ID (Optional)</label>
                  <input
                    type="text"
                    name="college_id"
                    placeholder="e.g. 2024-CS-042"
                    value={formData.college_id}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Academic Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="Alumni">Alumni / Staff</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Base Price (₹)</label>
                  <input
                    type="number"
                    name="base_price"
                    min="5"
                    step="5"
                    value={formData.base_price}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Jersey Number (Optional)</label>
                  <input
                    type="number"
                    name="jersey_number"
                    placeholder="e.g. 7 or 18"
                    value={formData.jersey_number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Cricket Playing Profile & Tactical Specs */}
            <div className="form-section">
              <h3>3. Cricket Playing Style & Specs</h3>
              <p className="section-hint">Select how you play so captains can bid accurately for your category pool.</p>

              {/* 1-Click Role Selector Tabs */}
              <div className="role-selector-cards">
                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'batter' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('batter')}
                >
                  <span className="role-icon"><CricketIcon size={22} color="#00f0ff" /></span>
                  <div className="role-label">Batter</div>
                  <small>Pure Batsman</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'bowler' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('bowler')}
                >
                  <span className="role-icon"><TargetIcon size={22} color="#f59e0b" /></span>
                  <div className="role-label">Bowler</div>
                  <small>Pace / Spin</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'all-rounder' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('all-rounder')}
                >
                  <span className="role-icon"><LightningIcon size={22} color="#a855f7" /></span>
                  <div className="role-label">All-Rounder</div>
                  <small>Bat & Bowl</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'wicketkeeper' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('wicketkeeper')}
                >
                  <span className="role-icon"><GloveIcon size={22} color="#10b981" /></span>
                  <div className="role-label">Wicketkeeper</div>
                  <small>WK-Batter</small>
                </button>
              </div>

              {/* TACTICAL PILL SELECTORS */}
              <div className="cricket-style-details-box" style={{ marginTop: '16px' }}>
                {/* 1. BATTER SPECS */}
                {formData.role === 'batter' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading"><CricketIcon size={18} color="#00f0ff" style={{ marginRight: 6 }} />Batsman Profile</div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Batting Hand:</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'right' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'right' })}
                        >
                          <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} />Right-Hand Bat (RHB)
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'left' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'left' })}
                        >
                          <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} />Left-Hand Bat (LHB)
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Batting Position:</label>
                      <div className="fast-pill-btn-group">
                        {[
                          { id: 'opener', label: 'Opener (Powerplay)' },
                          { id: 'top-order', label: 'Top Order (No. 3)' },
                          { id: 'middle-order', label: 'Middle Order' },
                          { id: 'finisher', label: 'Finisher (Death Overs)' }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            type="button"
                            className={`fast-pill-btn ${formData.batting_position === pos.id ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, batting_position: pos.id as any })}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="checkbox-subgroup">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_wicketkeeper"
                          checked={formData.is_wicketkeeper}
                          onChange={handleInputChange}
                        />
                        <span><GloveIcon size={14} color="#10b981" style={{ marginRight: 4 }} /> Can also perform Wicketkeeping duties</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. BOWLER SPECS */}
                {formData.role === 'bowler' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading"><TargetIcon size={18} color="#f59e0b" style={{ marginRight: 6 }} />Bowler Profile</div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Bowling Category:</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.bowling_category === 'pace' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, bowling_category: 'pace', bowling_type: 'fast-medium' })}
                        >
                          <RocketIcon size={14} color="#f59e0b" style={{ marginRight: 6 }} />Fast / Pace Bowling
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.bowling_category === 'spin' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, bowling_category: 'spin', bowling_type: 'off-spin' })}
                        >
                          <SpinIcon size={14} color="#38bdf8" style={{ marginRight: 6 }} />Spin Bowling
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Bowling Arm:</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.bowling_arm === 'right' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, bowling_arm: 'right' })}
                        >
                          Right-Arm
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.bowling_arm === 'left' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, bowling_arm: 'left' })}
                        >
                          Left-Arm
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        {formData.bowling_category === 'pace' ? 'Pace Type:' : 'Spin Type:'}
                      </label>
                      <div className="fast-pill-btn-group">
                        {formData.bowling_category === 'pace' ? (
                          [
                            { id: 'fast', label: 'Express Fast' },
                            { id: 'fast-medium', label: 'Fast-Medium (Swing)' },
                            { id: 'medium-fast', label: 'Medium-Fast (Seam)' },
                            { id: 'medium', label: 'Medium Pace' }
                          ].map(b => (
                            <button
                              key={b.id}
                              type="button"
                              className={`fast-pill-btn ${formData.bowling_type === b.id ? 'active' : ''}`}
                              onClick={() => setFormData({ ...formData, bowling_type: b.id })}
                            >
                              {b.label}
                            </button>
                          ))
                        ) : (
                          [
                            { id: 'off-spin', label: 'Off-Spin (Finger)' },
                            { id: 'leg-spin', label: 'Leg-Spin (Wrist)' },
                            { id: 'orthodox', label: 'Left-Arm Orthodox' },
                            { id: 'chinaman', label: 'Left-Arm Chinaman' }
                          ].map(b => (
                            <button
                              key={b.id}
                              type="button"
                              className={`fast-pill-btn ${formData.bowling_type === b.id ? 'active' : ''}`}
                              onClick={() => setFormData({ ...formData, bowling_type: b.id })}
                            >
                              {b.label}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Batting Hand (Tailender):</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'right' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'right' })}
                        >
                          Right-Hand Bat
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'left' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'left' })}
                        >
                          Left-Hand Bat
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ALL-ROUNDER SPECS */}
                {formData.role === 'all-rounder' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading"><LightningIcon size={18} color="#a855f7" style={{ marginRight: 6 }} />All-Rounder Profile</div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Primary Dominance:</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.allrounder_type === 'batting-allrounder' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, allrounder_type: 'batting-allrounder' })}
                        >
                          <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} />Batting All-Rounder (Batsman who bowls)
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.allrounder_type === 'bowling-allrounder' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, allrounder_type: 'bowling-allrounder' })}
                        >
                          <TargetIcon size={14} color="#f59e0b" style={{ marginRight: 6 }} />Bowling All-Rounder (Bowler who bats)
                        </button>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Batting Hand</label>
                        <select
                          name="batting_hand"
                          value={formData.batting_hand}
                          onChange={handleInputChange}
                        >
                          <option value="right">Right-Hand Bat</option>
                          <option value="left">Left-Hand Bat</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Batting Position</label>
                        <select
                          name="batting_position"
                          value={formData.batting_position}
                          onChange={handleInputChange}
                        >
                          <option value="opener">Opener</option>
                          <option value="top-order">Top Order</option>
                          <option value="middle-order">Middle Order</option>
                          <option value="finisher">Finisher</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Category</label>
                        <select
                          name="bowling_category"
                          value={formData.bowling_category}
                          onChange={(e) => {
                            const cat = e.target.value as 'pace' | 'spin';
                            setFormData({
                              ...formData,
                              bowling_category: cat,
                              bowling_type: cat === 'pace' ? 'fast-medium' : 'off-spin'
                            });
                          }}
                        >
                          <option value="pace">Pace / Fast</option>
                          <option value="spin">Spin</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Arm</label>
                        <select
                          name="bowling_arm"
                          value={formData.bowling_arm}
                          onChange={handleInputChange}
                        >
                          <option value="right">Right-Arm</option>
                          <option value="left">Left-Arm</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WICKETKEEPER SPECS */}
                {formData.role === 'wicketkeeper' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading"><GloveIcon size={18} color="#10b981" style={{ marginRight: 6 }} />Wicketkeeper Profile</div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Batting Hand:</label>
                      <div className="fast-pill-btn-group">
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'right' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'right' })}
                        >
                          <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} />Right-Hand Bat (RHB)
                        </button>
                        <button
                          type="button"
                          className={`fast-pill-btn ${formData.batting_hand === 'left' ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, batting_hand: 'left' })}
                        >
                          <CricketIcon size={14} color="#00f0ff" style={{ marginRight: 6 }} />Left-Hand Bat (LHB)
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Batting Position:</label>
                      <div className="fast-pill-btn-group">
                        {[
                          { id: 'opener', label: 'WK-Opener' },
                          { id: 'top-order', label: 'WK-Top Order (3)' },
                          { id: 'middle-order', label: 'WK-Middle Order' },
                          { id: 'finisher', label: 'WK-Finisher' }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            type="button"
                            className={`fast-pill-btn ${formData.batting_position === pos.id ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, batting_position: pos.id as any })}
                          >
                            {pos.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths & Skills */}
                <div style={{ marginTop: '14px' }}>
                  <label style={{ fontSize: '13px', color: '#cbd5e1' }}>Special Strengths / Playing Notes (Optional):</label>
                  <input
                    type="text"
                    name="special_skills"
                    placeholder="e.g. Powerplay hitter, death-overs yorkers, agile slip catcher"
                    value={formData.special_skills}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginTop: '6px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STEP 4: Availability Confirmation */}
            <div className="form-section">
              <h3>4. Availability Confirmation</h3>
              <div className="availability-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                  />
                  <span>
                    <strong>I confirm my availability to play in {leagueInfo?.name || 'this tournament'}</strong>
                    <br />
                    <small>Team captains will evaluate your profile and bid to pick you during the live auction.</small>
                  </span>
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="form-error-alert">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn-submit-reg"
              disabled={!leagueInfo || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LightningIcon size={16} color="#000" style={{ marginRight: 6 }} />
                  Registering Player...
                </>
              ) : (
                <>
                  <LightningIcon size={16} color="#000" style={{ marginRight: 6 }} />
                  Submit Registration Instantly
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlayerRegistration;
