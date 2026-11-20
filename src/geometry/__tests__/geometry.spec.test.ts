/** Owner: P2 · geometry with known inputs. Remove `.skip` as each part is built. */
import { polygonArea } from '@/geometry/area';
import { cutPolygon } from '@/geometry/cut';
import { pieceAt, pointInPolygon, segmentCrossesPolygon } from '@/geometry/hitTest';
import {
  designToLocal,
  designToScreen,
  localToDesign,
  pieceToDesign,
  screenToDesign,
} from '@/geometry/transform';
import { rect } from '@/model/units';
import { preset, shoelace } from '@/testUtils';

describe('P2 · area', () => {
  test('rectangle and triangle', () => {
    expect(polygonArea(rect(30, 88))).toBe(2_640);
    expect(
      polygonArea([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 3 },
      ]),
    ).toBe(6);
  });
});

describe('P2 · transforms', () => {
  const placement = { position: { x: 10, y: 20 }, rotationDeg: 90, flipped: true };

  test('flip, then rotate clockwise, then move', () => {
    // (1, 0) -> flip -> (-1, 0) -> rotate 90° clockwise (y down) -> (0, -1) -> move -> (10, 19)
    const p = localToDesign(placement, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(19);
  });

  test('design <-> local round-trips', () => {
    const odd = { position: { x: 3.3, y: -7 }, rotationDeg: 37, flipped: true };
    const q = { x: 4.2, y: -1.5 };
    const back = designToLocal(odd, localToDesign(odd, q));
    expect(back.x).toBeCloseTo(q.x);
    expect(back.y).toBeCloseTo(q.y);
  });

  test('design <-> screen round-trips', () => {
    const vp = { scale: 3.2, offsetX: 12, offsetY: 40 };
    const q = { x: 50, y: 25 };
    const back = screenToDesign(vp, designToScreen(vp, q));
    expect(back.x).toBeCloseTo(q.x);
    expect(back.y).toBeCloseTo(q.y);
  });
});

describe('P2 · straight cut', () => {
  const square = rect(10, 10);

  test('a line across splits into two parts that sum to the whole', () => {
    const parts = cutPolygon(square, { x: 0, y: -20 }, { x: 0, y: 20 });
    expect(parts).not.toBeNull();
    const [a, b] = parts!;
    expect(shoelace(a)).toBeCloseTo(50);
    expect(shoelace(b)).toBeCloseTo(50);
  });

  test('a diagonal cut also preserves area', () => {
    const parts = cutPolygon(square, { x: -20, y: -18 }, { x: 20, y: 15 });
    expect(parts).not.toBeNull();
    expect(shoelace(parts![0]) + shoelace(parts![1])).toBeCloseTo(100);
  });

  test('a line that misses the piece is rejected', () => {
    expect(cutPolygon(square, { x: 20, y: -20 }, { x: 20, y: 20 })).toBeNull();
  });

  test('a line along an edge is rejected (one side would be empty)', () => {
    expect(cutPolygon(square, { x: 5, y: -20 }, { x: 5, y: 20 })).toBeNull();
  });
});

describe('P2 · extra geometry checks', () => {
  test('rotating 90° clockwise without a flip', () => {
    // (1, 0) -> rotate 90° clockwise (y down) -> (0, 1)
    const upright = { position: { x: 0, y: 0 }, rotationDeg: 90, flipped: false };
    const p = localToDesign(upright, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  test('a leg panel turned 90° is 88 wide and 30 tall, and keeps its area', () => {
    const outline = pieceToDesign({
      polygon: rect(30, 88),
      position: { x: 50, y: 40 },
      rotationDeg: 90,
      flipped: false,
    });
    const xs = outline.map((p) => p.x);
    const ys = outline.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(88);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(30);
    expect(polygonArea(outline)).toBeCloseTo(2_640);
  });

  test('flipping mirrors points but keeps the area', () => {
    const piece = { polygon: rect(12.5, 20), position: { x: 5, y: 5 }, rotationDeg: 30 };
    const once = pieceToDesign({ ...piece, flipped: true });
    const plain = pieceToDesign({ ...piece, flipped: false });
    // An off-centre point lands somewhere else once flipped.
    const q = { x: 2, y: 1 };
    const a = localToDesign({ ...piece, flipped: true }, q);
    const b = localToDesign({ ...piece, flipped: false }, q);
    expect(a.x).not.toBeCloseTo(b.x);
    expect(polygonArea(once)).toBeCloseTo(polygonArea(plain));
  });

  test('a corner-to-corner cut gives two triangles of half the area', () => {
    const parts = cutPolygon(rect(10, 10), { x: -5, y: -5 }, { x: 5, y: 5 });
    expect(parts).not.toBeNull();
    const [a, b] = parts!;
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    expect(polygonArea(a)).toBeCloseTo(50);
    expect(polygonArea(b)).toBeCloseTo(50);
  });

  test('a cut with both endpoints at the same point is rejected', () => {
    expect(cutPolygon(rect(10, 10), { x: 0, y: 0 }, { x: 0, y: 0 })).toBeNull();
  });

  test('a cut drawn on a rotated, flipped piece splits it where the user drew it', () => {
    const placement = { position: { x: 40, y: 30 }, rotationDeg: 37, flipped: true };
    const polygon = rect(30, 88);
    // The user draws a line in design space straight through the piece's centre.
    const from = designToLocal(placement, { x: 0, y: 30 });
    const to = designToLocal(placement, { x: 80, y: 30 });
    const parts = cutPolygon(polygon, from, to);
    expect(parts).not.toBeNull();
    const [a, b] = parts!;
    expect(polygonArea(a) + polygonArea(b)).toBeCloseTo(2_640);
    // A line through the centre of a rectangle splits it in half.
    expect(polygonArea(a)).toBeCloseTo(1_320);
  });
});

describe('P2 · hit testing', () => {
  test('a point inside, outside and beyond a square', () => {
    const square = rect(10, 10);
    expect(pointInPolygon({ x: 0, y: 0 }, square)).toBe(true);
    expect(pointInPolygon({ x: 4.9, y: -4.9 }, square)).toBe(true);
    expect(pointInPolygon({ x: 6, y: 0 }, square)).toBe(false);
    expect(pointInPolygon({ x: 0, y: -20 }, square)).toBe(false);
  });

  test('a point inside a triangle but outside its bounding box corner', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon({ x: 2, y: 2 }, triangle)).toBe(true);
    expect(pointInPolygon({ x: 8, y: 8 }, triangle)).toBe(false);
  });

  test('finds the placed piece under a point, and nothing on empty canvas', () => {
    // In skirt layout A, second-panel is a 20 × 20 square centred at (90, 35).
    const pieces = preset('skirt-a').pieces;
    expect(pieceAt(pieces, { x: 90, y: 35 })?.id).toBe('second-panel');
    expect(pieceAt(pieces, { x: 99, y: 44 })?.id).toBe('second-panel');
    expect(pieceAt(pieces, { x: 115, y: 75 })).toBeNull();
  });

  test('pieces in the tray are never hit', () => {
    const pieces = preset('skirt-a').pieces.map((p) =>
      p.id === 'second-panel' ? { ...p, status: 'tray' as const } : p,
    );
    expect(pieceAt(pieces, { x: 90, y: 35 })).toBeNull();
  });

  test('the piece drawn on top wins where two overlap', () => {
    const pieces = preset('skirt-a').pieces.map((p) =>
      p.id === 'jeans-pocket-l' ? { ...p, position: { x: 90, y: 35 } } : p,
    );
    const top = pieces.filter((p) => p.status === 'canvas').at(-1)!;
    expect(pieceAt(pieces, { x: 90, y: 35 })?.id).toBe(top.id);
  });

  test('a rotated piece is hit along its turned outline', () => {
    const pieces = preset('skirt-a').pieces.map((p) =>
      p.id === 'jeans-yoke-l' ? { ...p, rotationDeg: 90 } : p,
    );
    const yoke = pieces.find((p) => p.id === 'jeans-yoke-l')!;
    const outline = pieceToDesign(yoke);
    const ys = outline.map((p) => p.y);
    // Just inside the bottom of the turned yoke.
    const point = { x: yoke.position.x, y: Math.max(...ys) - 0.5 };
    expect(pieceAt(pieces, point)?.id).toBe('jeans-yoke-l');
  });
});

describe('P2 · drawn cut lines', () => {
  const square = rect(10, 10);

  test('a line drawn all the way across counts', () => {
    expect(segmentCrossesPolygon(square, { x: 0, y: -8 }, { x: 0, y: 8 })).toBe(true);
    expect(segmentCrossesPolygon(square, { x: -8, y: -7 }, { x: 8, y: 6 })).toBe(true);
  });

  test('a line that stops inside the piece does not count', () => {
    expect(segmentCrossesPolygon(square, { x: 0, y: -8 }, { x: 0, y: 2 })).toBe(false);
    expect(segmentCrossesPolygon(square, { x: -2, y: 0 }, { x: 2, y: 0 })).toBe(false);
  });

  test('a line beside the piece does not count, even if its extension would cross it', () => {
    expect(segmentCrossesPolygon(square, { x: 0, y: -20 }, { x: 0, y: -8 })).toBe(false);
  });
});
