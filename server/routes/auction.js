const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { 
  startAuction, 
  placeBid, 
  sellPlayer, 
  skipPlayer,
  stopAuction,
  createTeam,
  loginCaptain,
  getAuctionHistory 
} = require('../controllers/auctionController');

// Get current auction state
router.get('/state', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // If no auction state exists, create default
    if (!data) {
      const defaultState = {
        id: 1,
        current_player_id: null,
        current_team_id: null,
        current_bid: 10,
        timer_seconds: 30,
        is_active: false,
        auction_round: 1
      };
      
      const { data: newState, error: insertError } = await supabase
        .from('auction_state')
        .insert(defaultState)
        .select();
        
      if (insertError) throw insertError;
      res.json({
        success: true,
        data: newState[0],
        message: 'Default auction state created'
      });
    } else {
      res.json({
        success: true,
        data: data,
        message: 'Auction state retrieved'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Update auction state
router.put('/state', async (req, res) => {
  try {
    const { current_player_id, current_team_id, current_bid, timer_seconds, is_active, auction_round } = req.body;
    
    const { data, error } = await supabase
      .from('auction_state')
      .update({
        current_player_id,
        current_team_id,
        current_bid,
        timer_seconds,
        is_active,
        auction_round,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select();

    if (error) throw error;
    
    res.json({
      success: true,
      data: data[0],
      message: 'Auction state updated'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Process player sale (using controller)
router.post('/sell-player', async (req, res) => {
  try {
    await sellPlayer(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Validate team constraints
router.get('/validate-team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const { data: teamPlayers, error } = await supabase
      .from('team_players')
      .select(`
        players (
          id,
          name,
          role
        )
      `)
      .eq('team_id', teamId);

    if (error) throw error;

    const constraints = {
      total_players: teamPlayers.length,
      batters: teamPlayers.filter(tp => tp.players.role === 'batter').length,
      bowlers: teamPlayers.filter(tp => tp.players.role === 'bowler').length,
      all_rounders: teamPlayers.filter(tp => tp.players.role === 'all-rounder').length,
      wicketkeepers: teamPlayers.filter(tp => tp.players.role === 'wicketkeeper').length
    };

    const validation = {
      is_valid: true,
      errors: []
    };

    // Check constraints
    if (constraints.total_players >= 11) {
      validation.is_valid = false;
      validation.errors.push('Maximum 11 players allowed');
    }

    if (constraints.batters >= 5) {
      validation.is_valid = false;
      validation.errors.push('Maximum 5 batters allowed');
    }

    if ((constraints.bowlers + constraints.all_rounders) >= 5) {
      validation.is_valid = false;
      validation.errors.push('Maximum 5 bowlers (including all-rounders) allowed');
    }

    if (constraints.wicketkeepers >= 1) {
      validation.is_valid = false;
      validation.errors.push('Maximum 1 wicketkeeper allowed');
    }

    res.json({ 
      success: true,
      data: { constraints, validation },
      message: 'Team validation completed'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Start auction (using controller)
 * POST /start
 */
router.post('/start', async (req, res) => {
  try {
    await startAuction(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Place a bid (using controller)
 * POST /place-bid
 */
router.post('/place-bid', async (req, res) => {
  try {
    await placeBid(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Sell current player (using controller)
 * POST /sell
 */
router.post('/sell', async (req, res) => {
  try {
    await sellPlayer(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Login captain using captain code (using controller)
 * POST /login-captain
 */
router.post('/login-captain', async (req, res) => {
  try {
    await loginCaptain(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Create a new team (using controller)
 * POST /create-team
 */
router.post('/create-team', async (req, res) => {
  try {
    await createTeam(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Skip current player (using controller)
 * POST /skip
 */
router.post('/skip', async (req, res) => {
  try {
    await skipPlayer(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Get auction history (using controller)
 * GET /history
 */
router.get('/history', async (req, res) => {
  try {
    await getAuctionHistory(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
