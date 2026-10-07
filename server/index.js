const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import security middleware
const { 
  helmetConfig, 
  rateLimits, 
  inputSizeLimits, 
  requestTimeout, 
  securityHeaders 
} = require('./middlewares/security');
const { sanitizeRequest } = require('./middlewares/sanitization');
const { errorHandler, notFoundHandler, requestId } = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      process.env.FRONTEND_URL || "https://vsbh-cl.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Set global io for controllers and services
global.io = io;

// Apply security middleware in correct order
app.use(requestId); // Add request ID for tracking
app.use(helmetConfig); // Security headers
app.use(securityHeaders); // Additional security headers
app.use(inputSizeLimits); // Prevent oversized payloads
app.use(requestTimeout(30000)); // 30 second timeout

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.FRONTEND_URL || "https://vsbh-cl.vercel.app"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key']
}));

// Apply rate limiting to all requests
app.use(rateLimits.general);

// Body parsing middleware with limits
app.use(express.json({ 
  limit: '10mb',
  strict: true // Only accept arrays and objects
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));
app.use(express.static('public'));

// Apply input sanitization to all requests
app.use(sanitizeRequest);

// Import routes
const leaguesRouter = require('./routes/leagues');
const matchesRouter = require('./routes/matches');
const authRouter = require('./routes/auth');
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const auctionRouter = require('./routes/auction');
const adminRouter = require('./routes/admin');
const googleSheetsRouter = require('./routes/googleSheets');

// Import auction controller functions
const { placeBid, startAuction, sellPlayer, skipPlayer, stopAuction } = require('./controllers/auctionController');

// Import auction timer service
const { startAuctionTimer } = require('./services/auctionTimer');

// Use routes with specific rate limits
app.use('/api/leagues', rateLimits.general, leaguesRouter);
app.use('/api/matches', rateLimits.general, matchesRouter);
app.use('/api/auth', rateLimits.auth, authRouter);
app.use('/api/players', rateLimits.auction, playersRouter);
app.use('/api/teams', rateLimits.teamCreation, teamsRouter);
app.use('/api/auction', rateLimits.auction, auctionRouter);
app.use('/api/admin', rateLimits.admin, adminRouter);
app.use('/api/google-sheets', rateLimits.general, googleSheetsRouter);

const PORT = process.env.PORT || 5000;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join auction room (support both global and per-league rooms)
  socket.on('join-auction', (data) => {
    socket.join('auction-room');
    const leagueId = typeof data === 'string' ? data : data?.leagueId;
    if (leagueId) {
      socket.join(`auction-room-${leagueId}`);
      console.log(`User joined auction room for league: ${leagueId}`);
    } else {
      console.log('User joined global auction room:', socket.id);
    }
  });

  // Join match room for live score updates
  socket.on('join-match', (data) => {
    const matchId = typeof data === 'string' ? data : data?.matchId;
    if (matchId) {
      socket.join(`match-room-${matchId}`);
      console.log(`User joined match room: ${matchId}`);
    }
  });

  // Helper function to create mock response for controllers
  const createMockResponse = (leagueId, successEvent, errorEvent) => {
    const room = leagueId ? `auction-room-${leagueId}` : 'auction-room';
    return {
      status: (code) => ({
        json: (response) => {
          if (response.success) {
            io.to(room).emit(successEvent, response.data);
            io.to('auction-room').emit(successEvent, response.data);
            
            // Broadcast full auction state after every action
            if (response.data.auction) {
              const auctionState = {
                leagueId,
                current_player: response.data.currentPlayer || response.data.nextPlayer,
                current_bid: response.data.auction.current_bid,
                current_team: response.data.auction.current_team_id,
                timer_seconds: response.data.auction.timer_seconds
              };
              io.to(room).emit('auction-update', auctionState);
              io.to('auction-room').emit('auction-update', auctionState);
            }
          } else {
            socket.emit(errorEvent, response.message);
          }
        }
      })
    };
  };

  // Handle auction start
  socket.on('start-auction', async (data) => {
    try {
      const leagueId = data?.leagueId;
      const mockReq = { body: data || {} };
      const mockRes = createMockResponse(leagueId, 'auction-started', 'error');
      await startAuction(mockReq, mockRes);
    } catch (error) {
      console.error('Start auction error:', error);
      socket.emit('error', 'Failed to start auction');
    }
  });

  // Handle new bids
  socket.on('place-bid', async (data) => {
    try {
      const leagueId = data?.leagueId;
      const mockReq = { body: data || {} };
      const mockRes = createMockResponse(leagueId, 'bid-updated', 'bid-error');
      await placeBid(mockReq, mockRes);
    } catch (error) {
      console.error('Bid error:', error);
      socket.emit('bid-error', 'Internal server error');
    }
  });

  // Handle player sale
  socket.on('sell-player', async (data) => {
    try {
      const leagueId = data?.leagueId;
      const mockReq = { body: data || {} };
      const mockRes = createMockResponse(leagueId, 'player-sold', 'error');
      await sellPlayer(mockReq, mockRes);
    } catch (error) {
      console.error('Sell player error:', error);
      socket.emit('error', 'Sell failed');
    }
  });

  // Handle player skip
  socket.on('skip-player', async (data) => {
    try {
      const leagueId = data?.leagueId;
      const mockReq = { body: data || {} };
      const mockRes = createMockResponse(leagueId, 'player-skipped', 'error');
      await skipPlayer(mockReq, mockRes);
    } catch (error) {
      console.error('Skip player error:', error);
      socket.emit('error', 'Skip failed');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'VSBH-CL Multi-League Cricket Management Server Running' });
});

// Admin panel route
app.get('/admin-test.html', (req, res) => {
  res.sendFile(__dirname + '/admin-test.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Multi-league support enabled');
  console.log('Native authentication enabled');
  console.log('Live match documentation enabled');

  // Start multi-league auction timer
  startAuctionTimer(io);
});
