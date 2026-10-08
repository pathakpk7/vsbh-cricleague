const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Get all teams (optionally filtered by leagueId)
router.get('/', async (req, res) => {
  try {
    if (!db.data.teams || db.data.teams.length === 0) {
      await db.syncFromSupabase();
    }
    const { leagueId } = req.query;
    const teams = db.getTeams(leagueId);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const team = db.getTeamById(id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new team under a league (League Admin right)
router.post('/', (req, res) => {
  try {
    const { league_id, name, budget, captain_name, logo } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    let targetLeagueId = league_id;
    if (!targetLeagueId) {
      const leagues = db.getLeagues();
      targetLeagueId = leagues[0]?.id;
    }

    const newTeam = db.createTeam({
      league_id: targetLeagueId,
      name,
      budget: budget || 100,
      captain_name: captain_name || '',
      logo: logo || ''
    });

    res.status(201).json(newTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update team details (name, budget, captain)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.updateTeam(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete team
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteTeam(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
