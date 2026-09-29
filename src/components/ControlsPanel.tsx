import { BAND_PRESETS, PRESETS, type PresetId, type YagiInputs } from '../lib/yagi';
import type { Highlight } from '../lib/highlight';
import { NO_HIGHLIGHT } from '../lib/highlight';
import { NumberParam, ParamShell } from './ParamField';

interface Props {
  inputs: YagiInputs;
  onChange: (patch: Partial<YagiInputs>) => void;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
}

function SegButton({
  active,
  label,
  title,
  onClick,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex-1 rounded border px-1 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'border-amber-400/80 bg-amber-400/15 text-amber-200'
          : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}

export function ControlsPanel({ inputs, onChange, highlight, onHighlight }: Props) {
  const set = (patch: Partial<YagiInputs>) => onChange(patch);
  return (
    <div className="flex flex-col gap-1">
      <div className="px-2.5 pb-1 pt-2">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Design inputs
        </div>
      </div>

      <NumberParam
        label="Design frequency"
        info="frequency"
        kind="frequency"
        value={inputs.frequencyMHz}
        min={3}
        max={6000}
        step={inputs.frequencyMHz < 600 ? 0.1 : 1}
        unit="MHz"
        highlight={highlight}
        onHighlight={onHighlight}
        onChange={(v) => set({ frequencyMHz: v })}
      />

      <div className="flex flex-wrap gap-1 px-2.5 pb-1">
        {BAND_PRESETS.map(([label, f, n]) => (
          <button
            key={label}
            type="button"
            title={`${label} band — ${f} MHz`}
            onClick={() => set({ frequencyMHz: f, elements: n })}
            onMouseEnter={() => onHighlight({ kind: 'frequency', index: null })}
            onMouseLeave={() => onHighlight(NO_HIGHLIGHT)}
            className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 transition-colors hover:border-amber-400/60 hover:text-amber-200"
          >
            {label}
          </button>
        ))}
      </div>

      <NumberParam
        label="Element count"
        info="elements"
        kind="directors"
        value={inputs.elements}
        min={2}
        max={31}
        step={1}
        unit="el"
        highlight={highlight}
        onHighlight={onHighlight}
        onChange={(v) => set({ elements: Math.round(v) })}
      />

      <ParamShell
        label="Design family"
        info="preset"
        kind="gain"
        highlight={highlight}
        onHighlight={onHighlight}
      >
        <div className="flex flex-col gap-1" role="radiogroup" aria-label="Design family">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={inputs.preset === id}
              onClick={() => set({ preset: id })}
              className={`rounded border px-2 py-1 text-left transition-colors ${
                inputs.preset === id
                  ? 'border-amber-400/80 bg-amber-400/15'
                  : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
              }`}
            >
              <div
                className={`text-xs font-medium ${inputs.preset === id ? 'text-amber-200' : 'text-zinc-200'}`}
              >
                {PRESETS[id].name}
              </div>
              <div className="text-[11px] text-zinc-500">{PRESETS[id].tagline}</div>
            </button>
          ))}
        </div>
      </ParamShell>

      <NumberParam
        label="Element diameter"
        info="elementDiameter"
        kind="diameter"
        value={inputs.elementDiameterMm}
        min={1}
        max={60}
        step={0.5}
        unit="mm"
        highlight={highlight}
        onHighlight={onHighlight}
        onChange={(v) => set({ elementDiameterMm: v })}
      />

      <NumberParam
        label="Boom diameter"
        info="boomDiameter"
        kind="boom"
        value={inputs.boomDiameterMm}
        min={8}
        max={80}
        step={1}
        unit="mm"
        highlight={highlight}
        onHighlight={onHighlight}
        onChange={(v) => set({ boomDiameterMm: v })}
      />

      <ParamShell
        label="Element mounting"
        info="boomMount"
        kind="boom"
        highlight={highlight}
        onHighlight={onHighlight}
      >
        <div className="flex gap-1">
          <SegButton
            active={inputs.boomMount === 'insulated'}
            label="Insulated"
            title="Elements insulated from the boom — no electrical correction"
            onClick={() => set({ boomMount: 'insulated' })}
          />
          <SegButton
            active={inputs.boomMount === 'through'}
            label="Thru metal boom"
            title="Elements pass through a conductive boom — lengths corrected"
            onClick={() => set({ boomMount: 'through' })}
          />
        </div>
      </ParamShell>

      <ParamShell
        label="Driven element"
        info="drivenType"
        kind="driven"
        highlight={highlight}
        onHighlight={onHighlight}
      >
        <div className="flex gap-1">
          <SegButton
            active={inputs.drivenType === 'straight'}
            label="Straight dipole"
            title={`Straight dipole, ~low impedance`}
            onClick={() => set({ drivenType: 'straight' })}
          />
          <SegButton
            active={inputs.drivenType === 'folded'}
            label="Folded dipole"
            title="Folded dipole, ~4x the straight impedance"
            onClick={() => set({ drivenType: 'folded' })}
          />
        </div>
      </ParamShell>
    </div>
  );
}
