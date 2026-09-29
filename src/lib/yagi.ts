/**
 * Yagi-Uda parametric design engine.
 *
 * Produces element lengths / positions from published Yagi design families
 * (DL6WU, NBS TN-688, classic Rothammel/ARRL practice) with corrections for
 * element diameter (end effect) and conductive through-booms.
 *
 * Performance figures (gain, F/B, beamwidth) are empirical estimates fitted
 * to published measurements — they are good starting values, not a substitute
 * for a method-of-moments simulation (see the NEC exporter). Every estimate
 * is labelled as such in the UI.
 *
 * References:
 *  - Viezbicke, P.P., "Yagi Antenna Design", NBS Technical Note 688, 1976.
 *  - Hoch, G. (DL6WU), "Yagi optimisation" series, DUBUS.
 *  - Rothammel, K., "Antennenbuch".
 *  - ARRL Antenna Book (Yagi chapters).
 *  - Balanis, C.A., "Antenna Theory" (Yagi-Uda chapter).
 */

export const SPEED_OF_LIGHT = 299_792_458; // m/s, exact (SI definition)

export type PresetId = 'dl6wu' | 'nbs' | 'classic';
export type BoomMount = 'insulated' | 'through';
export type DrivenType = 'straight' | 'folded';

export interface YagiInputs {
  frequencyMHz: number;
  elements: number; // total element count, 2..31
  preset: PresetId;
  elementDiameterMm: number;
  boomDiameterMm: number;
  boomMount: BoomMount;
  drivenType: DrivenType;
}

export type ElementRole = 'reflector' | 'driven' | 'director';

export interface YagiElement {
  index: number; // 0 = reflector
  role: ElementRole;
  /** R, DE, D1, D2, ... */
  label: string;
  /** tip-to-tip length, fully corrected */
  lengthMm: number;
  lengthLambda: number;
  /** distance from reflector plane along the boom */
  positionMm: number;
  positionLambda: number;
  /** spacing to the previous element (0 for reflector) */
  spacingMm: number;
  spacingLambda: number;
}

export interface YagiDesign {
  inputs: YagiInputs;
  wavelengthMm: number;
  elements: YagiElement[];
  boomLengthMm: number; // includes mechanical end overhang
  boomElectricalMm: number; // reflector-to-last-director
  boomLengthLambda: number;
  longestElementMm: number;
  /** element-diameter (end-effect) shortening applied, in mm of tip-to-tip */
  endEffectShorteningMm: number;
  /** through-boom lengthening applied to parasitics, mm (0 when insulated) */
  boomCorrectionMm: number;
  gainDbi: number;
  gainDbd: number;
  frontToBackDb: number;
  /** -3 dB beamwidth, E-plane (plane of the elements) */
  beamwidthE: number;
  /** -3 dB beamwidth, H-plane */
  beamwidthH: number;
  /** estimated straight-dipole feedpoint resistance */
  feedImpedanceOhm: number;
  /** estimated folded-dipole feedpoint resistance (~4x) */
  foldedImpedanceOhm: number;
  matchSuggestion: string;
  /** usable bandwidth for SWR <= ~2, percent of f0 */
  bandwidthPct: number;
  fLowMHz: number;
  fHighMHz: number;
  /** rough projected wind area of elements + boom, m^2 */
  windAreaM2: number;
  warnings: string[];
}

export const PRESETS: Record<
  PresetId,
  { name: string; tagline: string }
> = {
  dl6wu: {
    name: 'DL6WU wideband',
    tagline: 'G. Hoch taper — clean pattern, best bandwidth',
  },
  nbs: {
    name: 'NBS high-gain',
    tagline: 'Viezbicke TN-688 style — max gain, narrow band',
  },
  classic: {
    name: 'Classic / Rothammel',
    tagline: 'Forgiving all-round dimensions, easy build',
  },
};

/** Resonant half-wave dipole length (in wavelengths) vs element diameter.
 *  Thin-wire limit ≈ 0.477λ (the classic 143/f formula); fat elements
 *  resonate shorter. Interpolated from Rothammel/ARRL curves. */
const RESONANCE_TABLE: Array<[number, number]> = [
  // [d/lambda, L/lambda]
  [0.0001, 0.4805],
  [0.0005, 0.4795],
  [0.001, 0.4785],
  [0.002, 0.4765],
  [0.003, 0.4745],
  [0.005, 0.471],
  [0.007, 0.4675],
  [0.01, 0.462],
  [0.015, 0.453],
  [0.02, 0.444],
  [0.03, 0.429],
  [0.05, 0.408],
];

function interp(table: Array<[number, number]>, x: number): number {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return table[table.length - 1][1];
}

/** Through-boom lengthening coefficient C (ΔL = C × boom diameter)
 *  vs element/boom diameter ratio, after Rothammel boom-correction curves. */
const BOOM_CORRECTION_TABLE: Array<[number, number]> = [
  [0.15, 0.62],
  [0.25, 0.52],
  [0.35, 0.44],
  [0.5, 0.35],
  [0.7, 0.26],
  [1.0, 0.17],
];

