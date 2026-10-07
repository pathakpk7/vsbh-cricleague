import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components & Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Auction from './pages/Auction';
import Teams from './pages/Teams';
import Fixtures from './pages/Fixtures';
import PointsTable from './pages/PointsTable';
import Stats from './pages/Stats';
import Login from './pages/Login';
import PlayerRegistration from './pages/PlayerRegistration';
import LeagueManagement from './pages/LeagueManagement';
import LiveMatchCenter from './pages/LiveMatchCenter';
import BroadcastTicker from './components/soc/BroadcastTicker';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <BroadcastTicker />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auction" element={<Auction />} />
              <Route path="/live-matches" element={<LiveMatchCenter />} />
              <Route path="/register-player" element={<PlayerRegistration />} />
              <Route path="/league-admin" element={<LeagueManagement />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/points-table" element={<PointsTable />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
