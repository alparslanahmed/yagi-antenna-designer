import type { YagiDesign } from '../lib/yagi';
import type { Highlight } from '../lib/highlight';
import { NO_HIGHLIGHT, roleToKind } from '../lib/highlight';
import { formatLen, type Unit } from '../lib/format';

interface Props {
  design: YagiDesign;
  unit: Unit;
  highlight: Highlight;
  onHighlight: (h: Highlight) => void;
}

/** Element schedule / cut list. Hovering a row highlights it in 2D/3D. */
export function ElementTable({ design: d, unit, highlight, onHighlight }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500">
            <th className="border-b border-zinc-800 px-2 py-1 font-medium">El</th>
            <th className="border-b border-zinc-800 px-2 py-1 font-medium">Role</th>
            <th className="border-b border-zinc-800 px-2 py-1 text-right font-medium">
              Length
            </th>
            <th className="border-b border-zinc-800 px-2 py-1 text-right font-medium">λ</th>
            <th className="border-b border-zinc-800 px-2 py-1 text-right font-medium">
              Pos from R
            </th>
            <th className="border-b border-zinc-800 px-2 py-1 text-right font-medium">
              Spacing
            </th>
          </tr>
        </thead>
        <tbody>
          {d.elements.map((e) => {
            const hot = highlight.index === e.index;
            const roleHot = highlight.kind === roleToKind(e.role);
            return (
              <tr
                key={e.index}
                onMouseEnter={() =>
                  onHighlight({ kind: roleToKind(e.role), index: e.index })
                }
                onMouseLeave={() => onHighlight(NO_HIGHLIGHT)}
                className={`cursor-default border-b border-zinc-800/60 transition-colors last:border-0 ${
                  hot
                    ? 'bg-amber-400/15 text-amber-100'
                    : roleHot
                      ? 'bg-amber-400/[0.05] text-zinc-100'
                      : 'text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <td className="px-2 py-1 font-semibold">{e.label}</td>
                <td className="px-2 py-1 font-sans text-[11px] capitalize text-zinc-400">
                  {e.role}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatLen(e.lengthMm, unit, 1)}
                </td>
                <td className="px-2 py-1 text-right text-zinc-400">
                  {e.lengthLambda.toFixed(3)}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatLen(e.positionMm, unit, 1)}
                </td>
                <td className="px-2 py-1 text-right text-zinc-400">
                  {e.index === 0 ? '—' : formatLen(e.spacingMm, unit, 1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
