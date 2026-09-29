import { useMemo } from 'react';
import type { YagiDesign } from '../lib/yagi';
import type { Highlight } from '../lib/highlight';

interface Props {
  design: YagiDesign;
  highlight: Highlight;
}

/**
 * Illustrative polar sketches derived from the estimated beamwidths and
 * F/B — a cos^n main lobe plus an F/B-scaled rear lobe. Clearly labelled
 * as a model, not a simulation.
 */
export function PatternPlot({ design: d, highlight }: Props) {
  const lobes = useMemo(() => {
    const fbLin = Math.pow(10, -d.frontToBackDb / 10);
    const build = (hpbwDeg: number) => {
      const half = (hpbwDeg / 2) * (Math.PI / 180);
      const p = Math.log(0.5) / Math.log(Math.max(Math.cos(half / 1), 1e-6));
      const pts: string[] = [];
      const N = 160;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * 2 * Math.PI;
        // angle from boresight (0 = forward)
        const a = Math.atan2(Math.sin(th), Math.cos(th));
        const main = Math.pow(Math.max(Math.cos(a / 2), 0), p);
        const back = fbLin * Math.pow(Math.max(Math.cos((a - Math.PI) / 2), 0), 6);
        const lin = Math.max(main + back, 1e-4);
        const db = 10 * Math.log10(lin); // 0 .. -40
        const r = Math.max(0, 1 + db / 40); // 0dB -> 1, -40dB -> 0
        const R = 118 * r;
        const x = 150 + R * Math.sin(th);
        const y = 150 - R * Math.cos(th);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };
    return { e: build(d.beamwidthE), h: build(d.beamwidthH) };
  }, [d]);

  const rings = [0, -10, -20, -30].map((db) => 118 * (1 + db / 40));
  const emphRear = highlight.kind === 'pattern';
  const emphFwd = highlight.kind === 'gain';

  const polar = (title: string, pts: string, hpbw: number) => (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[340px]" role="img" aria-label={`${title} radiation pattern sketch`}>
        <rect x="0" y="0" width="300" height="300" fill="#101014" />
        {rings.map((r, i) => (
          <circle key={i} cx="150" cy="150" r={r} fill="none" stroke="#2a2a33" strokeWidth="1" />
        ))}
        <line x1="150" y1="8" x2="150" y2="292" stroke="#26262e" strokeWidth="1" />
        <line x1="8" y1="150" x2="292" y2="150" stroke="#26262e" strokeWidth="1" />
        {[-30, -20, -10].map((db) => (
          <text key={db} x="154" y={150 - 118 * (1 + db / 40) + 11} fontSize="8.5" fill="#52525b" fontFamily="monospace">
            {db}
          </text>
        ))}
        <polygon points={pts} fill={emphRear || emphFwd ? 'rgba(251,191,36,0.18)' : 'rgba(103,232,249,0.14)'} stroke={emphRear || emphFwd ? '#fbbf24' : '#67e8f9'} strokeWidth={emphRear || emphFwd ? 2.4 : 1.8} />
        <text x="150" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill={emphFwd ? '#fbbf24' : '#8b8b94'} fontFamily="monospace">
          0° FWD
        </text>
        <text x="150" y="286" textAnchor="middle" fontSize="9" fill={emphRear ? '#fbbf24' : '#52525b'} fontFamily="monospace">
          180° −{d.frontToBackDb.toFixed(0)} dB
        </text>
      </svg>
      <div className="mt-1 text-center">
        <div className="font-mono text-[11px] font-semibold text-zinc-200">{title}</div>
        <div className="font-mono text-[11px] text-zinc-500">−3 dB width ≈ {hpbw.toFixed(0)}°</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {polar('E-plane (elements plane)', lobes.e, d.beamwidthE)}
        {polar('H-plane', lobes.h, d.beamwidthH)}
      </div>
      <p className="max-w-2xl text-center text-[11px] leading-relaxed text-zinc-500">
        Illustrative model from the estimated beamwidth and F/B — not a NEC simulation.
        Gain ≈ {d.gainDbi.toFixed(1)} dBi · F/B ≈ {d.frontToBackDb.toFixed(0)} dB ·
        export the NEC deck for the real pattern.
      </p>
    </div>
  );
}
