import React, { useId } from 'react';

interface TechnicalPatternProps {
  className?: string;
  gridSpacing?: number;
  dotSpacing?: number;
  strokeWidth?: number;
  dotRadius?: number;
  opacity?: number;
  color?: string;
}

const TechnicalPattern: React.FC<TechnicalPatternProps> = ({
  className = 'text-[#5daaff]',
  gridSpacing = 40,
  dotSpacing = 20,
  strokeWidth = 1.2,
  dotRadius = 1.6,
  opacity = 0.45,
  color = 'currentColor',
}) => {
  const patternId = useId();
  const gridId = `${patternId}-grid`;
  const dotsId = `${patternId}-dots`;

  return (
    <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={gridId} width={gridSpacing} height={gridSpacing} patternUnits="userSpaceOnUse">
            <path d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`} fill="none" stroke={color} strokeWidth={strokeWidth} />
          </pattern>
          <pattern id={dotsId} width={dotSpacing} height={dotSpacing} patternUnits="userSpaceOnUse">
            <circle cx={dotSpacing / 2} cy={dotSpacing / 2} r={dotRadius} fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${gridId})`} />
        <rect width="100%" height="100%" fill={`url(#${dotsId})`} />
      </svg>
    </div>
  );
};

export default TechnicalPattern;