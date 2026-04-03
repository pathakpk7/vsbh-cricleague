const express = require('express');
const router = express.Router();
const GoogleSheetsService = require('../services/googleSheets');
const supabase = require('../config/supabase');

const googleSheetsService = new GoogleSheetsService();

// Test Google Sheets connection
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await googleSheetsService.testConnection();
    res.json({ 
      success: isConnected,
      message: isConnected ? 'Successfully connected to Google Sheets' : 'Failed to connect'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch players from Google Sheets
router.get('/fetch-players', async (req, res) => {
  try {
    const players = await googleSheetsService.fetchPlayers();
    res.json({ 
      success: true,
      count: players.length,
      players: players
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync players to Supabase
router.post('/sync-players', async (req, res) => {
  try {
    const result = await googleSheetsService.syncToSupabase(supabase);
    res.json({ 
      success: true,
      ...result,
      message: `Synced ${result.synced} out of ${result.total} players`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
