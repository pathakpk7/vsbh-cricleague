const { supabase } = require('../config/supabase');
const { generateCaptainCode } = require('../utils/generateCode');

// Global lock variable to prevent concurrent bid updates
let isUpdating = false;

/**
 * Log auction activity to auction_logs table
 * @param {number} playerId - Player being bid on
 * @param {number} teamId - Team placing bid
 * @param {number} bidAmount - Amount of bid
 * @param {boolean} isWinningBid - Whether this is the final winning bid
 */
const logAuctionActivity = async (playerId, teamId, bidAmount, isWinningBid = false) => {
  try {
    await supabase
      .from('auction_logs')
      .insert({
        player_id: playerId,
        team_id: teamId,
        bid_amount: bidAmount,
        is_winning_bid: isWinningBid,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging auction activity:', error);
    // Don't throw error - logging failure shouldn't break auction
  }
};

/**
 * Start the auction
 * Anyone can start the auction (public access)
 */
const startAuction = async (req, res) => {
  try {
    // Check if auction is already active
    const { data: existingAuction } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (existingAuction && existingAuction.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction is already active' 
      });
    }

    // Get first available player
    const { data: firstPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!firstPlayer) {
      return res.status(400).json({ 
        success: false, 
        message: 'No available players found' 
      });
    }

    // Initialize or update auction state
    const auctionState = {
      current_player_id: firstPlayer.id,
      current_bid: firstPlayer.base_price || 10,
      current_team_id: null,
      timer_seconds: 30,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('auction_state')
      .upsert(auctionState, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Auction started successfully',
      data: {
        auction: data,
        currentPlayer: firstPlayer
      }
    });

  } catch (error) {
    console.error('Error starting auction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start auction' 
    });
  }
};

/**
 * Place a bid for current player
 * Requires captain code for validation, not role-based authentication
 */
