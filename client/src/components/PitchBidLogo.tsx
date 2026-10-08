import React from 'react';

interface PitchBidLogoProps {
  className?: string;
  size?: number;
  variant?: 'icon' | 'full';
}

export const PitchBidLogo: React.FC<PitchBidLogoProps> = ({ 
  className = '', 
  size = 38,
  variant = 'icon'
}) => {
  const src = variant === 'full' ? '/pitchbid_logo.png' : '/pitchbid_icon.png';
  return (
    <img 
      src={src} 
      alt="PitchBid Pro" 
      width={size} 
      height={size} 
      className={`pitchbid-brand-image ${className}`}
      style={{ 
        objectFit: 'contain', 
        display: 'inline-block', 
        borderRadius: variant === 'icon' ? '8px' : '0' 
      }}
    />
  );
};

export default PitchBidLogo;
