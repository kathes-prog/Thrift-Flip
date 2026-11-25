/**
 * Shared: style tokens for the "Zine Cut-Out" look — photocopied paper,
 * xerox black, highlighter yellow and hot pink, square torn-paper shapes.
 *
 * The original token names are kept so existing screens keep compiling;
 * the Zine-specific ones are at the bottom. Check every one on the Hello
 * Styles screen on the demo iPhone (requirement 2).
 */

export const colors = {
  // surfaces
  background: '#F2EFE8', // photocopy paper
  surface: '#FFFFFF', // cut-out paper
  border: '#111111',
  // text
  ink: '#111111',
  inkMuted: '#5C584F',
  inkInverse: '#FFFFFF',
  // brand
  primary: '#111111', // primary buttons are black blocks
  primaryPressed: '#3A3A3A',
  accent: '#FF3EA5',
  // status
  success: '#1F7A3E',
  warning: '#8A5300',
  danger: '#E0006F', // stamp pink: passes 4.5:1 on paper for small text
  // fabric sources (one shade per source so pieces stay distinguishable)
  denimOriginal: '#3F5F95',
  denimSecond: '#9DB8DA',
  scrapDefault: '#A68A64',
  // canvas
  guideStroke: '#111111',
  guideFill: '#F7F4EC',
  selection: '#FF3EA5',

  // ---- Zine extras
  highlight: '#FFF04D', // highlighter yellow behind words and on tape
  pink: '#FF3EA5', // fills: hard shadows, selected states, chips (black text on it)
  paperDot: '#D9D4C8', // the photocopy speckle on the background
  gridLine: '#CFE3F2', // graph-paper lines on the studio canvas
  tape: 'rgba(255, 240, 77, 0.8)', // translucent masking tape
  disabled: '#8F8B84',
} as const;

export type ColorToken = keyof typeof colors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Zine shapes are square-cut: only swatches and dots stay round. */
export const radii = { sm: 0, md: 0, lg: 2, pill: 999 } as const;

/** Heavy outlines and the hard offset shadow used on cut-outs and buttons. */
export const lines = { thin: 1.5, bold: 2, heavy: 3 } as const;
export const hardShadow = { x: 5, y: 5 } as const;

/** Small fixed tilts (degrees) so cut-outs look hand-placed, not random per render. */
export const tilts = [-1.5, 1, -0.8, 1.4, -1.2, 0.6] as const;
export const tiltAt = (index: number): number => tilts[index % tilts.length] ?? 0;
