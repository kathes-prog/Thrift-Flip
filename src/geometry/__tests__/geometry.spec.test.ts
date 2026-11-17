/** Owner: P2 · geometry with known inputs. Remove `.skip` as each part is built. */
import { polygonArea } from '@/geometry/area';
import { cutPolygon } from '@/geometry/cut';
import { designToLocal, designToScreen, localToDesign, screenToDesign } from '@/geometry/transform';
import { rect } from '@/model/units';
import { shoelace } from '@/testUtils';

describe.skip('P2 · area', () => {
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

describe.skip('P2 · transforms', () => {
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

describe.skip('P2 · straight cut', () => {
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
