import React from 'react';
import './AnimatedLogo.css';

interface AnimatedLogoProps {
  direction?: 'right' | 'left';
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ direction = 'right' }) => {
  return (
    <div className={`animated-logo animated-logo-${direction}`}>
      <img src="/logo_flat.png" alt="HP Logo" style={{ width: '36px', height: 'auto', objectFit: 'contain' }} />
    </div>
  );
};

export default AnimatedLogo;
