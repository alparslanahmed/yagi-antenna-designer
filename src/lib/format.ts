export type Unit = 'metric' | 'imperial';

export function formatLen(mm: number, unit: Unit, digits = 0): string {
  if (unit === 'metric') {
    if (Math.abs(mm) >= 1000) return `${(mm / 1000).toFixed(3)} m`;
    return `${mm.toFixed(digits)} mm`;
  }
  const inch = mm / 25.4;
  if (Math.abs(inch) >= 24) return `${(inch / 12).toFixed(2)} ft`;
  return `${inch.toFixed(2)} in`;
}

/** Compact mm/in value without unit (for dimension lines). */
export function formatLenShort(mm: number, unit: Unit): string {
  if (unit === 'metric') {
    if (Math.abs(mm) >= 1000) return (mm / 1000).toFixed(2);
    return mm.toFixed(0);
  }
  return (mm / 25.4).toFixed(1);
}

export function lenUnitLabel(unit: Unit): string {
  return unit === 'metric' ? 'mm' : 'in';
}
