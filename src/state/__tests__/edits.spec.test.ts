/** Owner: P2 · requirements 4 and 5. Remove `.skip` when built. */
import type { CutPieceAction, StitchPiecesAction } from '@/state/actions';
import { initHistory, rootReducer } from '@/state/reducer';
import { applyAll, preset } from '@/testUtils';

const piece = (p: ReturnType<typeof preset>, id: string) => p.pieces.find((x) => x.id === id);

describe('P2 · move, rotate, flip, recolour', () => {
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

describe('P2 · cut and undo', () => {
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

describe('P2 · edit edge cases', () => {
  const cut: CutPieceAction = {
    type: 'CUT_PIECE',
    pieceId: 'second-panel',
    from: { x: 90, y: 0 },
    to: { x: 90, y: 70 },
    fragmentIds: ['frag-a', 'frag-b'],
  };

  test('edits to a piece that does not exist change nothing', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, { type: 'FLIP_PIECE', pieceId: 'nope' })).toBe(p);
    expect(applyAll(p, { ...cut, pieceId: 'nope' })).toBe(p);
  });

  test('an edit that changes nothing records no undo step', () => {
    const p = preset('skirt-a');
    const panel = piece(p, 'second-panel')!;
    expect(
      applyAll(
        p,
        { type: 'MOVE_PIECE', pieceId: 'second-panel', position: { ...panel.position } },
        { type: 'RECOLOR_PIECE', pieceId: 'second-panel', color: panel.color },
        { type: 'ROTATE_PIECE', pieceId: 'second-panel', rotationDeg: panel.rotationDeg + 360 },
      ),
    ).toBe(p);
  });

  test('rotation is kept between 0 and 360 degrees', () => {
    const next = applyAll(preset('skirt-a'), {
      type: 'ROTATE_PIECE',
      pieceId: 'second-panel',
      rotationDeg: 450,
    });
    expect(piece(next, 'second-panel')?.rotationDeg).toBe(90);
    const back = applyAll(next, {
      type: 'ROTATE_PIECE',
      pieceId: 'second-panel',
      rotationDeg: -90,
    });
    expect(piece(back, 'second-panel')?.rotationDeg).toBe(270);
  });

  test('flipping twice returns to the original orientation', () => {
    const p = preset('skirt-a');
    const next = applyAll(
      p,
      { type: 'FLIP_PIECE', pieceId: 'second-panel' },
      { type: 'FLIP_PIECE', pieceId: 'second-panel' },
    );
    expect(piece(next, 'second-panel')?.flipped).toBe(piece(p, 'second-panel')?.flipped);
  });

  test('fragments stay where the parent was, in its place in the list', () => {
    const p = preset('skirt-a');
    const parent = piece(p, 'second-panel')!;
    const index = p.pieces.indexOf(parent);
    const next = applyAll(p, cut);
    expect(next.pieces).toHaveLength(p.pieces.length + 1);
    expect(next.pieces[index]?.id).toBe('frag-a');
    expect(next.pieces[index + 1]?.id).toBe('frag-b');
    for (const id of ['frag-a', 'frag-b']) {
      expect(piece(next, id)).toMatchObject({
        position: parent.position,
        rotationDeg: parent.rotationDeg,
        flipped: parent.flipped,
        color: parent.color,
        category: 'fragment',
      });
    }
  });

  test('cutting a rotated, flipped piece still splits it where the line was drawn', () => {
    // Turn the 20 × 20 panel 30° and flip it, then cut straight down through its centre.
    const turned = applyAll(
      preset('skirt-a'),
      { type: 'ROTATE_PIECE', pieceId: 'second-panel', rotationDeg: 30 },
      { type: 'FLIP_PIECE', pieceId: 'second-panel' },
    );
    const next = applyAll(turned, cut);
    const a = piece(next, 'frag-a')!;
    const b = piece(next, 'frag-b')!;
    expect(a.areaCm2).toBeCloseTo(200);
    expect(b.areaCm2).toBeCloseTo(200);
  });

  test('cutting a fragment again keeps the original piece id', () => {
    const next = applyAll(preset('skirt-a'), cut, {
      type: 'CUT_PIECE',
      pieceId: 'frag-a',
      from: { x: 0, y: 35 },
      to: { x: 200, y: 35 },
      fragmentIds: ['frag-c', 'frag-d'],
    });
    for (const id of ['frag-b', 'frag-c', 'frag-d']) {
      expect(piece(next, id)?.originalPieceId).toBe('second-panel');
    }
    const total = ['frag-b', 'frag-c', 'frag-d']
      .map((id) => piece(next, id)!.areaCm2)
      .reduce((s, a) => s + a, 0);
    expect(total).toBeCloseTo(400);
  });

  test('one undo reverses a whole cut', () => {
    const start = preset('skirt-a');
    let s = rootReducer(initHistory(start), cut);
    expect(s.past).toHaveLength(1);
    s = rootReducer(s, { type: 'UNDO' });
    expect(s.present).toBe(start);
  });
});

describe('P2 · cut must be drawn across the piece', () => {
  // second-panel spans x 80–100, y 25–45 in skirt layout A.
  const base: CutPieceAction = {
    type: 'CUT_PIECE',
    pieceId: 'second-panel',
    from: { x: 90, y: 0 },
    to: { x: 90, y: 70 },
    fragmentIds: ['frag-a', 'frag-b'],
  };

  test('a stroke that stops inside the piece is rejected', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, { ...base, to: { x: 90, y: 35 } })).toBe(p);
  });

  test('a stroke above the piece is rejected even though its line would cross it', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, { ...base, from: { x: 90, y: 0 }, to: { x: 90, y: 20 } })).toBe(p);
  });
});

