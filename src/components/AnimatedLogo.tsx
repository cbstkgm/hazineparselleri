import React from 'react';
import './AnimatedLogo.css';

interface AnimatedLogoProps {
  direction?: 'right' | 'left';
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ direction = 'right' }) => {
  return (
    <div className={`animated-logo animated-logo-${direction}`}>
      <svg viewBox="0 0 120 100" width="36" height="30" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path className="chevron chevron-1" d="M 25,20 L 55,50 L 25,80" stroke="#000000" />
        <path className="chevron chevron-2" d="M 50,20 L 80,50 L 50,80" stroke="#000000" />
        <path className="chevron chevron-3" d="M 75,20 L 105,50 L 75,80" stroke="#40E0D0" />
      </svg>
    </div>
  );
};

export default AnimatedLogo;
