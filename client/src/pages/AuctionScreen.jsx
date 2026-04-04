import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import './AuctionScreen.css';

const AuctionScreen = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(10);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to auction server');
      initializeAuction();
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const initializeAuction = async () => {
    try {
      setLoading(true);
      
      // Fetch initial data from API
      const response = await fetch('/api/auction/init');
      const data = await response.json();

      if (response.ok) {
        setPlayers(data.players || []);
        setTeams(data.teams || []);
        
        if (data.auctionState) {
          setCurrentBid(data.auctionState.current_bid || 10);
          setTimer(data.auctionState.timer_seconds || 30);
          setIsAuctionActive(data.auctionState.is_active || false);
          
          if (data.auctionState.current_player_id) {
            const player = data.players.find(p => p.id === data.auctionState.current_player_id);
            setCurrentPlayer(player);
          } else if (data.players.length > 0) {
            setCurrentPlayer(data.players[0]);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to initialize auction');
      }

      // Socket listeners
      newSocket.on('bid-update', handleBidUpdate);
      newSocket.on('timer-update', handleTimerUpdate);
      newSocket.on('player-sold', handlePlayerSold);

    } catch (err) {
      console.error('Error initializing auction:', err);
      setError('Failed to initialize auction');
    } finally {
      setLoading(false);
    }
  };

  const handleBidUpdate = (bidData) => {
    setCurrentBid(bidData.current_bid);
    setSelectedTeam(bidData.current_team_id);
    setTimer(bidData.timer_seconds || 30);
    setIsAuctionActive(bidData.is_active);
    
    if (bidData.current_player) {
      setCurrentPlayer(bidData.current_player);
    }
  };

  const handleTimerUpdate = (timerData) => {
    setTimer(timerData.timer_seconds || 30);
    setIsAuctionActive(timerData.is_active);
    
    if (timerData.current_player) {
      setCurrentPlayer(timerData.current_player);
    }
  };

  const handlePlayerSold = (soldData) => {
    setPlayers(prev => prev.map(player => 
      player.id === soldData.player_id 
        ? { ...player, sold: true, sold_to_team: soldData.team_id, price: soldData.price }
        : player
    ));
    
    setTeams(prev => prev.map(team => 
      team.id === soldData.team_id 
        ? { ...team, budget: team.budget - soldData.price }
        : team
    ));
    
    if (soldData.nextPlayer) {
      setCurrentPlayer(soldData.nextPlayer);
      setCurrentBid(soldData.nextPlayer.base_price || 10);
      setTimer(30);
    } else {
      setIsAuctionActive(false);
      setCurrentPlayer(null);
    }
  };

  const placeBid = async (teamId) => {
    if (!user || !currentPlayer || !isAuctionActive) return;
    
    try {
      const response = await fetch('/api/auction/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          teamId: teamId,
          bidAmount: currentBid + 5
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Bid failed');
      }
      
    } catch (err) {
      setError(err.message);
    }
  };

  const startAuction = async () => {
    try {
      const response = await fetch('/api/auction/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to start auction');
      }
      
      setIsAuctionActive(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const skipPlayer = async () => {
    if (!currentPlayer) return;
    
    try {
      const response = await fetch('/api/auction/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to skip player');
      }
      
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="auction-screen">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-screen">
        <div className="error">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-screen">
      <div className="auction-header">
        <h1>Live Auction</h1>
        <div className="auction-controls">
          {!isAuctionActive && (
            <button className="btn btn-primary" onClick={startAuction}>
              Start Auction
            </button>
          )}
        </div>
      </div>

      <div className="auction-content">
        <div className="current-player-section">
          {currentPlayer ? (
            <div className="player-card">
              <div className="player-info">
                <h3>{currentPlayer.name}</h3>
                <p className="player-role">{currentPlayer.role}</p>
                <p className="player-base-price">Base: ₹{currentPlayer.base_price}</p>
              </div>
              <div className="player-status">
                <span className={`status ${currentPlayer.sold ? 'sold' : 'available'}`}>
                  {currentPlayer.sold ? 'Sold' : 'Available'}
                </span>
              </div>
            </div>
          ) : (
            <div className="no-player">
              <p>No player selected</p>
            </div>
          )}
        </div>

        <div className="auction-section">
          <div className="timer-section">
            <div className="timer">
              <div className={`timer-display ${timer <= 10 ? 'warning' : ''}`}>
                {timer}s
              </div>
              <div className="timer-label">Time Remaining</div>
            </div>
          </div>

          <div className="bid-section">
            <div className="current-bid">
              <span className="bid-label">Current Bid:</span>
              <span className="bid-amount">₹{currentBid}</span>
            </div>

            {user && user.role === 'captain' && isAuctionActive && (
              <div className="bid-controls">
                <button 
                  className="btn btn-primary" 
                  onClick={() => placeBid(user.teamId)}
                  disabled={!currentPlayer || currentPlayer.sold}
                >
                  Bid ₹{currentBid + 5}
                </button>
              </div>
            )}

            {user && user.role === 'admin' && isAuctionActive && (
              <div className="admin-controls">
                <button className="btn btn-success" onClick={skipPlayer}>
                  Skip Player
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="teams-section">
        <h3>Teams</h3>
        <div className="teams-grid">
          {teams.map(team => (
            <div 
              key={team.id} 
              className={`team-card ${selectedTeam === team.id ? 'selected' : ''}`}
            >
              <div className="team-header">
                <h4>{team.name}</h4>
                <span className="team-budget">₹{team.budget}</span>
              </div>
              <div className="team-players">
                <span className="players-count">{team.players?.length || 0} Players</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="players-section">
        <h3>Players</h3>
        <div className="players-grid">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`player-card-small ${player.sold ? 'sold' : 'available'} ${currentPlayer?.id === player.id ? 'current' : ''}`}
              onClick={() => !isAuctionActive && setCurrentPlayer(player)}
            >
              <div className="player-name">{player.name}</div>
              <div className="player-role">{player.role}</div>
              <div className="player-price">₹{player.base_price}</div>
              {player.sold && (
                <div className="sold-badge">Sold</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuctionScreen;
