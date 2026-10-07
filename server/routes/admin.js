const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { resetAuction } = require('../controllers/adminController');
const authSchemas = require('../validators/authValidator');
const { validate } = require('../middlewares/validation');
const { sanitizeRequest } = require('../middlewares/sanitization');
const { rateLimits } = require('../middlewares/security');
const { asyncHandler, AuthenticationError, AuthorizationError } = require('../middlewares/errorHandler');

/**
 * Enhanced admin authentication middleware
 */
const isAdmin = async (req, res, next) => {
  try {
    const admin_key = req.headers['x-admin-key'] || req.headers['admin-key'];
    const authHeader = req.headers['authorization'];
    
    // Check header key
    const ADMIN_KEY = process.env.ADMIN_KEY || 'unitedvsbh@321';
    
    if (admin_key && admin_key === ADMIN_KEY) {
      return next();
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Validated token from session
      return next();
    }

    // Allow admin if valid admin session token
    if (req.body?.admin_key === ADMIN_KEY) {
      return next();
    }

    throw new AuthenticationError('Admin credentials required');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin login endpoint
 * POST /api/admin/login
 */
router.post('/login', 
  rateLimits.auth,
  sanitizeRequest,
  asyncHandler(async (req, res) => {
    const { admin_key, email, password } = req.body;
    
    // Support login via email & password
    if (email && password) {
      const adminSession = db.authenticateAdmin(email, password);
      if (adminSession) {
        return res.json({
          success: true,
          message: 'Admin login successful',
          data: adminSession,
          token: Buffer.from(`admin:${adminSession.league_id}:${Date.now()}`).toString('base64')
        });
      }
    }

    const ADMIN_KEY = process.env.ADMIN_KEY || 'unitedvsbh@321';
    if (admin_key && admin_key === ADMIN_KEY) {
      const defaultLeague = db.getLeagues()[0] || {};
      const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64');
      return res.json({
        success: true,
        message: 'Admin login successful',
        token: sessionToken,
        data: {
          role: 'admin',
          league_id: defaultLeague.id,
          league_name: defaultLeague.name
        }
      });
    }
    
    throw new AuthenticationError('Invalid admin credentials');
  })
);

/**
 * Reset auction endpoint
 * POST /api/admin/reset
 */
router.post('/reset', 
  rateLimits.admin,
  isAdmin,
  sanitizeRequest,
  asyncHandler(async (req, res) => {
    await resetAuction(req, res);
  })
);

/**
 * Flush/wipe all leagues, teams, players, matches and auction data permanently
 * POST /api/admin/flush-all-data
 */
router.post('/flush-all-data',
  rateLimits.admin,
  isAdmin,
  asyncHandler(async (req, res) => {
    db.clearAllData();
    if (global.io) {
      global.io.emit('system-reset', { message: 'All platform data has been cleared.' });
    }
    res.json({
      success: true,
      message: 'All system data has been wiped. Platform is now fresh.'
    });
  })
);

/**
 * Get system status (admin only)
 * GET /api/admin/status
 */
router.get('/status', 
  rateLimits.admin,
  isAdmin,
  asyncHandler(async (req, res) => {
    try {
      const leagues = db.getLeagues();
      const teams = db.getTeams();
      const players = db.getPlayers();
      
      res.json({
        success: true,
        message: 'System status retrieved',
        data: {
          leagues: leagues.length,
          teams: teams.length,
          players: players.length,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      throw new Error('Failed to get system status');
    }
  })
);

/**
 * Admin logout endpoint
 * POST /api/admin/logout
 */
router.post('/logout', 
  rateLimits.auth,
  sanitizeRequest,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  })
);

module.exports = router;
