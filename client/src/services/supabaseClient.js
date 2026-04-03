import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper functions for common operations
export const supabaseService = {
  // Players
  async getPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getAvailablePlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addPlayer(player) {
    const { data, error } = await supabase
      .from('players')
      .insert([player])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Teams
  async getTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_players (
          player_id,
          sold_price,
          college_id,
          picked_by,
          picked_at,
          players (
            id,
            name,
            role,
            college_id,
            year,
            is_mvp,
            base_price,
            sold_price
          )
        )
      `);
    
    if (error) throw error;
    return data;
  },

  async getTeam(teamId) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_players (
          player_id,
          sold_price,
          college_id,
          picked_by,
          picked_at,
          players (
            id,
            name,
            role,
            college_id,
            year,
            is_mvp,
            base_price,
            sold_price
          )
        )
      `)
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async initializeTeams() {
    const teams = [
      { name: 'Warriors', budget: 100, logo: 'warriors.png' },
      { name: 'Titans', budget: 100, logo: 'titans.png' },
      { name: 'Royals', budget: 100, logo: 'royals.png' },
      { name: 'Superstars', budget: 100, logo: 'superstars.png' },
      { name: 'Champions', budget: 100, logo: 'champions.png' },
      { name: 'Legends', budget: 100, logo: 'legends.png' }
    ];

    const { data, error } = await supabase
      .from('teams')
      .insert(teams)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Auction
  async getAuctionState() {
    const { data, error } = await supabase
      .from('auction_state')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateAuctionState(updates) {
    const { data, error } = await supabase
      .from('auction_state')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async sellPlayer(playerId, teamId, soldPrice, collegeId, pickedBy) {
    // Update player status
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .update({ 
        status: 'sold', 
        sold_price: soldPrice, 
        sold_to_team: teamId,
        sold_at: new Date().toISOString()
      })
      .eq('id', playerId)
      .select();

    if (playerError) throw playerError;

    // Add player to team with tracking
    const { data: teamPlayerData, error: teamPlayerError } = await supabase
      .from('team_players')
      .insert([{ 
        player_id: playerId, 
        team_id: teamId, 
        sold_price: soldPrice,
        college_id: collegeId,
        picked_by: pickedBy,
        picked_at: new Date().toISOString()
      }])
      .select();

    if (teamPlayerError) throw teamPlayerError;

    // Update team budget
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('budget')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const newBudget = teamData.budget - soldPrice;
    
    await supabase
      .from('teams')
      .update({ budget: newBudget })
      .eq('id', teamId);

    return { 
      player: playerData[0], 
      team_player: teamPlayerData[0],
      new_budget: newBudget 
    };
  },

  async validateTeamConstraints(teamId) {
    const { data: teamPlayers, error } = await supabase
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

    if (error) throw error;

    const constraints = {
      total_players: teamPlayers.length,
      batters: teamPlayers.filter(tp => tp.players.role === 'batter').length,
      bowlers: teamPlayers.filter(tp => tp.players.role === 'bowler').length,
      all_rounders: teamPlayers.filter(tp => tp.players.role === 'all-rounder').length,
      wicketkeepers: teamPlayers.filter(tp => tp.players.role === 'wicketkeeper').length,
      mvp_players: teamPlayers.filter(tp => tp.players.is_mvp).length
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

    if (constraints.mvp_players >= 3) {
      validation.is_valid = false;
      validation.errors.push('Maximum 3 MVP players allowed');
    }

    return { constraints, validation };
  },

  // Authentication
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signUp(email, password, options = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Realtime subscriptions
  subscribeToTable(tableName, callback) {
    return supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName }, 
        callback
      )
      .subscribe();
  },

  unsubscribeFromTable(subscription) {
    supabase.removeChannel(subscription);
  }
};

export default supabaseService;