const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Get all leagues (public)
router.get('/', (req, res) => {
  try {
    const leagues = db.getLeagues();
    res.json({ success: true, data: leagues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get league by ID or Code
router.get('/:idOrCode', (req, res) => {
  try {
    const { idOrCode } = req.params;
    let league = db.getLeagueById(idOrCode);
    if (!league) {
      league = db.getLeagueByCode(idOrCode);
    }
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }
    res.json({
      success: true,
      data: {
        ...league,
        admin_password: undefined // Never expose password in public lookup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register / Create a new cricket league
router.post('/', (req, res) => {
  try {
    const { name, admin_name, admin_email, admin_password, number_of_teams, team_names } = req.body;
    
    if (!name || !admin_email || !admin_password) {
      return res.status(400).json({
        success: false,
        message: 'League name, admin email, and admin password are required'
      });
    }

    const newLeague = db.createLeague({
      name,
      admin_name,
      admin_email,
      admin_password,
      number_of_teams: number_of_teams ? parseInt(number_of_teams, 10) : undefined,
      team_names
    });

    res.status(201).json({
      success: true,
      message: 'Cricket league registered successfully',
      data: {
        ...newLeague,
        admin_password: undefined
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update league settings (admin only)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const league = db.getLeagueById(id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    const updated = db.updateLeague(id, req.body);
    res.json({
      success: true,
      message: 'League updated successfully',
      data: {
        ...updated,
        admin_password: undefined
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate/Refresh captain auction key (admin only)
router.post('/:id/generate-captain-key', (req, res) => {
  try {
    const { id } = req.params;
    const league = db.getLeagueById(id);
    if (!league) {
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    const crypto = require('crypto');
    const newKey = `CAP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const updated = db.updateLeague(id, { captain_auction_key: newKey });

    res.json({
      success: true,
      message: 'New captain auction key generated',
      captain_auction_key: newKey,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
