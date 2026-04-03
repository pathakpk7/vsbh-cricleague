const { supabase } = require('../config/supabase');
const { sellPlayer } = require('../controllers/auctionController');

// Global flag to ensure only one timer runs
let timerInterval = null;
let isTimerRunning = false;

/**
 * Start the auction timer service
 * @param {Object} io - Socket.IO instance
 */
const startAuctionTimer = (io) => {
  // Prevent duplicate timers
  if (isTimerRunning && timerInterval) {
    console.log('Auction timer already running');
    return;
  }

  isTimerRunning = true;
  console.log('Starting auction timer service');

  timerInterval = setInterval(async () => {
    try {
      // Fetch auction_state (id = 1)
      const { data: auctionState, error: auctionError } = await supabase
        .from('auction_state')
        .select('*')
        .eq('id', 1)
        .single();

      if (auctionError || !auctionState) {
        console.error('Error fetching auction state:', auctionError);
        return;
      }

      // IF auction is active
      if (auctionState.is_active) {
        // Decrease timer_seconds by 1
        const newTimerSeconds = Math.max(0, auctionState.timer_seconds - 1);

        // Update in database
        const { data: updatedState, error: updateError } = await supabase
          .from('auction_state')
          .update({
            timer_seconds: newTimerSeconds,
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating timer:', updateError);
          return;
        }

        // Emit socket: timer-update
        io.to('auction-room').emit('timer-update', updatedState);

        // IF timer reaches 0
        if (newTimerSeconds === 0) {
          // IF current_team_id exists
          if (auctionState.current_team_id) {
            try {
              // Call sellPlayer()
              const mockReq = { body: {} };
              const mockRes = {
                status: (code) => ({
                  json: (response) => {
                    if (response.success) {
                      io.to('auction-room').emit('player-sold', response.data);
                    } else {
                      io.to('auction-room').emit('error', response.message);
                    }
                  }
                })
              };

              await sellPlayer(mockReq, mockRes);
              console.log('Player sold automatically when timer expired');
            } catch (error) {
              console.error('Error auto-selling player:', error);
              io.to('auction-room').emit('error', 'Failed to sell player');
            }
          } else {
            // ELSE: mark player as unsold
            try {
              // Mark current player as unsold
              if (auctionState.current_player_id) {
                await supabase
                  .from('players')
                  .update({
                    status: 'unsold',
                    sold_at: new Date().toISOString()
                  })
                  .eq('id', auctionState.current_player_id);

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
                  const { data: updatedAuction } = await supabase
                    .from('auction_state')
                    .update({
                      current_player_id: nextPlayer.id,
                      current_bid: nextPlayer.base_price || 10,
                      current_team_id: null,
                      timer_seconds: 30,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', 1)
                    .select()
                    .single();

                  io.to('auction-room').emit('player-unsold', {
                    skippedPlayerId: auctionState.current_player_id,
                    nextPlayer: nextPlayer,
                    auction: updatedAuction
                  });
                } else {
                  // No more players - end auction
                  await supabase
                    .from('auction_state')
                    .update({
                      is_active: false,
                      current_player_id: null,
                      current_bid: 0,
                      current_team_id: null,
                      timer_seconds: 0,
                      auction_ended_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', 1);

                  io.to('auction-room').emit('player-unsold', {
                    skippedPlayerId: auctionState.current_player_id,
                    auctionEnded: true
                  });
                }
              }

              console.log('Player marked as unsold (no bids)');
            } catch (error) {
              console.error('Error marking player unsold:', error);
              io.to('auction-room').emit('error', 'Failed to skip player');
            }
          }
        }
      }
    } catch (error) {
      console.error('Auction timer error:', error);
      io.to('auction-room').emit('error', 'Timer service error');
    }
  }, 1000); // Runs every 1 second

  console.log('Auction timer started successfully');
};

/**
 * Stop the auction timer service
 */
const stopAuctionTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
    console.log('Auction timer stopped');
  }
};

/**
 * Get timer status
 */
const getTimerStatus = () => {
  return {
    isRunning: isTimerRunning,
    intervalId: timerInterval
  };
};

module.exports = {
  startAuctionTimer,
  stopAuctionTimer,
  getTimerStatus
};