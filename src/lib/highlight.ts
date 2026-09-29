/**
 * Shared highlight contract: hovering / focusing a parameter, result, table
 * row or 3D part highlights the same physical part in every view.
 */
export type HighlightKind =
  | 'none'
  | 'frequency' // wavelength annotation
  | 'reflector'
  | 'driven'
  | 'directors'
  | 'boom'
  | 'spacing'
  | 'diameter' // element tube thickness
  | 'feed' // feedpoint / matching
  | 'gain' // forward lobe emphasis
  | 'pattern'; // rear lobe emphasis

export interface Highlight {
  kind: HighlightKind;
  /** specific element index when hovering a table row / 3D part */
  index: number | null;
}

export const NO_HIGHLIGHT: Highlight = { kind: 'none', index: null };

export function roleToKind(role: 'reflector' | 'driven' | 'director'): HighlightKind {
  return role === 'reflector' ? 'reflector' : role === 'driven' ? 'driven' : 'directors';
}
