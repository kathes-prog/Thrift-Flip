/**
 * Owner: P2. Pure functions only.
 *
 * First implementation: one straight line across a CONVEX polygon, in the
 * polygon's own (local) coordinates.
 */
import type { Point, Polygon } from '@/model/units';

import { polygonArea } from './area';

/** Distances (cm) and areas (cm²) smaller than this count as zero. */
const EPSILON = 1e-9;

/**
 * Split `polygon` along the line through `from` and `to`.
 * Returns null when the line does not cross the polygon or when either side
 * would have zero area. Otherwise returns the two pieces.
 */
export function cutPolygon(polygon: Polygon, from: Point, to: Point): [Polygon, Polygon] | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return null;

  // Signed distance from the line: > 0 on one side, < 0 on the other, 0 on it.
  const side = (p: Point) => {
    const d = (dx * (p.y - from.y) - dy * (p.x - from.x)) / length;
    return Math.abs(d) < EPSILON ? 0 : d;
  };

  const left: Point[] = [];
  const right: Point[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const sa = side(a);
    const sb = side(b);

    // A vertex exactly on the line belongs to both sides.
    if (sa >= 0) left.push(a);
    if (sa <= 0) right.push(a);

    // The edge crosses the line strictly between a and b.
    if ((sa > 0 && sb < 0) || (sa < 0 && sb > 0)) {
      const t = sa / (sa - sb);
      const crossing = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
      left.push(crossing);
      right.push(crossing);
    }
  }

  const valid = (part: Point[]) => part.length >= 3 && polygonArea(part) > EPSILON;
  return valid(left) && valid(right) ? [left, right] : null;
}
