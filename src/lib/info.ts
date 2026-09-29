/**
 * Info-badge content: every input parameter and result gets a "?" badge
 * that opens a modal explaining the RF theory behind it, with a diagram
 * and curated references.
 */
export interface InfoLink {
  label: string;
  url: string;
}

export interface InfoEntry {
  title: string;
  short: string;
  formula?: string;
  detail: string;
  /** Curated references / further reading shown in the modal. */
  links?: InfoLink[];
}

const WIKI_YAGI = 'https://en.wikipedia.org/wiki/Yagi%E2%80%93Uda_antenna';
const WIKI_DIPOLE = 'https://en.wikipedia.org/wiki/Dipole_antenna';
const WIKI_MATCHING = 'https://en.wikipedia.org/wiki/Impedance_matching';
const WIKI_PATTERN = 'https://en.wikipedia.org/wiki/Radiation_pattern';
const WIKI_DIRECTIVITY = 'https://en.wikipedia.org/wiki/Directivity';
const WIKI_SWR = 'https://en.wikipedia.org/wiki/Standing_wave_ratio';
const WIKI_BALUN = 'https://en.wikipedia.org/wiki/Balun';
const WIKI_NEC = 'https://en.wikipedia.org/wiki/Numerical_Electromagnetics_Code';
const NBS_TN688 =
  'https://nvlpubs.nist.gov/nistpubs/Legacy/TN/nbstechnicalnote688.pdf';
const DK7ZB = 'https://www.qsl.net/dk7zb/';
const NEC4 = 'https://www.qsl.net/4nec2/';

