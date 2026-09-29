import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, ExternalLink, X } from 'lucide-react';
import { INFO } from '../lib/info';
import { InfoFigure } from './InfoFigure';

/**
 * "?" badge: click opens a centred modal explaining the RF theory, with a
 * diagram and reference links. A modal (not an anchored popover) so it can
 * never overflow the viewport from the side panels.
 */
export function InfoBadge({ id, dark = false }: { id: string; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const entry = INFO[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open ]);

  if (!entry) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`About ${entry.title}`}
        aria-haspopup="dialog"
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          dark
            ? 'border-zinc-500 text-zinc-400 hover:border-amber-400 hover:text-amber-300'
            : 'border-zinc-600 text-zinc-500 hover:border-amber-400 hover:text-amber-300'
        }`}
      >
        <CircleHelp className="h-3 w-3" strokeWidth={2.4} />
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60"
            >
              <div className="flex items-start gap-2 border-b border-zinc-800 px-4 py-3">
                <h2
                  id={titleId}
                  className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-300"
                >
                  {entry.title}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="ms-auto rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-3">
                <div className="overflow-hidden rounded border border-zinc-800">
                  <InfoFigure id={id} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-100">{entry.short}</p>
                {entry.formula && (
                  <div className="mt-2 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-center font-mono text-xs text-cyan-200">
                    {entry.formula}
                  </div>
                )}
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{entry.detail}</p>
                {entry.links && entry.links.length > 0 && (
                  <div className="mt-3 border-t border-zinc-800 pt-2">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      References
                    </div>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {entry.links.map((l) => (
                        <li key={l.url}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-100 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
