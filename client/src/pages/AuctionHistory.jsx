import React, { useState, useEffect } from 'react';
import './AuctionHistory.css';

const AuctionHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchAuctionHistory();
  }, [limit]);

  const fetchAuctionHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/auction/history?limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs || []);
      } else {
        setError(data.message || 'Failed to fetch auction history');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching auction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    if (newLimit > 0 && newLimit <= 500) {
      setLimit(newLimit);
    }
  };

  if (loading) {
    return (
      <div className="auction-history">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading auction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-history">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={fetchAuctionHistory} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-history">
      <div className="history-header">
        <h1>📊 Auction History</h1>
        <div className="controls">
          <label htmlFor="limit">Show:</label>
          <select 
            id="limit" 
            value={limit} 
            onChange={handleLimitChange}
            className="limit-select"
          >
            <option value={25}>25 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
            <option value={200}>200 records</option>
          </select>
          <button onClick={fetchAuctionHistory} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="history-stats">
        <div className="stat-card">
          <span className="stat-label">Total Records</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Showing</span>
          <span className="stat-value">{limit}</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="no-records">
          <h2>📝 No Auction History</h2>
          <p>No auction activity has been recorded yet.</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Player Name</th>
                <th>Team Name</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr 
                  key={log.id} 
                  className={`history-row ${log.event_type === 'sold' ? 'sold-row' : 'bid-row'}`}
                >
                  <td className="time-cell">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="player-cell">
                    {log.player_name}
                  </td>
                  <td className="team-cell">
                    {log.team_name}
                  </td>
                  <td className="amount-cell">
                    {formatAmount(log.bid_amount)}
                  </td>
                  <td className="type-cell">
                    <span className={`event-type ${log.event_type}`}>
                      {log.event_type === 'sold' ? '🏆 SOLD' : '💰 BID'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-footer">
        <p>Showing latest {Math.min(logs.length, limit)} records</p>
        {logs.length >= limit && (
          <button 
            onClick={() => setLimit(prev => prev + 50)} 
            className="load-more-btn"
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionHistory;
