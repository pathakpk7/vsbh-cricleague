import React, { useState, useEffect } from 'react';
import './BroadcastTicker.css';

interface BroadcastTickerProps {
  customMessage?: string;
}

const BroadcastTicker: React.FC<BroadcastTickerProps> = ({ customMessage }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [
    '⚡ VSBH COMMAND HUB ONLINE',
    '🎯 MULTI-TENANT AUCTIONS: CONCURRENT BIDDING ENABLED',
    '🧤 NEW: GRANULAR PLAYING PROFILES (BATTER / BOWLER / ALL-ROUNDER SPECS)',
    '👑 CAPTAIN AUCTION KEYS: SECURE BIDDING ROOMS RESTRICTED BY LEAGUE',
    '🏏 MATCH CENTER: LIVE BALL-BY-BALL DOCUMENTATION EDITABLE BY LEAGUE ADMIN',
    customMessage || '🏆 REGISTRATION OPEN: JOIN YOUR COLLEGE TOURNAMENT TODAY'
  ];

  return (
    <div className="soc-broadcast-ticker">
      <div className="ticker-badge-live">
        <span className="live-dot-pulse"></span>
        <span className="live-text">BROADCAST FEED</span>
      </div>

      <div className="ticker-viewport">
        <div className="ticker-track">
          {/* Duplicate to create infinite seamless loop */}
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={index} className="ticker-item">
              <span className="ticker-bullet">◆</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="ticker-clock-display">
        <span className="clock-label">IST</span>
        <span className="clock-time">{currentTime || '--:--:--'}</span>
      </div>
    </div>
  );
};

export default BroadcastTicker;
