'use client';

import React from 'react';

type BlueprintCardProps = {
  children: React.ReactNode;
  grid?: boolean;
};

interface BlueprintDiagramLayerProps {
  className?: string;
}

const strokePrimary = 'rgba(191,219,254,0.85)';
const strokeMuted = 'rgba(148,186,255,0.35)';
const strokeAccent = 'rgba(96,165,250,0.9)';

const BlueprintCard = ({ children, grid = false }: BlueprintCardProps) => (
  <div className="relative w-full h-full rounded-[28px] border border-blue-100/40 bg-blue-950/5 shadow-[0_0_30px_rgba(15,23,42,0.35)] overflow-hidden backdrop-blur-[1px]">
    {grid && (
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <g key={`grid-${i}`}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={200} stroke={strokeMuted} strokeWidth="0.4" />
              <line y1={i * 10} x1={0} y2={i * 10} x2={200} stroke={strokeMuted} strokeWidth="0.4" />
            </g>
          ))}
        </svg>
      </div>
    )}
    <div className="relative w-full h-full p-4">{children}</div>
  </div>
);

const ParabolaGraph = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      <defs>
        <marker id="arrow-x" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill={strokePrimary} />
        </marker>
        <marker id="arrow-y" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill={strokePrimary} />
        </marker>
      </defs>
      <line x1="20" y1="135" x2="200" y2="135" stroke={strokePrimary} strokeWidth="1.4" markerEnd="url(#arrow-x)" />
      <line x1="40" y1="150" x2="40" y2="20" stroke={strokePrimary} strokeWidth="1.4" markerEnd="url(#arrow-y)" />
      <path d="M20 130 Q110 -20 200 130" fill="none" stroke={strokeAccent} strokeWidth="2" />
      <path d="M20 120 Q110 0 200 120" fill="none" stroke="rgba(59,130,246,0.55)" strokeWidth="1" strokeDasharray="6 4" />
      <text x="120" y="32" fill={strokePrimary} fontSize="10" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        f(x)=ax^2+bx+c
      </text>
      <text x="46" y="26" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        delta=b^2-4ac
      </text>
    </svg>
  </BlueprintCard>
);

const QuadraticFormulaCard = () => (
  <BlueprintCard>
    <div className="text-blue-100/90 font-mono text-[11px] space-y-3 leading-relaxed tracking-[0.08em]">
      <div className="text-[10px] uppercase text-blue-300/80">Roots</div>
      <div className="text-[12px]">
        x_{1,2} = (-b +- sqrt(b^2 - 4ac))/(2a)
      </div>
      <div className="text-[10px] uppercase text-blue-300/80 pt-1">vertex</div>
      <div className="text-[12px]">h = -b/(2a)</div>
      <div className="flex justify-between text-[10px] text-blue-200/70 pt-2 border-t border-blue-100/30">
        <span>tolerance</span>
        <span>+-0.025 mm</span>
      </div>
    </div>
  </BlueprintCard>
);

const SineWaveCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 150">
      {[0, 30, 60, 90, 120].map((y) => (
        <line key={y} x1="20" y1={y + 15} x2="200" y2={y + 15} stroke={strokeMuted} strokeWidth="0.5" strokeDasharray="6 6" />
      ))}
      {[0.8, 1.2, 1.6].map((amplitude, idx) => (
        <path
          key={idx}
          d={`M20 75 ${Array.from({ length: 18 }).map((_, i) => {
            const x = 20 + i * 10;
            const y = 75 + Math.sin((i / 18) * Math.PI * 4 + idx) * (20 * amplitude);
            return `L${x} ${y.toFixed(2)}`;
          }).join(' ')}`}
          fill="none"
          stroke={idx === 0 ? strokeAccent : 'rgba(59,130,246,0.45)'}
          strokeWidth={idx === 0 ? 1.6 : 1}
        />
      ))}
      <text x="24" y="18" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        signal(t)
      </text>
      <text x="150" y="134" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        freq=2.8hz
      </text>
    </svg>
  </BlueprintCard>
);

const GearSectionCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      <circle cx="110" cy="80" r="55" fill="none" stroke={strokeAccent} strokeWidth="1.8" />
      <circle cx="110" cy="80" r="25" fill="none" stroke={strokePrimary} strokeWidth="1.2" strokeDasharray="6 4" />
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const outerR = 70;
        const innerR = 55;
        return (
          <line
            key={i}
            x1={110 + Math.cos(angle) * innerR}
            y1={80 + Math.sin(angle) * innerR}
            x2={110 + Math.cos(angle) * outerR}
            y2={80 + Math.sin(angle) * outerR}
            stroke={strokePrimary}
            strokeWidth="1"
          />
        );
      })}
      <line x1="30" y1="20" x2="90" y2="20" stroke={strokePrimary} strokeWidth="1" />
      <line x1="30" y1="20" x2="30" y2="35" stroke={strokePrimary} strokeWidth="1" />
      <line x1="90" y1="20" x2="90" y2="35" stroke={strokePrimary} strokeWidth="1" />
      <text x="42" y="36" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        32 teeth
      </text>
    </svg>
  </BlueprintCard>
);

