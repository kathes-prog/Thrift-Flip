/** Owner: P2 · requirements 4 and 5. Remove `.skip` when built. */
import { polygonArea } from '@/geometry/area';
import { pieceToDesign } from '@/geometry/transform';
import type { Point } from '@/model/units';
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
      { type: 'FLIP_PIECE', pieceId: 'jeans-pocket-l', axis: 'horizontal' },
    );
    expect(piece(next, 'jeans-pocket-l')).toMatchObject({
      rotationDeg: 270,
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
    expect(applyAll(p, { type: 'FLIP_PIECE', pieceId: 'nope', axis: 'vertical' })).toBe(p);
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

  test('flipping twice on the same axis returns to the original orientation', () => {
    const p = applyAll(preset('skirt-a'), {
      type: 'ROTATE_PIECE',
      pieceId: 'second-panel',
      rotationDeg: 30,
    });
    for (const axis of ['horizontal', 'vertical'] as const) {
      const flip = { type: 'FLIP_PIECE' as const, pieceId: 'second-panel', axis };
      const next = applyAll(p, flip, flip);
      expect(piece(next, 'second-panel')).toMatchObject({ flipped: false, rotationDeg: 30 });
    }
  });

  test('flips mirror the piece as it looks on screen', () => {
    // A right triangle, turned 30°, so any mistake shows up in the outline.
    const base = preset('skirt-a');
    const tri = {
      ...piece(base, 'second-panel')!,
      polygon: [
        { x: -5, y: -5 },
        { x: 10, y: -5 },
        { x: -5, y: 5 },
      ],
      rotationDeg: 30,
    };
    const p = { ...base, pieces: base.pieces.map((x) => (x.id === tri.id ? tri : x)) };
    const { x: cx, y: cy } = tri.position;
    const sorted = (pts: Point[]) =>
      pts
        .map((q) => ({ x: Math.round(q.x * 1e6) / 1e6, y: Math.round(q.y * 1e6) / 1e6 }))
        .sort((a, b) => a.x - b.x || a.y - b.y);
    const before = pieceToDesign(tri);

    const h = piece(
      applyAll(p, { type: 'FLIP_PIECE', pieceId: tri.id, axis: 'horizontal' }),
      tri.id,
    )!;
    expect(sorted(pieceToDesign(h))).toEqual(
      sorted(before.map((q) => ({ x: 2 * cx - q.x, y: q.y }))),
    );

    const v = piece(
      applyAll(p, { type: 'FLIP_PIECE', pieceId: tri.id, axis: 'vertical' }),
      tri.id,
    )!;
    expect(sorted(pieceToDesign(v))).toEqual(
      sorted(before.map((q) => ({ x: q.x, y: 2 * cy - q.y }))),
    );
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
      { type: 'FLIP_PIECE', pieceId: 'second-panel', axis: 'horizontal' },
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

describe('P2 · stitch', () => {
  // second-panel: 20 × 20 at (90, 35), so x 80–100, y 25–45.
  // jeans-pocket-l: 12.5 × 20 (250 cm²). Moved to (100, 35) it overlaps the panel by 6.25 × 20.
  const stitch = (a: string, b: string, mergedId = 'joined'): StitchPiecesAction => ({
    type: 'STITCH_PIECES',
    pieceIds: [a, b],
    mergedId,
  });
  const overlapping = () =>
    applyAll(preset('skirt-a'), {
      type: 'MOVE_PIECE',
      pieceId: 'jeans-pocket-l',
      position: { x: 100, y: 35 },
    });

  test('two overlapping pieces become one piece with both areas', () => {
    const p = overlapping();
    // The joined piece takes the panel's place once the pocket is gone.
    const index = p.pieces
      .filter((x) => x.id !== 'jeans-pocket-l')
      .findIndex((x) => x.id === 'second-panel');
    const next = applyAll(p, stitch('second-panel', 'jeans-pocket-l'));
    expect(next.pieces).toHaveLength(p.pieces.length - 1);
    expect(piece(next, 'second-panel')).toBeUndefined();
    expect(piece(next, 'jeans-pocket-l')).toBeUndefined();
    const joined = piece(next, 'joined')!;
    expect(next.pieces[index]).toBe(joined);
    expect(joined).toMatchObject({ status: 'canvas', areaCm2: 650, rotationDeg: 0 });
    // The outline is the two shapes joined: 400 + 250 − 125 overlap.
    expect(polygonArea(joined.polygon)).toBeCloseTo(525, 2);
    expect(joined.position.x).toBeCloseTo(93.125, 2);
    expect(joined.position.y).toBeCloseTo(35, 2);
  });

  test('pieces that do not overlap, tray pieces, or the same piece twice are rejected', () => {
    const p = preset('skirt-a');
    expect(applyAll(p, stitch('second-panel', 'jeans-pocket-l'))).toBe(p);
    expect(applyAll(p, stitch('second-panel', 'jeans-waistband'))).toBe(p);
    expect(applyAll(p, stitch('second-panel', 'second-panel'))).toBe(p);
  });

  test('one undo brings both pieces back', () => {
    const p = overlapping();
    let state = initHistory(p);
    state = rootReducer(state, stitch('second-panel', 'jeans-pocket-l'));
    state = rootReducer(state, { type: 'UNDO' });
    expect(state.present).toBe(p);
  });
});

describe('P2 · discard back to the tray', () => {
  test('a canvas piece goes back to the tray; anything else is left alone', () => {
    const p = preset('skirt-a');
    const next = applyAll(p, { type: 'RETURN_PIECE', pieceId: 'second-panel' });
    expect(piece(next, 'second-panel')?.status).toBe('tray');
    expect(applyAll(p, { type: 'RETURN_PIECE', pieceId: 'jeans-waistband' })).toBe(p);
    expect(applyAll(p, { type: 'RETURN_PIECE', pieceId: 'nope' })).toBe(p);
  });
});

describe('P2 · reset the canvas', () => {
  test('every canvas piece goes back to the tray; other pieces are left alone', () => {
    const p = preset('skirt-a');
    expect(p.pieces.some((x) => x.status === 'canvas')).toBe(true);
    const next = applyAll(p, { type: 'CLEAR_CANVAS' });
    expect(next.pieces.some((x) => x.status === 'canvas')).toBe(false);
    p.pieces.forEach((before, i) => {
      const after = next.pieces[i]!;
      expect(after.id).toBe(before.id);
      expect(after.status).toBe(before.status === 'canvas' ? 'tray' : before.status);
      expect(after.areaCm2).toBe(before.areaCm2);
    });
  });

  test('an empty canvas is left unchanged', () => {
    const p = applyAll(preset('skirt-a'), { type: 'CLEAR_CANVAS' });
    expect(applyAll(p, { type: 'CLEAR_CANVAS' })).toBe(p);
  });

  test('one undo puts every piece back on the canvas', () => {
    const p = preset('skirt-a');
    let state = initHistory(p);
    state = rootReducer(state, { type: 'CLEAR_CANVAS' });
    state = rootReducer(state, { type: 'UNDO' });
    expect(state.present).toBe(p);
  });
});
