import React, { useState, useEffect, useRef } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ 
  seconds, 
  maxSeconds = 30, 
  isActive = true, 
  onTimeUp = null,
  size = 200 
}) => {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setDisplaySeconds(seconds);
    
    // Check warning states
    setIsPulsing(seconds <= 5);
    setIsWarning(seconds <= 15);
  }, [seconds]);

  useEffect(() => {
    if (isActive && displaySeconds > 0) {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(prev => {
          const newSeconds = prev - 1;
          
          // Trigger animations based on time
          if (newSeconds <= 5) {
            setIsPulsing(true);
            setIsWarning(true);
          } else if (newSeconds <= 15) {
            setIsWarning(true);
            setIsPulsing(false);
          }
          
          // Call callback when time is up
          if (newSeconds === 0 && onTimeUp) {
            onTimeUp();
          }
          
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, displaySeconds, onTimeUp]);

  // Calculate progress for circular progress
  const progress = ((maxSeconds - displaySeconds) / maxSeconds) * 100;
  const circumference = 2 * Math.PI * 85; // radius = 85
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine color based on time
  const getTimerColor = () => {
    if (displaySeconds <= 5) return '#e74c3c'; // Red
    if (displaySeconds <= 15) return '#f39c12'; // Yellow
    return '#27ae60'; // Green
  };

  const getTimerClass = () => {
    if (displaySeconds <= 5) return 'critical';
    if (displaySeconds <= 15) return 'warning';
    return 'safe';
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`countdown-timer ${getTimerClass()} ${isActive ? 'active' : 'inactive'} ${isPulsing ? 'pulsing' : ''}`}>
      {/* Circular Progress Ring */}
      <div className="timer-circle" style={{ width: size, height: size }}>
        <svg className="progress-ring" width={size} height={size}>
          {/* Background circle */}
          <circle
            className="progress-ring__background"
            cx={size / 2}
            cy={size / 2}
            r={85}
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            className="progress-ring__progress"
            cx={size / 2}
            cy={size / 2}
            r={85}
            strokeWidth="8"
            fill="transparent"
            stroke={getTimerColor()}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer Display */}
        <div className="timer-display">
          <div className="timer-text" style={{ color: getTimerColor() }}>
            {formatTime(displaySeconds)}
          </div>
          <div className="timer-seconds">{displaySeconds} seconds</div>
        </div>
      </div>

      {/* Timer Status */}
      <div className="timer-status">
        <div className={`status-indicator ${getTimerClass()}`}>
          <div className="indicator-dot"></div>
          <span className="status-text">
            {displaySeconds <= 5 ? 'TIME RUNNING OUT!' : 
             displaySeconds <= 15 ? 'HURRY UP!' : 'PLenty OF TIME'}
          </span>
        </div>
      </div>

      {/* Pulse Animation Overlay */}
      {isPulsing && (
        <div className="pulse-overlay">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
      )}

      {/* Warning Flash */}
      {isWarning && (
        <div className="warning-flash">
          <div className="flash-bar"></div>
        </div>
      )}

      {/* Time Remaining Bars */}
      <div className="time-bars">
        {Array.from({ length: maxSeconds }, (_, i) => (
          <div
            key={i}
            className={`time-bar ${i < displaySeconds ? 'active' : 'inactive'} ${getTimerClass()}`}
            style={{ 
              backgroundColor: i < displaySeconds ? getTimerColor() : '#e9ecef',
              animationDelay: `${i * 0.05}s`
            }}
          />
        ))}
      </div>

      {/* Audio Cue Indicator */}
      {displaySeconds <= 5 && (
        <div className="audio-cue">
          <div className="sound-wave">
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
