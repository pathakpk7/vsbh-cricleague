const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '..', 'data', 'store.json');

// Helper to generate IDs
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

// Initial default clean state (Starts completely fresh)
const getInitialState = () => {
  return {
    leagues: [],
    teams: [],
    players: [],
    team_players: [],
    auction_states: {},
    auction_logs: [],
    matches: []
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

  clearAllData() {
    this.data = getInitialState();
    this.save();
    return this.data;
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

  createLeague({ name, admin_name, admin_email, admin_password, number_of_teams, team_names = [] }) {
    // Generate unique league code (e.g. LEAGUE-8A49)
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `LEAGUE-${randomHex}`;
    const id = generateId();
    const captainKey = `CAP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Filter to real non-empty team names explicitly entered by organizer
    const validTeamNames = Array.isArray(team_names)
      ? team_names.map(t => typeof t === 'string' ? t.trim() : '').filter(t => t.length > 0)
      : [];

    const numTeams = parseInt(number_of_teams, 10) || validTeamNames.length || 0;

    const newLeague = {
      id,
      name: name.trim(),
      code,
      admin_name: admin_name ? admin_name.trim() : '',
      admin_email: admin_email.trim().toLowerCase(),
      admin_password: admin_password || '',
      number_of_teams: numTeams,
      registration_deadline: '',
      registration_status: 'open',
      auction_date_time: '',
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
      current_bid: 0,
      timer_seconds: 30,
      is_active: false,
      auction_round: 1,
      updated_at: new Date().toISOString()
    };

    // ONLY create teams if valid names were explicitly provided
    // Absolutely NO fake placeholder teams or fake captain names!
    validTeamNames.forEach((tName) => {
      this.data.teams.push({
        id: generateId(),
        league_id: id,
        name: tName,
        budget: 100,
        captain_name: '',
        logo: '',
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
