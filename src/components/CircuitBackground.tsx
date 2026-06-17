import { useMemo } from "react";

interface PathSpec {
  d: string;
  endX: number;
  endY: number;
  startX: number;
  startY: number;
  isHighlighted: boolean;
  isFlowing: boolean;
}

export function CircuitBackground() {
  const copperColor = "#e87738"; // Vibrant copper orange matching the 2nd image
  const highlightColor = "#ffe6c0"; // Warm white/yellow highlights
  
  // Center frame starting coordinates (shifted inward under the 3D chip to allow seamless fade-in)
  const frameLeft = 780;
  const frameRight = 1140;
  const frameTop = 460;
  const frameBottom = 650;

  const pathsData = useMemo(() => {
    const list: PathSpec[] = [];

    // Helper to generate a path spec and push it
    const addPath = (
      startX: number,
      startY: number,
      segments: { dx: number; dy: number }[],
      isHighlighted: boolean,
      isFlowing: boolean
    ) => {
      let x = startX;
      let y = startY;
      let d = `M ${x} ${y}`;
      for (const seg of segments) {
        x += seg.dx;
        y += seg.dy;
        d += ` L ${x} ${y}`;
      }
      list.push({ d, endX: x, endY: y, startX, startY, isHighlighted, isFlowing });
    };

    // 1. LEFT BUS (Horizontal-ish radiating left) - 10 lines
    for (let i = 0; i < 10; i++) {
      const startY = 485 + i * 11;
      const isHi = i === 2 || i === 7;
      const isFlow = i === 4;
      addPath(
        frameLeft,
        startY,
        [
          { dx: -110 - i * 3, dy: 0 },
          { dx: -60, dy: 60 },
          { dx: -120 - i * 5, dy: 0 },
          { dx: -40, dy: -40 },
          { dx: -350, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 2. RIGHT BUS (Horizontal-ish radiating right) - 10 lines
    for (let i = 0; i < 10; i++) {
      const startY = 485 + i * 11;
      const isHi = i === 1 || i === 6;
      const isFlow = i === 3;
      addPath(
        frameRight,
        startY,
        [
          { dx: 110 + i * 3, dy: 0 },
          { dx: 60, dy: -60 },
          { dx: 120 + i * 5, dy: 0 },
          { dx: 40, dy: 40 },
          { dx: 350, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 3. TOP LEFT DIAGONAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = frameLeft - 20 - i * 12;
      const startY = frameTop;
      const isHi = i === 3;
      const isFlow = i === 5;
      addPath(
        startX,
        startY,
        [
          { dx: -120, dy: -120 },
          { dx: 0, dy: -80 - i * 6 },
          { dx: -60, dy: -60 },
          { dx: -250, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 4. TOP RIGHT DIAGONAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = frameRight + 20 + i * 12;
      const startY = frameTop;
      const isHi = i === 4;
      const isFlow = i === 2;
      addPath(
        startX,
        startY,
        [
          { dx: 120, dy: -120 },
          { dx: 0, dy: -80 - i * 6 },
          { dx: 60, dy: -60 },
          { dx: 250, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 5. BOTTOM LEFT DIAGONAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = frameLeft - 20 - i * 12;
      const startY = frameBottom;
      const isHi = i === 2;
      const isFlow = i === 4;
      addPath(
        startX,
        startY,
        [
          { dx: -120, dy: 120 },
          { dx: 0, dy: 80 + i * 6 },
          { dx: -60, dy: 60 },
          { dx: -250, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 6. BOTTOM RIGHT DIAGONAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = frameRight + 20 + i * 12;
      const startY = frameBottom;
      const isHi = i === 5;
      const isFlow = i === 3;
      addPath(
        startX,
        startY,
        [
          { dx: 120, dy: 120 },
          { dx: 0, dy: 80 + i * 6 },
          { dx: 60, dy: 60 },
          { dx: 250, dy: 0 }
        ],
        isHi,
        isFlow
      );
    }

    // 7. TOP VERTICAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = 910 + i * 13;
      const startY = frameTop;
      const isHi = i === 1 || i === 6;
      const isFlow = i === 4;
      addPath(
        startX,
        startY,
        [
          { dx: 0, dy: -130 - i * 5 },
          { dx: i < 4 ? -80 : 80, dy: -80 },
          { dx: 0, dy: -200 }
        ],
        isHi,
        isFlow
      );
    }

    // 8. BOTTOM VERTICAL BUS - 8 lines
    for (let i = 0; i < 8; i++) {
      const startX = 910 + i * 13;
      const startY = frameBottom;
      const isHi = i === 2 || i === 5;
      const isFlow = i === 3;
      addPath(
        startX,
        startY,
        [
          { dx: 0, dy: 130 + i * 5 },
          { dx: i < 4 ? -80 : 80, dy: 80 },
          { dx: 0, dy: 200 }
        ],
        isHi,
        isFlow
      );
    }

    return list;
  }, []);

  const vias: { x: number; y: number }[] = useMemo(() => {
    return [
      // Top Left Bus ends
      { x: 300, y: 380 }, { x: 300, y: 390 }, { x: 300, y: 400 }, { x: 300, y: 410 },
      // Bottom Left Bus ends
      { x: 350, y: 680 }, { x: 350, y: 690 }, { x: 350, y: 700 },
      // Top Right Bus ends
      { x: 1620, y: 380 }, { x: 1620, y: 390 }, { x: 1620, y: 400 }, { x: 1620, y: 410 },
      // Bottom Right Bus ends
      { x: 1570, y: 680 }, { x: 1570, y: 690 }, { x: 1570, y: 700 },
      // Diagonal routes ends
      { x: 200, y: 260 }, { x: 1720, y: 260 }, { x: 200, y: 820 }, { x: 1720, y: 820 },
      // Vertical routes ends
      { x: 750, y: 50 }, { x: 1170, y: 50 }, { x: 750, y: 1030 }, { x: 1170, y: 1030 }
    ];
  }, []);

  const testPointGrids = useMemo(() => {
    const grids = [
      { startX: 350, startY: 180 },
      { startX: 1500, startY: 180 },
      { startX: 350, startY: 860 },
      { startX: 1500, startY: 860 },
    ];
    const points: { x: number; y: number }[] = [];
    grids.forEach((g) => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if ((r + c) % 4 === 0) continue;
          points.push({ x: g.startX + c * 16, y: g.startY + r * 16 });
        }
      }
    });
    return points;
  }, []);

  const goldFingers = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    // Left edge
    for (let y = 300; y <= 800; y += 28) {
      list.push({ x: 60, y });
    }
    // Right edge
    for (let y = 300; y <= 800; y += 28) {
      list.push({ x: 1840, y });
    }
    return list;
  }, []);

  const fiducials = [
    { x: 140, y: 100 }, { x: 1780, y: 100 },
    { x: 140, y: 980 }, { x: 1780, y: 980 }
  ];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none pointer-events-none"
    >
      <defs>
        {/* Mask with custom ellipse offsets perfectly fading traces out under the 3D chip */}
        <radialGradient id="circuit-radial-mask-grad" cx="50%" cy="52.5%" r="50%">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="11%" stopColor="black" stopOpacity="0" />
          <stop offset="16%" stopColor="white" stopOpacity="1" />
          <stop offset="85%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <mask id="circuit-radial-mask">
          <rect x="0" y="0" width="1920" height="1080" fill="url(#circuit-radial-mask-grad)" />
        </mask>
      </defs>

      <g mask="url(#circuit-radial-mask)">
        {/* (Math-notebook background grid removed per design direction.) */}

        {/* ── Main Circuit Board Traces (Emerging directly from under the 3D chip boundaries) ── */}
        {/* Copper orange traces */}
        <g fill="none" stroke={copperColor} strokeWidth="2.4" strokeOpacity="0.75" strokeLinecap="round" strokeLinejoin="round">
          {pathsData.filter(p => !p.isHighlighted && !p.isFlowing).map((p, i) => (
            <path key={`trace-std-${i}`} d={p.d} />
          ))}
        </g>

        {/* White-cream highlighted traces */}
        <g fill="none" stroke={highlightColor} strokeWidth="2.6" strokeOpacity="0.95" strokeLinecap="round" strokeLinejoin="round">
          {pathsData.filter(p => p.isHighlighted).map((p, i) => (
            <path key={`trace-hi-${i}`} d={p.d} />
          ))}
        </g>

        {/* Static high-intensity traces */}
        <g fill="none" stroke={highlightColor} strokeWidth="3.0" strokeOpacity="0.95" strokeLinecap="round" strokeLinejoin="round">
          {pathsData.filter(p => p.isFlowing).map((p, i) => (
            <path key={`trace-flow-${i}`} d={p.d} />
          ))}
        </g>

        {/* ── Live Data Stream Packets flowing along traces into the processor ── */}
        {pathsData.map((p, idx) => {
          // Render a bubble/packet on about 40% of the paths
          if (idx % 3 !== 0) return null;

          // Technical logic analyzer colored data streams fanning into the chip
          const colors = ["#3b82f6", "#10b981", "#ff007f", "#fbbf24", "#a855f7", "#06b6d4"];
          const color = colors[idx % colors.length];
          const dur = `${2.4 + (idx % 4) * 0.7}s`;
          const delay = `-${(idx % 4) * 0.6}s`; // Stagger start offsets
          const size = 3 + (idx % 3); // 3px to 5px size

          return (
            <circle key={`packet-${idx}`} r={size} fill={color} opacity="0.95">
              <animateMotion
                dur={dur}
                begin={delay}
                repeatCount="indefinite"
                path={p.d}
                keyPoints="1;0"
                keyTimes="0;1"
                calcMode="linear"
              />
            </circle>
          );
        })}

        {/* ── Vias (concentric copper pads at endpoints) ── */}
        <g stroke={copperColor} strokeWidth="1.4" fill="none" opacity="0.9" strokeLinecap="round">
          {pathsData.map((p, i) => (
            <g key={`via-end-${i}`}>
              <circle cx={p.endX} cy={p.endY} r="3.8" />
              <circle cx={p.endX} cy={p.endY} r="1.2" fill={copperColor} />
            </g>
          ))}
          {vias.map((v, i) => (
            <g key={`via-static-${i}`}>
              <circle cx={v.x} cy={v.y} r="3.8" />
              <circle cx={v.x} cy={v.y} r="1.2" fill={copperColor} />
            </g>
          ))}
        </g>

        {/* ── Grids of Test Points ── */}
        <g fill={copperColor} opacity="0.6">
          {testPointGrids.map((tp, i) => (
            <circle key={`tp-${i}`} cx={tp.x} cy={tp.y} r="2.5" />
          ))}
        </g>

        {/* ── Fiducial Registration Markers ── */}
        {fiducials.map((f, i) => (
          <g key={`fid-${i}`} opacity="0.75" stroke={copperColor} fill="none">
            <circle cx={f.x} cy={f.y} r="10" strokeWidth="1.5" />
            <circle cx={f.x} cy={f.y} r="2.5" fill={copperColor} />
            <line x1={f.x - 16} y1={f.y} x2={f.x + 16} y2={f.y} strokeWidth="1.2" />
            <line x1={f.x} y1={f.y - 16} x2={f.x} y2={f.y + 16} strokeWidth="1.2" />
          </g>
        ))}

        {/* ── Gold Connector Fingers (Left/Right margins) ── */}
        <g fill={copperColor} opacity="0.7">
          {goldFingers.map((gf, i) => (
            <rect
              key={`gf-${i}`}
              x={gf.x - 5}
              y={gf.y - 10}
              width="10"
              height="20"
              rx="1.5"
            />
          ))}
        </g>
        <g fill="none" stroke={copperColor} strokeWidth="1.2" strokeOpacity="0.45" strokeLinecap="round">
          {/* Fanout lines from fingers */}
          {goldFingers.map((gf, i) => {
            const isLeft = gf.x < 960;
            const targetX = isLeft ? gf.x + 45 : gf.x - 45;
            const bendX = isLeft ? gf.x + 20 : gf.x - 20;
            const bendY = gf.y + (i % 2 === 0 ? 12 : -12);
            return (
              <path
                key={`gfl-${i}`}
                d={`M ${gf.x} ${gf.y} L ${bendX} ${bendY} L ${targetX} ${bendY}`}
              />
            );
          })}
        </g>

        {/* ── Technical Monospace Labels ── */}
        <g fill={copperColor} opacity="0.8" fontSize="10.5" fontFamily="JetBrains Mono, Courier New, monospace" fontWeight="500">
          <text x="310" y="372">SYS_BUS_D[0..3]</text>
          <text x="360" y="672">VDD_SOC_EN</text>
          <text x="1435" y="372">DRAM_ADDR[0..3]</text>
          <text x="1380" y="672">PMU_VREG_OUT</text>
          <text x="940" y="860" transform="rotate(-90 940 860)">CLK_REF_100M</text>

          {/* Board Spec Blocks */}
          <g opacity="0.85">
            <text x="180" y="210">BOARD SPEC: 12-LAYER FR4 HDI</text>
            <text x="180" y="226">TRACE WIDTH: 0.125MM</text>
            <text x="180" y="242">CONTROLLED IMPEDANCE: 50R/90R</text>

            <text x="1450" y="210" textAnchor="end">DESIGNED BY: PARZIVAL & DHRUV</text>
            <text x="1450" y="226" textAnchor="end">PROJECT: BITS'N'BREWS V5</text>
            <text x="1450" y="242" textAnchor="end">LAYER STACKUP: 1-10-1</text>
          </g>
        </g>
      </g>
    </svg>
  );
}
