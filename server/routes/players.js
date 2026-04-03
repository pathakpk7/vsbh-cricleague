const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all players
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available players for auction
router.get('/available', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new player
router.post('/', async (req, res) => {
  try {
    const { name, role, department, base_price = 10 } = req.body;
    
    const { data, error } = await supabase
      .from('players')
      .insert([{ name, role, department, base_price, status: 'available' }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
