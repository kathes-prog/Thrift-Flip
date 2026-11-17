/** Owner: P3 · clipping for the 3D preview. Remove `.skip` when built. */
import { clipToRegion } from '@/geometry/clip';
import { getPattern, SKIRT_ID, SKIRT_REGION } from '@/fixtures/patterns';
import type { Polygon } from '@/model/units';
import { shoelace } from '@/testUtils';

const front = getPattern(SKIRT_ID)!.guideRegions.find((r) => r.id === SKIRT_REGION.front)!;

const square = (cx: number, cy: number, s: number): Polygon => [
  { x: cx - s / 2, y: cy - s / 2 },
  { x: cx + s / 2, y: cy - s / 2 },
  { x: cx + s / 2, y: cy + s / 2 },
  { x: cx - s / 2, y: cy + s / 2 },
];

describe.skip('P3 · clip to guide region', () => {
  test('a piece fully inside the region is kept whole', () => {
    const parts = clipToRegion(square(30, 35, 10), front);
    expect(parts.reduce((s, p) => s + shoelace(p), 0)).toBeCloseTo(100);
  });

  test('a piece outside the region gives nothing', () => {
    expect(clipToRegion(square(90, 35, 10), front)).toEqual([]);
  });

  test('a piece over the region edge keeps only the inside part', () => {
    const area = clipToRegion(square(30, 5, 10), front).reduce((s, p) => s + shoelace(p), 0);
    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(100);
  });
});

describe('P3 · storage', () => {
  test.todo('saves the project and loads the same project back (mock expo-file-system)');
  test.todo('rejects or migrates a saved file with a different schemaVersion');
  test.todo('returns null when nothing has been saved');
});
