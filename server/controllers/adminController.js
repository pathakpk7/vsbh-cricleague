const supabase = require('../config/supabase');

/**
 * Reset entire auction system
 * - Delete auction_logs
 * - Delete team_players
 * - Reset players (set sold status to false)
 * - Reset teams budget
 * - Reset auction_state
 */
const resetAuction = async (req, res) => {
  try {
    console.log('Starting auction system reset...');
    
    // 1. Delete auction_logs
    console.log('Deleting auction logs...');
    const { error: logsError } = await supabase
      .from('auction_logs')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (logsError) {
      console.error('Error deleting auction logs:', logsError);
      throw new Error('Failed to delete auction logs');
    }
    
    // 2. Delete team_players
    console.log('Deleting team players...');
    const { error: teamPlayersError } = await supabase
      .from('team_players')
      .delete()
      .neq('id', 0); // Delete all records
    
    if (teamPlayersError) {
      console.error('Error deleting team players:', teamPlayersError);
      throw new Error('Failed to delete team players');
    }
    
    // 3. Reset players (set sold status to false and clear team assignments)
    console.log('Resetting players...');
    const { error: playersError } = await supabase
      .from('players')
      .update({
        sold: false,
        sold_to_team: null,
        sold_price: null,
        sold_at: null
      })
      .neq('id', 0); // Update all records
    
    if (playersError) {
      console.error('Error resetting players:', playersError);
      throw new Error('Failed to reset players');
    }
    
    // 4. Reset teams budget (set to default budget)
    console.log('Resetting teams budget...');
    const DEFAULT_BUDGET = 10000000; // 1 crore in rupees
    const { error: teamsError } = await supabase
      .from('teams')
      .update({
        budget: DEFAULT_BUDGET,
        total_spent: 0,
        players_count: 0
      })
      .neq('id', 0); // Update all records
    
    if (teamsError) {
      console.error('Error resetting teams budget:', teamsError);
      throw new Error('Failed to reset teams budget');
    }
    
    // 5. Reset auction_state
    console.log('Resetting auction state...');
    const { error: stateError } = await supabase
      .from('auction_state')
      .update({
        current_player_id: null,
        current_team_id: null,
        current_bid: 10,
        timer_seconds: 30,
        is_active: false,
        auction_round: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
    
    if (stateError) {
      console.error('Error resetting auction state:', stateError);
      throw new Error('Failed to reset auction state');
    }
    
    console.log('Auction system reset completed successfully!');
    
    res.json({
      success: true,
      message: 'System reset successful',
      reset_operations: [
        'Deleted auction logs',
        'Deleted team players',
        'Reset players status',
        'Reset teams budget',
        'Reset auction state'
      ]
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
