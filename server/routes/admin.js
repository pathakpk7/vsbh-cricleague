const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { resetAuction } = require('../controllers/adminController');

// Admin authentication middleware
const isAdmin = async (req, res, next) => {
  try {
    const { admin_key } = req.headers;
    
    // Simple admin key check (you can make this more secure)
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
    
    if (!admin_key || admin_key !== ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid admin credentials.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Reset entire auction system
 * POST /api/admin/reset
 */
router.post('/reset', isAdmin, async (req, res) => {
  try {
    await resetAuction(req, res);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Admin login endpoint
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
  try {
    const { admin_key } = req.body;
    
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
    
    if (!admin_key || admin_key !== ADMIN_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin key'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin login successful',
      token: admin_key // Simple token (in production, use JWT)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;
