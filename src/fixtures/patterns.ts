/**
 * Shared fixture: patterns and their guide regions.
 *
 * Region IDs are a contract between the 2D guide (P2) and the 3D skirt (P3).
 * Build plan values: tote 3,580 cm², cropped top 12,500 cm².
 *
 * TODO(skeleton): replace region outlines with the Make prototype's pattern
 * guide coordinates, and fill in the skirt's estimated area and the prepared
 * construction steps. Values marked PLACEHOLDER are not from the build plan.
 */
import type { Pattern } from '@/model/types';

export const TOTE_ID = 'tote';
export const CROPPED_TOP_ID = 'cropped-top';
export const SKIRT_ID = 'skirt';

export const SKIRT_REGION = {
  front: 'skirt-front',
  back: 'skirt-back',
} as const;

export const patterns: Pattern[] = [
  {
    id: TOTE_ID,
    name: 'Tote bag',
    estimatedAreaCm2: 3_580,
    canvas: { widthCm: 100, heightCm: 60 },
    guideRegions: [
      // PLACEHOLDER outlines
      { id: 'tote-front', label: 'Front', polygon: rectAt(25, 30, 40, 44) },
      { id: 'tote-back', label: 'Back', polygon: rectAt(75, 30, 40, 44) },
    ],
    has3dPreview: false,
  },
  {
    id: CROPPED_TOP_ID,
    name: 'Cropped top',
    estimatedAreaCm2: 12_500,
    canvas: { widthCm: 140, heightCm: 100 },
    guideRegions: [
      // PLACEHOLDER outlines
      { id: 'top-front', label: 'Front bodice', polygon: rectAt(35, 50, 60, 80) },
      { id: 'top-back', label: 'Back bodice', polygon: rectAt(105, 50, 60, 80) },
    ],
    has3dPreview: false,
  },
  {
    id: SKIRT_ID,
    name: 'Skirt',
    estimatedAreaCm2: 6_000, // PLACEHOLDER: not in the build plan
    canvas: { widthCm: 120, heightCm: 70 },
    guideRegions: [
      {
        id: SKIRT_REGION.front,
        label: 'Front',
        surface: 'front',
        // PLACEHOLDER trapezoid: narrow waist at the top, wider hem at the bottom
        polygon: [
          { x: 13, y: 5 },
          { x: 47, y: 5 },
          { x: 57, y: 65 },
          { x: 3, y: 65 },
        ],
      },
      {
        id: SKIRT_REGION.back,
        label: 'Back',
        surface: 'back',
        polygon: [
          { x: 73, y: 5 },
          { x: 107, y: 5 },
          { x: 117, y: 65 },
          { x: 63, y: 65 },
        ],
      },
    ],
    has3dPreview: true,
  },
];

/** Canvas size for Freestyle mode, which has no guide regions. */
export const FREESTYLE_CANVAS = { widthCm: 120, heightCm: 80 };

export function getPattern(id: string): Pattern | undefined {
  return patterns.find((p) => p.id === id);
}

/** Axis-aligned rectangle centred at (cx, cy) in design coordinates. */
function rectAt(cx: number, cy: number, w: number, h: number) {
  return [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
}
