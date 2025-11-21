'use client';

import React from 'react';

type BlueprintCardProps = {
  children: React.ReactNode;
  grid?: boolean;
};

interface BlueprintDiagramLayerProps {
  className?: string;
}

const strokePrimary = '#0f172a';
const strokeMuted = '#0f172a';
const strokeAccent = '#0f172a';

const BlueprintCard = ({ children, grid = false }: BlueprintCardProps) => (
  <div className="relative w-full h-full rounded-[28px] border border-blue-100/70 bg-gradient-to-br from-blue-900/35 via-blue-900/15 to-blue-950/5 shadow-[0_15px_45px_rgba(15,23,42,0.55)] overflow-hidden backdrop-blur-md">
    {grid && (
      <div className="absolute inset-0 opacity-45">
        <svg className="w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
          {[...Array(20)].map((_, i) => (
            <g key={`grid-${i}`}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={200} stroke={strokeMuted} strokeWidth="0.6" />
              <line y1={i * 10} x1={0} y2={i * 10} x2={200} stroke={strokeMuted} strokeWidth="0.6" />
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
    <svg className="w-full h-full text-blue-900" viewBox="0 0 220 160">
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
      <text x="120" y="32" fill="#0f172a" fontSize="10" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        f(x)=ax^2+bx+c
      </text>
      <text x="46" y="26" fill="#0f172a" fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        delta=b^2-4ac
      </text>
    </svg>
  </BlueprintCard>
);

const QuadraticFormulaCard = () => (
  <BlueprintCard>
    <div className="text-blue-900 font-mono text-[12px] space-y-3 leading-relaxed tracking-[0.08em] drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
      <div className="text-[11px] uppercase font-semibold text-blue-800">Roots</div>
      <div className="text-[14px] font-semibold">
        {'x_{1,2} = (-b +- sqrt(b^2 - 4ac))/(2a)'}
      </div>
      <div className="text-[11px] uppercase font-semibold text-blue-800 pt-1">vertex</div>
      <div className="text-[13px] font-semibold">h = -b/(2a)</div>
      <div className="flex justify-between text-[11px] font-semibold pt-3 border-t border-blue-900/40">
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
      <text x="24" y="18" fill="#0f172a" fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        signal(t)
      </text>
      <text x="150" y="134" fill="#0f172a" fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
        freq=2.8hz
      </text>
    </svg>
  </BlueprintCard>
);

const GearSectionCard = () => {
  // Pre-calculate coordinates to avoid hydration mismatch
  const gearTeeth = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const outerR = 70;
    const innerR = 55;
    return {
      x1: Number((110 + Math.cos(angle) * innerR).toFixed(2)),
      y1: Number((80 + Math.sin(angle) * innerR).toFixed(2)),
      x2: Number((110 + Math.cos(angle) * outerR).toFixed(2)),
      y2: Number((80 + Math.sin(angle) * outerR).toFixed(2)),
    };
  });

  return (
    <BlueprintCard grid>
      <svg className="w-full h-full" viewBox="0 0 220 160">
        <circle cx="110" cy="80" r="55" fill="none" stroke="#0f172a" strokeWidth="1.8" />
        <circle cx="110" cy="80" r="25" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeDasharray="6 4" />
        {gearTeeth.map((tooth, i) => (
          <line
            key={i}
            x1={tooth.x1}
            y1={tooth.y1}
            x2={tooth.x2}
            y2={tooth.y2}
            stroke={strokePrimary}
            strokeWidth="1"
          />
        ))}
        <line x1="30" y1="20" x2="90" y2="20" stroke="#0f172a" strokeWidth="1" />
        <line x1="30" y1="20" x2="30" y2="35" stroke={strokePrimary} strokeWidth="1" />
        <line x1="90" y1="20" x2="90" y2="35" stroke={strokePrimary} strokeWidth="1" />
        <text x="42" y="36" fill="#0f172a" fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
          32 teeth
        </text>
      </svg>
    </BlueprintCard>
  );
};

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

const PolarNetworkCard = () => {
  // Pre-calculate coordinates to avoid hydration mismatch
  const polarLines = [...Array(6)].map((_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    return {
      x2: Number((110 + Math.cos(angle) * 60).toFixed(2)),
      y2: Number((80 + Math.sin(angle) * 60).toFixed(2)),
    };
  });

  const polarNodes = [...Array(12)].map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return {
      cx: Number((110 + Math.cos(angle) * 60).toFixed(2)),
      cy: Number((80 + Math.sin(angle) * 60).toFixed(2)),
      fill: i % 3 === 0 ? strokeAccent : strokePrimary,
      opacity: i % 3 === 0 ? 0.9 : 0.6,
    };
  });

  return (
    <BlueprintCard grid>
      <svg className="w-full h-full" viewBox="0 0 220 160">
        {[20, 40, 60].map((r, idx) => (
          <circle key={r} cx="110" cy="80" r={r} fill="none" stroke={idx === 2 ? strokeAccent : strokePrimary} strokeWidth="1" strokeDasharray={idx === 0 ? '4 4' : 'none'} />
        ))}
        {polarLines.map((line, i) => (
          <line
            key={i}
            x1="110"
            y1="80"
            x2={line.x2}
            y2={line.y2}
            stroke={strokePrimary}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {polarNodes.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={node.cx}
            cy={node.cy}
            r="3"
            fill={node.fill}
            opacity={node.opacity}
          />
        ))}
        <text x="74" y="24" fill={strokePrimary} fontSize="9" fontFamily="'Space Mono','IBM Plex Mono',monospace">
          polar lattice
        </text>
      </svg>
    </BlueprintCard>
  );
};

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
    <div className="flex flex-col gap-4 text-blue-900 font-mono text-[12px] tracking-[0.08em] drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]">
      <div className="flex justify-between text-[11px] uppercase font-semibold text-blue-800">
        <span>analysis</span>
        <span>rev 03</span>
      </div>
      <div className="text-[14px] leading-relaxed font-semibold">
        tau = r x F
        <br />
        sigma = F / A
        <br />
        shear = 0.58 * sigma
      </div>
      <div className="border-t border-blue-900/40 pt-3 text-[11px] uppercase font-semibold flex justify-between">
        <span>material</span>
        <span>6061-T6</span>
      </div>
      <div className="flex justify-between text-[11px] font-semibold text-blue-800">
        <span>factor</span>
        <span>2.4</span>
      </div>
    </div>
  </BlueprintCard>
);

const blueprintElements = [
  {
    id: 'parabola',
    className: 'absolute top-[4%] left-[4%] w-[250px] h-[190px] opacity-95',
    animation: 'blueprintFloat 10s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite',
    node: <ParabolaGraph />,
  },
  {
    id: 'sine',
    className: 'absolute top-[4%] left-[32%] w-[260px] h-[190px] opacity-92',
    animation: 'blueprintFloatAlt 11s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 0.8s',
    node: <SineWaveCard />,
  },
  {
    id: 'gear',
    className: 'absolute top-[4%] right-[4%] w-[230px] h-[230px] opacity-92',
    animation: 'blueprintFloat 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 1.2s',
    node: <GearSectionCard />,
  },
  {
    id: 'wave-equation',
    className: 'absolute top-[70%] right-[16%] w-[240px] h-[190px] opacity-95',
    animation: 'blueprintFloat 10s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 2.8s',
    node: <WaveEquationCard />,
  },
  {
    id: 'formula',
    className: 'absolute top-[46%] left-[3%] w-[240px] h-[190px] opacity-95',
    animation: 'blueprintFloatAlt 12s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 3.2s',
    node: <QuadraticFormulaCard />,
  },
  {
    id: 'cylinder',
    className: 'absolute top-[43%] left-[38%] w-[250px] h-[200px] opacity-90',
    animation: 'blueprintFloat 11s ease-in-out infinite, blueprintPulse 7s ease-in-out infinite 2s',
    node: <CylinderSectionCard />,
  },
  {
    id: 'dot-matrix',
    className: 'absolute top-[46%] right-[6%] w-[230px] h-[190px] opacity-90',
    animation: 'blueprintFloatAlt 14s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 2.4s',
    node: <DotMatrixCard />,
  },
  {
    id: 'exploded',
    className: 'absolute top-[80%] right-[44%] w-[240px] h-[190px] opacity-95',
    animation: 'blueprintFloat 12s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 2.6s',
    node: <ExplodedStackCard />,
  },
  {
    id: 'dimension',
    className: 'absolute top-[62%] left-[50%] w-[260px] h-[200px] opacity-90',
    animation: 'blueprintFloatAlt 12s ease-in-out infinite, blueprintPulse 9s ease-in-out infinite 3s',
    node: <DimensionBlockCard />,
  },
  {
    id: 'polar',
    className: 'absolute bottom-[8%] left-[3%] w-[240px] h-[220px] opacity-90',
    animation: 'blueprintFloatAlt 13s ease-in-out infinite, blueprintPulse 8s ease-in-out infinite 3.4s',
    node: <PolarNetworkCard />,
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