const ExplodedStackCard = () => (
  <BlueprintCard>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      {[0, 1, 2, 3].map((idx) => (
        <g key={idx} transform={`translate(${20 + idx * 12},${20 + idx * 14})`}>
          <rect width="140" height="40" rx="4" fill="none" stroke={strokeAccent} strokeWidth="1.4" />
          <line x1="0" y1="6" x2="140" y2="6" stroke={strokeMuted} strokeWidth="0.8" strokeDasharray="4 4" />
        </g>
      ))}
      <text x="30" y="150" fill={strokePrimary} fontSize="10" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        exploded stack - rev b
      </text>
    </svg>
  </BlueprintCard>
);

const CylinderSectionCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      <ellipse cx="110" cy="40" rx="70" ry="18" fill="none" stroke={strokeAccent} strokeWidth="1.5" />
      <rect x="40" y="40" width="140" height="80" rx="45" fill="none" stroke={strokePrimary} strokeWidth="1.5" />
      <ellipse cx="110" cy="120" rx="70" ry="18" fill="none" stroke={strokeAccent} strokeWidth="1.5" />
      <line x1="40" y1="40" x2="40" y2="120" stroke={strokePrimary} strokeWidth="1" strokeDasharray="4 4" />
      <line x1="180" y1="40" x2="180" y2="120" stroke={strokePrimary} strokeWidth="1" strokeDasharray="4 4" />
      <line x1="10" y1="30" x2="10" y2="130" stroke={strokePrimary} strokeWidth="1" />
      <line x1="10" y1="30" x2="20" y2="30" stroke={strokePrimary} strokeWidth="1" />
      <line x1="10" y1="130" x2="20" y2="130" stroke={strokePrimary} strokeWidth="1" />
      <line x1="210" y1="60" x2="210" y2="100" stroke={strokePrimary} strokeWidth="1" />
      <line x1="200" y1="60" x2="210" y2="60" stroke={strokePrimary} strokeWidth="1" />
      <line x1="200" y1="100" x2="210" y2="100" stroke={strokePrimary} strokeWidth="1" />
      <text x="20" y="85" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace" transform="rotate(-90 20 85)">
        L = 180 mm
      </text>
      <text x="182" y="90" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        ID = 58 mm
      </text>
    </svg>
  </BlueprintCard>
);

const DotMatrixCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 12 }).map((__, col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 16}
            cy={20 + row * 16}
            r={row === 3 && col === 6 ? 3 : 2}
            fill={row === 3 && col === 6 ? strokeAccent : strokePrimary}
            opacity={row === 3 && col === 6 ? 0.9 : 0.5}
          />
        ))
      )}
      <text x="30" y="150" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        sampling grid
      </text>
    </svg>
  </BlueprintCard>
);

const PolarNetworkCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      {[20, 40, 60].map((r, idx) => (
        <circle key={r} cx="110" cy="80" r={r} fill="none" stroke={idx === 2 ? strokeAccent : strokePrimary} strokeWidth="1" strokeDasharray={idx === 0 ? '4 4' : 'none'} />
      ))}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <line
            key={i}
            x1="110"
            y1="80"
            x2={110 + Math.cos(angle) * 60}
            y2={80 + Math.sin(angle) * 60}
            stroke={strokePrimary}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <circle
            key={`node-${i}`}
            cx={110 + Math.cos(angle) * 60}
            cy={80 + Math.sin(angle) * 60}
            r="3"
            fill={i % 3 === 0 ? strokeAccent : strokePrimary}
            opacity={i % 3 === 0 ? 0.9 : 0.6}
          />
        );
      })}
      <text x="74" y="24" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        polar lattice
      </text>
    </svg>
  </BlueprintCard>
);

