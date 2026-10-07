const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { 
  startAuction, 
  placeBid, 
  sellPlayer, 
  skipPlayer,
  stopAuction,
  loginCaptain,
  getAuctionHistory,
  getAuctionPools
} = require('../controllers/auctionController');

// Get current auction state (by leagueId)
router.get('/state', async (req, res) => {
  try {
    let leagueId = req.query.leagueId;
    if (!leagueId) {
      const leagues = db.getLeagues();
      leagueId = leagues[0]?.id;
    }

    if (!leagueId) {
      return res.status(404).json({ success: false, message: 'No league found' });
    }

    const state = db.getAuctionState(leagueId);
    res.json({
      success: true,
      data: state,
      message: 'Auction state retrieved'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update auction state
router.put('/state', async (req, res) => {
  try {
    let leagueId = req.body.leagueId || req.query.leagueId;
    if (!leagueId) {
      const leagues = db.getLeagues();
      leagueId = leagues[0]?.id;
    }
    const updated = db.updateAuctionState(leagueId, req.body);
    res.json({ success: true, data: updated, message: 'Auction state updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Process player sale
router.post('/sell-player', sellPlayer);

// Process player skip
router.post('/skip-player', skipPlayer);

// Start auction
router.post('/start', startAuction);

// Stop auction
router.post('/stop', stopAuction);

// Place bid
router.post('/place-bid', placeBid);

// Captain login
router.post('/login-captain', loginCaptain);

// Auction history
router.get('/history', getAuctionHistory);

// Auction disclosed category pools
router.get('/pools', getAuctionPools);

// Reset auction system for a league (Admin only)
router.post('/reset', async (req, res) => {
  try {
    let leagueId = req.body.leagueId || req.query.leagueId;
    if (!leagueId) {
      const leagues = db.getLeagues();
      leagueId = leagues[0]?.id;
    }

    const resetState = db.resetAuction(leagueId);

    if (global.io) {
      const room = `auction-room-${leagueId}`;
      global.io.to(room).emit('auction-reset', { leagueId, auction: resetState });
      global.io.to('auction-room').emit('auction-reset', { leagueId, auction: resetState });
    }

    res.json({
      success: true,
      message: 'Auction reset successfully for this league',
      data: resetState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
