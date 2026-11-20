/**
 * Owner: P2. Colours for the Design Studio, taken from the hi-fi Figma frame.
 *
 * These live here, not in theme/tokens.ts, because the shared tokens are still
 * the skeleton's placeholders. When the team copies the Figma values into the
 * shared tokens, point these at them.
 */
export const studio = {
  screen: '#F2F0EB',
  bar: '#F7F6F2',
  canvas: '#FAF9F6',
  grid: '#E9E6DF',
  canvasBorder: '#E2DED5',
  ink: '#2B2B2A',
  muted: '#8B8A85',
  faint: '#B9B7B1',
  sage: '#5E7463',
  sheet: '#FAF9F6',
  track: '#E3E1DB',
  plus: '#FFF8D9',
  card: '#FFFFFF',
  discard: '#8C4A41',
  discardBorder: '#E5C9C3',
  selection: '#D9824B',
  stitch: '#5E7463',
  cutLine: '#B5473A',
  guideFill: '#F0EEE8',
  guideStroke: '#8E8C86',
} as const;