export const INFO: Record<string, InfoEntry> = {
  frequency: {
    title: 'Design frequency',
    short: 'Centre frequency the antenna is cut for. Everything scales with wavelength λ = c / f.',
    formula: 'λ = c / f,  c = 299 792 458 m/s',
    detail:
      'All element lengths and spacings are fractions of a wavelength, so the whole antenna scales inversely with frequency: double the frequency and every dimension halves. Cut for the centre of the band segment you actually use (e.g. 144.300 MHz for SSB, 432.200 MHz). Yagis are resonant structures with only a few percent of usable bandwidth, so designing for the wrong sub-band costs gain and match where you need it.',
    links: [
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
      { label: 'NBS TN-688: Yagi Antenna Design (PDF)', url: NBS_TN688 },
    ],
  },
  elements: {
    title: 'Number of elements',
    short: 'Reflector + driven element + directors. More directors on a longer boom = more gain.',
    detail:
      'Element 1 is the reflector, element 2 the driven element, the rest are directors. Gain grows mainly with boom length (in wavelengths), not raw element count: cramming extra directors onto a short boom adds almost nothing. Rough guide — 3 el ≈ 7.5 dBi, 5 el ≈ 9.5 dBi, 11 el ≈ 12.5 dBi, 19+ el on a long boom ≈ 14–16 dBi. Longer booms also narrow the beam and need sturdier mechanics.',
    links: [
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
      { label: 'DK7ZB optimised Yagi designs', url: DK7ZB },
    ],
  },
  preset: {
    title: 'Design family',
    short: 'Whose optimisation recipe generates lengths and spacings.',
    detail:
      'DL6WU (G. Hoch): tapered lengths and growing spacings, optimised for a clean pattern and wide SWR bandwidth at a tiny gain cost — the best default. NBS (Viezbicke, NBS TN-688): uniform 0.2λ spacing tuned for maximum forward gain; narrower bandwidth. Classic (Rothammel/ARRL): forgiving textbook dimensions with wide spacings; slightly less gain but tolerant of building errors. All three are parametric models of the published families — export the NEC deck to verify exact behaviour.',
    links: [
      { label: 'NBS TN-688: Yagi Antenna Design (PDF)', url: NBS_TN688 },
      { label: 'DK7ZB optimised Yagi designs', url: DK7ZB },
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
    ],
  },
  elementDiameter: {
    title: 'Element diameter',
    short: 'Tube diameter. Thicker elements resonate shorter and give wider bandwidth.',
    formula: 'L_res ≈ 0.477λ (thin) → ~0.44λ (fat, d ≈ 0.02λ)',
    detail:
      'This is the end effect: charge crowding at the element tips adds capacitance, so a real half-wave dipole resonates shorter than λ/2. Fat elements have more tip capacitance and resonate shorter still, but reward you with lower Q, wider SWR bandwidth and lower loss. The app interpolates the resonant length from Rothammel/ARRL curves for your exact d/λ. Above d/λ ≈ 0.02 the simple model degrades — check with NEC.',
    links: [
      { label: 'Dipole antenna — Wikipedia', url: WIKI_DIPOLE },
      { label: 'Standing wave ratio — Wikipedia', url: WIKI_SWR },
    ],
  },
  boomDiameter: {
    title: 'Boom diameter',
    short: 'Boom tube size. Only affects electrics when elements pass through a metal boom.',
    detail:
      'An insulated or non-conductive boom is electrically invisible. A metallic boom with elements passing through it adds shunt capacitance at each element centre (the current maximum), which detunes parasitic elements — the app lengthens them to compensate (Rothammel boom correction). Mechanically, size the boom for the bending moment: long VHF booms typically use 20–40 mm tubing, often telescoped.',
    links: [{ label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI }],
  },
  boomMount: {
    title: 'Element mounting',
    short: 'Whether parasitic elements are insulated from, or pass through, a metal boom.',
    formula: 'ΔL ≈ C · D_boom,  C ≈ 0.2–0.6 from d/D',
    detail:
      'Through-metal mounting is rugged but the boom steals capacitance at the element centre, so reflector and directors must be lengthened (typically a few mm at VHF — small but measurable). Insulated mounting (plastic blocks, clamps on an insulated plate) needs no correction. The driven element is always split at the feedpoint, so it never takes the boom correction.',
    links: [
      { label: 'DK7ZB Yagi building practice', url: DK7ZB },
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
    ],
  },
  drivenType: {
    title: 'Driven element type',
    short: 'Straight dipole (~25 Ω in the array) or folded dipole (~4× that).',
    formula: 'Z_folded ≈ 4 · Z_straight',
    detail:
      'Mutual coupling to the parasitics drags the free-space 73 Ω down to roughly 20–35 Ω. A folded dipole multiplies whatever the straight version would be by ~4 (unequal current division in the array makes it approximate), landing near 80–140 Ω — handy because a 2:1 balun or a DK7ZB asymmetric fold then gives 50 Ω directly. Straight dipoles need a gamma, T, or hairpin match. Both radiate identically; the choice is purely about matching.',
    links: [
      { label: 'Dipole antenna (incl. folded) — Wikipedia', url: WIKI_DIPOLE },
      { label: 'Impedance matching — Wikipedia', url: WIKI_MATCHING },
      { label: 'Balun — Wikipedia', url: WIKI_BALUN },
    ],
  },
  wavelength: {
    title: 'Wavelength λ',
    short: 'Free-space wavelength at the design frequency. The ruler everything is measured in.',
    formula: 'λ = 299.792458 / f(MHz)  metres',
    detail:
      'Yagi dimensions are universal when expressed in wavelengths: a 2 m design scaled to 70 cm keeps identical electrical behaviour. Note this is the free-space wavelength — elements resonate near λ/2 only after the end-effect shortening, and coax/wire inside dielectrics would use λ × velocity factor (not applicable to bare aluminium elements in air).',
    links: [{ label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI }],
  },
  gain: {
    title: 'Forward gain (estimate)',
    short: 'How much stronger the main lobe is vs. isotropic (dBi) or a dipole (dBd).',
    formula: 'dBd = dBi − 2.15',
    detail:
      'Interpolated from published measurements (NBS TN-688, DL6WU long-boom data) against your boom length in wavelengths, with a small per-family adjustment. It assumes a clean build at the design frequency. Real gain varies ±0.5 dB with construction, height and ground. dBi references a (fictional) isotropic radiator; dBd references a half-wave dipole and is 2.15 dB lower.',
    links: [
      { label: 'Directivity — Wikipedia', url: WIKI_DIRECTIVITY },
      { label: 'Radiation pattern — Wikipedia', url: WIKI_PATTERN },
      { label: 'NBS TN-688: measured gain data (PDF)', url: NBS_TN688 },
    ],
  },
  frontback: {
    title: 'Front-to-back ratio (estimate)',
    short: 'Main-lobe vs. rear-lobe power. Higher = quieter reception off the back.',
    detail:
      'Grows with element count and optimisation quality; DL6WU tapers are famous for deep rear nulls (25–30 dB), classic designs manage ~15–19 dB. F/B is the most construction-sensitive figure here — a few mm of director error can halve it — so treat it as what a careful build achieves. It matters most for contest/DX reception, less for FM simplex.',
    links: [
      { label: 'Radiation pattern — Wikipedia', url: WIKI_PATTERN },
      { label: 'DK7ZB low-noise Yagi designs', url: DK7ZB },
    ],
  },
  beamwidth: {
    title: 'Half-power beamwidth (estimate)',
    short: 'Angular width of the main lobe at −3 dB, E-plane and H-plane.',
    formula: 'D ≈ 41253 / (θE · θH),  θ in degrees',
    detail:
      'Derived from the estimated directivity with the standard pencil-beam relation and a typical E/H ratio of 1:1.55 (the E-plane, containing the elements, is narrower). Beamwidth sets how precisely you must aim: a 13 dBi Yagi has roughly a 35° × 55° window. The Pattern tab sketches the lobes from these numbers.',
    links: [
      { label: 'Directivity — Wikipedia', url: WIKI_DIRECTIVITY },
      { label: 'Radiation pattern — Wikipedia', url: WIKI_PATTERN },
    ],
  },
  feedZ: {
    title: 'Feedpoint impedance (estimate)',
    short: 'Resistive impedance the feedline sees at resonance.',
    detail:
      'Mutual coupling pulls the impedance down from 73 Ω toward ~20 Ω as directors are added (exponential-decay fit to published Yagi feed data). Reactance is ~0 at the design frequency by construction. The exact value depends on diameters and taper, so always leave adjustment room in your match (telescoping gamma rod, movable short) and tune for minimum SWR with an analyser.',
    links: [
      { label: 'Impedance matching — Wikipedia', url: WIKI_MATCHING },
      { label: 'Standing wave ratio — Wikipedia', url: WIKI_SWR },
      { label: 'Balun — Wikipedia', url: WIKI_BALUN },
    ],
  },
  bandwidth: {
    title: 'Usable bandwidth (estimate)',
    short: 'Frequency range holding roughly SWR ≤ 2 without retuning.',
    formula: 'SWR ≤ 2 across ±BW/2',
    detail:
      'Rule-of-thumb per family: DL6WU ~5%, classic ~3%, NBS ~2% of centre frequency. Fatter elements, looser coupling (wider spacings) and lower-Q matches widen it; long high-gain booms narrow it. If you need a whole band (e.g. all of 2 m), prefer DL6WU with fat elements and verify the SWR sweep in NEC before cutting.',
    links: [
      { label: 'Standing wave ratio — Wikipedia', url: WIKI_SWR },
      { label: 'Dipole antenna — Wikipedia', url: WIKI_DIPOLE },
    ],
  },
  boom: {
    title: 'Boom length',
    short: 'Reflector-to-last-director distance plus mechanical overhang.',
    detail:
      'The electrical boom (reflector to last director, shown in λ) is what sets gain — the most important single dimension after frequency. The cut length adds an overhang of max(25 mm, 2× boom diameter) at each end for end caps and the mast clamp. Support a boom longer than ~1.5 m at its balance point and consider a truss for HF/VHF long booms.',
    links: [
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
      { label: 'NBS TN-688: boom-length gain curves (PDF)', url: NBS_TN688 },
    ],
  },
  spacing: {
    title: 'Element spacing',
    short: 'Distance between adjacent elements along the boom, in λ and mm.',
    detail:
      'Spacing controls coupling: tight spacing (0.15λ) gives compact size but touchy tuning and lower impedance; wide spacing (0.3λ+) is broadband and forgiving but needs more boom per dB. DL6WU grows spacing along the boom (more where the wave is already formed); NBS holds 0.2λ everywhere for peak gain. Position errors of ±λ/200 are negligible; ±λ/50 starts to cost F/B.',
    links: [
      { label: 'NBS TN-688: spacing data (PDF)', url: NBS_TN688 },
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
    ],
  },
  reflector: {
    title: 'Reflector',
    short: 'The parasitic element behind the driven element — ~5% longer than resonant.',
    detail:
      'Being longer than resonance makes it inductive: its re-radiated field lags, cancelling radiation toward the rear and reinforcing it forward. One reflector is standard; a second adds little. Length error here mainly affects F/B, not gain.',
    links: [{ label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI }],
  },
  driven: {
    title: 'Driven element',
    short: 'The only element connected to the feedline — cut for resonance.',
    detail:
      'The driven element is a resonant dipole at the design frequency; everything else is parasitic (excited only by coupling). It sits ~0.2λ ahead of the reflector. Keep metal (boom, mast, clamps) symmetric around its centre and feed it through a balun so the coax shield does not become part of the antenna.',
    links: [
      { label: 'Dipole antenna — Wikipedia', url: WIKI_DIPOLE },
      { label: 'Balun — Wikipedia', url: WIKI_BALUN },
    ],
  },
  directors: {
    title: 'Directors',
    short: 'Parasitic elements ahead of the driven element — progressively shorter.',
    detail:
      'Shorter than resonance, directors are capacitive: their re-radiation leads in phase, guiding the wave forward like a lens. Each added director extends the aperture and adds gain with diminishing returns. Taper (each shorter than the last) suppresses sidelobes — that is the essence of the DL6WU recipe.',
    links: [
      { label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI },
      { label: 'NBS TN-688: director data (PDF)', url: NBS_TN688 },
    ],
  },
  windload: {
    title: 'Projected wind area (rough)',
    short: 'Flat-plate equivalent area of elements + boom for mast/clamp sizing.',
    formula: 'A ≈ Σ(L·d) + L_boom·D',
    detail:
      'Sums length × diameter of every tube as if viewed side-on. Real wind load is force = q·A·Cf with dynamic pressure q ≈ 0.613·v² (v in m/s) and shape factor Cf ≈ 1.0–1.2 for round tubes — plus mast, rotator and ice. Use this only to sanity-check rotator ratings, then add margin.',
    links: [{ label: 'Yagi–Uda antenna — Wikipedia', url: WIKI_YAGI }],
  },
  nec: {
    title: 'NEC deck export',
    short: 'Method-of-moments model of this design for 4nec2 / xnec2c / PyNEC.',
    detail:
      'Generates straight-wire GW cards for every element (radius = your tube radius, odd segment counts scaled to λ/50), an EX voltage source on the driven element centre, an FR card at your design frequency and an RP pattern request. Folded dipoles are exported as their straight equivalent — add the fold wires yourself if you need exact folded feed impedance. Always re-tune lengths against the NEC SWR sweep before cutting metal.',
    links: [
      { label: '4nec2 modelling software', url: NEC4 },
      {
        label: 'Numerical Electromagnetics Code — Wikipedia',
        url: WIKI_NEC,
      },
    ],
  },
};
