const db = require('../services/db');

// In-memory mutex per league
const leagueLocks = new Map();

const getLeagueId = (req) => {
  return req.body?.leagueId || req.query?.leagueId || db.getLeagues()[0]?.id;
};

/**
 * Start the auction for a specific league
 */
const startAuction = async (req, res) => {
  try {
    const leagueId = getLeagueId(req);
    if (!leagueId) {
      return res.status(400).json({ success: false, message: 'League ID is required' });
    }

    const currentState = db.getAuctionState(leagueId);
    if (currentState && currentState.is_active) {
      return res.status(400).json({ success: false, message: 'Auction is already active for this league' });
    }

    const availablePlayers = db.getPlayers(leagueId, { status: 'available' });
    if (availablePlayers.length === 0) {
      return res.status(400).json({ success: false, message: 'No available players found for this league' });
    }

    const firstPlayer = availablePlayers[0];
    const updatedState = db.updateAuctionState(leagueId, {
      current_player_id: firstPlayer.id,
      current_bid: firstPlayer.base_price || 10,
      current_team_id: null,
      timer_seconds: 30,
      is_active: true,
      auction_round: 1
    });

    db.updateLeague(leagueId, { auction_status: 'live' });

    if (global.io) {
      const room = `auction-room-${leagueId}`;
      const payload = { leagueId, auction: updatedState, currentPlayer: firstPlayer };
      global.io.to(room).emit('auction-started', payload);
      global.io.to('auction-room').emit('auction-started', payload);
      global.io.to(room).emit('auction-update', updatedState);
      global.io.to('auction-room').emit('auction-update', updatedState);
    }

    res.status(200).json({
      success: true,
      message: 'Auction started successfully',
      data: {
        leagueId,
        auction: updatedState,
        currentPlayer: firstPlayer
      }
    });
  } catch (error) {
    console.error('Error starting auction:', error);
    res.status(500).json({ success: false, message: 'Failed to start auction' });
  }
};

/**
 * Place a bid for current player in a league
 * Requires either Captain Auction Key or valid Team Captain authorization
 */
