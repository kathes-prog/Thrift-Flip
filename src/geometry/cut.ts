/**
 * Owner: P2. Pure functions only.
 *
 * First implementation: one straight line across a CONVEX polygon, in the
 * polygon's own (local) coordinates.
 */
import type { Point, Polygon } from '@/model/units';
import { todo } from '@/todo';

/**
 * Split `polygon` along the line through `from` and `to`.
 * Returns null when the line does not cross the polygon or when either side
 * would have zero area. Otherwise returns the two pieces.
 */
export function cutPolygon(polygon: Polygon, from: Point, to: Point): [Polygon, Polygon] | null {
  return todo('P2', 'cutPolygon');
}
