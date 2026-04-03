import React, { useState, useEffect, useRef } from 'react';
import './AuctionAnimations.css';

const AuctionAnimations = ({ 
  children, 
  animationType = 'default',
  duration = 300,
  delay = 0,
  trigger = null 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (trigger) {
      startAnimation();
    }
  }, [trigger]);

  const startAnimation = () => {
    setIsAnimating(true);
    setIsVisible(true);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  };

  const getAnimationClass = () => {
    if (!isVisible) return '';
    
    const animations = {
      fade: 'animate-fade',
      slideIn: 'animate-slide-in',
      slideOut: 'animate-slide-out',
      scale: 'animate-scale',
      bounce: 'animate-bounce',
      pulse: 'animate-pulse',
      shake: 'animate-shake',
      flip: 'animate-flip',
      rotate: 'animate-rotate',
      glow: 'animate-glow',
      playerChange: 'animate-player-change',
      bidUpdate: 'animate-bid-update',
      timerPulse: 'animate-timer-pulse',
      buttonClick: 'animate-button-click'
    };

    return animations[animationType] || animations.fade;
  };

  return (
    <div
      ref={elementRef}
      className={`auction-animation ${getAnimationClass()} ${isAnimating ? 'animating' : ''}`}
      style={{
        '--animation-duration': `${duration}ms`,
        '--animation-delay': `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

// Specific Animation Components
export const FadeIn = ({ children, duration = 300, delay = 0, trigger }) => (
  <AuctionAnimations animationType="fade" duration={duration} delay={delay} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

export const SlideIn = ({ children, duration = 300, delay = 0, trigger, direction = 'left' }) => (
  <div className={`slide-in-container slide-in-${direction}`}>
    <AuctionAnimations animationType="slideIn" duration={duration} delay={delay} trigger={trigger}>
      {children}
    </AuctionAnimations>
  </div>
);

export const ScaleIn = ({ children, duration = 300, delay = 0, trigger }) => (
  <AuctionAnimations animationType="scale" duration={duration} delay={delay} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

export const BounceIn = ({ children, duration = 600, delay = 0, trigger }) => (
  <AuctionAnimations animationType="bounce" duration={duration} delay={delay} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

export const Pulse = ({ children, duration = 1000, delay = 0, trigger, infinite = false }) => (
  <div className={`pulse-container ${infinite ? 'infinite' : ''}`}>
    <AuctionAnimations animationType="pulse" duration={duration} delay={delay} trigger={trigger}>
      {children}
    </AuctionAnimations>
  </div>
);

export const Shake = ({ children, duration = 500, delay = 0, trigger }) => (
  <AuctionAnimations animationType="shake" duration={duration} delay={delay} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

// Auction-Specific Animations
export const PlayerChange = ({ children, duration = 400, trigger }) => (
  <AuctionAnimations animationType="playerChange" duration={duration} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

export const BidUpdate = ({ children, duration = 300, trigger }) => (
  <AuctionAnimations animationType="bidUpdate" duration={duration} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

export const TimerPulse = ({ children, duration = 1000, trigger, infinite = true }) => (
  <div className={`timer-pulse-container ${infinite ? 'infinite' : ''}`}>
    <AuctionAnimations animationType="timerPulse" duration={duration} trigger={trigger}>
      {children}
    </AuctionAnimations>
  </div>
);

export const ButtonClick = ({ children, duration = 200, trigger }) => (
  <AuctionAnimations animationType="buttonClick" duration={duration} trigger={trigger}>
    {children}
  </AuctionAnimations>
);

// Animation Hook for programmatic control
export const useAnimation = () => {
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const triggerAnimation = () => {
    setAnimationTrigger(prev => prev + 1);
  };

  return { animationTrigger, triggerAnimation };
};

// Animation Utilities
export const AnimationUtils = {
  // Stagger animations for lists
  stagger: (items, baseDelay = 100) => {
    return items.map((item, index) => ({
      ...item,
      delay: index * baseDelay
    }));
  },

  // Create animation keyframes dynamically
  createKeyframes: (name, keyframes) => {
    const styleSheet = document.styleSheets[0];
    const keyframeRule = `@keyframes ${name} { ${keyframes} }`;
    styleSheet.insertRule(keyframeRule, styleSheet.cssRules.length);
  },

  // Preload animations
  preloadAnimations: () => {
    const animations = [
      'animate-fade',
      'animate-slide-in',
      'animate-scale',
      'animate-bounce',
      'animate-pulse',
      'animate-shake',
      'animate-player-change',
      'animate-bid-update',
      'animate-timer-pulse',
      'animate-button-click'
    ];

    animations.forEach(className => {
      const element = document.createElement('div');
      element.className = className;
      element.style.opacity = '0';
      document.body.appendChild(element);
      setTimeout(() => document.body.removeChild(element), 100);
    });
  }
};

// Animation Presets
export const AnimationPresets = {
  // Fast and snappy
  fast: {
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Smooth and elegant
  smooth: {
    duration: 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },

  // Bouncy and playful
  bouncy: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },

  // Slow and dramatic
  dramatic: {
    duration: 800,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
};

// Performance Monitor
export const AnimationPerformance = {
  // Check if animations are smooth
  isSmooth: (duration = 1000) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frameCount = 0;
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = frameCount / (duration / 1000);
          resolve(fps >= 55); // Consider 55+ FPS as smooth
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  },

  // Optimize animations based on device performance
  optimizeForDevice: () => {
    const isLowEnd = navigator.hardwareConcurrency <= 2 || 
                     navigator.deviceMemory <= 2;
    
    return {
      reducedMotion: isLowEnd,
      shorterDuration: isLowEnd,
      simplerEasing: isLowEnd
    };
  }
};

export default AuctionAnimations;
