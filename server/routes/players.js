const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Get all players (optionally by leagueId and filters)
router.get('/', (req, res) => {
  try {
    const { leagueId, status, role } = req.query;
    const players = db.getPlayers(leagueId, { status, role });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available players for auction (optionally by leagueId)
router.get('/available', (req, res) => {
  try {
    const { leagueId } = req.query;
    const players = db.getPlayers(leagueId, { status: 'available' });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
router.get('/:id', (req, res) => {
  try {
    const player = db.getPlayerById(req.params.id);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new player under a league
router.post('/', (req, res) => {
  try {
    const {
      league_id,
      leagueCode,
      name,
      role,
      department,
      college_id,
      year,
      base_price,
      email,
      phone,
      password,
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
    } = req.body;
    
    let targetLeagueId = league_id;
    if (!targetLeagueId && leagueCode) {
      const league = db.getLeagueByCode(leagueCode);
      if (league) targetLeagueId = league.id;
    }

    if (!targetLeagueId) {
      // Fallback to first league if single league mode
      const leagues = db.getLeagues();
      targetLeagueId = leagues[0]?.id;
    }

    const player = db.createPlayer({
      league_id: targetLeagueId,
      name,
      role,
      department,
      college_id,
      year,
      base_price: base_price || 10,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone,
      password,
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

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update player
router.put('/:id', (req, res) => {
  try {
    const updated = db.updatePlayer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
