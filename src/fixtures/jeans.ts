/**
 * Shared fixture: the original jeans' sample-analysis inventory.
 *
 * Build plan: 10 pieces, 11,856 cm² in six categories.
 * TODO(skeleton): swap the placeholder rectangles for the Figma Make
 * prototype's piece outlines. Keep each piece's areaCm2 and the 11,856 total.
 */
import type { FabricPiece, MaterialSource } from '@/model/types';
import { rect } from '@/model/units';
import { colors } from '@/theme/tokens';

export const JEANS_SOURCE_ID = 'src-jeans';

export const jeansSource: MaterialSource = {
  id: JEANS_SOURCE_ID,
  displayName: 'Original jeans',
  type: 'original-garment',
  photoPath: null,
  shade: colors.denimOriginal,
  isSampleAnalysis: true,
};

type PieceSpec = Pick<FabricPiece, 'id' | 'displayName' | 'category'> & { w: number; h: number };

/** Width × height in cm. Areas: 2640, 2640, 2560, 2560, 384, 250, 250, 252, 252, 68. */
const specs: PieceSpec[] = [
  {
    id: 'jeans-front-leg-l',
    displayName: 'Front leg panel (left)',
    category: 'front-leg-panel',
    w: 30,
    h: 88,
  },
  {
    id: 'jeans-front-leg-r',
    displayName: 'Front leg panel (right)',
    category: 'front-leg-panel',
    w: 30,
    h: 88,
  },
  {
    id: 'jeans-back-leg-l',
    displayName: 'Back leg panel (left)',
    category: 'back-leg-panel',
    w: 32,
    h: 80,
  },
  {
    id: 'jeans-back-leg-r',
    displayName: 'Back leg panel (right)',
    category: 'back-leg-panel',
    w: 32,
    h: 80,
  },
  { id: 'jeans-waistband', displayName: 'Waistband', category: 'waistband', w: 96, h: 4 },
  {
    id: 'jeans-pocket-l',
    displayName: 'Back pocket (left)',
    category: 'back-pocket',
    w: 12.5,
    h: 20,
  },
  {
    id: 'jeans-pocket-r',
    displayName: 'Back pocket (right)',
    category: 'back-pocket',
    w: 12.5,
    h: 20,
  },
  { id: 'jeans-yoke-l', displayName: 'Back yoke (left)', category: 'back-yoke', w: 36, h: 7 },
  { id: 'jeans-yoke-r', displayName: 'Back yoke (right)', category: 'back-yoke', w: 36, h: 7 },
  {
    id: 'jeans-belt-loops',
    displayName: 'Belt-loop strip',
    category: 'belt-loop-strip',
    w: 34,
    h: 2,
  },
];

export function makeJeansPieces(): FabricPiece[] {
  return specs.map(({ w, h, ...spec }) => ({
    ...spec,
    sourceId: JEANS_SOURCE_ID,
    originalPieceId: spec.id,
    polygon: rect(w, h),
    areaCm2: w * h,
    color: colors.denimOriginal,
    position: { x: 0, y: 0 },
    rotationDeg: 0,
    flipped: false,
    status: 'tray',
  }));
}

export const JEANS_TOTAL_CM2 = 11_856;
