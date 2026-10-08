import React from 'react';

interface PitchBidLogoProps {
  className?: string;
  size?: number;
}

export const PitchBidLogo: React.FC<PitchBidLogoProps> = ({ className = '', size = 38 }) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      width={size} 
      height={size} 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="pblBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="70%" stopColor="#070a12" />
          <stop offset="100%" stopColor="#020408" />
        </radialGradient>
        <linearGradient id="pblCyan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="pblPulse" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="pblGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container */}
      <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#pblBg)" stroke="#1e293b" strokeWidth="6" />
      <rect x="28" y="28" width="456" height="456" rx="100" fill="none" stroke="#00e5ff" strokeWidth="3" strokeOpacity="0.4" />

      {/* Orbit Arc */}
      <path d="M 120 330 C 140 180, 360 160, 400 290" fill="none" stroke="url(#pblCyan)" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.5" />

      {/* Left Stump */}
      <rect x="180" y="200" width="18" height="175" rx="9" fill="url(#pblCyan)" />

      {/* Right Stump */}
      <rect x="314" y="200" width="18" height="175" rx="9" fill="url(#pblCyan)" />

      {/* Center Stump with Pulse Bars */}
      <g>
        <rect x="246" y="165" width="20" height="210" rx="10" fill="url(#pblPulse)" />
        <rect x="230" y="215" width="52" height="7" rx="3.5" fill="#34d399" />
        <rect x="220" y="240" width="72" height="7" rx="3.5" fill="#38bdf8" />
        <rect x="214" y="265" width="84" height="8" rx="4" fill="#00e5ff" />
        <rect x="222" y="290" width="68" height="7" rx="3.5" fill="#34d399" />
        <rect x="230" y="315" width="52" height="7" rx="3.5" fill="#10b981" />
      </g>

      {/* Floating Glowing Bails */}
      <rect x="172" y="176" width="76" height="13" rx="6.5" fill="url(#pblGold)" transform="rotate(-6 210 182)" />
      <rect x="264" y="176" width="76" height="13" rx="6.5" fill="url(#pblGold)" transform="rotate(6 302 182)" />

      {/* Base Line */}
      <rect x="140" y="385" width="232" height="7" rx="3.5" fill="url(#pblCyan)" opacity="0.8" />

      {/* Bid Strike Spark */}
      <circle cx="256" cy="165" r="8" fill="#ffffff" />
      <circle cx="256" cy="165" r="16" fill="none" stroke="#fef08a" strokeWidth="2.5" opacity="0.85" />
    </svg>
  );
};

export default PitchBidLogo;
