const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Admin Login
router.post('/admin-login', (req, res) => {
  try {
    const { email, password, admin_key } = req.body;

    // Check league admin credentials
    if (email && password) {
      const adminSession = db.authenticateAdmin(email, password);
      if (adminSession) {
        return res.json({
          success: true,
          message: 'Admin login successful',
          data: {
            ...adminSession,
            token: Buffer.from(`admin:${adminSession.league_id}:${Date.now()}`).toString('base64')
          }
        });
      }
    }

    // Fallback: Check if global admin key is provided (from process.env.ADMIN_KEY)
    if (admin_key && process.env.ADMIN_KEY && admin_key === process.env.ADMIN_KEY) {
      // Find default or first league
      const leagues = db.getLeagues();
      const defaultLeague = leagues[0] || {};
      return res.json({
        success: true,
        message: 'System admin login successful',
        data: {
          role: 'admin',
          admin_email: 'admin@vsbh.com',
          admin_name: 'Super Admin',
          league_id: defaultLeague.id,
          league_name: defaultLeague.name,
          league_code: defaultLeague.code,
          token: Buffer.from(`system_admin:${Date.now()}`).toString('base64')
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Captain Login (Using League ID + Team + Unique Captain Auction Key)
router.post('/captain-login', (req, res) => {
  try {
    const { leagueCodeOrId, teamId, captainKey } = req.body;

    if (!leagueCodeOrId || !teamId || !captainKey) {
      return res.status(400).json({
        success: false,
        message: 'League Code, Team ID, and Captain Auction Key are required'
      });
    }

    const captainSession = db.authenticateCaptain(leagueCodeOrId, teamId, captainKey);
    if (!captainSession) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Captain Auction Key or Team selection for this League'
      });
    }

    res.json({
      success: true,
      message: 'Captain authenticated successfully for auction bidding',
      data: {
        ...captainSession,
        token: Buffer.from(`captain:${captainSession.teamId}:${Date.now()}`).toString('base64')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Player Registration inside the website under a League Code
router.post('/player-register', (req, res) => {
  try {
    const {
      leagueCode,
      name,
      email,
      phone,
      role,
      department,
      college_id,
      year,
      base_price,
      password,
      is_available = true,
      batting_hand,
      batting_position,
      bowling_arm,
      bowling_category,
      bowling_type,
      allrounder_type,
      is_wicketkeeper,
      experience_level,
      jersey_number,
      special_skills
    } = req.body;

    if (!leagueCode || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'League Code, Name, and Email are required'
      });
    }

    const league = db.getLeagueByCode(leagueCode) || db.getLeagueById(leagueCode);
    if (!league) {
      return res.status(404).json({
        success: false,
        message: 'Invalid League Code. Please enter a valid organization key.'
      });
    }

    if (league.registration_status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Player registration deadline for this league has closed'
      });
    }

    // Check if player already registered in this league with this email
    const existing = db.getPlayers(league.id).find(p => p.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A player with this email is already registered in this league'
      });
    }

    const player = db.createPlayer({
      league_id: league.id,
      name,
      email,
      phone,
      role: role || 'batter',
      department,
      college_id,
      year,
      base_price: base_price || 10,
      password: password || 'player123',
      is_available,
      batting_hand,
      batting_position,
      bowling_arm,
      bowling_category,
      bowling_type,
      allrounder_type,
      is_wicketkeeper,
      experience_level,
      jersey_number,
      special_skills
    });

    res.status(201).json({
      success: true,
      message: `Successfully registered under ${league.name}`,
      data: {
        player: { ...player, password: undefined },
        league: {
          id: league.id,
          name: league.name,
          code: league.code,
          auction_date_time: league.auction_date_time,
          registration_deadline: league.registration_deadline
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Player Login
router.post('/player-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const playerSession = db.authenticatePlayer(email, password);
    if (!playerSession) {
      return res.status(401).json({
        success: false,
        message: 'Invalid player email or password'
      });
    }

    res.json({
      success: true,
      message: 'Player login successful',
      data: {
        ...playerSession,
        token: Buffer.from(`player:${playerSession.id}:${Date.now()}`).toString('base64')
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
