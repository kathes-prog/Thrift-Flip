/**
 * Shared fixture: the second garment and the measured demo scrap.
 *
 * Build plan: second garment = one 400 cm² panel + one 200 cm² pocket in a
 * distinguishable denim shade (+600 cm²). Scrap = 30 × 30 cm (+900 cm²).
 */
import type { FabricPiece, MaterialSource } from '@/model/types';
import { rect } from '@/model/units';
import { colors } from '@/theme/tokens';

export const SECOND_SOURCE_ID = 'src-second';
export const DEMO_SCRAP_SOURCE_ID = 'src-scrap-demo';

export const secondGarmentSource: MaterialSource = {
  id: SECOND_SOURCE_ID,
  displayName: 'Second garment',
  type: 'additional-garment',
  photoPath: null,
  shade: colors.denimSecond,
  isSampleAnalysis: true,
};

function base(id: string, sourceId: string, color: string) {
  return {
    id,
    sourceId,
    originalPieceId: id,
    color,
    position: { x: 0, y: 0 },
    rotationDeg: 0,
    flipped: false,
    status: 'tray' as const,
  };
}

export function makeSecondGarmentPieces(): FabricPiece[] {
  return [
    {
      ...base('second-panel', SECOND_SOURCE_ID, colors.denimSecond),
      displayName: 'Panel',
      category: 'panel',
      polygon: rect(20, 20),
      areaCm2: 400,
    },
    {
      ...base('second-pocket', SECOND_SOURCE_ID, colors.denimSecond),
      displayName: 'Pocket',
      category: 'pocket',
      polygon: rect(10, 20),
      areaCm2: 200,
    },
  ];
}

export const SECOND_GARMENT_TOTAL_CM2 = 600;

export const demoScrapSource: MaterialSource = {
  id: DEMO_SCRAP_SOURCE_ID,
  displayName: 'Scrap 30 × 30 cm',
  type: 'scrap',
  photoPath: null,
  shade: colors.scrapDefault,
  isSampleAnalysis: false,
  measured: { widthCm: 30, lengthCm: 30 },
};

export function makeDemoScrapPiece(): FabricPiece {
  return {
    ...base('scrap-demo', DEMO_SCRAP_SOURCE_ID, colors.scrapDefault),
    displayName: 'Scrap 30 × 30 cm',
    category: 'scrap',
    polygon: rect(30, 30),
    areaCm2: 900,
  };
}
