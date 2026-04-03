import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon = '📋',
  size = 'medium',
  showAnimation = true
}) => {
  return (
    <div className={`empty-state empty-state--${size} ${showAnimation ? 'empty-state--animated' : ''}`}>
      <div className="empty-state__content">
        <div className="empty-state__icon">
          {icon}
        </div>
        
        <div className="empty-state__text">
          <h2 className="empty-state__title">{title}</h2>
          <p className="empty-state__subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
