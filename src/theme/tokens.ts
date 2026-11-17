/**
 * Shared: style tokens.
 *
 * TODO(skeleton): replace these placeholder values with the exact colours,
 * sizes and radii from the finalized Figma Make prototype, then check every
 * one on the Hello Styles screen on the demo iPhone (requirement 2).
 */

export const colors = {
  // surfaces
  background: '#F7F3EC',
  surface: '#FFFFFF',
  border: '#E2DACB',
  // text
  ink: '#1F2430',
  inkMuted: '#5E6472',
  inkInverse: '#FFFFFF',
  // brand
  primary: '#2F4B7C',
  primaryPressed: '#233A61',
  accent: '#D9824B',
  // status
  success: '#3E8E5E',
  warning: '#C98A1B',
  danger: '#B5473A',
  // fabric sources (one shade per source so pieces stay distinguishable)
  denimOriginal: '#4A6FA5',
  denimSecond: '#8FB3D9',
  scrapDefault: '#A68A64',
  // canvas
  guideStroke: '#9AA3B2',
  guideFill: '#EEF1F6',
  selection: '#D9824B',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radii = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
