const db = require('../services/db');

/**
 * Reset auction system for a league (or default league)
 */
const resetAuction = async (req, res) => {
  try {
    const leagueId = req.body?.leagueId || req.query?.leagueId || db.getLeagues()[0]?.id;
    if (!leagueId) {
      return res.status(404).json({ success: false, message: 'No league found to reset' });
    }

    const resetState = db.resetAuction(leagueId);

    if (global.io) {
      const room = `auction-room-${leagueId}`;
      global.io.to(room).emit('auction-reset', { leagueId, auction: resetState });
      global.io.to('auction-room').emit('auction-reset', { leagueId, auction: resetState });
    }

    res.json({
      success: true,
      message: 'League auction system reset successful',
      leagueId,
      data: resetState
    });
  } catch (error) {
    console.error('Auction reset error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset auction system'
    });
  }
};

module.exports = {
  resetAuction
};
