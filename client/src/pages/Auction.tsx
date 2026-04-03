import React, { useState, useEffect } from 'react';
import { socket } from '../config/socket';
import { supabase } from '../config/supabase';
import { Player, Team } from '../types';
import './Auction.css';

const Auction: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState(10);
  const [timer, setTimer] = useState(30);
  const [isAuctionActive, setIsAuctionActive] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [captainSession, setCaptainSession] = useState<{ teamId: string; captainCode: string; teamName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate next bid amount
  const nextBidAmount = currentBid + 5;

  // Check if user can bid for their team
  const canUserBid = captainSession && selectedTeam === captainSession.teamId;
  const hasInsufficientFunds = captainSession && teams.find(t => t.id === captainSession.teamId)?.budget ? 
    teams.find(t => t.id === captainSession.teamId)!.budget < nextBidAmount : false;

  // 🔥 AUTO-LOGIN ON PAGE LOAD
  useEffect(() => {
    const checkCaptainSession = async () => {
      const savedCaptainCode = localStorage.getItem('captainCode');
      const savedTeamId = localStorage.getItem('teamId');
      const savedTeamName = localStorage.getItem('teamName');

      if (savedCaptainCode && savedTeamId && savedTeamName) {
        // Auto-login using saved credentials
        try {
          const response = await fetch('/api/auction/login-captain', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ captainCode: savedCaptainCode }),
          });

          const data = await response.json();

          if (data.success) {
            // Session restored successfully
            setCaptainSession({
              teamId: data.data.teamId,
              captainCode: data.data.captainCode,
              teamName: data.data.teamName
            });
            console.log('✅ Captain session restored:', data.data.teamName);
          } else {
            // Invalid saved session, clear it
            console.warn('⚠️ Invalid saved session, clearing localStorage');
            localStorage.removeItem('captainCode');
            localStorage.removeItem('teamId');
            localStorage.removeItem('teamName');
          }
        } catch (error) {
          console.error('❌ Auto-login failed:', error);
          // Clear invalid session
          localStorage.removeItem('captainCode');
          localStorage.removeItem('teamId');
          localStorage.removeItem('teamName');
        }
      }
      setIsLoading(false);
    };

    checkCaptainSession();
  }, []);

  // 🔥 INITIAL LOAD (after auto-login)
  useEffect(() => {
    if (!isLoading) {
      socket.connect();
      socket.emit('join-auction');

      fetchAuctionData();

      // ✅ SOCKET EVENTS
      socket.on('bid-updated', (data) => {
        setCurrentBid(data.current_bid);
        setSelectedTeam(data.team_id);
      });

      socket.on('timer-update', (data) => {
        setTimer(data.timer_seconds);
      });

      socket.on('player-sold', () => {
        fetchAuctionData();
      });

      socket.on('auction-update', (data) => {
        setCurrentBid(data.current_bid);
        setTimer(data.timer_seconds);
        setSelectedTeam(data.current_team_id);
        setIsAuctionActive(data.is_active);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isLoading]);

  // 🔥 FETCH DATA (READ ONLY)
  const fetchAuctionData = async () => {
    try {
      const { data: auctionData } = await supabase
        .from('auction_state')
        .select('*')
        .eq('id', 1)
        .single();

      if (auctionData) {
        setCurrentBid(auctionData.current_bid);
        setTimer(auctionData.timer_seconds);
        setIsAuctionActive(auctionData.is_active);
      }

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*');

      if (teamsData) {
        setTeams(teamsData);
      }

      if (auctionData?.current_player_id) {
        const { data: current } = await supabase
          .from('players')
          .select('*')
          .eq('id', auctionData.current_player_id)
          .single();

        setCurrentPlayer(current);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // 🔥 START AUCTION
  const startAuction = async () => {
    try {
      await fetch('http://localhost:5000/api/auction/start', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Start auction error:', error);
    }
  };

  // 🔥 PLACE BID
  const placeBid = async (teamId: string) => {
    if (!captainSession) {
      console.error('❌ No captain session found');
      alert('Please login with your captain code first');
      return;
    }

    // Ensure user can only bid for their own team
    if (captainSession.teamId !== teamId) {
      console.error('❌ Cannot bid for other teams');
      alert('You can only bid for your own team');
      return;
    }

    try {
      const response = await fetch('/api/auction/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: teamId,
          captainCode: captainSession.captainCode 
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        alert(`Bid failed: ${data.message}`);
        console.error('Bid error:', data.message);
      } else {
        console.log('✅ Bid placed successfully');
      }
    } catch (error) {
      console.error('Bid error:', error);
      alert('Failed to place bid. Please try again.');
    }
  };

  const getTeamById = (teamId: string) =>
    teams.find(t => t.id === teamId);

  return (
    <div className="auction-container">

      {/* LEFT PANEL */}
      <div className="auction-panel">

        <div className="auction-header">
          <h1>🎯 Live Auction</h1>
          {isAuctionActive && <span className="live-indicator">LIVE</span>}
        </div>

        {currentPlayer ? (
          <div className="current-player">

            <div className="player-info">
              <h2>{currentPlayer.name}</h2>

              <div className="player-details">
                <span>{currentPlayer.role}</span>
                <span>{currentPlayer.year}</span>
                {currentPlayer.is_mvp && <span className="mvp">MVP</span>}
                <span>₹{currentPlayer.base_price}</span>
              </div>
            </div>

            <div className="auction-status">
              <div className={`timer ${timer <= 5 ? 'danger' : ''}`}>
                {timer}s
              </div>

              <div className="bid">
                ₹{currentBid}
              </div>

              {selectedTeam && (
                <div className="team">
                  Leading: {getTeamById(selectedTeam)?.name}
                </div>
              )}
            </div>

            <div className="controls">
              {!isAuctionActive ? (
                <button onClick={startAuction}>
                  Start Auction
                </button>
              ) : (
                <div className="bidding-section">
                  {hasInsufficientFunds && (
                    <div className="insufficient-funds-warning">
                      ⚠️ Insufficient funds for next bid
                      <div className="funds-details">
                        <span>Team Budget: ₹{teams.find(t => t.id === captainSession?.teamId)?.budget || 0}</span>
                        <span>Next Bid: ₹{nextBidAmount}</span>
                        <span>Short by: ₹{nextBidAmount - (teams.find(t => t.id === captainSession?.teamId)?.budget || 0)}</span>
                      </div>
                    </div>
                  )}
                  
                  {!canUserBid && (
                    <div className="login-required">
                      🔐 Please login with your captain code to bid
                    </div>
                  )}

                  {teams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => placeBid(team.id)}
                      disabled={
                        !canUserBid || // Can't bid if not logged in or wrong team
                        hasInsufficientFunds || // Can't bid if insufficient funds
                        !isAuctionActive // Can't bid if auction not active
                      }
                      className={`bid-button ${
                        team.id === captainSession?.teamId ? 'my-team' : 'other-team'
                      } ${
                        hasInsufficientFunds ? 'insufficient-funds' : ''
                      }`}
                    >
                      <div className="button-content">
                        <span className="team-name">{team.name}</span>
                        <span className="budget">₹{team.budget}</span>
                        {team.id === selectedTeam && (
                          <span className="current-bidder">👑 Current Bidder</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div>No players available</div>
        )}

      </div>

      {/* RIGHT PANEL */}
      <div className="team-panel">
        <h3>Teams</h3>

        {teams.map(team => (
          <div key={team.id} className="team-card">
            <h4>{team.name}</h4>
            <p>Budget: ₹{team.budget}</p>
            <p>Players: {team.team_players?.length || 0}/11</p>

            {selectedTeam === team.id && (
              <span className="leading">Leading</span>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Auction;