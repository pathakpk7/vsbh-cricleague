import React from 'react';
import './StatTelemetryCard.css';

interface StatTelemetryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subValue?: string;
  badge?: {
    text: string;
    type: 'live' | 'ready' | 'warning' | 'info';
  };
  progress?: {
    percent: number;
    color?: 'cyan' | 'emerald' | 'gold' | 'rose';
  };
  accentColor?: 'cyan' | 'emerald' | 'gold' | 'rose' | 'violet';
  onClick?: () => void;
}

const StatTelemetryCard: React.FC<StatTelemetryCardProps> = ({
  icon,
  title,
  value,
  subValue,
  badge,
  progress,
  accentColor = 'cyan',
  onClick
}) => {
  return (
    <div 
      className={`soc-telemetry-card accent-${accentColor} ${onClick ? 'interactive' : ''}`}
      onClick={onClick}
    >
      <div className="card-ambient-glow"></div>
      
      <div className="card-top-row">
        <div className="telemetry-icon-box">
          <span className="icon-glyph">{icon}</span>
        </div>
        {badge && (
          <span className={`soc-badge badge-${badge.type}`}>
            {badge.type === 'live' && <span className="beacon-dot"></span>}
            {badge.text}
          </span>
        )}
      </div>

      <div className="card-data-body">
        <div className="telemetry-value">{value}</div>
        <div className="telemetry-title">{title}</div>
        {subValue && <div className="telemetry-subvalue">{subValue}</div>}
      </div>

      {progress && (
        <div className="telemetry-progress-track">
          <div 
            className={`telemetry-progress-fill fill-${progress.color || accentColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default StatTelemetryCard;