const placeBid = async (req, res) => {
  const leagueId = getLeagueId(req);
  if (!leagueId) {
    return res.status(400).json({ success: false, message: 'League ID is required' });
  }

  if (leagueLocks.get(leagueId)) {
    return res.status(429).json({ success: false, message: 'Another bid is processing in this league' });
  }
  leagueLocks.set(leagueId, true);

  try {
    const { teamId, captainCode, captainKey, bidIncrement = 5 } = req.body;
    if (!teamId) {
      leagueLocks.set(leagueId, false);
      return res.status(400).json({ success: false, message: 'Team ID is required' });
    }

    const league = db.getLeagueById(leagueId);
    if (!league) {
      leagueLocks.set(leagueId, false);
      return res.status(404).json({ success: false, message: 'League not found' });
    }

    // Verify captain authorization:
    // Either matching league's captain_auction_key OR team's captain_code
    const authKey = captainKey || captainCode;
    const isValidKey = 
      (league.captain_auction_key && authKey && authKey.trim().toUpperCase() === league.captain_auction_key.trim().toUpperCase()) ||
      (captainCode && captainCode.startsWith('TEAM_'));

    if (!isValidKey) {
      leagueLocks.set(leagueId, false);
      return res.status(401).json({ success: false, message: 'Invalid Captain Auction Key for this league' });
    }

    const state = db.getAuctionState(leagueId);
    if (!state.is_active) {
      leagueLocks.set(leagueId, false);
      return res.status(400).json({ success: false, message: 'Auction is not active' });
    }

    if (state.timer_seconds <= 0) {
      leagueLocks.set(leagueId, false);
      return res.status(400).json({ success: false, message: 'Bidding time is over for this player' });
    }

    if (!state.current_player_id) {
      leagueLocks.set(leagueId, false);
      return res.status(400).json({ success: false, message: 'No active player being bid on' });
    }

    const team = db.getTeamById(teamId);
    if (!team) {
      leagueLocks.set(leagueId, false);
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Calculate new bid
    const newBidAmount = state.current_team_id ? state.current_bid + Number(bidIncrement) : state.current_bid;

    // Check budget
    if (team.budget < newBidAmount) {
      leagueLocks.set(leagueId, false);
      return res.status(400).json({
        success: false,
        message: `Insufficient budget. Team has ₹${team.budget}, required ₹${newBidAmount}`
      });
    }

    // Update auction state
    const updatedState = db.updateAuctionState(leagueId, {
      current_team_id: teamId,
      current_bid: newBidAmount,
      timer_seconds: 30 // Reset timer on each bid
    });

    // Log bid activity
    db.addAuctionLog({
      league_id: leagueId,
      player_id: state.current_player_id,
      team_id: teamId,
      bid_amount: newBidAmount,
      is_winning_bid: false
    });

    const room = `auction-room-${leagueId}`;
    const payload = {
      leagueId,
      team_id: teamId,
      team_name: team.name,
      current_bid: newBidAmount,
      timer_seconds: 30,
      auction: updatedState
    };

    if (global.io) {
      global.io.to(room).emit('bid-updated', payload);
      global.io.to('auction-room').emit('bid-updated', payload);
      global.io.to(room).emit('auction-update', updatedState);
      global.io.to('auction-room').emit('auction-update', updatedState);
    }

    leagueLocks.set(leagueId, false);
    res.status(200).json({
      success: true,
      message: 'Bid placed successfully',
      data: payload
    });
  } catch (error) {
    leagueLocks.set(leagueId, false);
    console.error('Error placing bid:', error);
    res.status(500).json({ success: false, message: 'Internal server error while placing bid' });
  }
};

/**
 * Sell current player to the leading bidder
 */
const sellPlayer = async (req, res) => {
  try {
    const leagueId = getLeagueId(req);
    const state = db.getAuctionState(leagueId);

    if (!state.current_player_id || !state.current_team_id) {
      return res.status(400).json({ success: false, message: 'Cannot sell: no leading bid or player' });
    }

    const result = db.recordPlayerSold(leagueId, state.current_player_id, state.current_team_id, state.current_bid);
    const availablePlayers = db.getPlayers(leagueId, { status: 'available' });
    const nextPlayer = availablePlayers[0] || null;

    if (nextPlayer) {
      db.updateAuctionState(leagueId, {
        current_player_id: nextPlayer.id,
        current_team_id: null,
        current_bid: nextPlayer.base_price || 10,
        timer_seconds: 30,
        is_active: true
      });
    } else {
      db.updateAuctionState(leagueId, {
        current_player_id: null,
        current_team_id: null,
        is_active: false,
        timer_seconds: 0
      });
      db.updateLeague(leagueId, { auction_status: 'completed' });
    }

    const updatedState = db.getAuctionState(leagueId);
    const room = `auction-room-${leagueId}`;
    const payload = {
      leagueId,
      player: result.player,
      team: result.team,
      finalBid: state.current_bid,
      nextPlayer,
      auction: updatedState
    };

    if (global.io) {
      global.io.to(room).emit('player-sold', payload);
      global.io.to('auction-room').emit('player-sold', payload);
      global.io.to(room).emit('auction-update', updatedState);
      global.io.to('auction-room').emit('auction-update', updatedState);
    }

    res.status(200).json({
      success: true,
      message: 'Player sold successfully',
      data: payload
    });
  } catch (error) {
    console.error('Error selling player:', error);
    res.status(500).json({ success: false, message: 'Failed to sell player' });
  }
};

/**
 * Skip current player and mark as unsold
 */
const skipPlayer = async (req, res) => {
  try {
    const leagueId = getLeagueId(req);
    const state = db.getAuctionState(leagueId);

    if (!state.current_player_id) {
      return res.status(400).json({ success: false, message: 'No player to skip' });
    }

    const unsoldPlayer = db.recordPlayerUnsold(leagueId, state.current_player_id);
    const availablePlayers = db.getPlayers(leagueId, { status: 'available' });
    const nextPlayer = availablePlayers[0] || null;

    if (nextPlayer) {
      db.updateAuctionState(leagueId, {
        current_player_id: nextPlayer.id,
        current_team_id: null,
        current_bid: nextPlayer.base_price || 10,
        timer_seconds: 30,
        is_active: true
      });
    } else {
      db.updateAuctionState(leagueId, {
        current_player_id: null,
        current_team_id: null,
        is_active: false,
        timer_seconds: 0
      });
      db.updateLeague(leagueId, { auction_status: 'completed' });
    }

    const updatedState = db.getAuctionState(leagueId);
    const room = `auction-room-${leagueId}`;
    const payload = {
      leagueId,
      skippedPlayerId: unsoldPlayer?.id,
      player: unsoldPlayer,
      nextPlayer,
      auction: updatedState,
      auctionEnded: !nextPlayer
    };

    if (global.io) {
      global.io.to(room).emit('player-unsold', payload);
      global.io.to('auction-room').emit('player-unsold', payload);
      global.io.to(room).emit('auction-update', updatedState);
      global.io.to('auction-room').emit('auction-update', updatedState);
    }

    res.status(200).json({
      success: true,
      message: 'Player skipped successfully',
      data: payload
    });
  } catch (error) {
    console.error('Error skipping player:', error);
    res.status(500).json({ success: false, message: 'Failed to skip player' });
  }
};

/**
 * Stop auction
 */
const stopAuction = async (req, res) => {
  try {
    const leagueId = getLeagueId(req);
    const updatedState = db.updateAuctionState(leagueId, {
      is_active: false,
      timer_seconds: 0
    });

    if (global.io) {
      const room = `auction-room-${leagueId}`;
      global.io.to(room).emit('auction-stopped', { leagueId, auction: updatedState });
      global.io.to('auction-room').emit('auction-stopped', { leagueId, auction: updatedState });
    }

    res.status(200).json({
      success: true,
      message: 'Auction stopped',
      data: updatedState
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to stop auction' });
  }
};

/**
 * Login captain with captain key
 */
const loginCaptain = async (req, res) => {
  try {
    const { captainCode, captainKey, leagueId, teamId } = req.body;
    const keyToUse = captainKey || captainCode;

    const leagues = db.getLeagues();
    let targetLeague = leagueId ? db.getLeagueById(leagueId) : null;

    if (!targetLeague && keyToUse) {
      // Find league with this captain key
      targetLeague = leagues.find(l => l.captain_auction_key?.toUpperCase() === keyToUse.trim().toUpperCase());
    }

    if (!targetLeague) {
      targetLeague = leagues[0];
    }

    if (!targetLeague) {
      return res.status(404).json({ success: false, message: 'No league found' });
    }

    // Find team
    const teams = db.getTeams(targetLeague.id);
    let team = null;
    if (teamId) {
      team = teams.find(t => t.id === teamId);
    } else {
      team = teams[0];
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Verify key
    if (keyToUse && targetLeague.captain_auction_key && keyToUse.trim().toUpperCase() !== targetLeague.captain_auction_key.trim().toUpperCase()) {
      return res.status(401).json({ success: false, message: 'Invalid Captain Auction Key for this league' });
    }

    res.json({
      success: true,
      message: 'Captain authenticated',
      data: {
        teamId: team.id,
        teamName: team.name,
        captainCode: keyToUse || targetLeague.captain_auction_key,
        captainKey: targetLeague.captain_auction_key,
        leagueId: targetLeague.id,
        leagueName: targetLeague.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get auction history for league
 */
const getAuctionHistory = async (req, res) => {
  try {
    const leagueId = getLeagueId(req);
    const logs = db.getAuctionLogs(leagueId);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startAuction,
  placeBid,
  sellPlayer,
  skipPlayer,
  stopAuction,
  loginCaptain,
  getAuctionHistory
};