/** Measured gain of optimised Yagis vs boom length (dBi), compiled from
 *  NBS TN-688 measurements and DL6WU long-boom data. */
const GAIN_TABLE: Array<[number, number]> = [
  // [boom length in lambda, dBi]
  [0.1, 4.6],
  [0.15, 5.3],
  [0.2, 6.0],
  [0.3, 6.9],
  [0.4, 7.6],
  [0.6, 8.6],
  [0.8, 9.4],
  [1.0, 10.2],
  [1.5, 11.4],
  [2.0, 12.4],
  [3.0, 13.7],
  [4.0, 14.6],
  [5.0, 15.3],
  [6.5, 16.0],
  [8.0, 16.6],
];

const MAX_VALIDATED_BOOM = 8.0;

export function wavelengthMm(frequencyMHz: number): number {
  // c [mm/s] / f [Hz] with f in MHz: 299792458e3 / (f * 1e6)
  return 299_792.458 / frequencyMHz;
}

export function clampInputs(raw: YagiInputs): YagiInputs {
  return {
    frequencyMHz: Math.min(11000, Math.max(1, raw.frequencyMHz || 144.2)),
    elements: Math.min(31, Math.max(2, Math.round(raw.elements) || 5)),
    preset: raw.preset,
    elementDiameterMm: Math.min(100, Math.max(0.5, raw.elementDiameterMm || 8)),
    boomDiameterMm: Math.min(150, Math.max(5, raw.boomDiameterMm || 20)),
    boomMount: raw.boomMount,
    drivenType: raw.drivenType,
  };
}

function directorFactor(preset: PresetId, i: number): number {
  // i = 1 for D1, 2 for D2, ...
  switch (preset) {
    case 'dl6wu':
      return Math.max(0.9, 0.952 - 0.0042 * i);
    case 'nbs':
      return Math.max(0.895, 0.908 - 0.0012 * i);
    case 'classic':
      return Math.max(0.895, 0.962 - 0.0075 * i);
  }
}

function directorSpacingLambda(preset: PresetId, i: number): number {
  // spacing between director i-1 (or DE for i=1) and director i
  switch (preset) {
    case 'dl6wu':
      return Math.min(0.4, 0.19 + 0.016 * i);
    case 'nbs':
      return 0.2;
    case 'classic':
      return 0.24;
  }
}

function reflectorSpacingLambda(preset: PresetId): number {
  switch (preset) {
    case 'dl6wu':
      return 0.22;
    case 'nbs':
      return 0.2;
    case 'classic':
      return 0.2;
  }
}

