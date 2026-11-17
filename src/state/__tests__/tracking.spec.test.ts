/**
 * Owner: P1 · requirements 3 and 6. Remove `.skip` as each part is built.
 * Numbers come straight from the build plan.
 */
import { jeansSource, makeJeansPieces } from '@/fixtures/jeans';
import { CROPPED_TOP_ID, getPattern, TOTE_ID } from '@/fixtures/patterns';
import { emptyProject } from '@/fixtures/presets';
import { makeSecondGarmentPieces, secondGarmentSource } from '@/fixtures/secondGarment';
import type { Project } from '@/model/types';
import { selectPatternFit, selectTracker } from '@/state/selectors';
import { applyAll, preset } from '@/testUtils';

const top = getPattern(CROPPED_TOP_ID)!;
const tote = getPattern(TOTE_ID)!;
const pocket = 'jeans-pocket-l';

function expectInvariant(project: Project) {
  const t = selectTracker(project);
  expect(t.usedCm2 + t.availableCm2 + t.discardedCm2).toBeCloseTo(t.recoveredCm2, 6);
}

describe.skip('P1 · sources', () => {
  test('ADD_GARMENT adds the jeans and their 10 pieces to the tray', () => {
    const p = applyAll(emptyProject(), {
      type: 'ADD_GARMENT',
      source: jeansSource,
      pieces: makeJeansPieces(),
    });
    expect(p.sources).toHaveLength(1);
    expect(p.pieces.filter((x) => x.status === 'tray')).toHaveLength(10);
  });

  test('allows only one additional garment', () => {
    const p = preset('jeans-second');
    const again = applyAll(p, {
      type: 'ADD_GARMENT',
      source: { ...secondGarmentSource, id: 'src-third' },
      pieces: makeSecondGarmentPieces().map((x) => ({
        ...x,
        id: `third-${x.id}`,
        sourceId: 'src-third',
      })),
    });
    expect(again).toBe(p);
  });

  test('SELECT_MODE sets the pattern', () => {
    const p = applyAll(preset('jeans'), {
      type: 'SELECT_MODE',
      mode: { kind: 'pattern', patternId: TOTE_ID },
    });
    expect(p.mode).toEqual({ kind: 'pattern', patternId: TOTE_ID });
  });
});

describe.skip('P1 · tracker and shortage', () => {
  test('jeans recover 11,856 cm², all available', () => {
    const t = selectTracker(preset('jeans'));
    expect(t.recoveredCm2).toBe(11_856);
    expect(t.availableCm2).toBe(11_856);
    expect(t.usedCm2).toBe(0);
    expect(t.percentUsed).toBe(0);
  });

  test('tote is eligible; cropped top is 644 cm² short', () => {
    const p = preset('jeans');
    expect(selectPatternFit(p, tote)).toMatchObject({ eligible: true, shortageCm2: 0 });
    expect(selectPatternFit(p, top)).toMatchObject({ eligible: false, shortageCm2: 644 });
  });

  test('second garment leaves the cropped top 44 cm² short', () => {
    expect(selectPatternFit(preset('jeans-second'), top).shortageCm2).toBe(44);
  });

  test('the 30 × 30 cm scrap raises the total to 12,756 and clears the warning', () => {
    const p = preset('jeans-scrap');
    expect(selectTracker(p).recoveredCm2).toBe(12_756);
    expect(selectPatternFit(p, top)).toMatchObject({ eligible: true, shortageCm2: 0 });
  });

  test('percent used is 0 when nothing is recovered', () => {
    expect(selectTracker(emptyProject()).percentUsed).toBe(0);
  });
});

describe.skip('P1 · inventory rules', () => {
  test('pocket sequence: place, store, restore, discard', () => {
    const start = preset('jeans');

    const placed = applyAll(start, {
      type: 'PLACE_PIECE',
      pieceId: pocket,
      position: { x: 0, y: 0 },
    });
    expect(selectTracker(placed)).toMatchObject({ availableCm2: 11_606, usedCm2: 250 });

    const stored = applyAll(placed, { type: 'STORE_PIECE', pieceId: pocket });
    expect(selectTracker(stored)).toMatchObject({
      availableCm2: 11_856,
      storedCm2: 250,
      usedCm2: 0,
    });

    const restored = applyAll(stored, { type: 'RESTORE_PIECE', pieceId: pocket });
    expect(restored.pieces.find((p) => p.id === pocket)?.status).toBe('tray');

    const discarded = applyAll(restored, { type: 'DISCARD_PIECE', pieceId: pocket });
    expect(selectTracker(discarded)).toMatchObject({
      availableCm2: 11_606,
      discardedCm2: 250,
      usedCm2: 0,
    });

    [placed, stored, restored, discarded].forEach(expectInvariant);
  });

  test('rejects a third jeans pocket', () => {
    const both = applyAll(
      preset('jeans'),
      { type: 'PLACE_PIECE', pieceId: 'jeans-pocket-l', position: { x: 0, y: 0 } },
      { type: 'PLACE_PIECE', pieceId: 'jeans-pocket-r', position: { x: 20, y: 0 } },
    );
    // Placing an already-placed pocket again, or a pocket that doesn't exist, changes nothing.
    expect(
      applyAll(both, { type: 'PLACE_PIECE', pieceId: 'jeans-pocket-l', position: { x: 40, y: 0 } }),
    ).toBe(both);
    expect(
      applyAll(both, { type: 'PLACE_PIECE', pieceId: 'jeans-pocket-3', position: { x: 40, y: 0 } }),
    ).toBe(both);
    expect(
      both.pieces.filter((p) => p.category === 'back-pocket' && p.status === 'canvas'),
    ).toHaveLength(2);
  });

  test('store only from the canvas, restore only from storage', () => {
    const p = preset('jeans');
    expect(applyAll(p, { type: 'STORE_PIECE', pieceId: pocket })).toBe(p);
    expect(applyAll(p, { type: 'RESTORE_PIECE', pieceId: pocket })).toBe(p);
  });

  test('a discarded piece cannot be placed or restored', () => {
    const d = applyAll(preset('jeans'), { type: 'DISCARD_PIECE', pieceId: pocket });
    expect(applyAll(d, { type: 'PLACE_PIECE', pieceId: pocket, position: { x: 0, y: 0 } })).toBe(d);
    expect(applyAll(d, { type: 'RESTORE_PIECE', pieceId: pocket })).toBe(d);
  });
});
