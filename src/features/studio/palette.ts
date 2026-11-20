/**
 * Owner: P2. Colours a piece can be recoloured to: denim washes first, then
 * the source shades from the theme so a piece can always go back to them.
 */
import { colors } from '@/theme';

export const PIECE_COLORS: readonly string[] = [
  colors.denimOriginal,
  colors.denimSecond,
  '#2F4B7C', // dark rinse
  '#6D8FBF', // mid wash
  '#C9D6E8', // light wash
  '#3B3D42', // black denim
  colors.scrapDefault,
];