export function designYagi(raw: YagiInputs): YagiDesign {
  const inputs = clampInputs(raw);
  const warnings: string[] = [];
  const lambda = wavelengthMm(inputs.frequencyMHz);
  const dLambda = inputs.elementDiameterMm / lambda;

  if (dLambda > 0.02) {
    warnings.push(
      `Elements are very fat (d/λ = ${dLambda.toFixed(3)}). Resonance and gain models lose accuracy above d/λ ≈ 0.02 — verify with a NEC simulation.`,
    );
  }
  if (dLambda < 0.0003) {
    warnings.push(
      `Elements are extremely thin (d/λ = ${dLambda.toFixed(4)}). Radiation efficiency drops and the design gets narrowband — consider thicker tubing.`,
    );
  }

  const resonantLambda = interp(RESONANCE_TABLE, dLambda);
  const l0 = resonantLambda * lambda; // resonant dipole tip-to-tip, mm
  const endEffectShorteningMm = 0.5 * lambda - l0;

  // Through-boom correction (parasitic elements only — the driven element
  // is split/insulated at the feedpoint, so it needs none).
  let boomCorrectionMm = 0;
  if (inputs.boomMount === 'through') {
    const ratio = inputs.elementDiameterMm / inputs.boomDiameterMm;
    boomCorrectionMm = interp(BOOM_CORRECTION_TABLE, ratio) * inputs.boomDiameterMm;
  }

  const n = inputs.elements;
  const elements: YagiElement[] = [];
  let posLambda = 0;

  const push = (
    index: number,
    role: ElementRole,
    label: string,
    lengthMm: number,
    spacingLambda: number,
  ) => {
    elements.push({
      index,
      role,
      label,
      lengthMm,
      lengthLambda: lengthMm / lambda,
      positionMm: posLambda * lambda,
      positionLambda: posLambda,
      spacingMm: spacingLambda * lambda,
      spacingLambda,
    });
  };

  // Reflector: ~5% longer than resonance (inductive → reflects).
  push(0, 'reflector', 'R', l0 * 1.05 + boomCorrectionMm, 0);

  if (n >= 2) {
    const s = reflectorSpacingLambda(inputs.preset);
    posLambda += s;
    // Driven element kept at resonance (uncorrected for boom: it is split).
    push(1, 'driven', 'DE', l0 * (inputs.preset === 'nbs' ? 0.992 : 1.0), s);
  }
  for (let i = 2; i < n; i++) {
    const di = i - 1; // D1, D2, ...
    const s = directorSpacingLambda(inputs.preset, di);
    posLambda += s;
    const f = directorFactor(inputs.preset, di);
    push(i, 'director', `D${di}`, l0 * f + boomCorrectionMm, s);
  }

  const boomElectricalMm = posLambda * lambda;
  const boomLengthLambda = posLambda;
  const overhang = Math.max(25, 2 * inputs.boomDiameterMm);
  const boomLengthMm = boomElectricalMm + 2 * overhang;
  const longestElementMm = Math.max(...elements.map((e) => e.lengthMm));

  // ---- Performance estimates ----
  if (boomLengthLambda > MAX_VALIDATED_BOOM) {
    warnings.push(
      `Boom is ${boomLengthLambda.toFixed(1)}λ — beyond the validated gain data (≤ ${MAX_VALIDATED_BOOM}λ). Gain is extrapolated; model the design in NEC.`,
    );
  }
  const presetGainAdj = inputs.preset === 'nbs' ? 0.1 : inputs.preset === 'dl6wu' ? -0.15 : -0.4;
  const gainDbi = interp(GAIN_TABLE, boomLengthLambda) + presetGainAdj;
  const gainDbd = gainDbi - 2.15;

  const fbCap = inputs.preset === 'dl6wu' ? 30 : inputs.preset === 'nbs' ? 24 : 19;
  const frontToBackDb =
    n <= 2 ? 8 + presetGainAdj : Math.min(fbCap, 11 + 1.6 * (n - 2));

  // Beamwidth from directivity: D ≈ 41253 / (θE × θH), E-plane narrower.
  const gLin = Math.pow(10, gainDbi / 10);
  const ratio = 1.55; // θH / θE typical for Yagis
  const beamwidthE = Math.min(170, Math.sqrt(41253 / (gLin * ratio)));
  const beamwidthH = Math.min(175, beamwidthE * ratio);

  // Feedpoint: mutual coupling pulls the ~73 Ω free-space dipole down.
  const presetZAdj = inputs.preset === 'dl6wu' ? -2 : inputs.preset === 'nbs' ? -1 : 2;
  const feedImpedanceOhm = Math.round(
    Math.max(15, 20 + 18 * Math.exp(-(n - 2) / 4) + presetZAdj),
  );
  const foldedImpedanceOhm = feedImpedanceOhm * 4;
  const activeZ =
    inputs.drivenType === 'folded' ? foldedImpedanceOhm : feedImpedanceOhm;
  const matchSuggestion = suggestMatch(inputs.drivenType, activeZ);

  const bandwidthPct =
    inputs.preset === 'dl6wu' ? 5 : inputs.preset === 'classic' ? 3 : 2;
  const fLowMHz = inputs.frequencyMHz * (1 - bandwidthPct / 200);
  const fHighMHz = inputs.frequencyMHz * (1 + bandwidthPct / 200);

  const windAreaM2 =
    (elements.reduce((a, e) => a + e.lengthMm, 0) * inputs.elementDiameterMm +
      boomLengthMm * inputs.boomDiameterMm) /
    1e6;

  if (n === 2) {
    warnings.push(
      'A 2-element beam has modest gain and a wide pattern — add directors for more gain.',
    );
  }

  return {
    inputs,
    wavelengthMm: lambda,
    elements,
    boomLengthMm,
    boomElectricalMm,
    boomLengthLambda,
    longestElementMm,
    endEffectShorteningMm,
    boomCorrectionMm,
    gainDbi,
    gainDbd,
    frontToBackDb,
    beamwidthE,
    beamwidthH,
    feedImpedanceOhm,
    foldedImpedanceOhm,
    matchSuggestion,
    bandwidthPct,
    fLowMHz,
    fHighMHz,
    windAreaM2,
    warnings,
  };
}

function suggestMatch(drivenType: DrivenType, z: number): string {
  if (drivenType === 'folded') {
    if (Math.abs(z - 50) <= 14) return 'Feed 50 Ω coax directly via a 1:1 balun.';
    if (z > 50)
      return `≈ ${z} Ω — use a step-down balun (≈ ${Math.round((z / 50) * 10) / 10}:1), or a DK7ZB asymmetric folded dipole for direct 50 Ω.`;
    return `≈ ${z} Ω — use a step-up transformer to 50 Ω, or a DK7ZB asymmetric folded dipole for direct 50 Ω.`;
  }
  if (Math.abs(z - 50) <= 8) return 'Close to 50 Ω — feed coax via a 1:1 balun.';
  if (Math.abs(z - 28) <= 9)
    return `≈ ${z} Ω — classic options: folded dipole + 2:1 balun, DK7ZB match, or gamma / T-match to 50 Ω.`;
  return `≈ ${z} Ω — use a gamma match, T-match, folded dipole + balun, or DK7ZB match to reach 50 Ω.`;
}

/** Band presets: [label, center MHz, suggested elements]. */
export const BAND_PRESETS: Array<[string, number, number]> = [
  ['6 m', 50.15, 5],
  ['4 m', 70.2, 5],
  ['2 m', 144.3, 7],
  ['1.25 m', 222.1, 7],
  ['70 cm', 432.2, 9],
  ['33 cm', 902.5, 11],
  ['23 cm', 1296.2, 13],
  ['13 cm', 2400, 13],
];
