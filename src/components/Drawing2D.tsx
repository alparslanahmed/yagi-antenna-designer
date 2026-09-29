import { useMemo } from 'react';
import { PRESETS, type YagiDesign, type YagiElement } from '../lib/yagi';
import type { Highlight } from '../lib/highlight';
import { roleToKind } from '../lib/highlight';
import { formatLenShort, lenUnitLabel, type Unit } from '../lib/format';

interface Props {
  design: YagiDesign;
  unit: Unit;
  highlight: Highlight;
}

export const DRAWING_SVG_ID = 'yagi-2d-svg';

const AMBER = '#fbbf24';
const DIM = '#71717a';
const DIM_TXT = '#a1a1aa';

function elBaseColor(e: YagiElement): string {
  if (e.role === 'reflector') return '#fb923c';
  if (e.role === 'driven') return '#67e8f9';
  return '#d4d4d8';
}

/**
 * True-scale top-view technical drawing: boom along X, elements vertical,
 * full dimensioning, title block. Not to be confused with art — every
 * pixel derives from the design data.
 */
export function Drawing2D({ design: d, unit, highlight }: Props) {
  const g = useMemo(() => {
    const W = 1000;
    const left = 96;
    const right = 64;
    const top = 78;
    const bottom = 168;
    const contentW = W - left - right;
    const boomEl = Math.max(d.boomElectricalMm, d.wavelengthMm * 0.05);
    const s = contentW / boomEl; // px per mm
    const halfPx = (d.longestElementMm / 2) * s;
    const yC = top + halfPx;
    const H = Math.ceil(yC + halfPx + bottom);
    const x = (posMm: number) => left + posMm * s;
    const halfLen = (lenMm: number) => (lenMm / 2) * s;
    return { W, H, left, right, top, yC, s, x, halfLen, halfPx };
  }, [d]);

  const elHot = (e: YagiElement): boolean => {
    if (highlight.index != null) return highlight.index === e.index;
    if (highlight.kind === 'diameter' || highlight.kind === 'frequency')
      return true;
    return highlight.kind === roleToKind(e.role);
  };
  const anyElHot =
    highlight.index != null ||
    ['reflector', 'driven', 'directors', 'diameter', 'frequency'].includes(
      highlight.kind,
    );
  const boomHot = highlight.kind === 'boom';
  const spacingHot = highlight.kind === 'spacing';
  const lambdaHot = highlight.kind === 'frequency';
  const feedHot = highlight.kind === 'feed' || highlight.kind === 'driven';
  const fwdHot = highlight.kind === 'gain';
  const rearHot = highlight.kind === 'pattern';

  const u = lenUnitLabel(unit);
  const n = d.elements.length;
  // label stride so names never collide
  const stride = Math.max(1, Math.ceil(n / 12));

  const boomX0 = g.x(0) - (d.boomLengthMm - d.boomElectricalMm) / 2 / 1; // px below
  const overhangPx =
    ((d.boomLengthMm - d.boomElectricalMm) / 2) * g.s;
  const bx0 = g.x(0) - overhangPx;
  const bx1 = g.x(d.boomElectricalMm) + overhangPx;
  const boomT = Math.min(9, Math.max(4.5, d.inputs.boomDiameterMm * g.s));
  void boomX0;

  const dimY1 = g.yC + g.halfPx + 36;
  const dimY2 = dimY1 + 30;
  const dimY3 = dimY2 + 34;

  const lamPx = d.wavelengthMm * g.s;
  const lamX0 = g.x(0);
  const lamX1 = Math.min(lamX0 + lamPx, g.W - g.right);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <svg
      id={DRAWING_SVG_ID}
      viewBox={`0 0 ${g.W} ${g.H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label={`Technical drawing of ${n}-element Yagi for ${d.inputs.frequencyMHz} MHz`}
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      <defs>
        <pattern id="yagi-grid-s" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e1e24" strokeWidth="1" />
        </pattern>
        <pattern id="yagi-grid-l" width="200" height="200" patternUnits="userSpaceOnUse">
          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#26262e" strokeWidth="1" />
        </pattern>
        <marker id="yagi-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M 0 0 L 7 3 L 0 6" fill="none" stroke={DIM} strokeWidth="1.2" />
        </marker>
        <marker id="yagi-arr-h" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M 0 0 L 7 3 L 0 6" fill="none" stroke={AMBER} strokeWidth="1.4" />
        </marker>
      </defs>

      <rect x="0" y="0" width={g.W} height={g.H} fill="#101014" />
      <rect x="0" y="0" width={g.W} height={g.H} fill="url(#yagi-grid-s)" />
      <rect x="0" y="0" width={g.W} height={g.H} fill="url(#yagi-grid-l)" />

      {/* wavelength bracket */}
      <g opacity={lambdaHot ? 1 : 0.55}>
        <line
          x1={lamX0}
          y1={26}
          x2={lamX1}
          y2={26}
          stroke={lambdaHot ? AMBER : DIM}
          strokeWidth={lambdaHot ? 2 : 1}
          markerStart="url(#yagi-arr)"
          markerEnd="url(#yagi-arr)"
        />
        <text
          x={(lamX0 + lamX1) / 2}
          y={20}
          textAnchor="middle"
          fontSize="11"
          fill={lambdaHot ? AMBER : DIM_TXT}
        >
          λ = {d.wavelengthMm.toFixed(1)} mm{lamX0 + lamPx > lamX1 ? ' (truncated)' : ''}
        </text>
      </g>

      {/* FWD / REAR arrows */}
      <g>
        <line
          x1={bx1 + 6}
          y1={g.yC}
          x2={Math.min(bx1 + 46, g.W - 8)}
          y2={g.yC}
          stroke={fwdHot ? AMBER : '#52525b'}
          strokeWidth={fwdHot ? 2.5 : 1.5}
          markerEnd={fwdHot ? 'url(#yagi-arr-h)' : 'url(#yagi-arr)'}
          opacity={fwdHot || highlight.kind === 'none' ? 1 : 0.4}
        />
        <text
          x={Math.min(bx1 + 26, g.W - 28)}
          y={g.yC - 8}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={fwdHot ? AMBER : '#71717a'}
          opacity={fwdHot || highlight.kind === 'none' ? 1 : 0.4}
        >
          FWD
        </text>
        <line
          x1={bx0 - 6}
          y1={g.yC}
          x2={Math.max(bx0 - 30, 8)}
          y2={g.yC}
          stroke={rearHot ? AMBER : '#3f3f46'}
          strokeWidth={rearHot ? 2.5 : 1.2}
          strokeDasharray="4 3"
          opacity={rearHot ? 1 : 0.5}
        />
        {rearHot && (
          <text x={Math.max(bx0 - 18, 30)} y={g.yC - 8} textAnchor="middle" fontSize="10" fill={AMBER}>
            −{d.frontToBackDb.toFixed(0)} dB
          </text>
        )}
      </g>

      {/* boom */}
      <g opacity={boomHot || highlight.kind === 'none' || anyElHot ? 1 : 0.35}>
        <rect
          x={bx0}
          y={g.yC - boomT / 2}
          width={bx1 - bx0}
          height={boomT}
          fill={boomHot ? '#78350f' : '#27272a'}
          stroke={boomHot ? AMBER : '#71717a'}
          strokeWidth={boomHot ? 2 : 1.2}
        />
        <line
          x1={bx0 - 14}
          y1={g.yC}
          x2={bx1 + 14}
          y2={g.yC}
          stroke={boomHot ? AMBER : '#52525b'}
          strokeWidth="1"
          strokeDasharray="10 3 2 3"
          opacity="0.8"
        />
        <text x={(bx0 + bx1) / 2} y={g.yC + boomT / 2 + 14} textAnchor="middle" fontSize="10" fill={boomHot ? AMBER : DIM_TXT}>
          BOOM ⌀{d.inputs.boomDiameterMm} ({d.inputs.boomMount === 'through' ? 'metal, thru-mount' : 'insulated mount'})
        </text>
      </g>

      {/* elements */}
      {d.elements.map((e) => {
        const hot = elHot(e);
        const dimmed = anyElHot && !hot;
        const ex = g.x(e.positionMm);
        const h = g.halfLen(e.lengthMm);
        const w =
          highlight.kind === 'diameter'
            ? Math.min(12, Math.max(6, d.inputs.elementDiameterMm * g.s * 2))
            : Math.min(7, Math.max(2.4, d.inputs.elementDiameterMm * g.s));
        const showLabel = e.index % stride === 0 || hot || e.role !== 'director';
        return (
          <g key={e.index} opacity={dimmed ? 0.3 : 1}>
            {hot && (
              <line x1={ex} y1={g.yC - h} x2={ex} y2={g.yC + h} stroke={AMBER} strokeWidth={w + 7} opacity="0.25" strokeLinecap="round" />
            )}
            {e.role === 'driven' && d.inputs.drivenType === 'folded' ? (
              <g stroke={hot ? AMBER : elBaseColor(e)} strokeWidth={w * 0.7} strokeLinecap="round">
                <line x1={ex - 7} y1={g.yC - h} x2={ex - 7} y2={g.yC + h} />
                <line x1={ex + 7} y1={g.yC - h} x2={ex + 7} y2={g.yC + h} />
                <line x1={ex - 7} y1={g.yC - h} x2={ex + 7} y2={g.yC - h} />
                <line x1={ex - 7} y1={g.yC + h} x2={ex + 7} y2={g.yC + h} />
              </g>
            ) : (
              <line
                x1={ex}
                y1={g.yC - h}
                x2={ex}
                y2={g.yC + h}
                stroke={hot ? AMBER : elBaseColor(e)}
                strokeWidth={hot ? w + 1.5 : w}
                strokeLinecap="round"
              />
            )}
            {/* centre mark */}
            <line x1={ex - 5} y1={g.yC} x2={ex + 5} y2={g.yC} stroke={hot ? AMBER : '#52525b'} strokeWidth="1" />
            {showLabel && (
              <g>
                <text x={ex} y={g.yC - h - 8} textAnchor="middle" fontSize="11" fontWeight="bold" fill={hot ? AMBER : elBaseColor(e)}>
                  {e.label}
                </text>
                <text x={ex} y={g.yC + h + 16} textAnchor="middle" fontSize="9.5" fill={hot ? AMBER : DIM_TXT}>
                  {formatLenShort(e.lengthMm, unit)}
                </text>
              </g>
            )}
            {/* feedpoint */}
            {e.role === 'driven' && (
              <g opacity={feedHot || highlight.kind === 'none' ? 1 : 0.35}>
                <circle cx={ex} cy={g.yC - 11} r="3.4" fill={feedHot ? AMBER : '#101014'} stroke={feedHot ? AMBER : '#67e8f9'} strokeWidth="1.4" />
                <circle cx={ex} cy={g.yC + 11} r="3.4" fill={feedHot ? AMBER : '#101014'} stroke={feedHot ? AMBER : '#67e8f9'} strokeWidth="1.4" />
                <text x={ex + 12} y={g.yC + 22} fontSize="9.5" fill={feedHot ? AMBER : '#67e8f9'}>
                  FEED
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* spacing dimensions (staggered rows) */}
      {d.elements.slice(1).map((e, k) => {
        const x0 = g.x(d.elements[k].positionMm);
        const x1 = g.x(e.positionMm);
        const row2 = k % 2 === 1;
        const y = row2 ? dimY2 : dimY1;
        const hot = spacingHot || highlight.index === e.index;
        return (
          <g key={e.index} opacity={spacingHot || hot || highlight.kind === 'none' ? 1 : 0.45}>
            <line x1={x0} y1={g.yC + g.halfPx + 8} x2={x0} y2={y + 4} stroke={hot ? AMBER : '#3f3f46'} strokeWidth="1" />
            <line x1={x1} y1={g.yC + g.halfPx + 8} x2={x1} y2={y + 4} stroke={hot ? AMBER : '#3f3f46'} strokeWidth="1" />
            <line
              x1={x0}
              y1={y}
              x2={x1}
              y2={y}
              stroke={hot ? AMBER : DIM}
              strokeWidth={hot ? 1.6 : 1}
              markerStart={hot ? 'url(#yagi-arr-h)' : 'url(#yagi-arr)'}
              markerEnd={hot ? 'url(#yagi-arr-h)' : 'url(#yagi-arr)'}
            />
            <text x={(x0 + x1) / 2} y={y - 4} textAnchor="middle" fontSize="9.5" fill={hot ? AMBER : DIM_TXT}>
              {formatLenShort(e.spacingMm, unit)}
            </text>
          </g>
        );
      })}

      {/* overall boom dimension */}
      <g opacity={boomHot || highlight.kind === 'none' ? 1 : 0.45}>
        <line x1={bx0} y1={g.yC + 6} x2={bx0} y2={dimY3 + 4} stroke={boomHot ? AMBER : '#3f3f46'} strokeWidth="1" />
        <line x1={bx1} y1={g.yC + 6} x2={bx1} y2={dimY3 + 4} stroke={boomHot ? AMBER : '#3f3f46'} strokeWidth="1" />
        <line
          x1={bx0}
          y1={dimY3}
          x2={bx1}
          y2={dimY3}
          stroke={boomHot ? AMBER : DIM}
          strokeWidth={boomHot ? 1.8 : 1.2}
          markerStart={boomHot ? 'url(#yagi-arr-h)' : 'url(#yagi-arr)'}
          markerEnd={boomHot ? 'url(#yagi-arr-h)' : 'url(#yagi-arr)'}
        />
        <text x={(bx0 + bx1) / 2} y={dimY3 - 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill={boomHot ? AMBER : DIM_TXT}>
          BOOM {formatLenShort(d.boomLengthMm, unit)} {u} ({d.boomLengthLambda.toFixed(2)}λ)
        </text>
      </g>

      {/* datum */}
      <text x={g.x(0)} y={dimY1 + 16} textAnchor="middle" fontSize="9" fill="#52525b">
        DATUM 0
      </text>

      {/* title block */}
      <g fontSize="10.5">
        <rect x={g.W - g.right - 268} y={g.H - 96} width="268" height="80" fill="#0c0c0f" stroke="#3f3f46" strokeWidth="1" />
        <text x={g.W - g.right - 258} y={g.H - 76} fontWeight="bold" fill="#e4e4e7">
          YAGI-UDA · {n} EL · {PRESETS[d.inputs.preset].name.toUpperCase()}
        </text>
        <text x={g.W - g.right - 258} y={g.H - 60} fill={DIM_TXT}>
          f0 {d.inputs.frequencyMHz} MHz · λ {d.wavelengthMm.toFixed(1)} mm
        </text>
        <text x={g.W - g.right - 258} y={g.H - 44} fill={DIM_TXT}>
          ≈{d.gainDbi.toFixed(1)} dBi · F/B ≈{d.frontToBackDb.toFixed(0)} dB
        </text>
        <text x={g.W - g.right - 258} y={g.H - 28} fill="#52525b">
          TRUE SCALE · {today} · yagi-antenna-designer (MIT)
        </text>
      </g>
    </svg>
  );
}
