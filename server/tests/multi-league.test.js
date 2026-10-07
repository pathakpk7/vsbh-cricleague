const request = require('supertest');
const app = require('./test-app');
const db = require('../services/db');

describe('Multi-League & Auction API Tests', () => {
  let createdLeague;

  it('should list leagues', async () => {
    const res = await request(app).get('/api/leagues');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  const testRunId = Date.now();
  const testAdminEmail = `director_${testRunId}@university.edu`;

  it('should create a new cricket league with unique code and teams', async () => {
    const leaguePayload = {
      name: 'Inter-Collegiate Champions League',
      admin_name: 'Tournament Director',
      admin_email: testAdminEmail,
      admin_password: 'director_pass',
      number_of_teams: 4,
      team_names: ['Strikers', 'Blasters', 'Hurricanes', 'Daredevils']
    };

    const res = await request(app)
      .post('/api/leagues')
      .send(leaguePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(leaguePayload.name);
    expect(res.body.data.code).toBeDefined();
    expect(res.body.data.captain_auction_key).toBeDefined();

    createdLeague = res.body.data;
  });

  it('should register a player with detailed playing style under the created league code', async () => {
    const playerPayload = {
      leagueCode: createdLeague.code,
      name: 'Sameer Khan',
      email: `sameer_${testRunId}@student.edu`,
      phone: '9988776655',
      role: 'all-rounder',
      department: 'Mechanical',
      college_id: 'MECH-2025',
      year: '2nd',
      base_price: 15,
      password: 'sameerpass123',
      is_available: true,
      batting_hand: 'left',
      batting_position: 'finisher',
      bowling_arm: 'right',
      bowling_category: 'spin',
      bowling_type: 'off-spin',
      allrounder_type: 'batting-allrounder',
      is_wicketkeeper: false,
      special_skills: 'Death over power hitter'
    };

    const res = await request(app)
      .post('/api/auth/player-register')
      .send(playerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.player.name).toBe('Sameer Khan');
    expect(res.body.data.player.batting_hand).toBe('left');
    expect(res.body.data.player.batting_position).toBe('finisher');
    expect(res.body.data.player.bowling_category).toBe('spin');
    expect(res.body.data.player.bowling_type).toBe('off-spin');
    expect(res.body.data.player.allrounder_type).toBe('batting-allrounder');
    expect(res.body.data.player.special_skills).toBe('Death over power hitter');
    expect(res.body.data.league.id).toBe(createdLeague.id);
  });

  it('should authenticate league admin with their own credentials', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({
        email: testAdminEmail,
        password: 'director_pass'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.league_id).toBe(createdLeague.id);
  });

  it('should authenticate captain using league captain auction key', async () => {
    const teams = db.getTeams(createdLeague.id);
    expect(teams.length).toBeGreaterThan(0);
    const targetTeam = teams[0];

    const res = await request(app)
      .post('/api/auth/captain-login')
      .send({
        leagueCodeOrId: createdLeague.code,
        teamId: targetTeam.id,
        captainKey: createdLeague.captain_auction_key
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('captain');
    expect(res.body.data.teamId).toBe(targetTeam.id);
  });

  it('should create and update match live score and play documentation', async () => {
    const teams = db.getTeams(createdLeague.id);
    const matchRes = await request(app)
      .post('/api/matches')
      .send({
        league_id: createdLeague.id,
        team1_id: teams[0].id,
        team2_id: teams[1].id,
        team1_name: teams[0].name,
        team2_name: teams[1].name,
        venue: 'Main Stadium'
      });

    expect(matchRes.status).toBe(201);
    const matchId = matchRes.body.data.id;

    // Update live score
    const scoreRes = await request(app)
      .put(`/api/matches/${matchId}/score`)
      .send({
        status: 'live',
        team1_score: 85,
        team1_wickets: 2,
        team1_overs: '10.4',
        current_striker: 'Rahul Dravid 40*(32)',
        current_bowler: 'Zaheer Khan 3.4-0-22-1'
      });

    expect(scoreRes.status).toBe(200);
    expect(scoreRes.body.data.team1_score).toBe(85);

    // Update live play documentation
    const docRes = await request(app)
      .put(`/api/matches/${matchId}/documentation`)
      .send({
        play_documentation: 'Powerplay dominated by Strikers. Excellent swing bowling in early overs.'
      });

    expect(docRes.status).toBe(200);
    expect(docRes.body.data.play_documentation).toContain('Powerplay dominated');
  });
});
