// Test setup file for API tests without Socket.IO
const express = require('express');
const cors = require('cors');

// Create a minimal Express app for testing
const app = express();

// CORS configuration for testing
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Import only the routes we need to test
const adminRouter = require('../routes/admin');
const playersRouter = require('../routes/players');
const teamsRouter = require('../routes/teams');
const auctionRouter = require('../routes/auction');

// Use routes
app.use('/api/admin', adminRouter);
app.use('/api/players', playersRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/auction', auctionRouter);

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'VSBH-CL Test Server' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = app;
