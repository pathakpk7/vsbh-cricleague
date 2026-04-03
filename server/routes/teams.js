const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all teams
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_players (
          player_id,
          players (
            id,
            name,
            role,
            base_price,
            sold_price
          )
        )
      `);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_players (
          player_id,
          players (
            id,
            name,
            role,
            base_price,
            sold_price
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize teams (6 teams)
router.post('/initialize', async (req, res) => {
  try {
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
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
