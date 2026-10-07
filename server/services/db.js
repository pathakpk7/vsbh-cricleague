const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');

// Helper to generate IDs
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

// Initial default seed state
const getInitialState = () => {
  const defaultLeagueId = 'league-vsbh-2026';
  const defaultLeague = {
    id: defaultLeagueId,
    name: 'VSBH Premier League 2026',
    code: 'VSBH-2026',
    admin_name: 'League Administrator',
    admin_email: 'admin@vsbh.com',
    admin_password: 'admin123', // In production, hash with bcrypt
    number_of_teams: 6,
    registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    registration_status: 'open',
    auction_date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    captain_auction_key: 'CAPT-VSBH-77',
    auction_status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const defaultTeams = [
    { id: 'team-warriors', league_id: defaultLeagueId, name: 'Warriors', budget: 100, captain_name: 'Rohit Sharma', logo: 'warriors.png', created_at: new Date().toISOString() },
    { id: 'team-titans', league_id: defaultLeagueId, name: 'Titans', budget: 100, captain_name: 'Hardik Pandya', logo: 'titans.png', created_at: new Date().toISOString() },
    { id: 'team-royals', league_id: defaultLeagueId, name: 'Royals', budget: 100, captain_name: 'Sanju Samson', logo: 'royals.png', created_at: new Date().toISOString() },
    { id: 'team-superstars', league_id: defaultLeagueId, name: 'Superstars', budget: 100, captain_name: 'KL Rahul', logo: 'superstars.png', created_at: new Date().toISOString() },
    { id: 'team-champions', league_id: defaultLeagueId, name: 'Champions', budget: 100, captain_name: 'Shreyas Iyer', logo: 'champions.png', created_at: new Date().toISOString() },
    { id: 'team-legends', league_id: defaultLeagueId, name: 'Legends', budget: 100, captain_name: 'MS Dhoni', logo: 'legends.png', created_at: new Date().toISOString() }
  ];

  const defaultPlayers = [
    {
      id: 'player-1',
      league_id: defaultLeagueId,
      name: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '9876543210',
      role: 'batter',
      department: 'Computer Science',
      college_id: 'CS-2023-01',
      year: '3rd',
      base_price: 10,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: true,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'player-2',
      league_id: defaultLeagueId,
      name: 'Rohan Verma',
      email: 'rohan@example.com',
      phone: '9876543211',
      role: 'bowler',
      department: 'Mechanical',
      college_id: 'ME-2023-04',
      year: '3rd',
      base_price: 10,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: false,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'player-3',
      league_id: defaultLeagueId,
      name: 'Ishaan Patel',
      email: 'ishaan@example.com',
      phone: '9876543212',
      role: 'all-rounder',
      department: 'Electrical',
      college_id: 'EE-2024-12',
      year: '2nd',
      base_price: 15,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: true,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'player-4',
      league_id: defaultLeagueId,
      name: 'Kabir Singh',
      email: 'kabir@example.com',
      phone: '9876543213',
      role: 'wicketkeeper',
      department: 'Civil',
      college_id: 'CE-2022-09',
      year: '4th',
      base_price: 10,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: false,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'player-5',
      league_id: defaultLeagueId,
      name: 'Devraj Chauhan',
      email: 'devraj@example.com',
      phone: '9876543214',
      role: 'batter',
      department: 'IT',
      college_id: 'IT-2023-15',
      year: '3rd',
      base_price: 10,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: false,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ];

  const defaultAuctionStates = {
    [defaultLeagueId]: {
      league_id: defaultLeagueId,
      current_player_id: defaultPlayers[0].id,
      current_team_id: null,
      current_bid: 10,
      timer_seconds: 30,
      is_active: false,
      auction_round: 1,
      updated_at: new Date().toISOString()
    }
  };

  const defaultMatches = [
    {
      id: 'match-1',
      league_id: defaultLeagueId,
      team1_id: 'team-warriors',
      team2_id: 'team-titans',
      team1_name: 'Warriors',
      team2_name: 'Titans',
      team1_score: 168,
      team1_wickets: 5,
      team1_overs: '20.0',
      team2_score: 142,
      team2_wickets: 4,
      team2_overs: '17.3',
      target: 169,
      current_batting_team_id: 'team-titans',
      status: 'live',
      venue: 'Campus Sports Ground - Pitch A',
      match_date: new Date().toISOString(),
      current_striker: 'Hardik Pandya (34* off 19)',
      current_non_striker: 'Shubman Gill (58* off 41)',
      current_bowler: 'Jasprit Bumrah (3.3-0-24-2)',
      recent_balls: ['1', '4', '2', '0', '6', '1'],
      commentary: [
        { id: 'c1', over: '17.3', text: 'Single taken towards long-off. Good running between wickets.', runs: 1, isWicket: false, timestamp: new Date().toISOString() },
        { id: 'c2', over: '17.2', text: 'SIX! What a massive strike over deep mid-wicket!', runs: 6, isWicket: false, timestamp: new Date(Date.now() - 30000).toISOString() },
        { id: 'c3', over: '17.1', text: 'Dot ball. Yorker fired right in the blockhole.', runs: 0, isWicket: false, timestamp: new Date(Date.now() - 60000).toISOString() }
      ],
      play_documentation: 'Titans need 27 runs in 15 balls. High tension match! Warriors fielders are up inside the circle. Pitch playing true with good bounce.',
      updated_at: new Date().toISOString()
    }
  ];

  return {
    leagues: [defaultLeague],
    teams: defaultTeams,
    players: defaultPlayers,
    team_players: [],
    auction_states: defaultAuctionStates,
    auction_logs: [],
    matches: defaultMatches
  };
};

class DatabaseService {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.data.leagues) this.data.leagues = [];
        if (!this.data.teams) this.data.teams = [];
        if (!this.data.players) this.data.players = [];
        if (!this.data.team_players) this.data.team_players = [];
        if (!this.data.auction_states) this.data.auction_states = {};
        if (!this.data.auction_logs) this.data.auction_logs = [];
        if (!this.data.matches) this.data.matches = [];
      } else {
        this.data = getInitialState();
        this.save();
      }
    } catch (e) {
      console.error('Error loading db file, reinitializing default:', e);
      this.data = getInitialState();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save db file:', e);
    }
  }

  // --- LEAGUES ---
  getLeagues() {
    return this.data.leagues.map(l => ({
      ...l,
      // Hide admin password in public list
      admin_password: undefined
    }));
  }

  getLeagueById(id) {
    return this.data.leagues.find(l => l.id === id);
  }

  getLeagueByCode(code) {
    if (!code) return null;
    return this.data.leagues.find(l => l.code.toUpperCase() === code.trim().toUpperCase());
  }

  createLeague({ name, admin_name, admin_email, admin_password, number_of_teams = 6, team_names = [] }) {
    // Generate unique league code (e.g. VSBH-8A49)
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `LEAGUE-${randomHex}`;
    const id = generateId();
    const captainKey = `CAP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const newLeague = {
      id,
      name: name.trim(),
      code,
      admin_name: admin_name || 'Admin',
      admin_email: admin_email.trim().toLowerCase(),
      admin_password: admin_password || 'admin123',
      number_of_teams: parseInt(number_of_teams, 10) || 6,
      registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      registration_status: 'open',
      auction_date_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      captain_auction_key: captainKey,
      auction_status: 'draft',
      created_at: new Date().toISOString()
    };

    this.data.leagues.push(newLeague);

    // Initialize auction state for this league
    this.data.auction_states[id] = {
      league_id: id,
      current_player_id: null,
      current_team_id: null,
      current_bid: 10,
      timer_seconds: 30,
      is_active: false,
      auction_round: 1,
      updated_at: new Date().toISOString()
    };

    // Auto-create initial teams if provided or create placeholders
    const teamsToCreate = team_names && team_names.length > 0 
      ? team_names 
      : Array.from({ length: newLeague.number_of_teams }, (_, i) => `Team ${i + 1}`);

    teamsToCreate.slice(0, newLeague.number_of_teams).forEach((tName, idx) => {
      this.data.teams.push({
        id: generateId(),
        league_id: id,
        name: typeof tName === 'string' ? tName.trim() : `Team ${idx + 1}`,
        budget: 100,
        captain_name: `Captain ${idx + 1}`,
        logo: `team_${idx + 1}.png`,
        created_at: new Date().toISOString()
      });
    });

    this.save();
    return newLeague;
  }

  updateLeague(id, updates) {
    const idx = this.data.leagues.findIndex(l => l.id === id);
    if (idx === -1) return null;

    // Apply allowed updates
    const current = this.data.leagues[idx];
    const updated = {
      ...current,
      ...updates,
      id: current.id, // prevent id change
      code: current.code // prevent code change
    };

    this.data.leagues[idx] = updated;
    this.save();
    return updated;
  }

  // --- TEAMS ---
  getTeams(leagueId) {
    let teams = this.data.teams;
    if (leagueId) {
      teams = teams.filter(t => t.league_id === leagueId);
    }
    // Join team players
    return teams.map(t => {
      const teamPlayers = this.data.team_players
        .filter(tp => tp.team_id === t.id)
        .map(tp => {
          const player = this.data.players.find(p => p.id === tp.player_id);
          return {
            ...tp,
            player
          };
        });
      return {
        ...t,
        team_players: teamPlayers,
        players_count: teamPlayers.length
      };
    });
  }

  getTeamById(id) {
    const team = this.data.teams.find(t => t.id === id);
    if (!team) return null;
    const teamPlayers = this.data.team_players
      .filter(tp => tp.team_id === team.id)
      .map(tp => {
        const player = this.data.players.find(p => p.id === tp.player_id);
        return { ...tp, player };
      });
    return { ...team, team_players: teamPlayers };
  }

  createTeam({ league_id, name, budget = 100, captain_name = '', logo = '' }) {
    const newTeam = {
      id: generateId(),
      league_id,
      name: name.trim(),
      budget: Number(budget) || 100,
      captain_name: captain_name.trim(),
      logo: logo || 'default_team.png',
      created_at: new Date().toISOString()
    };
    this.data.teams.push(newTeam);
    this.save();
    return newTeam;
  }

  updateTeam(id, updates) {
    const idx = this.data.teams.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.teams[idx] = { ...this.data.teams[idx], ...updates };
    this.save();
    return this.data.teams[idx];
  }

  deleteTeam(id) {
    const idx = this.data.teams.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.teams.splice(idx, 1);
    // Remove relations
    this.data.team_players = this.data.team_players.filter(tp => tp.team_id !== id);
    this.save();
    return true;
  }

  // --- PLAYERS ---
  getPlayers(leagueId, filters = {}) {
    let players = this.data.players;
    if (leagueId) {
      players = players.filter(p => p.league_id === leagueId);
    }
    if (filters.status) {
      players = players.filter(p => p.status === filters.status);
    }
    if (filters.role) {
      players = players.filter(p => p.role.toLowerCase() === filters.role.toLowerCase());
    }
    return players;
  }

  getPlayerById(id) {
    return this.data.players.find(p => p.id === id);
  }

  createPlayer({
    league_id,
    name,
    email,
    phone = '',
    role = 'batter',
    department = '',
    college_id = '',
    year = '',
    base_price = 10,
    password = '',
    is_mvp = false,
    is_available = true,
    batting_hand = 'right',
    batting_position = '',
    bowling_arm = '',
    bowling_category = '',
    bowling_type = '',
    allrounder_type = '',
    is_wicketkeeper = false,
    experience_level = '',
    jersey_number = null,
    special_skills = ''
  }) {
    const newPlayer = {
      id: generateId(),
      league_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role.toLowerCase(),
      department: department.trim(),
      college_id: college_id.trim(),
      year: year.trim(),
      base_price: Number(base_price) || 10,
      sold_price: null,
      sold_to_team: null,
      status: 'available',
      is_mvp: !!is_mvp,
      is_available: is_available !== false,
      password: password || 'player123',
      batting_hand: batting_hand || 'right',
      batting_position: batting_position || '',
      bowling_arm: bowling_arm || '',
      bowling_category: bowling_category || '',
      bowling_type: bowling_type || '',
      allrounder_type: allrounder_type || '',
      is_wicketkeeper: is_wicketkeeper === true || is_wicketkeeper === 'true' || role === 'wicketkeeper' || batting_position === 'wk-batter',
      experience_level: experience_level || '',
      jersey_number: jersey_number ? Number(jersey_number) : null,
      special_skills: special_skills ? special_skills.trim() : '',
      created_at: new Date().toISOString()
    };
    this.data.players.push(newPlayer);
    this.save();
    return newPlayer;
  }

  updatePlayer(id, updates) {
    const idx = this.data.players.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.players[idx] = { ...this.data.players[idx], ...updates };
    this.save();
    return this.data.players[idx];
  }

  // --- AUCTION STATE & BIDDING ---
  getAuctionState(leagueId) {
    if (!this.data.auction_states[leagueId]) {
      this.data.auction_states[leagueId] = {
        league_id: leagueId,
        current_player_id: null,
        current_team_id: null,
        current_bid: 10,
        timer_seconds: 30,
        is_active: false,
        auction_round: 1,
        updated_at: new Date().toISOString()
      };
      this.save();
    }
    const state = this.data.auction_states[leagueId];
    let currentPlayer = null;
    if (state.current_player_id) {
      currentPlayer = this.getPlayerById(state.current_player_id);
    }
    let currentTeam = null;
    if (state.current_team_id) {
      currentTeam = this.data.teams.find(t => t.id === state.current_team_id);
    }
    return {
      id: 1,
      ...state,
      currentPlayer,
      currentTeam
    };
  }

  updateAuctionState(leagueId, updates) {
    if (!this.data.auction_states[leagueId]) {
      this.data.auction_states[leagueId] = {
        league_id: leagueId,
        current_player_id: null,
        current_team_id: null,
        current_bid: 10,
        timer_seconds: 30,
        is_active: false,
        auction_round: 1,
        updated_at: new Date().toISOString()
      };
    }
    this.data.auction_states[leagueId] = {
      ...this.data.auction_states[leagueId],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.getAuctionState(leagueId);
  }

  recordPlayerSold(leagueId, playerId, teamId, finalBid) {
    // 1. Update player status
    const player = this.getPlayerById(playerId);
    if (player) {
      player.status = 'sold';
      player.sold_to_team = teamId;
      player.sold_price = finalBid;
      player.sold_at = new Date().toISOString();
    }

    // 2. Deduct team budget
    const team = this.data.teams.find(t => t.id === teamId);
    if (team) {
      team.budget = Math.max(0, team.budget - finalBid);
    }

    // 3. Add to team_players
    this.data.team_players.push({
      id: generateId(),
      league_id: leagueId,
      team_id: teamId,
      player_id: playerId,
      sold_price: finalBid,
      picked_at: new Date().toISOString()
    });

    // 4. Log winning bid
    this.addAuctionLog({
      league_id: leagueId,
      player_id: playerId,
      team_id: teamId,
      bid_amount: finalBid,
      is_winning_bid: true
    });

    this.save();
    return { player, team };
  }

  recordPlayerUnsold(leagueId, playerId) {
    const player = this.getPlayerById(playerId);
    if (player) {
      player.status = 'unsold';
      player.sold_at = new Date().toISOString();
    }
    this.save();
    return player;
  }

  addAuctionLog({ league_id, player_id, team_id, bid_amount, is_winning_bid = false }) {
    const log = {
      id: generateId(),
      league_id,
      player_id,
      team_id,
      bid_amount,
      is_winning_bid,
      timestamp: new Date().toISOString()
    };
    this.data.auction_logs.push(log);
    this.save();
    return log;
  }

  getAuctionLogs(leagueId) {
    if (!leagueId) return this.data.auction_logs;
    return this.data.auction_logs.filter(l => l.league_id === leagueId);
  }

  resetAuction(leagueId) {
    // Reset players of this league
    this.data.players.forEach(p => {
      if (p.league_id === leagueId) {
        p.status = 'available';
        p.sold_to_team = null;
        p.sold_price = null;
      }
    });

    // Reset teams budget
    this.data.teams.forEach(t => {
      if (t.league_id === leagueId) {
        t.budget = 100;
      }
    });

    // Remove team_players for this league
    this.data.team_players = this.data.team_players.filter(tp => tp.league_id !== leagueId);

    // Reset state
    const availablePlayers = this.data.players.filter(p => p.league_id === leagueId && p.status === 'available');
    this.data.auction_states[leagueId] = {
      league_id: leagueId,
      current_player_id: availablePlayers[0]?.id || null,
      current_team_id: null,
      current_bid: availablePlayers[0]?.base_price || 10,
      timer_seconds: 30,
      is_active: false,
      auction_round: 1,
      updated_at: new Date().toISOString()
    };

    this.save();
    return this.data.auction_states[leagueId];
  }

  // --- MATCHES & LIVE SCORE DOCUMENTATION ---
  getMatches(leagueId) {
    let matches = this.data.matches;
    if (leagueId) {
      matches = matches.filter(m => m.league_id === leagueId);
    }
    return matches;
  }

  getMatchById(id) {
    return this.data.matches.find(m => m.id === id);
  }

  createMatch({
    league_id,
    team1_id,
    team2_id,
    team1_name,
    team2_name,
    venue = 'Campus Ground',
    match_date = new Date().toISOString()
  }) {
    const newMatch = {
      id: generateId(),
      league_id,
      team1_id,
      team2_id,
      team1_name: team1_name || 'Team 1',
      team2_name: team2_name || 'Team 2',
      team1_score: 0,
      team1_wickets: 0,
      team1_overs: '0.0',
      team2_score: 0,
      team2_wickets: 0,
      team2_overs: '0.0',
      target: null,
      current_batting_team_id: team1_id,
      status: 'upcoming',
      venue,
      match_date,
      current_striker: '',
      current_non_striker: '',
      current_bowler: '',
      recent_balls: [],
      commentary: [],
      play_documentation: 'Match scheduled. Live play notes will be documented here by the league admin.',
      updated_at: new Date().toISOString()
    };

    this.data.matches.push(newMatch);
    this.save();
    return newMatch;
  }

  updateMatchScoreAndPlay(id, updates) {
    const idx = this.data.matches.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const current = this.data.matches[idx];
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.data.matches[idx] = updated;
    this.save();
    return updated;
  }

  addMatchBallCommentary(id, { ball, over, runs, isWicket, text }) {
    const match = this.getMatchById(id);
    if (!match) return null;

    const commEntry = {
      id: generateId(),
      over: over || '',
      runs: Number(runs) || 0,
      isWicket: !!isWicket,
      text: text || '',
      timestamp: new Date().toISOString()
    };

    if (!match.commentary) match.commentary = [];
    match.commentary.unshift(commEntry);

    // Keep last 10 balls in recent_balls
    if (!match.recent_balls) match.recent_balls = [];
    const ballLabel = isWicket ? 'W' : String(runs);
    match.recent_balls.push(ballLabel);
    if (match.recent_balls.length > 8) match.recent_balls.shift();

    match.updated_at = new Date().toISOString();
    this.save();
    return match;
  }

  deleteMatch(id) {
    const idx = this.data.matches.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.matches.splice(idx, 1);
    this.save();
    return true;
  }

  // --- AUTHENTICATION HELPERS ---
  authenticateAdmin(email, password) {
    if (!email || !password) return null;
    const cleanEmail = email.trim().toLowerCase();
    const league = this.data.leagues.find(l => 
      l.admin_email.toLowerCase() === cleanEmail && l.admin_password === password
    );
    if (!league) return null;

    return {
      role: 'admin',
      admin_email: league.admin_email,
      admin_name: league.admin_name,
      league_id: league.id,
      league_name: league.name,
      league_code: league.code
    };
  }

  authenticateCaptain(leagueCodeOrId, teamId, captainKey) {
    if (!leagueCodeOrId || !captainKey) return null;

    const league = this.data.leagues.find(l => 
      (l.id === leagueCodeOrId || l.code.toUpperCase() === leagueCodeOrId.trim().toUpperCase()) &&
      l.captain_auction_key.toUpperCase() === captainKey.trim().toUpperCase()
    );

    if (!league) return null;

    const team = this.data.teams.find(t => t.id === teamId && t.league_id === league.id);
    if (!team) return null;

    return {
      role: 'captain',
      teamId: team.id,
      teamName: team.name,
      league_id: league.id,
      league_name: league.name,
      league_code: league.code,
      captainKey
    };
  }

  authenticatePlayer(email, password) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const player = this.data.players.find(p => p.email.toLowerCase() === cleanEmail);
    if (!player) return null;

    // Check password if set
    if (player.password && password && player.password !== password) {
      return null;
    }

    const league = this.getLeagueById(player.league_id);
    return {
      role: 'player',
      id: player.id,
      name: player.name,
      email: player.email,
      player,
      league_id: player.league_id,
      league_name: league?.name,
      league_code: league?.code
    };
  }
}

const db = new DatabaseService();
module.exports = db;
