const db = require('./db');

let timerInterval = null;
let isTimerRunning = false;

/**
 * Start the multi-league auction timer service
 * @param {Object} io - Socket.IO instance
 */
const startAuctionTimer = (io) => {
  if (isTimerRunning && timerInterval) {
    return;
  }

  isTimerRunning = true;
  console.log('Starting multi-league auction timer service');

  timerInterval = setInterval(async () => {
    try {
      const leagues = db.getLeagues();

      for (const league of leagues) {
        const leagueId = league.id;
        const state = db.getAuctionState(leagueId);

        if (state && state.is_active) {
          const newTimerSeconds = Math.max(0, (state.timer_seconds || 30) - 1);
          db.updateAuctionState(leagueId, { timer_seconds: newTimerSeconds });

          const roomName = `auction-room-${leagueId}`;
          const timerPayload = {
            leagueId,
            timer_seconds: newTimerSeconds,
            is_active: true,
            current_bid: state.current_bid,
            current_team_id: state.current_team_id,
            current_player_id: state.current_player_id
          };

          if (io) {
            io.to(roomName).emit('timer-update', timerPayload);
            io.to('auction-room').emit('timer-update', timerPayload);
          }

          // If timer expires
          if (newTimerSeconds === 0) {
            if (state.current_team_id && state.current_player_id) {
              // Sell player to leading bidder
              const finalBid = state.current_bid;
              const result = db.recordPlayerSold(leagueId, state.current_player_id, state.current_team_id, finalBid);

              // Get next available player
              const remainingPlayers = db.getPlayers(leagueId, { status: 'available' });
              const nextPlayer = remainingPlayers[0] || null;

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

              const updatedAuction = db.getAuctionState(leagueId);
              const soldPayload = {
                leagueId,
                player: result.player,
                team: result.team,
                finalBid,
                nextPlayer,
                auction: updatedAuction
              };

              if (io) {
                io.to(roomName).emit('player-sold', soldPayload);
                io.to('auction-room').emit('player-sold', soldPayload);
              }
              console.log(`[League ${league.name}] Player ${result.player?.name} SOLD to team ${result.team?.name} for ₹${finalBid}`);
            } else if (state.current_player_id) {
              // No bid placed - mark unsold
              const unsoldPlayer = db.recordPlayerUnsold(leagueId, state.current_player_id);
              const remainingPlayers = db.getPlayers(leagueId, { status: 'available' });
              const nextPlayer = remainingPlayers[0] || null;

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

              const updatedAuction = db.getAuctionState(leagueId);
              const unsoldPayload = {
                leagueId,
                skippedPlayerId: unsoldPlayer?.id,
                player: unsoldPlayer,
                nextPlayer,
                auction: updatedAuction,
                auctionEnded: !nextPlayer
              };

              if (io) {
                io.to(roomName).emit('player-unsold', unsoldPayload);
                io.to('auction-room').emit('player-unsold', unsoldPayload);
              }
              console.log(`[League ${league.name}] Player ${unsoldPlayer?.name} UNSOLD`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Auction timer service error:', error);
    }
  }, 1000);
};

const stopAuctionTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
  }
};

module.exports = {
  startAuctionTimer,
  stopAuctionTimer
};