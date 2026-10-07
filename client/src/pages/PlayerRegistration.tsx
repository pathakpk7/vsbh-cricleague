import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { League } from '../types';
import './PlayerRegistration.css';

const PlayerRegistration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setActiveLeagueId } = useAuth();

  const [leagueCode, setLeagueCode] = useState(searchParams.get('league') || '');
  const [leagueInfo, setLeagueInfo] = useState<League | null>(null);
  const [isVerifyingLeague, setIsVerifyingLeague] = useState(false);
  const [leagueError, setLeagueError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'all-rounder' as 'batter' | 'bowler' | 'all-rounder' | 'wicketkeeper',
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
    experience_level: 'College Team',
    jersey_number: '',
    special_skills: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-verify if code passed in URL
  useEffect(() => {
    if (leagueCode) {
      verifyLeagueCode(leagueCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyLeagueCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsVerifyingLeague(true);
    setLeagueError(null);
    try {
      const res = await fetch(`/api/leagues/${codeToVerify.trim()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLeagueInfo(data.data);
        setActiveLeagueId(data.data.id);
      } else {
        setLeagueInfo(null);
        setLeagueError(data.message || 'Invalid League Key. Please verify with tournament organizer.');
      }
    } catch (err: any) {
      setLeagueError('Could not verify league key. Please check your connection.');
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
        updated.batting_position = prev.batting_position === 'wk-batter' ? 'opener' : prev.batting_position;
      } else if (role === 'bowler') {
        updated.bowling_category = prev.bowling_category || 'pace';
        updated.bowling_type = prev.bowling_type || (updated.bowling_category === 'spin' ? 'off-spin' : 'fast-medium');
      } else if (role === 'wicketkeeper') {
        updated.is_wicketkeeper = true;
        updated.batting_position = 'wk-batter';
      } else if (role === 'all-rounder') {
        updated.allrounder_type = prev.allrounder_type || 'batting-allrounder';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueInfo) {
      setErrorMessage('Please verify a valid League Key first.');
      return;
    }

    if (!formData.name || !formData.email) {
      setErrorMessage('Name and Email are required.');
      return;
    }

    if (!formData.is_available) {
      setErrorMessage('You must confirm your availability to be picked in the auction.');
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
          <span className="badge-tag">Direct In-App Registration</span>
          <h2>🏏 League Player Registration</h2>
          <p>Register yourself directly on VSBH-CL to declare your availability and playing style for the auction.</p>
        </div>

        {submitSuccess ? (
          <div className="registration-success-card">
            <div className="success-icon">🎉</div>
            <h3>Registration Confirmed!</h3>
            <p>You are officially registered for the auction in <strong>{submitSuccess.league?.name}</strong>.</p>
            
            <div className="player-summary-box">
              <div><strong>Player:</strong> {submitSuccess.player?.name}</div>
              <div><strong>Role:</strong> {submitSuccess.player?.role?.toUpperCase()}</div>
              <div>
                <strong>Batting:</strong> {submitSuccess.player?.batting_hand?.toUpperCase()} Hand ({submitSuccess.player?.batting_position || 'Middle Order'})
              </div>
              {(submitSuccess.player?.role === 'bowler' || submitSuccess.player?.role === 'all-rounder') && (
                <div>
                  <strong>Bowling:</strong> {submitSuccess.player?.bowling_arm?.toUpperCase()} Arm {submitSuccess.player?.bowling_category?.toUpperCase()} ({submitSuccess.player?.bowling_type})
                </div>
              )}
              {submitSuccess.player?.is_wicketkeeper && (
                <div><strong>Special:</strong> 🧤 Wicketkeeper</div>
              )}
              {submitSuccess.player?.special_skills && (
                <div><strong>Strengths:</strong> {submitSuccess.player?.special_skills}</div>
              )}
              <div><strong>Base Price:</strong> ₹{submitSuccess.player?.base_price}</div>
              <div><strong>Availability:</strong> <span className="status-badge available">Available for Auction</span></div>
              <div><strong>League Code:</strong> {submitSuccess.league?.code}</div>
            </div>

            <div className="success-actions">
              <button className="btn-primary" onClick={() => navigate('/auction')}>
                Go to Live Auction Arena
              </button>
              <button className="btn-secondary" onClick={() => { setSubmitSuccess(null); }}>
                Register Another Player
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="player-reg-form">
            {/* STEP 1: League Key Verification */}
            <div className="form-section">
              <h3>1. Organization League Key</h3>
              <p className="section-hint">Enter the unique league ID provided by your league admin.</p>
              
              <div className="league-verify-input-group">
                <input
                  type="text"
                  placeholder="e.g. VSBH-2026 or LEAGUE-ABCD"
                  value={leagueCode}
                  onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
                  required
                />
                <button
                  type="button"
                  onClick={() => verifyLeagueCode(leagueCode)}
                  disabled={isVerifyingLeague || !leagueCode}
                  className="btn-verify"
                >
                  {isVerifyingLeague ? 'Verifying...' : 'Verify League'}
                </button>
              </div>

              {leagueInfo && (
                <div className="league-verified-banner">
                  <span className="check-icon">✓</span>
                  <div>
                    <strong>{leagueInfo.name}</strong>
                    <div className="league-meta-text">
                      Teams: {leagueInfo.number_of_teams} | Status: {leagueInfo.registration_status === 'open' ? '🟢 Registration Open' : '🔴 Closed'}
                    </div>
                  </div>
                </div>
              )}

              {leagueError && (
                <div className="league-error-banner">
                  ⚠️ {leagueError}
                </div>
              )}
            </div>

            {/* STEP 2: Basic Contact & Identity */}
            <div className={`form-section ${!leagueInfo ? 'disabled-section' : ''}`}>
              <h3>2. Player Identity & Academic Details</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                  />
                </div>

                <div className="form-group">
                  <label>Department / Branch</label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Computer Science / Mechanical"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                  />
                </div>

                <div className="form-group">
                  <label>College Roll No / ID</label>
                  <input
                    type="text"
                    name="college_id"
                    placeholder="e.g. CS-2024-42"
                    value={formData.college_id}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                  />
                </div>

                <div className="form-group">
                  <label>Academic Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
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
                    disabled={!leagueInfo}
                  />
                </div>

                <div className="form-group">
                  <label>Account Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a password for your account"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Cricket Playing Profile & Tactical Specs */}
            <div className={`form-section ${!leagueInfo ? 'disabled-section' : ''}`}>
              <h3>3. Cricket Playing Profile & Style</h3>
              <p className="section-hint">Specify how you play so captains can evaluate your role during the auction.</p>

              {/* Primary Role Selector Tabs */}
              <div className="role-selector-cards">
                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'batter' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('batter')}
                  disabled={!leagueInfo}
                >
                  <span className="role-icon">🏏</span>
                  <div className="role-label">Batter</div>
                  <small>Pure Batsman</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'bowler' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('bowler')}
                  disabled={!leagueInfo}
                >
                  <span className="role-icon">🎯</span>
                  <div className="role-label">Bowler</div>
                  <small>Pace / Spin Specialist</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'all-rounder' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('all-rounder')}
                  disabled={!leagueInfo}
                >
                  <span className="role-icon">⚡</span>
                  <div className="role-label">All-Rounder</div>
                  <small>Batting or Bowling</small>
                </button>

                <button
                  type="button"
                  className={`role-select-card ${formData.role === 'wicketkeeper' ? 'active' : ''}`}
                  onClick={() => handleRoleSelect('wicketkeeper')}
                  disabled={!leagueInfo}
                >
                  <span className="role-icon">🧤</span>
                  <div className="role-label">Wicketkeeper</div>
                  <small>Wk + Batsman</small>
                </button>
              </div>

              {/* CONDITIONAL SPECS BASED ON ROLE */}
              <div className="cricket-style-details-box">
                {/* 1. BATTER SPECS */}
                {formData.role === 'batter' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading">🏏 Batsman Profile</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Batting Hand *</label>
                        <select
                          name="batting_hand"
                          value={formData.batting_hand}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Hand Bat (RHB)</option>
                          <option value="left">Left-Hand Bat (LHB)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Batting Position / Specialty *</label>
                        <select
                          name="batting_position"
                          value={formData.batting_position}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="opener">Opener (Powerplay Specialist)</option>
                          <option value="top-order">Top Order (No. 3 / Anchor)</option>
                          <option value="middle-order">Middle Order (Stabilizer / Rotator)</option>
                          <option value="finisher">Finisher (Death Overs Power Hitter)</option>
                          <option value="wk-batter">Wicketkeeper-Batter</option>
                        </select>
                      </div>
                    </div>

                    <div className="checkbox-subgroup">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="is_wicketkeeper"
                          checked={formData.is_wicketkeeper}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        />
                        <span>🧤 Can also perform Wicketkeeping duties</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. BOWLER SPECS */}
                {formData.role === 'bowler' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading">🎯 Bowler Profile</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Bowling Arm *</label>
                        <select
                          name="bowling_arm"
                          value={formData.bowling_arm}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Arm</option>
                          <option value="left">Left-Arm</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Category *</label>
                        <select
                          name="bowling_category"
                          value={formData.bowling_category}
                          onChange={(e) => {
                            const cat = e.target.value as 'pace' | 'spin';
                            setFormData(prev => ({
                              ...prev,
                              bowling_category: cat,
                              bowling_type: cat === 'pace' ? 'fast-medium' : 'off-spin'
                            }));
                          }}
                          disabled={!leagueInfo}
                        >
                          <option value="pace">Pace / Fast Bowling</option>
                          <option value="spin">Spin Bowling</option>
                        </select>
                      </div>

                      {formData.bowling_category === 'pace' ? (
                        <div className="form-group">
                          <label>Pace Type *</label>
                          <select
                            name="bowling_type"
                            value={formData.bowling_type}
                            onChange={handleInputChange}
                            disabled={!leagueInfo}
                          >
                            <option value="fast">Express Fast</option>
                            <option value="fast-medium">Fast-Medium (Swing)</option>
                            <option value="medium-fast">Medium-Fast (Seam)</option>
                            <option value="medium">Medium Pace</option>
                          </select>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label>Spin Type *</label>
                          <select
                            name="bowling_type"
                            value={formData.bowling_type}
                            onChange={handleInputChange}
                            disabled={!leagueInfo}
                          >
                            <option value="off-spin">Off-Spin (Finger Spin)</option>
                            <option value="leg-spin">Leg-Spin (Wrist Spin)</option>
                            <option value="orthodox">Left-Arm Orthodox</option>
                            <option value="chinaman">Left-Arm Chinaman / Unorthodox</option>
                          </select>
                        </div>
                      )}

                      <div className="form-group">
                        <label>Batting Hand (Tailender / Lower Order)</label>
                        <select
                          name="batting_hand"
                          value={formData.batting_hand}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Hand Bat</option>
                          <option value="left">Left-Hand Bat</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ALL-ROUNDER SPECS */}
                {formData.role === 'all-rounder' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading">⚡ All-Rounder Profile</div>
                    
                    <div className="form-group full-width-group">
                      <label>All-Rounder Primary Dominance *</label>
                      <div className="chip-options-row">
                        <label className={`chip-label ${formData.allrounder_type === 'batting-allrounder' ? 'chip-active' : ''}`}>
                          <input
                            type="radio"
                            name="allrounder_type"
                            value="batting-allrounder"
                            checked={formData.allrounder_type === 'batting-allrounder'}
                            onChange={handleInputChange}
                            disabled={!leagueInfo}
                          />
                          🏏 Batting All-Rounder (Primary batsman who bowls)
                        </label>
                        <label className={`chip-label ${formData.allrounder_type === 'bowling-allrounder' ? 'chip-active' : ''}`}>
                          <input
                            type="radio"
                            name="allrounder_type"
                            value="bowling-allrounder"
                            checked={formData.allrounder_type === 'bowling-allrounder'}
                            onChange={handleInputChange}
                            disabled={!leagueInfo}
                          />
                          🎯 Bowling All-Rounder (Primary bowler who bats)
                        </label>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Batting Hand *</label>
                        <select
                          name="batting_hand"
                          value={formData.batting_hand}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Hand Bat</option>
                          <option value="left">Left-Hand Bat</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Batting Position *</label>
                        <select
                          name="batting_position"
                          value={formData.batting_position}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="opener">Opener</option>
                          <option value="top-order">Top Order</option>
                          <option value="middle-order">Middle Order</option>
                          <option value="finisher">Finisher</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Arm *</label>
                        <select
                          name="bowling_arm"
                          value={formData.bowling_arm}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Arm</option>
                          <option value="left">Left-Arm</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Category *</label>
                        <select
                          name="bowling_category"
                          value={formData.bowling_category}
                          onChange={(e) => {
                            const cat = e.target.value as 'pace' | 'spin';
                            setFormData(prev => ({
                              ...prev,
                              bowling_category: cat,
                              bowling_type: cat === 'pace' ? 'fast-medium' : 'off-spin'
                            }));
                          }}
                          disabled={!leagueInfo}
                        >
                          <option value="pace">Pace / Fast</option>
                          <option value="spin">Spin</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Bowling Subtype *</label>
                        <select
                          name="bowling_type"
                          value={formData.bowling_type}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          {formData.bowling_category === 'pace' ? (
                            <>
                              <option value="fast">Express Fast</option>
                              <option value="fast-medium">Fast-Medium</option>
                              <option value="medium-fast">Medium-Fast</option>
                              <option value="medium">Medium Pace</option>
                            </>
                          ) : (
                            <>
                              <option value="off-spin">Off-Spin</option>
                              <option value="leg-spin">Leg-Spin</option>
                              <option value="orthodox">Left-Arm Orthodox</option>
                              <option value="chinaman">Left-Arm Chinaman</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WICKETKEEPER SPECS */}
                {formData.role === 'wicketkeeper' && (
                  <div className="role-specific-inputs">
                    <div className="spec-heading">🧤 Wicketkeeper-Batter Profile</div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Batting Hand *</label>
                        <select
                          name="batting_hand"
                          value={formData.batting_hand}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="right">Right-Hand Bat</option>
                          <option value="left">Left-Hand Bat</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Batting Position *</label>
                        <select
                          name="batting_position"
                          value={formData.batting_position}
                          onChange={handleInputChange}
                          disabled={!leagueInfo}
                        >
                          <option value="opener">Opener / Top Order</option>
                          <option value="middle-order">Middle Order</option>
                          <option value="finisher">Finisher</option>
                          <option value="wk-batter">Wicketkeeper-Batter</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDITIONAL TOURNAMENT DETAILS */}
                <div className="extra-specs-container">
                  <div className="spec-heading">⭐ Additional Playing Details & Strengths</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Preferred Jersey Number</label>
                      <input
                        type="number"
                        name="jersey_number"
                        placeholder="e.g. 7, 18, 45, 99"
                        min="1"
                        max="999"
                        value={formData.jersey_number}
                        onChange={handleInputChange}
                        disabled={!leagueInfo}
                      />
                    </div>

                    <div className="form-group">
                      <label>Playing Experience Level</label>
                      <select
                        name="experience_level"
                        value={formData.experience_level}
                        onChange={handleInputChange}
                        disabled={!leagueInfo}
                      >
                        <option value="College Team">College Team Player</option>
                        <option value="Club / Academy">Club / Cricket Academy</option>
                        <option value="Hostel League">Hostel / Inter-Department</option>
                        <option value="Casual / Box Cricket">Casual / Box Cricket</option>
                      </select>
                    </div>

                    <div className="form-group full-width-group">
                      <label>Key Strengths & Special Skills (Optional)</label>
                      <input
                        type="text"
                        name="special_skills"
                        placeholder="e.g. Death-over yorker specialist, powerplay boundary hitter, agile slip fielder"
                        value={formData.special_skills}
                        onChange={handleInputChange}
                        disabled={!leagueInfo}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: Availability Confirmation */}
            <div className={`form-section ${!leagueInfo ? 'disabled-section' : ''}`}>
              <h3>4. Availability Confirmation</h3>
              <div className="availability-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    disabled={!leagueInfo}
                  />
                  <span>
                    <strong>I confirm my availability to play in {leagueInfo?.name || 'this league'}</strong>
                    <br />
                    <small>By checking this, team captains can view your profile and bid to pick you in their squad during the live auction.</small>
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
              {isSubmitting ? 'Registering Player...' : 'Complete Player Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlayerRegistration;
