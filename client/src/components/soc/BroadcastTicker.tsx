import React, { useState, useEffect } from 'react';
import { LightningIcon, TargetIcon, GloveIcon, CrownIcon, CricketIcon, TrophyIcon } from '../Icons';
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
    { icon: <LightningIcon size={13} color="#00f0ff" />, text: 'VSBH COMMAND HUB ONLINE' },
    { icon: <TargetIcon size={13} color="#00f0ff" />, text: 'MULTI-TENANT AUCTIONS: CONCURRENT BIDDING ENABLED' },
    { icon: <GloveIcon size={13} color="#00f0ff" />, text: 'NEW: GRANULAR PLAYING PROFILES (BATTER / BOWLER / ALL-ROUNDER SPECS)' },
    { icon: <CrownIcon size={13} color="#facc15" />, text: 'CAPTAIN AUCTION KEYS: SECURE BIDDING ROOMS RESTRICTED BY LEAGUE' },
    { icon: <CricketIcon size={13} color="#10b981" />, text: 'MATCH CENTER: LIVE BALL-BY-BALL DOCUMENTATION EDITABLE BY LEAGUE ADMIN' },
    { icon: <TrophyIcon size={13} color="#facc15" />, text: customMessage || 'REGISTRATION OPEN: JOIN YOUR COLLEGE TOURNAMENT TODAY' }
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
            <span key={index} className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="ticker-bullet">◆</span>
              {item.icon}
              <span>{item.text}</span>
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
