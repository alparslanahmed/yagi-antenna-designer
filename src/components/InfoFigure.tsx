/**
 * Small inline SVG explainer diagrams for the info modals.
 * One schematic per INFO id; purely illustrative, drawn in the app palette.
 */
import type { ReactNode } from 'react';

const AMBER = '#fbbf24';
const CYAN = '#67e8f9';
const ORANGE = '#fb923c';
const EL = '#d4d4d8';
const DIM = '#71717a';
const TXT = '#a1a1aa';

const FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace';

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = DIM,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const h = 5;
  const tip = (x: number, y: number, s: number) =>
    `${x},${y} ${x - s * (ux * h - uy * h * 0.55)},${y - s * (uy * h + ux * h * 0.55)} ${x - s * (ux * h + uy * h * 0.55)},${y - s * (uy * h - ux * h * 0.55)}`;
  return (
    <g stroke={color} strokeWidth="1">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon points={tip(x1, y1, -1)} fill="none" />
      <polygon points={tip(x2, y2, 1)} fill="none" />
    </g>
  );
}

function Label({
  x,
  y,
  children,
  anchor = 'middle',
  color = TXT,
  size = 9,
  bold = false,
}: {
  x: number;
  y: number;
  children: string;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  size?: number;
  bold?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontWeight={bold ? 'bold' : 'normal'}
      fill={color}
      fontFamily={FONT}
    >
      {children}
    </text>
  );
}

function Wave({ lambda = true }: { lambda?: boolean }) {
  return (
    <g>
      <line x1="8" y1="66" x2="312" y2="66" stroke="#3f3f46" strokeWidth="1" />
      <path
        d="M16 66 Q 40 14 64 66 T 112 66 T 160 66 T 208 66 T 256 66 T 304 66"
        fill="none"
        stroke={CYAN}
        strokeWidth="2"
      />
      {lambda && (
        <g>
          <line x1="40" y1="14" x2="40" y2="40" stroke={DIM} strokeWidth="1" strokeDasharray="2 2" />
          <line x1="88" y1="14" x2="88" y2="40" stroke={DIM} strokeWidth="1" strokeDasharray="2 2" />
          <Arrow x1={40} y1={24} x2={88} y2={24} color={AMBER} />
          <Label x={64} y={18} color={AMBER} bold>
            λ
          </Label>
          <Label x={272} y={92} color={TXT}>
            f = c / λ
          </Label>
        </g>
      )}
    </g>
  );
}

function MiniYagi({ hot = 'none' }: { hot?: 'R' | 'DE' | 'D' | 'none' }) {
  const els: Array<{ x: number; h: number; c: string; hot: boolean; t: string }> = [
    { x: 46, h: 84, c: ORANGE, hot: hot === 'R', t: 'R' },
    { x: 96, h: 72, c: CYAN, hot: hot === 'DE', t: 'DE' },
    { x: 146, h: 62, c: EL, hot: hot === 'D', t: 'D1' },
    { x: 190, h: 56, c: EL, hot: hot === 'D', t: 'D2' },
    { x: 230, h: 50, c: EL, hot: hot === 'D', t: 'D3' },
    { x: 266, h: 44, c: EL, hot: hot === 'D', t: 'D4' },
  ];
  return (
    <g>
      <line x1="28" y1="52" x2="292" y2="52" stroke="#52525b" strokeWidth="4" />
      {els.map((e) => (
        <g key={e.t} opacity={hot === 'none' || e.hot ? 1 : 0.35}>
          <line
            x1={e.x}
            y1={52 - e.h / 2}
            x2={e.x}
            y2={52 + e.h / 2}
            stroke={e.hot ? AMBER : e.c}
            strokeWidth={e.hot ? 4.5 : 3}
            strokeLinecap="round"
          />
          <Label x={e.x} y={52 + e.h / 2 + 13} color={e.hot ? AMBER : TXT} bold={e.hot}>
            {e.t}
          </Label>
        </g>
      ))}
      <Label x={292} y={30} anchor="end" color={DIM}>
        FWD →
      </Label>
    </g>
  );
}

