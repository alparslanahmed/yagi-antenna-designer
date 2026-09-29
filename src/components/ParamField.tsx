import type { ReactNode } from 'react';
import { InfoBadge } from './InfoBadge';
import type { Highlight, HighlightKind } from '../lib/highlight';

interface ParamShellProps {
  label: string;
  info: string;
  kind: HighlightKind;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
  children: ReactNode;
  active?: boolean;
}

/** Label row with ? badge + highlight wiring shared by all inputs. */
export function ParamShell({
  label,
  info,
  kind,
  highlight,
  onHighlight,
  children,
  active,
}: ParamShellProps) {
  const hot = active ?? highlight.kind === kind;
  return (
    <div
      className={`rounded-md border px-2.5 py-2 transition-colors ${
        hot ? 'border-amber-400/70 bg-amber-400/[0.06]' : 'border-transparent'
      }`}
      onMouseEnter={() => onHighlight({ kind, index: null })}
      onMouseLeave={() => onHighlight({ kind: 'none', index: null })}
      onFocus={() => onHighlight({ kind, index: null })}
      onBlur={() => onHighlight({ kind: 'none', index: null })}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span
          className={`text-xs font-medium ${hot ? 'text-amber-200' : 'text-zinc-300'}`}
        >
          {label}
        </span>
        <InfoBadge id={info} />
      </div>
      {children}
    </div>
  );
}

interface NumberParamProps {
  label: string;
  info: string;
  kind: HighlightKind;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
  onChange: (v: number) => void;
}

/** Numeric input paired with a slider. */
export function NumberParam({
  label,
  info,
  kind,
  value,
  min,
  max,
  step,
  unit,
  highlight,
  onHighlight,
  onChange,
}: NumberParamProps) {
  return (
    <ParamShell
      label={label}
      info={info}
      kind={kind}
      highlight={highlight}
      onHighlight={onHighlight}
    >
      <div className="flex items-center gap-2">
        <input
          type="range"
          aria-label={label}
          className="yagi-range min-w-0 flex-1"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="flex items-baseline gap-1">
          <input
            type="number"
            aria-label={`${label} value`}
            className="w-[4.6rem] rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-right font-mono text-sm text-zinc-100 outline-none focus:border-amber-400"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="w-8 font-mono text-[11px] text-zinc-500">{unit}</span>
        </span>
      </div>
    </ParamShell>
  );
}