const DimensionBlockCard = () => (
  <BlueprintCard grid>
    <svg className="w-full h-full" viewBox="0 0 220 160">
      <rect x="40" y="30" width="140" height="90" rx="8" fill="none" stroke={strokeAccent} strokeWidth="1.6" />
      <line x1="80" y1="30" x2="80" y2="120" stroke={strokePrimary} strokeWidth="1" strokeDasharray="4 4" />
      <line x1="40" y1="70" x2="180" y2="70" stroke={strokePrimary} strokeWidth="1" strokeDasharray="4 4" />
      <line x1="20" y1="30" x2="20" y2="120" stroke={strokePrimary} strokeWidth="1" />
      <line x1="20" y1="30" x2="32" y2="30" stroke={strokePrimary} strokeWidth="1" />
      <line x1="20" y1="120" x2="32" y2="120" stroke={strokePrimary} strokeWidth="1" />
      <line x1="40" y1="10" x2="180" y2="10" stroke={strokePrimary} strokeWidth="1" />
      <line x1="40" y1="10" x2="40" y2="22" stroke={strokePrimary} strokeWidth="1" />
      <line x1="180" y1="10" x2="180" y2="22" stroke={strokePrimary} strokeWidth="1" />
      <text x="60" y="22" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        span=140 mm
      </text>
      <text x="24" y="80" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace" transform="rotate(-90 24 80)">
        height=90 mm
      </text>
    </svg>
  </BlueprintCard>
);

const WaveEquationCard = () => (
  <BlueprintCard>
    <div className="flex flex-col gap-3 text-blue-100/85 font-mono text-[11px] tracking-[0.06em]">
      <div className="flex justify-between text-[10px] uppercase text-blue-300/75">
        <span>analysis</span>
        <span>rev 03</span>
      </div>
      <div className="text-[12px] leading-relaxed">
        tau = r x F
        <br />
        sigma = F / A
        <br />
        shear = 0.58 * sigma
      </div>
      <div className="border-t border-blue-100/30 pt-2 text-[10px] uppercase text-blue-200/70 flex justify-between">
        <span>material</span>
        <span>6061-T6</span>
      </div>
      <div className="flex justify-between text-[10px]">
        <span>factor</span>
        <span>2.4</span>
      </div>
    </div>
  </BlueprintCard>
);

const blueprintElements = [
  {
    id: 'parabola',
    className: 'absolute top-[6%] left-[4%] w-[230px] h-[170px] opacity-80',
    animation: 'blueprintFloat 10s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite',
    node: <ParabolaGraph />,
  },
  {
    id: 'formula',
    className: 'absolute top-[12%] left-[20%] w-[200px] h-[150px] opacity-75',
    animation: 'blueprintFloatAlt 12s ease-in-out infinite, blueprintPulse 10s ease-in-out infinite 1.2s',
    node: <QuadraticFormulaCard />,
  },
  {
    id: 'sine',
    className: 'absolute top-[4%] left-[42%] w-[240px] h-[170px] opacity-70',
    animation: 'blueprintFloat 11s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 0.8s',
    node: <SineWaveCard />,
  },
  {
    id: 'gear',
    className: 'absolute top-[10%] right-[6%] w-[210px] h-[210px] opacity-75',
    animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 1.5s',
    node: <GearSectionCard />,
  },
  {
    id: 'exploded',
    className: 'absolute top-[32%] left-[6%] w-[250px] h-[190px] opacity-70',
    animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 2s',
    node: <ExplodedStackCard />,
  },
  {
    id: 'cylinder',
    className: 'absolute top-[30%] left-[32%] w-[230px] h-[190px] opacity-75',
    animation: 'blueprintFloatAlt 11s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 2.5s',
    node: <CylinderSectionCard />,
  },
  {
    id: 'dot-matrix',
    className: 'absolute top-[36%] right-[8%] w-[220px] h-[180px] opacity-68',
    animation: 'blueprintFloat 14s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 1.8s',
    node: <DotMatrixCard />,
  },
  {
    id: 'polar',
    className: 'absolute bottom-[36%] left-[6%] w-[210px] h-[210px] opacity-72',
    animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 3s',
    node: <PolarNetworkCard />,
  },
  {
    id: 'dimension',
    className: 'absolute bottom-[30%] left-[28%] w-[240px] h-[190px] opacity-74',
    animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 3.4s',
    node: <DimensionBlockCard />,
  },
  {
    id: 'wave-equation',
    className: 'absolute bottom-[24%] right-[10%] w-[220px] h-[160px] opacity-70',
    animation: 'blueprintFloatAlt 10s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 2.8s',
    node: <WaveEquationCard />,
  },
];

const BlueprintDiagramLayer: React.FC<BlueprintDiagramLayerProps> = ({ className = '' }) => (
  <div className={`absolute inset-0 pointer-events-none z-[1] ${className}`}>
    {blueprintElements.map(({ id, className, animation, node }) => (
      <div key={id} className={`${className}`} style={{ animation }}>
        {node}
      </div>
    ))}
  </div>
);

export default BlueprintDiagramLayer;

