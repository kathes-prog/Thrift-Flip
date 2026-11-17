/** Shared: checks the demo fixtures match the build plan. Runs now. */
import { JEANS_TOTAL_CM2, makeJeansPieces } from '@/fixtures/jeans';
import { CROPPED_TOP_ID, getPattern, SKIRT_ID, SKIRT_REGION, TOTE_ID } from '@/fixtures/patterns';
import { presets } from '@/fixtures/presets';
import { makeDemoScrapPiece, makeSecondGarmentPieces } from '@/fixtures/secondGarment';
import { SCHEMA_VERSION } from '@/model/types';
import { shoelace } from '@/testUtils';

const sum = (xs: { areaCm2: number }[]) => xs.reduce((s, x) => s + x.areaCm2, 0);

describe('original jeans fixture', () => {
  const pieces = makeJeansPieces();

  test('has 10 pieces totalling 11,856 cm²', () => {
    expect(pieces).toHaveLength(10);
    expect(sum(pieces)).toBe(11_856);
    expect(JEANS_TOTAL_CM2).toBe(11_856);
  });

  test('has the six categories from the build plan', () => {
    const count = (c: string) => pieces.filter((p) => p.category === c).length;
    expect(count('front-leg-panel')).toBe(2);
    expect(count('back-leg-panel')).toBe(2);
    expect(count('waistband')).toBe(1);
    expect(count('back-pocket')).toBe(2);
    expect(count('back-yoke')).toBe(2);
    expect(count('belt-loop-strip')).toBe(1);
  });

  test('each pocket is 250 cm² (pocket test)', () => {
    for (const p of pieces.filter((x) => x.category === 'back-pocket')) {
      expect(p.areaCm2).toBe(250);
    }
  });
});

describe('extra materials', () => {
  test('second garment is a 400 cm² panel and a 200 cm² pocket', () => {
    expect(makeSecondGarmentPieces().map((p) => p.areaCm2)).toEqual([400, 200]);
  });

  test('demo scrap is 30 × 30 = 900 cm²', () => {
    expect(makeDemoScrapPiece().areaCm2).toBe(900);
  });

  test('every fixture polygon matches its areaCm2', () => {
    const all = [...makeJeansPieces(), ...makeSecondGarmentPieces(), makeDemoScrapPiece()];
    for (const p of all) expect(shoelace(p.polygon)).toBeCloseTo(p.areaCm2, 6);
  });
});

describe('patterns', () => {
  test('tote and cropped top estimates match the build plan', () => {
    expect(getPattern(TOTE_ID)?.estimatedAreaCm2).toBe(3_580);
    expect(getPattern(CROPPED_TOP_ID)?.estimatedAreaCm2).toBe(12_500);
  });

  test('demo arithmetic: 644 short, then 44 short, then cleared by the scrap', () => {
    const top = 12_500;
    expect(top - 11_856).toBe(644);
    expect(top - (11_856 + 600)).toBe(44);
    expect(11_856 + 900).toBe(12_756);
    expect(12_756).toBeGreaterThanOrEqual(top);
  });

  test('skirt has front and back regions with the shared ids', () => {
    const skirt = getPattern(SKIRT_ID);
    expect(skirt?.has3dPreview).toBe(true);
    expect(skirt?.guideRegions.map((r) => r.id)).toEqual([SKIRT_REGION.front, SKIRT_REGION.back]);
  });
});

describe('presets', () => {
  test.each(presets.map((p) => [p.id, p] as const))('%s is valid', (_id, preset) => {
    const project = preset.make();
    expect(project.schemaVersion).toBe(SCHEMA_VERSION);
    const ids = project.pieces.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of project.pieces) {
      expect(project.sources.some((s) => s.id === piece.sourceId)).toBe(true);
    }
    expect(project.sources.filter((s) => s.type === 'additional-garment').length).toBeLessThan(2);
  });
});