const placeBid = async (req, res) => {
  // Check if another bid is processing
  if (isUpdating) {
    return res.status(429).json({ 
      success: false, 
      message: 'Another bid is processing' 
    });
  }

  // Set lock
  isUpdating = true;

  try {
    const { captainCode, teamId } = req.body;

    if (!captainCode || !teamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Captain code and team ID are required' 
      });
    }

    // Get team by ID (captain code will be generated dynamically)
    const { data: team, error: teamFetchError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamFetchError || !team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Generate or retrieve captain code dynamically
    let storedCaptainCode = team.captain_code;
    
    if (!storedCaptainCode) {
      // Generate captain code if it doesn't exist
      storedCaptainCode = `TEAM_${team.name.toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Update team with generated captain code
      const { error: updateError } = await supabase
        .from('teams')
        .update({ captain_code: storedCaptainCode })
        .eq('id', teamId);
      
      if (updateError) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to generate captain code' 
        });
      }
    }

    // Validate provided captain code against stored/generated code
    if (storedCaptainCode !== captainCode) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid captain code' 
      });
    }

    // Additional security: Ensure teamId matches the team associated with captain code
    if (team.id !== teamId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Team ID does not match captain code' 
      });
    }

    // Fetch auction_state (id = 1)
    const { data: auctionState, error: auctionError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (auctionError || !auctionState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    // Check: auction is active
    if (!auctionState.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction is not active' 
      });
    }

    // Check: timer is still running
    if (auctionState.timer_seconds <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bidding time is over'
      });
    }

    // Check: current_player exists
    if (!auctionState.current_player_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'No current player in auction' 
      });
    }

    // Fetch team details
    const { data: teams, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Fetch current player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', auctionState.current_player_id)
      .single();

    if (playerError || !player) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current player not found' 
      });
    }

    // Fetch team_players (for constraints)
    const { data: teamPlayers, error: teamPlayersError } = await supabase
      .from('team_players')
      .select(`
        players (
          id,
          name,
          role,
          is_mvp
        )
      `)
      .eq('team_id', teamId);

    if (teamPlayersError) throw teamPlayersError;

    // Validate: team budget >= current_bid + increment
    const bidIncrement = 5; // Standard bid increment
    const newBid = auctionState.current_bid + bidIncrement;
    
    if (team.budget < newBid) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient budget. Team budget: ₹${team.budget}, Required: ₹${newBid}` 
      });
    }

    // Additional validation: Ensure team has minimum buffer after bid
    const remainingBudget = team.budget - newBid;
    if (remainingBudget < 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient budget. Bid amount exceeds team budget by ₹${Math.abs(remainingBudget)}` 
      });
    }

    // Validate: team_players.length < 11
    if (teamPlayers.length >= 11) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team full (11/11 players)' 
      });
    }

    // Role constraints validation
    const roleCounts = {
      batters: teamPlayers.filter(tp => tp.players.role === 'batter').length,
      bowlers: teamPlayers.filter(tp => tp.players.role === 'bowler').length,
      all_rounders: teamPlayers.filter(tp => tp.players.role === 'all-rounder').length,
      wicketkeepers: teamPlayers.filter(tp => tp.players.role === 'wicketkeeper').length
    };

    // Validate: max 5 batters
    if (player.role === 'batter' && roleCounts.batters >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Batter limit reached (5/5)' 
      });
    }

    // Validate: max 5 bowlers (including all-rounders)
    const totalBowlers = roleCounts.bowlers + roleCounts.all_rounders;
    if ((player.role === 'bowler' || player.role === 'all-rounder') && totalBowlers >= 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bowler limit reached (5/5)' 
      });
    }

    // Validate: max 1 wicketkeeper
    if (player.role === 'wicketkeeper' && roleCounts.wicketkeepers >= 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wicketkeeper limit reached (1/1)' 
      });
    }

    // MVP constraint: max 3 MVP players
    const mvpCount = teamPlayers.filter(tp => tp.players.is_mvp).length;
    if (player.is_mvp && mvpCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'MVP limit reached (3/3)' 
      });
    }

    // �️ FINAL VALIDATION LAYER: All critical checks before database update
    // 1. Auction active
    if (!auctionState.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Auction is not active'
      });
    }

    // 2. Timer running
    if (auctionState.timer_seconds <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bidding time is over'
      });
    }

    // 3. Player exists
    if (!auctionState.current_player_id) {
      return res.status(400).json({
        success: false,
        message: 'No current player in auction'
      });
    }

    // 4. Team exists
    if (!team) {
      return res.status(400).json({
        success: false,
        message: 'Team not found'
      });
    }

    // 5. Bid validity
    if (newBid <= auctionState.current_bid) {
      return res.status(400).json({
        success: false,
        message: 'Bid must be higher than current bid'
      });
    }

    // � RACE CONDITION PREVENTION: Fetch latest auction_state from database AGAIN
    const { data: latestAuctionState, error: latestError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (latestError || !latestAuctionState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to verify latest auction state' 
      });
    }

    // Compare: Only allow incomingBid > latest.current_bid
    const incomingBid = auctionState.current_bid + 5;
    if (incomingBid <= latestAuctionState.current_bid) {
      return res.status(400).json({
        success: false,
        message: 'Bid too low or outdated'
      });
    }

    // If valid: update auction_state
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auction_state')
      .update({
        current_team_id: teamId,
        current_bid: incomingBid,
        timer_seconds: 30,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .then(({ data }) => {
        return {
          data: {
            auction: data,
            bid: {
              teamId,
              amount: newBid,
              player: player,
              team: team
            }
          }
        }
      });

  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place bid' 
    });
  } finally {
    // Always release the lock
    isUpdating = false;
  }
};

/**
 * Sell current player to highest bidder
 */
const sellPlayer = async (req, res) => {
  try {
    // Get current auction state
    const { data: auctionState, error: auctionError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (auctionError || !auctionState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    if (!auctionState.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction is not active' 
      });
    }

    if (!auctionState.current_bid_team) {
      return res.status(400).json({ 
        success: false, 
        message: 'No bids placed for current player' 
      });
    }

    // Get team budget and validate before selling
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('budget')
      .eq('id', auctionState.current_bid_team)
      .single();

    if (teamError) throw teamError;

    // Validate: Check if team has sufficient budget
    if (team.budget < auctionState.current_bid) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient budget. Team budget: ₹${team.budget}, Required: ₹${auctionState.current_bid}` 
      });
    }

    // Update player status
    const { data: updatedPlayer, error: playerError } = await supabase
      .from('players')
      .update({ 
        status: 'sold', 
        sold_price: auctionState.current_bid,
        sold_to_team: auctionState.current_bid_team,
        sold_at: new Date().toISOString()
      })
      .eq('id', auctionState.current_player_id)
      .select()
      .single();

    if (playerError) throw playerError;

    // Calculate new budget after deducting player cost
    const newBudget = team.budget - auctionState.current_bid;
    
    // Update team budget with new amount
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({ budget: newBudget })
      .eq('id', auctionState.current_bid_team)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add player to team_players with complete information
    const { data: teamPlayer, error: teamPlayerError } = await supabase
      .from('team_players')
      .insert({
        player_id: auctionState.current_player_id,
        team_id: auctionState.current_bid_team,
        sold_price: auctionState.current_bid,
        college_id: updatedPlayer.college_id || null,
        picked_by: 'AUCTION_SYSTEM',
        picked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (teamPlayerError) throw teamPlayerError;

    // Log the final player sale to auction_logs with complete information
    try {
      await supabase
        .from('auction_logs')
        .insert({
          player_id: auctionState.current_player_id,
          player_name: updatedPlayer.name,
          team_id: auctionState.current_bid_team,
          team_name: team.name,
          bid_amount: auctionState.current_bid,
          event_type: 'sold',
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging player sale:', logError);
      // Don't fail the sale if logging fails
    }

    // Get next available player from players table
    const { data: nextPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Update auction state for next player or end auction
    if (nextPlayer) {
      // Set next player in auction_state
      const { data: updatedAuction, error: updateError } = await supabase
        .from('auction_state')
        .update({
          current_player_id: nextPlayer.id,
          current_bid: nextPlayer.base_price || 10,
          current_team_id: null,
          timer_seconds: 30,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        success: true,
        message: 'Player sold successfully',
        data: {
          soldPlayer: updatedPlayer,
          teamPlayer: teamPlayer,
          nextPlayer: nextPlayer,
          auction: updatedAuction
        }
      });
    } else {
      // No players left - set is_active = false
      const { data: updatedAuction, error: updateError } = await supabase
        .from('auction_state')
        .update({
          is_active: false,
          current_player_id: null,
          current_bid: 0,
          current_team_id: null,
          auction_ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        success: true,
        message: 'Auction completed',
        data: {
          soldPlayer: updatedPlayer,
          teamPlayer: teamPlayer,
          nextPlayer: null,
          auction: updatedAuction,
          auctionEnded: true
        }
      });
    }

  } catch (error) {
    console.error('Error selling player:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sell player' 
    });
  }
};

/**
 * Skip current player (no bids placed)
 */
const skipPlayer = async (req, res) => {
  try {
    // Get current auction state
    const { data: auctionState, error: auctionError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (auctionError || !auctionState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    if (!auctionState.is_active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction is not active' 
      });
    }

    // Get next available player
    const { data: nextPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    // Update auction state for next player or end auction
    if (nextPlayer) {
      const { data: updatedAuction, error: updateError } = await supabase
        .from('auction_state')
        .update({
          current_player_id: nextPlayer.id,
          current_bid: nextPlayer.base_price || 100,
          current_bid_team: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        success: true,
        message: 'Player skipped successfully',
        data: {
          skippedPlayerId: auctionState.current_player_id,
          nextPlayer: nextPlayer,
          auction: updatedAuction
        }
      });

    } else {
      // No more players - end auction
      await supabase
        .from('auction_state')
        .update({
          is_active: false,
          current_player_id: null,
          current_bid: 0,
          current_bid_team: null,
          auction_ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      res.status(200).json({
        success: true,
        message: 'Auction ended - no more players available',
        data: {
          auctionEnded: true
        }
      });
    }

  } catch (error) {
    console.error('Error skipping player:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to skip player' 
    });
  }
};

/**
 * Stop auction (public access)
 * Pauses the auction immediately
 */
const stopAuction = async (req, res) => {
  try {
    // Get current auction state
    const { data: auctionState, error: auctionError } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (auctionError || !auctionState) {
      return res.status(400).json({ 
        success: false, 
        message: 'Auction not found' 
      });
    }

    // Set is_active = false to pause auction
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auction_state')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Auction stopped successfully',
      data: {
        auction: updatedAuction,
        stoppedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error stopping auction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to stop auction' 
    });
  }
};

/**
 * Create a new team with generated captain code
 */
const createTeam = async (req, res) => {
  try {
    const { teamName } = req.body;

    if (!teamName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team name is required' 
      });
    }

    // Normalize team name: trim spaces and convert to lowercase for checking
    const normalizedName = teamName.trim().toLowerCase();

    // Check if team name already exists
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('team_name', normalizedName)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check team name availability' 
      });
    }

    if (existingTeam) {
      return res.status(409).json({ 
        success: false, 
        message: 'Team name already taken' 
      });
    }

    // Check total teams count
    const { data: existingTeams, error: countError } = await supabase
      .from('teams')
      .select('id', { count: 'exact' });

    if (countError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to check team limit' 
      });
    }

    if (existingTeams && existingTeams.length >= 6) {
      return res.status(429).json({ 
        success: false, 
        message: 'Team limit reached' 
      });
    }

    // Generate captain code using utility
    const captainCode = generateCaptainCode();

    // Create team with default budget (use original teamName with proper casing)
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        team_name: teamName.trim(),
        captain_code: captainCode,
        budget: 1000
      })
      .select()
      .single();

    if (teamError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create team' 
      });
    }

    return res.status(201).json({
      success: true,
      teamId: team.id,
      captainCode: captainCode,
      teamName: teamName.trim()
    });

  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create team' 
    });
  }
};

