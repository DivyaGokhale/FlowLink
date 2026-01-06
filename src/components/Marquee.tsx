import React from 'react';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({ 
  children, 
  speed = 30,
  className = ''
}) => {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div 
        className="inline-block animate-marquee"
        style={{ 
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear'
        }}
      >
        {children}
      </div>
      <div 
        className="inline-block animate-marquee"
        style={{ 
          animationDuration: `${speed}s`,
          animationTimingFunction: 'linear'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Marquee;