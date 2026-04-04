const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://localhost:3000",
      process.env.FRONTEND_URL || "https://your-vercel-app.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.FRONTEND_URL || "https://your-vercel-app.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Import routes
const playersRouter = require('./routes/players');
const teamsRouter = require('./routes/teams');
const auctionRouter = require('./routes/auction');
const googleSheetsRouter = require('./routes/googleSheets');
const adminRouter = require('./routes/admin');

// Import auction controller functions
const { placeBid, startAuction, sellPlayer, skipPlayer } = require('./controllers/auctionController');

// Import auction timer service
const { startAuctionTimer } = require('./services/auctionTimer');

// Use routes
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/auction', auctionRouter);
app.use('/api/google-sheets', googleSheetsRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 5000;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join auction room
  socket.on('join-auction', () => {
    socket.join('auction-room');
    console.log('User joined auction room:', socket.id);
  });

  // Helper function to create mock response for controllers
  const createMockResponse = (successEvent, errorEvent) => {
    return {
      status: (code) => ({
        json: (response) => {
          if (response.success) {
            io.to('auction-room').emit(successEvent, response.data);
            
            // 🔄 Broadcast full auction state after every action
            if (response.data.auction) {
              const auctionState = {
                current_player: response.data.currentPlayer || response.data.nextPlayer,
                current_bid: response.data.auction.current_bid,
                current_team: response.data.auction.current_team_id,
                timer_seconds: response.data.auction.timer_seconds
              };
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
      const mockReq = { body: data };
      const mockRes = createMockResponse('auction-started', 'error');
      await startAuction(mockReq, mockRes);
    } catch (error) {
      console.error('Start auction error:', error);
      socket.emit('error', 'Failed to start auction');
    }
  });

  // Handle new bids
  socket.on('place-bid', async (data) => {
    try {
      const mockReq = { body: data };
      const mockRes = createMockResponse('bid-updated', 'bid-error');
      await placeBid(mockReq, mockRes);
    } catch (error) {
      console.error('Bid error:', error);
      socket.emit('bid-error', 'Internal server error');
    }
  });

  // Handle player sale
  socket.on('sell-player', async () => {
    try {
      const mockReq = { body: {} };
      const mockRes = createMockResponse('player-sold', 'error');
      await sellPlayer(mockReq, mockRes);
    } catch (error) {
      console.error('Sell player error:', error);
      socket.emit('error', 'Sell failed');
    }
  });

  // Handle player skip
  socket.on('skip-player', async () => {
    try {
      const mockReq = { body: {} };
      const mockRes = createMockResponse('player-skipped', 'error');
      await skipPlayer(mockReq, mockRes);
    } catch (error) {
      console.error('Skip player error:', error);
      socket.emit('error', 'Skip failed');
    }
  });

  // Handle auction timer updates with full state broadcast
  socket.on('timer-update', (timerData) => {
    io.to('auction-room').emit('timer-update', timerData);
    
    // 🔄 Broadcast full auction state on timer updates
    if (timerData && timerData.timer_seconds !== undefined) {
      const auctionState = {
        current_player: timerData.current_player_id,
        current_bid: timerData.current_bid,
        current_team: timerData.current_team_id,
        timer_seconds: timerData.timer_seconds
      };
      io.to('auction-room').emit('auction-update', auctionState);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'VSBH-CL Server Running' });
});

// Admin panel route
app.get('/admin-test.html', (req, res) => {
  res.sendFile(__dirname + '/admin-test.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start auction timer
  startAuctionTimer(io);
});
