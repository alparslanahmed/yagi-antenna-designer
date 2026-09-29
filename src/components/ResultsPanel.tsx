import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { YagiDesign } from '../lib/yagi';
import type { Highlight, HighlightKind } from '../lib/highlight';
import { NO_HIGHLIGHT } from '../lib/highlight';
import { formatLen, type Unit } from '../lib/format';
import { InfoBadge } from './InfoBadge';

interface Props {
  design: YagiDesign;
  unit: Unit;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
}

function Result({
  label,
  info,
  kind,
  value,
  sub,
  highlight,
  onHighlight,
  children,
}: {
  label: string;
  info: string;
  kind: HighlightKind;
  value: string;
  sub?: string;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
  children?: ReactNode;
}) {
  const hot = highlight.kind === kind;
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 transition-colors ${
        hot ? 'border-amber-400/70 bg-amber-400/[0.06]' : 'border-zinc-800 bg-zinc-950/60'
      }`}
      onMouseEnter={() => onHighlight({ kind, index: null })}
      onMouseLeave={() => onHighlight(NO_HIGHLIGHT)}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] ${hot ? 'text-amber-200' : 'text-zinc-400'}`}>
          {label}
        </span>
        <InfoBadge id={info} />
      </div>
      <div className="font-mono text-sm text-zinc-100">
        {value}{' '}
        {sub && <span className="text-[11px] text-zinc-500">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

export function ResultsPanel({ design: d, unit, highlight, onHighlight }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="px-1 pb-0.5 pt-2">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Design data
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Result
          label="Wavelength λ"
          info="wavelength"
          kind="frequency"
          value={formatLen(d.wavelengthMm, unit, 1)}
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Boom (cut)"
          info="boom"
          kind="boom"
          value={formatLen(d.boomLengthMm, unit)}
          sub={`(${d.boomLengthLambda.toFixed(2)}λ)`}
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Gain"
          info="gain"
          kind="gain"
          value={`${d.gainDbi.toFixed(1)} dBi`}
          sub={`${d.gainDbd.toFixed(1)} dBd · est`}
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Front/back"
          info="frontback"
          kind="pattern"
          value={`${d.frontToBackDb.toFixed(0)} dB`}
          sub="est"
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Beam E / H"
          info="beamwidth"
          kind="pattern"
          value={`${d.beamwidthE.toFixed(0)}° / ${d.beamwidthH.toFixed(0)}°`}
          sub="−3 dB · est"
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Feed Z"
          info="feedZ"
          kind="feed"
          value={
            d.inputs.drivenType === 'folded'
              ? `≈ ${d.foldedImpedanceOhm} Ω`
              : `≈ ${d.feedImpedanceOhm} Ω`
          }
          sub={d.inputs.drivenType === 'folded' ? 'folded · est' : 'straight · est'}
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Bandwidth"
          info="bandwidth"
          kind="frequency"
          value={`±${d.bandwidthPct / 2}%`}
          sub={`${d.fLowMHz.toFixed(d.fLowMHz < 600 ? 2 : 1)}–${d.fHighMHz.toFixed(d.fHighMHz < 600 ? 2 : 1)} MHz`}
          highlight={highlight}
          onHighlight={onHighlight}
        />
        <Result
          label="Wind area"
          info="windload"
          kind="boom"
          value={`${d.windAreaM2.toFixed(3)} m²`}
          sub="rough"
          highlight={highlight}
          onHighlight={onHighlight}
        />
      </div>

      <div
        className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5"
        onMouseEnter={() => onHighlight({ kind: 'feed', index: null })}
        onMouseLeave={() => onHighlight(NO_HIGHLIGHT)}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400">Matching</span>
          <InfoBadge id="drivenType" />
        </div>
        <div className="text-xs leading-relaxed text-zinc-200">{d.matchSuggestion}</div>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-zinc-500">
        <div>
          end-effect −{d.endEffectShorteningMm.toFixed(1)} mm
          {d.boomCorrectionMm > 0 && (
            <span> · boom corr +{d.boomCorrectionMm.toFixed(1)} mm (R, directors)</span>
          )}
        </div>
        <div>longest element {formatLen(d.longestElementMm, unit, 1)}</div>
      </div>

      {d.warnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {d.warnings.map((w, i) => (
            <div
              key={i}
              className="flex gap-1.5 rounded-md border border-amber-500/40 bg-amber-400/[0.07] px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-100/90"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
