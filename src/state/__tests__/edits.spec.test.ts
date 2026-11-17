/** Owner: P2 · requirements 4 and 5. Remove `.skip` when built. */
import type { CutPieceAction } from '@/state/actions';
import { initHistory, rootReducer } from '@/state/reducer';
import { applyAll, preset } from '@/testUtils';

const piece = (p: ReturnType<typeof preset>, id: string) => p.pieces.find((x) => x.id === id);

describe.skip('P2 · move, rotate, flip, recolour', () => {
  test('rotating or flipping the pocket leaves the other pieces where they were', () => {
    const p = preset('skirt-a');
    const next = applyAll(
      p,
      { type: 'ROTATE_PIECE', pieceId: 'jeans-pocket-l', rotationDeg: 90 },
      { type: 'FLIP_PIECE', pieceId: 'jeans-pocket-l' },
    );
    expect(piece(next, 'jeans-pocket-l')).toMatchObject({
      rotationDeg: 90,
      flipped: true,
      areaCm2: 250,
    });
    expect(piece(next, 'second-panel')?.position).toEqual(piece(p, 'second-panel')?.position);
    expect(piece(next, 'jeans-yoke-l')?.position).toEqual(piece(p, 'jeans-yoke-l')?.position);
  });

  test('moving and recolouring never changes area', () => {
    const next = applyAll(
      preset('skirt-a'),
      { type: 'MOVE_PIECE', pieceId: 'second-panel', position: { x: 80, y: 40 } },
      { type: 'RECOLOR_PIECE', pieceId: 'second-panel', color: '#6D8FBF' },
    );
    expect(piece(next, 'second-panel')).toMatchObject({
      position: { x: 80, y: 40 },
      color: '#6D8FBF',
      areaCm2: 400,
    });
  });
});

describe.skip('P2 · cut and undo', () => {
  // second-panel is a 20 × 20 cm square centred at (90, 35) in skirt layout A.
  const cut: CutPieceAction = {
    type: 'CUT_PIECE',
    pieceId: 'second-panel',
    from: { x: 90, y: 0 },
    to: { x: 90, y: 70 },
    fragmentIds: ['frag-a', 'frag-b'],
  };

  test('replaces the parent with two fragments whose areas sum to the parent', () => {
    const next = applyAll(preset('skirt-a'), cut);
    expect(piece(next, 'second-panel')).toBeUndefined();
    const a = piece(next, 'frag-a')!;
    const b = piece(next, 'frag-b')!;
    expect(a.areaCm2 + b.areaCm2).toBeCloseTo(400);
    for (const f of [a, b]) {
      expect(f).toMatchObject({
        sourceId: 'src-second',
        originalPieceId: 'second-panel',
        status: 'canvas',
      });
    }
  });

  test('an invalid cut leaves the project unchanged', () => {
    const p = preset('skirt-a');
    const miss: CutPieceAction = { ...cut, from: { x: 0, y: 0 }, to: { x: 0, y: 70 } };
    expect(applyAll(p, miss)).toBe(p);
  });

  test('undo the move, then undo the cut, to recover the original panel', () => {
    const start = preset('skirt-a');
    let s = initHistory(start);
    s = rootReducer(s, cut);
    s = rootReducer(s, { type: 'MOVE_PIECE', pieceId: 'frag-a', position: { x: 70, y: 50 } });
    s = rootReducer(s, { type: 'UNDO' });
    expect(piece(s.present, 'frag-a')).toBeDefined();
    s = rootReducer(s, { type: 'UNDO' });
    expect(s.present).toBe(start);
  });
});
