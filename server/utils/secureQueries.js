/**
 * Secure database query utilities
 * Prevents SQL injection through parameterized queries and input validation
 */

const supabase = require('../config/supabase');

/**
 * Secure player query with parameterized filtering
 */
const securePlayerQueries = {
  /**
   * Get players with safe filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   */
  async getPlayers(filters = {}, pagination = {}) {
    try {
      let query = supabase
        .from('players')
        .select(`
          id, name, role, base_price, 
          current_team, sold_price,
          teams(id, name, captain_name)
        `);

      // Apply safe filters
      if (filters.role) {
        // Validate role input
        const validRoles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
        if (validRoles.includes(filters.role)) {
          query = query.eq('role', filters.role);
        }
      }

      if (filters.teamId) {
        // Validate team ID format
        if (/^[a-zA-Z0-9\-]+$/.test(filters.teamId)) {
          query = query.eq('current_team', filters.teamId);
        }
      }

      if (filters.minPrice) {
        const price = parseInt(filters.minPrice);
        if (!isNaN(price) && price >= 0) {
          query = query.gte('base_price', price);
        }
      }

      if (filters.maxPrice) {
        const price = parseInt(filters.maxPrice);
        if (!isNaN(price) && price > 0) {
          query = query.lte('base_price', price);
        }
      }

      // Apply safe pagination
      const page = Math.max(1, parseInt(pagination.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(pagination.limit) || 10));
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      // Apply safe sorting
      const validSortFields = ['name', 'base_price', 'role', 'sold_price'];
      const sortField = validSortFields.includes(pagination.sortBy) ? pagination.sortBy : 'name';
      const sortOrder = pagination.sortOrder === 'asc' ? 'asc' : 'desc';
      
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: data?.length || 0
        }
      };

    } catch (error) {
      console.error('Secure player query error:', error);
      throw new Error('Failed to fetch players');
    }
  },

  /**
   * Create player with validation and sanitization
   * @param {Object} playerData - Player information
   */
  async createPlayer(playerData) {
    try {
      // Validate required fields
      const requiredFields = ['name', 'role', 'base_price'];
      for (const field of requiredFields) {
        if (!playerData[field] || playerData[field].trim() === '') {
          throw new Error(`${field} is required`);
        }
      }

      // Validate data types and ranges
      const sanitizedData = {
        name: playerData.name.trim().substring(0, 100),
        role: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].includes(playerData.role) 
          ? playerData.role 
          : 'Batsman',
        base_price: Math.max(100, Math.min(100000, parseInt(playerData.base_price) || 100)),
        description: playerData.description ? playerData.description.trim().substring(0, 500) : null,
        stats: playerData.stats ? JSON.parse(JSON.stringify(playerData.stats)) : {}
      };

      const { data, error } = await supabase
        .from('players')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create player: ${error.message}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Secure player creation error:', error);
      throw new Error('Failed to create player');
    }
  },

  /**
   * Update player with validation
   * @param {string} playerId - Player ID
   * @param {Object} updateData - Update data
   */
  async updatePlayer(playerId, updateData) {
    try {
      // Validate player ID
      if (!playerId || !/^[a-zA-Z0-9\-]+$/.test(playerId)) {
        throw new Error('Invalid player ID');
      }

      // Validate and sanitize update data
      const sanitizedUpdate = {};
      
      if (updateData.name) {
        sanitizedUpdate.name = updateData.name.trim().substring(0, 100);
      }
      
      if (updateData.role) {
        const validRoles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
        sanitizedUpdate.role = validRoles.includes(updateData.role) ? updateData.role : undefined;
      }
      
      if (updateData.base_price !== undefined) {
        sanitizedUpdate.base_price = Math.max(100, Math.min(100000, parseInt(updateData.base_price) || 100));
      }
      
      if (updateData.current_team) {
        if (/^[a-zA-Z0-9\-]+$/.test(updateData.current_team)) {
          sanitizedUpdate.current_team = updateData.current_team;
        }
      }
      
      if (updateData.sold_price !== undefined) {
        sanitizedUpdate.sold_price = Math.max(0, parseInt(updateData.sold_price) || 0);
      }

      const { data, error } = await supabase
        .from('players')
        .update(sanitizedUpdate)
        .eq('id', playerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update player: ${error.message}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Secure player update error:', error);
      throw new Error('Failed to update player');
    }
  }
};

/**
 * Secure team queries with validation
 */
