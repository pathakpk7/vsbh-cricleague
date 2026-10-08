const express = require('express');
const router = express.Router();
const db = require('../services/db');

// Get all matches (optionally filtered by leagueId)
router.get('/', async (req, res) => {
  try {
    if (!db.data.matches || db.data.matches.length === 0) {
      await db.syncFromSupabase();
    }
    const { leagueId } = req.query;
    const matches = db.getMatches(leagueId);
    res.json({ success: true, data: matches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single match by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const match = db.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new match (league admin)
router.post('/', (req, res) => {
  try {
    const { league_id, team1_id, team2_id, team1_name, team2_name, venue, match_date } = req.body;
    
    if (!league_id) {
      return res.status(400).json({ success: false, message: 'league_id is required' });
    }

    const match = db.createMatch({
      league_id,
      team1_id,
      team2_id,
      team1_name,
      team2_name,
      venue,
      match_date
    });

    if (global.io) {
      global.io.emit('match-updated', match);
    }

    res.status(201).json({ success: true, data: match, message: 'Match created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Live update match score & play (Editable only by League Admin)
router.put('/:id/score', (req, res) => {
  try {
    const { id } = req.params;
    const match = db.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const updated = db.updateMatchScoreAndPlay(id, req.body);

    // Broadcast live match update via socket.io
    if (global.io) {
      global.io.emit('match-score-update', updated);
      global.io.to(`league-${match.league_id}`).emit('match-score-update', updated);
    }

    res.json({
      success: true,
      message: 'Match score updated live',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add ball commentary (Editable only by League Admin)
router.post('/:id/commentary', (req, res) => {
  try {
    const { id } = req.params;
    const { ball, over, runs, isWicket, text } = req.body;
    const match = db.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const updated = db.addMatchBallCommentary(id, { ball, over, runs, isWicket, text });

    if (global.io) {
      global.io.emit('match-commentary-update', { matchId: id, commentary: updated.commentary[0] });
    }

    res.json({
      success: true,
      message: 'Commentary added',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update live play documentation / notes (Editable only by League Admin)
router.put('/:id/documentation', (req, res) => {
  try {
    const { id } = req.params;
    const { play_documentation } = req.body;
    const match = db.getMatchById(id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const updated = db.updateMatchScoreAndPlay(id, { play_documentation });

    if (global.io) {
      global.io.emit('match-documentation-update', { matchId: id, play_documentation });
    }

    res.json({
      success: true,
      message: 'Live play documentation updated',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete match
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteMatch(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    res.json({ success: true, message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
