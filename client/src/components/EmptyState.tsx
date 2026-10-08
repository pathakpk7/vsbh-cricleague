import React from 'react';
import { ClipboardIcon } from './Icons';
import './EmptyState.css';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon,
  size = 'medium',
  showAnimation = true
}) => {
  return (
    <div className={`empty-state empty-state--${size} ${showAnimation ? 'empty-state--animated' : ''}`}>
      <div className="empty-state__content">
        <div className="empty-state__icon">
          {icon || <ClipboardIcon size={size === 'large' ? 56 : size === 'small' ? 32 : 44} color="#64748b" />}
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