/**
 * Login captain using captain code
 */
const loginCaptain = async (req, res) => {
  try {
    const { captainCode } = req.body;

    if (!captainCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Captain code is required' 
      });
    }

    // Find team using captain code
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_code', captainCode)
      .single();

    if (teamError || !team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid captain code or team not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Captain login successful',
      data: {
        teamId: team.id,
        teamName: team.name,
        captainCode: team.captain_code,
        budget: team.budget,
        logo: team.logo,
        created_at: team.created_at
      }
    });

  } catch (error) {
    console.error('Error logging in captain:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to login captain' 
    });
  }
};

/**
 * Get auction history from logs
 */
const getAuctionHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query; // Default limit of 50, configurable via query param

    // Fetch auction logs with player and team information
    const { data: logs, error: logsError } = await supabase
      .from('auction_logs')
      .select(`
        id,
        player_id,
        player_name,
        team_id,
        team_name,
        bid_amount,
        event_type,
        timestamp
      `)
      .order('created_at', { ascending: false }) // DESC order
      .limit(limit > 0 ? limit : 50); // Apply limit if valid, default to 50

    if (logsError) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch auction history' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Auction history retrieved successfully',
      data: {
        logs: logs || [],
        count: logs ? logs.length : 0,
        limit: limit > 0 ? limit : 50
      }
    });

  } catch (error) {
    console.error('Error fetching auction history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch auction history' 
    });
  }
};

module.exports = {
  startAuction,
  placeBid,
  sellPlayer,
  skipPlayer,
  stopAuction,
  createTeam,
  loginCaptain,
  getAuctionHistory
};