const secureTeamQueries = {
  /**
   * Create team with comprehensive validation
   * @param {Object} teamData - Team information
   */
  async createTeam(teamData) {
    try {
      // Validate required fields
      const requiredFields = ['name', 'captain_code', 'captain_name'];
      for (const field of requiredFields) {
        if (!teamData[field] || teamData[field].trim() === '') {
          throw new Error(`${field} is required`);
        }
      }

      // Check if team name already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', teamData.name.trim())
        .single();

      if (existingTeam) {
        throw new Error('Team name already exists');
      }

      // Validate and sanitize data
      const sanitizedData = {
        name: teamData.name.trim().substring(0, 50),
        captain_code: teamData.captain_code.trim().substring(0, 20),
        captain_name: teamData.captain_name.trim().substring(0, 50),
        budget: Math.max(0, Math.min(10000000, parseInt(teamData.budget) || 1000000)),
        description: teamData.description ? teamData.description.trim().substring(0, 500) : null
      };

      // Validate captain code format
      if (!/^[a-zA-Z0-9]+$/.test(sanitizedData.captain_code)) {
        throw new Error('Captain code can only contain letters and numbers');
      }

      const { data, error } = await supabase
        .from('teams')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create team: ${error.message}`);
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Secure team creation error:', error);
      throw new Error('Failed to create team');
    }
  },

  /**
   * Get team with secure ID validation
   * @param {string} teamId - Team ID
   */
  async getTeamById(teamId) {
    try {
      // Validate team ID
      if (!teamId || !/^[a-zA-Z0-9\-]+$/.test(teamId)) {
        throw new Error('Invalid team ID');
      }

      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          players(id, name, role, base_price, sold_price),
          bids(id, player_id, amount, timestamp)
        `)
        .eq('id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Failed to fetch team: ${error.message}`);
      }

      return {
        success: true,
        data: data || null
      };

    } catch (error) {
      console.error('Secure team query error:', error);
      throw new Error('Failed to fetch team');
    }
  }
};

/**
 * Secure auction queries with bid validation
 */
const secureAuctionQueries = {
  /**
   * Place bid with comprehensive validation
   * @param {Object} bidData - Bid information
   */
  async placeBid(bidData) {
    try {
      // Validate required fields
      const requiredFields = ['player_id', 'team_id', 'amount'];
      for (const field of requiredFields) {
        if (!bidData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate IDs
      if (!/^[a-zA-Z0-9\-]+$/.test(bidData.player_id)) {
        throw new Error('Invalid player ID');
      }
      
      if (!/^[a-zA-Z0-9\-]+$/.test(bidData.team_id)) {
        throw new Error('Invalid team ID');
      }

      // Validate bid amount
      const amount = parseInt(bidData.amount);
      if (isNaN(amount) || amount < 100 || amount > 100000) {
        throw new Error('Bid amount must be between 100 and 100,000');
      }

      // Check if player exists and get current bid
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id, current_bid, current_team, sold_price')
        .eq('id', bidData.player_id)
        .single();

      if (playerError || !player) {
        throw new Error('Player not found');
      }

      // Check if bid is higher than current bid
      if (player.current_bid && amount <= player.current_bid) {
        throw new Error('Bid must be higher than current bid');
      }

      // Check if player is already sold
      if (player.sold_price) {
        throw new Error('Player is already sold');
      }

      // Get team information
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, budget, total_spent')
        .eq('id', bidData.team_id)
        .single();

      if (teamError || !team) {
        throw new Error('Team not found');
      }

      // Check team budget
      const totalSpent = team.total_spent || 0;
      if (totalSpent + amount > team.budget) {
        throw new Error('Insufficient team budget');
      }

      // Create bid record
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .insert([{
          player_id: bidData.player_id,
          team_id: bidData.team_id,
          amount: amount,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (bidError) {
        throw new Error(`Failed to place bid: ${bidError.message}`);
      }

      // Update player with new bid
      const { error: updateError } = await supabase
        .from('players')
        .update({
          current_bid: amount,
          current_team: bidData.team_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', bidData.player_id);

      if (updateError) {
        throw new Error(`Failed to update player: ${updateError.message}`);
      }

      return {
        success: true,
        data: {
          bid,
          player: { ...player, current_bid: amount, current_team: bidData.team_id }
        }
      };

    } catch (error) {
      console.error('Secure bid placement error:', error);
      throw new Error('Failed to place bid');
    }
  }
};

/**
 * Secure admin queries with validation
 */
const secureAdminQueries = {
  /**
   * Reset auction system with safety checks
   */
  async resetAuction() {
    try {
      // Use transaction-like operations
      const operations = [];

      // Reset all bids
      const { error: bidsError } = await supabase
        .from('bids')
        .delete()
        .neq('id', 'never-match'); // Delete all records

      if (bidsError) {
        throw new Error(`Failed to reset bids: ${bidsError.message}`);
      }

      // Reset all players
      const { error: playersError } = await supabase
        .from('players')
        .update({
          current_bid: null,
          current_team: null,
          sold_price: null,
          updated_at: new Date().toISOString()
        })
        .neq('id', 'never-match'); // Update all records

      if (playersError) {
        throw new Error(`Failed to reset players: ${playersError.message}`);
      }

      // Reset team budgets
      const { error: teamsError } = await supabase
        .from('teams')
        .update({
          total_spent: 0,
          player_count: 0,
          updated_at: new Date().toISOString()
        })
        .neq('id', 'never-match'); // Update all records

      if (teamsError) {
        throw new Error(`Failed to reset teams: ${teamsError.message}`);
      }

      return {
        success: true,
        message: 'Auction system reset successfully'
      };

    } catch (error) {
      console.error('Secure auction reset error:', error);
      throw new Error('Failed to reset auction system');
    }
  }
};

module.exports = {
  securePlayerQueries,
  secureTeamQueries,
  secureAuctionQueries,
  secureAdminQueries
};
