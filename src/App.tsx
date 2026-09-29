import { useMemo, useState } from 'react';
import {
  Box,
  DraftingCompass,
  FileDown,
  Radio,
  RadioTower,
  Ruler,
} from 'lucide-react';
import { designYagi, type YagiInputs } from './lib/yagi';
import { NO_HIGHLIGHT, type Highlight } from './lib/highlight';
import type { Unit } from './lib/format';
import {
  designFilename,
  download,
  toCsv,
  toNec,
} from './lib/exporters';
import { ControlsPanel } from './components/ControlsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ElementTable } from './components/ElementTable';
import { Drawing2D, DRAWING_SVG_ID } from './components/Drawing2D';
import { Viewer3D } from './components/Viewer3D';
import { PatternPlot } from './components/PatternPlot';
import { InfoBadge } from './components/InfoBadge';

type Tab = '2d' | '3d' | 'pattern';

const TABS: Array<{ id: Tab; label: string; icon: typeof Box }> = [
  { id: '2d', label: '2D technical', icon: DraftingCompass },
  { id: '3d', label: '3D model', icon: Box },
  { id: 'pattern', label: 'Pattern', icon: RadioTower },
];

export default function App() {
  const [inputs, setInputs] = useState<YagiInputs>({
    frequencyMHz: 144.3,
    elements: 7,
    preset: 'dl6wu',
    elementDiameterMm: 8,
    boomDiameterMm: 20,
    boomMount: 'insulated',
    drivenType: 'folded',
  });
  const [unit, setUnit] = useState<Unit>('metric');
  const [tab, setTab] = useState<Tab>('2d');
  const [highlight, setHighlight] = useState<Highlight>(NO_HIGHLIGHT);

  const design = useMemo(() => designYagi(inputs), [inputs]);
  const patch = (p: Partial<YagiInputs>) => setInputs((v) => ({ ...v, ...p }));

  const exportSvg = () => {
    const node = document.getElementById(DRAWING_SVG_ID);
    if (!node) return;
    const clone = node.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const text = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    download(designFilename(design, 'svg'), text, 'image/svg+xml');
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* header */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded border border-amber-400/60 bg-amber-400/10">
            <Radio className="h-4.5 w-4.5 text-amber-300" size={18} />
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
              Yagi Antenna Designer
            </h1>
            <p className="font-mono text-[10px] text-zinc-500">
              Yagi-Uda calculator · open source (MIT) · runs 100% in your browser
            </p>
          </div>
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-1.5">
          <div className="flex overflow-hidden rounded border border-zinc-700" role="group" aria-label="Units">
            {(['metric', 'imperial'] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`px-2 py-1 font-mono text-[11px] ${
                  unit === u ? 'bg-amber-400/15 text-amber-200' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {u === 'metric' ? 'mm' : 'in'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportSvg}
            className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-400/60 hover:text-amber-200"
          >
            <Ruler size={13} /> SVG
          </button>
          <button
            type="button"
            onClick={() => download(designFilename(design, 'csv'), toCsv(design), 'text/csv')}
            className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:border-amber-400/60 hover:text-amber-200"
          >
            <FileDown size={13} /> Cut list
          </button>
          <button
            type="button"
            onClick={() => download(designFilename(design, 'nec'), toNec(design))}
            title="NEC-2 deck for 4nec2 / xnec2c verification"
            className="flex items-center gap-1 rounded border border-amber-400/60 bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-400/20"
          >
            <FileDown size={13} /> NEC deck
          </button>
        </div>
      </header>

      {/* main */}
      <main className="mx-auto grid w-full max-w-[1500px] flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        {/* left: inputs */}
        <section aria-label="Parameters" className="rounded-lg border border-zinc-800 bg-zinc-900/50 lg:sticky lg:top-3 lg:self-start">
          <ControlsPanel
            inputs={inputs}
            onChange={patch}
            highlight={highlight}
            onHighlight={setHighlight}
          />
          <p className="px-4 pb-3 pt-1 text-[11px] leading-relaxed text-zinc-500">
            Hover any parameter to highlight its part in the drawing. Click a{' '}
            <InfoBadge id="frequency" /> badge for the theory.
          </p>
        </section>

        {/* center: views + schedule */}
        <section aria-label="Views" className="flex min-w-0 flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-1 border-b border-zinc-800 px-2 py-1.5" role="tablist" aria-label="View">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-amber-400/15 text-amber-200'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    <Icon size={14} /> {t.label}
                  </button>
                );
              })}
              <span className="ms-auto hidden font-mono text-[10px] text-zinc-600 sm:inline">
                {design.inputs.elements} el · {design.inputs.frequencyMHz} MHz · true scale
              </span>
            </div>
            {/* 2D always mounted so SVG export works from any tab */}
            <div className={tab === '2d' ? '' : 'hidden'}>
              <Drawing2D design={design} unit={unit} highlight={highlight} />
            </div>
            {tab === '3d' && (
              <div className="h-[520px]" role="tabpanel" aria-label="3D model">
                <Viewer3D design={design} highlight={highlight} onHighlight={setHighlight} />
              </div>
            )}
            {tab === 'pattern' && (
              <div role="tabpanel" aria-label="Radiation pattern">
                <PatternPlot design={design} highlight={highlight} />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
            <div className="px-2 pb-1 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Element schedule — hover a row to locate it
            </div>
            <ElementTable
              design={design}
              unit={unit}
              highlight={highlight}
              onHighlight={setHighlight}
            />
          </div>
        </section>

        {/* right: results */}
        <section aria-label="Results" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 lg:sticky lg:top-3 lg:self-start">
          <ResultsPanel
            design={design}
            unit={unit}
            highlight={highlight}
            onHighlight={setHighlight}
          />
        </section>
      </main>

      {/* footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-3 text-[11px] leading-relaxed text-zinc-500 md:grid-cols-3">
          <div>
            <span className="font-mono font-semibold uppercase tracking-wider text-zinc-400">
              How it works
            </span>
            <p className="mt-1">
              Parametric models of published design families (DL6WU taper, NBS TN-688,
              classic Rothammel/ARRL), with end-effect shortening for your tube diameter
              and Rothammel boom correction for thru-metal mounts. Gain, F/B, beamwidth
              and feed Z are empirical estimates — always verify with the exported NEC
              deck before cutting metal.
            </p>
          </div>
          <div>
            <span className="font-mono font-semibold uppercase tracking-wider text-zinc-400">
              References
            </span>
            <p className="mt-1">
              Viezbicke (NBS TN-688, 1976) · Hoch DL6WU, DUBUS · Rothammel Antennenbuch ·
              ARRL Antenna Book · Balanis, Antenna Theory. Speed of light c = 299 792 458
              m/s (exact).
            </p>
          </div>
          <div>
            <span className="font-mono font-semibold uppercase tracking-wider text-zinc-400">
              Open source
            </span>
            <p className="mt-1">
              MIT licensed. No backend, no tracking, no build step for the math — the
              whole calculator runs locally in this page. A backend would only be needed
              for a server-side NEC solver or saved/shared designs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
