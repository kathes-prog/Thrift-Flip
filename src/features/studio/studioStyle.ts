/**
 * Owner: P2. Colours for the Design Studio in the Zine look: photocopy paper
 * around a white graph-paper canvas, xerox-black label-maker tools, hot pink
 * for whatever is selected or being cut.
 */
import { colors } from '@/theme';

export const studio = {
  screen: colors.background,
  bar: colors.background,
  canvas: colors.surface,
  grid: colors.gridLine,
  canvasBorder: colors.ink,
  ink: colors.ink,
  muted: colors.inkMuted,
  faint: colors.disabled,
  sage: colors.ink, // was the accent for labels; ink reads better on paper
  sheet: colors.background,
  track: colors.surface,
  plus: colors.highlight,
  card: colors.surface,
  discard: colors.danger,
  discardBorder: colors.danger,
  selection: colors.pink,
  stitch: colors.ink,
  cutLine: colors.danger,
  guideFill: colors.guideFill,
  guideStroke: colors.ink,
  /** Label-maker tool tiles. */
  tool: colors.ink,
  toolActive: colors.pink,
  toolText: colors.inkInverse,
} as const;