describe('P2 · resize', () => {
  test('scales the outline about its centre and the area by factor²', () => {
    const p = preset('skirt-a');
    const before = piece(p, 'second-panel')!;
    const next = applyAll(p, { type: 'RESIZE_PIECE', pieceId: 'second-panel', factor: 1.5 });
    const after = piece(next, 'second-panel')!;
    expect(after.areaCm2).toBeCloseTo(before.areaCm2 * 2.25);
    expect(after.position).toEqual(before.position);
    expect(after.polygon[0]!.x).toBeCloseTo(before.polygon[0]!.x * 1.5);
  });

  test('a factor of 1, zero or less changes nothing', () => {
    const p = preset('skirt-a');
    for (const factor of [1, 0, -2, Number.NaN]) {
      expect(applyAll(p, { type: 'RESIZE_PIECE', pieceId: 'second-panel', factor })).toBe(p);
    }
  });

  test('cannot shrink a piece below 1 cm²', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, { type: 'RESIZE_PIECE', pieceId: 'second-panel', factor: 0.01 })).toBe(p);
  });
});

describe('P2 · stitch', () => {
  const stitch = (a: string, b: string, groupId = 'g1'): StitchPiecesAction => ({
    type: 'STITCH_PIECES',
    pieceIds: [a, b],
    groupId,
  });

  test('stitched pieces move together', () => {
    const p = preset('skirt-a');
    const yoke = piece(p, 'jeans-yoke-l')!;
    const pocket = piece(p, 'jeans-pocket-l')!;
    const next = applyAll(p, stitch('jeans-yoke-l', 'jeans-pocket-l'), {
      type: 'MOVE_PIECE',
      pieceId: 'jeans-pocket-l',
      position: { x: pocket.position.x + 10, y: pocket.position.y - 5 },
    });
    expect(piece(next, 'jeans-yoke-l')?.position).toEqual({
      x: yoke.position.x + 10,
      y: yoke.position.y - 5,
    });
    expect(piece(next, 'second-panel')?.position).toEqual(piece(p, 'second-panel')?.position);
  });

  test('stitching into an existing group merges the groups', () => {
    const next = applyAll(
      preset('skirt-a'),
      stitch('jeans-yoke-l', 'jeans-pocket-l', 'g1'),
      stitch('second-panel', 'jeans-pocket-l', 'g2'),
    );
    for (const id of ['jeans-yoke-l', 'jeans-pocket-l', 'second-panel']) {
      expect(piece(next, id)?.groupId).toBe('g2');
    }
  });

  test('a piece cannot be stitched to itself, to a tray piece, or twice', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, stitch('second-panel', 'second-panel'))).toBe(p);
    expect(applyAll(p, stitch('second-panel', 'jeans-waistband'))).toBe(p);
    const once = applyAll(p, stitch('second-panel', 'jeans-yoke-l'));
    expect(applyAll(once, stitch('second-panel', 'jeans-yoke-l', 'g9'))).toBe(once);
  });

  test('unstitching the second-last piece frees both', () => {
    const next = applyAll(preset('skirt-a'), stitch('jeans-yoke-l', 'jeans-pocket-l'), {
      type: 'UNSTITCH_PIECE',
      pieceId: 'jeans-pocket-l',
    });
    expect(piece(next, 'jeans-yoke-l')?.groupId).toBeUndefined();
    expect(piece(next, 'jeans-pocket-l')?.groupId).toBeUndefined();
  });

  test('unstitching one of three leaves the other two stitched', () => {
    const next = applyAll(
      preset('skirt-a'),
      stitch('jeans-yoke-l', 'jeans-pocket-l'),
      stitch('second-panel', 'jeans-pocket-l', 'g2'),
      { type: 'UNSTITCH_PIECE', pieceId: 'second-panel' },
    );
    expect(piece(next, 'second-panel')?.groupId).toBeUndefined();
    expect(piece(next, 'jeans-yoke-l')?.groupId).toBe('g2');
    expect(piece(next, 'jeans-pocket-l')?.groupId).toBe('g2');
  });
});