const FIGURES: Record<string, () => ReactNode> = {
  frequency: () => <Wave />,
  wavelength: () => <Wave />,
  elements: () => <MiniYagi />,
  reflector: () => <MiniYagi hot="R" />,
  driven: () => <MiniYagi hot="DE" />,
  directors: () => <MiniYagi hot="D" />,

  preset: () => (
    <g>
      {(
        [
          { t: 'DL6WU', y: [46, 50, 54, 59, 64, 69], c: AMBER, dash: '' },
          { t: 'NBS', y: [50, 51, 52, 53, 54, 55], c: CYAN, dash: '4 3' },
          { t: 'CLASSIC', y: [48, 51, 54, 57, 60, 63], c: EL, dash: '1.5 3' },
        ] as const
      ).map((r, i) => (
        <g key={r.t}>
          <Label x={8} y={30 + i * 26} anchor="start" color={r.c} size={8.5} bold>
            {r.t}
          </Label>
          <polyline
            points={r.y.map((y, k) => `${90 + k * 36},${y}`).join(' ')}
            fill="none"
            stroke={r.c}
            strokeWidth="2"
            strokeDasharray={r.dash || undefined}
          />
          {r.y.map((y, k) => (
            <circle key={k} cx={90 + k * 36} cy={y} r="2.4" fill={r.c} />
          ))}
        </g>
      ))}
      <Label x={270} y={102} color={DIM}>
        element → shorter
      </Label>
    </g>
  ),

  elementDiameter: () => (
    <g>
      <circle cx="160" cy="52" r="30" fill="none" stroke={AMBER} strokeWidth="2.5" />
      <circle cx="160" cy="52" r="30" fill="rgba(251,191,36,0.08)" stroke="none" />
      <Arrow x1={130} y1={52} x2={190} y2={52} color={AMBER} />
      <Label x={160} y={46} color={AMBER} bold>
        d
      </Label>
      <Label x={160} y={98} color={TXT}>
        fat d → shorter + wider band
      </Label>
    </g>
  ),

  boomDiameter: () => (
    <g>
      <circle cx="160" cy="50" r="34" fill="none" stroke={EL} strokeWidth="3" />
      <line x1="60" y1="50" x2="260" y2="50" stroke={CYAN} strokeWidth="2" opacity="0.7" />
      <Arrow x1={160} y1={84} x2={194} y2={84} color={AMBER} />
      <Label x={177} y={78} color={AMBER} bold>
        D
      </Label>
      <Label x={160} y={102} color={TXT}>
        boom tube ⌀D, element through centre
      </Label>
    </g>
  ),

  boomMount: () => (
    <g>
      <Label x={80} y={14} color={CYAN} bold size={9}>
        INSULATED
      </Label>
      <rect x="30" y="58" width="100" height="12" fill="#27272a" stroke={DIM} />
      <line x1="30" y1="40" x2="130" y2="40" stroke={EL} strokeWidth="3" />
      <rect x="68" y="42" width="24" height="16" fill={CYAN} opacity="0.85" />
      <Label x={80} y={90} color={TXT}>
        no correction
      </Label>
      <Label x={240} y={14} color={AMBER} bold size={9}>
        THRU METAL
      </Label>
      <rect x="190" y="52" width="100" height="14" fill="#27272a" stroke={DIM} />
      <line x1="190" y1="48" x2="290" y2="48" stroke={EL} strokeWidth="3" />
      <line x1="238" y1="36" x2="242" y2="36" stroke={AMBER} strokeWidth="3" />
      <Label x={240} y={90} color={AMBER}>
        +ΔL on parasitics
      </Label>
    </g>
  ),

  drivenType: () => (
    <g>
      <Label x={80} y={14} color={TXT} bold size={9}>
        STRAIGHT ≈25 Ω
      </Label>
      <line x1="24" y1="52" x2="74" y2="52" stroke={CYAN} strokeWidth="3" />
      <line x1="86" y1="52" x2="136" y2="52" stroke={CYAN} strokeWidth="3" />
      <circle cx="74" cy="52" r="3" fill={AMBER} />
      <circle cx="86" cy="52" r="3" fill={AMBER} />
      <Label x={80} y={90} color={DIM}>
        needs gamma / T match
      </Label>
      <Label x={240} y={14} color={TXT} bold size={9}>
        FOLDED ≈4× Z
      </Label>
      <rect x="188" y="44" width="104" height="16" rx="8" fill="none" stroke={CYAN} strokeWidth="3" />
      <line x1="240" y1="60" x2="240" y2="60" stroke={AMBER} strokeWidth="4" />
      <circle cx="234" cy="60" r="3" fill={AMBER} />
      <circle cx="246" cy="60" r="3" fill={AMBER} />
      <Label x={240} y={90} color={DIM}>
        2:1 balun → 50 Ω
      </Label>
    </g>
  ),

  gain: () => (
    <g>
      <line x1="60" y1="20" x2="60" y2="92" stroke={CYAN} strokeWidth="3" />
      <line x1="40" y1="56" x2="80" y2="56" stroke={DIM} strokeWidth="2" />
      <ellipse cx="180" cy="56" rx="105" ry="38" fill="rgba(251,191,36,0.10)" stroke={AMBER} strokeWidth="2.5" />
      <line x1="285" y1="56" x2="300" y2="56" stroke={AMBER} strokeWidth="2" />
      <polygon points="300,56 292,51 292,61" fill={AMBER} />
      <Label x={180} y={50} color={AMBER} bold>
        main lobe
      </Label>
      <Label x={180} y={64} color={TXT} size={8.5}>
        dBi vs isotropic
      </Label>
    </g>
  ),

  frontback: () => (
    <g>
      <line x1="160" y1="24" x2="160" y2="88" stroke={CYAN} strokeWidth="3" />
      <ellipse cx="232" cy="56" rx="66" ry="30" fill="rgba(251,191,36,0.10)" stroke={AMBER} strokeWidth="2.5" />
      <ellipse cx="128" cy="56" rx="22" ry="14" fill="none" stroke={DIM} strokeWidth="1.5" strokeDasharray="3 3" />
      <Arrow x1={106} y1={92} x2={298} y2={92} color={AMBER} />
      <Label x={202} y={86} color={AMBER} bold>
        F/B dB
      </Label>
      <Label x={60} y={40} color={DIM} size={8.5}>
        rear null
      </Label>
    </g>
  ),

  beamwidth: () => (
    <g>
      <path d="M160 100 C 110 70 105 30 160 8 C 215 30 210 70 160 100" fill="rgba(103,232,249,0.10)" stroke={CYAN} strokeWidth="2.5" />
      <line x1="160" y1="100" x2="128" y2="30" stroke={AMBER} strokeWidth="1.2" strokeDasharray="3 3" />
      <line x1="160" y1="100" x2="192" y2="30" stroke={AMBER} strokeWidth="1.2" strokeDasharray="3 3" />
      <path d="M146 74 A 30 30 0 0 1 174 74" fill="none" stroke={AMBER} strokeWidth="1.5" />
      <Label x={160} y={68} color={AMBER} bold size={8.5}>
        θ −3dB
      </Label>
      <Label x={160} y={110} color={DIM} size={8.5}>
        E-plane narrower than H
      </Label>
    </g>
  ),

  feedZ: () => (
    <g>
      <line x1="80" y1="46" x2="150" y2="46" stroke={CYAN} strokeWidth="3" />
      <line x1="170" y1="46" x2="240" y2="46" stroke={CYAN} strokeWidth="3" />
      <circle cx="150" cy="46" r="4" fill={AMBER} />
      <circle cx="170" cy="46" r="4" fill={AMBER} />
      <line x1="150" y1="50" x2="150" y2="84" stroke={AMBER} strokeWidth="2" />
      <line x1="170" y1="50" x2="170" y2="84" stroke={AMBER} strokeWidth="2" />
      <rect x="138" y="84" width="44" height="14" fill="#27272a" stroke={DIM} />
      <Label x={160} y={94} color={TXT} size={8}>
        coax
      </Label>
      <Label x={252} y={50} anchor="start" color={AMBER} bold>
        Z ≈ R + j0
      </Label>
      <Label x={252} y={64} anchor="start" color={DIM} size={8.5}>
        at f0
      </Label>
    </g>
  ),

  bandwidth: () => (
    <g>
      <line x1="24" y1="88" x2="296" y2="88" stroke="#3f3f46" />
      <line x1="24" y1="12" x2="24" y2="88" stroke="#3f3f46" />
      <Label x={30} y={20} anchor="start" color={DIM} size={8.5}>
        SWR
      </Label>
      <line x1="24" y1="44" x2="296" y2="44" stroke={AMBER} strokeWidth="1.2" strokeDasharray="4 3" />
      <Label x={292} y={40} anchor="end" color={AMBER} size={8.5}>
        2.0
      </Label>
      <path d="M40 88 C 80 88 100 60 130 60 C 150 60 155 78 160 80 C 165 78 170 60 190 60 C 220 60 240 88 280 88" fill="none" stroke={CYAN} strokeWidth="2.5" />
      <line x1="118" y1="60" x2="118" y2="88" stroke={DIM} strokeDasharray="2 2" />
      <line x1="202" y1="60" x2="202" y2="88" stroke={DIM} strokeDasharray="2 2" />
      <Arrow x1={118} y1={80} x2={202} y2={80} color={AMBER} />
      <Label x={160} y={74} color={AMBER} size={8.5} bold>
        BW
      </Label>
    </g>
  ),

  boom: () => (
    <g>
      <line x1="60" y1="30" x2="60" y2="70" stroke={ORANGE} strokeWidth="3" />
      <line x1="260" y1="36" x2="260" y2="64" stroke={EL} strokeWidth="3" />
      <rect x="40" y="46" width="240" height="8" fill="#27272a" stroke={DIM} />
      <Arrow x1={60} y1={78} x2={260} y2={78} color={AMBER} />
      <Label x={160} y={72} color={AMBER} size={8.5} bold>
        electrical (sets gain)
      </Label>
      <Arrow x1={40} y1={96} x2={280} y2={96} color={DIM} />
      <Label x={160} y={108} color={DIM} size={8.5}>
        cut length = electrical + 2× overhang
      </Label>
    </g>
  ),

  spacing: () => (
    <g>
      <line x1="110" y1="18" x2="110" y2="82" stroke={CYAN} strokeWidth="3.5" />
      <line x1="210" y1="24" x2="210" y2="76" stroke={EL} strokeWidth="3.5" />
      <line x1="90" y1="50" x2="230" y2="50" stroke="#52525b" strokeWidth="4" />
      <line x1="110" y1="18" x2="110" y2="82" stroke={CYAN} strokeWidth="3.5" />
      <line x1="210" y1="24" x2="210" y2="76" stroke={EL} strokeWidth="3.5" />
      <Arrow x1={110} y1={94} x2={210} y2={94} color={AMBER} />
      <Label x={160} y={88} color={AMBER} bold>
        s ≈ 0.15–0.3 λ
      </Label>
    </g>
  ),

  windload: () => (
    <g>
      <rect x="40" y="48" width="240" height="10" fill="rgba(251,191,36,0.25)" stroke={AMBER} />
      {[60, 100, 140, 180, 220, 260].map((x, i) => (
        <rect
          key={x}
          x={x - 5}
          y={48 - 34 + i * 3}
          width="10"
          height={34 - i * 3}
          fill="rgba(251,191,36,0.25)"
          stroke={AMBER}
          strokeWidth="1"
        />
      ))}
      <Label x={160} y={82} color={AMBER} size={8.5} bold>
        A ≈ Σ (L · d)
      </Label>
      <Label x={160} y={98} color={TXT} size={8.5}>
        side-on projected tube area
      </Label>
    </g>
  ),

  nec: () => (
    <g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect
          key={i}
          x={52 + i * 24}
          y="44"
          width="24"
          height="12"
          fill={i === 4 ? 'rgba(251,191,36,0.3)' : 'none'}
          stroke={CYAN}
          strokeWidth="1.5"
        />
      ))}
      <circle cx="160" cy="50" r="5" fill={AMBER} />
      <Label x={160} y={36} color={AMBER} bold size={8.5}>
        EX source
      </Label>
      <Label x={160} y={82} color={TXT}>
        GW wire → segments ≈ λ/50
      </Label>
      <Label x={160} y={98} color={DIM} size={8.5}>
        FR f0 · RP pattern
      </Label>
    </g>
  ),
};

/** Explainer diagram for an INFO id; falls back to a mini-Yagi sketch. */
export function InfoFigure({ id }: { id: string }) {
  const draw = FIGURES[id] ?? (() => <MiniYagi />);
  return (
    <svg
      viewBox="0 0 320 112"
      className="h-auto w-full"
      role="img"
      aria-hidden="true"
      fontFamily={FONT}
    >
      <rect x="0" y="0" width="320" height="112" fill="#101014" />
      {draw()}
    </svg>
  );
}
