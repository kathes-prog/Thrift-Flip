/**
 * Owner: P2. Pure functions only.
 *
 * Which piece is under the user's finger. Points are in DESIGN coordinates (cm);
 * convert screen touches with screenToDesign() first.
 */
import type { FabricPiece } from '@/model/types';
import type { Point, Polygon } from '@/model/units';

import { pieceToDesign } from './transform';

/** True when `point` is inside `polygon` (ray casting; works for any simple polygon). */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/**
 * The top-most piece on the canvas under `point`, or null. Later pieces in the
 * list are drawn on top, so they are checked first.
 */
export function pieceAt(pieces: readonly FabricPiece[], point: Point): FabricPiece | null {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i]!;
    if (piece.status === 'canvas' && pointInPolygon(point, pieceToDesign(piece))) return piece;
  }
  return null;
}

/** Which side of the line a→b point p is on: > 0, < 0, or 0 when on it. */
function orient(a: Point, b: Point, p: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** True when segments p1–p2 and q1–q2 cross at a single interior point. */
function segmentsCross(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const d1 = orient(q1, q2, p1);
  const d2 = orient(q1, q2, p2);
  const d3 = orient(p1, p2, q1);
  const d4 = orient(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/**
 * True when the segment from → to is drawn all the way across the polygon:
 * it starts and ends outside the outline and crosses at least one edge.
 * A stroke that stops inside the piece, or misses it, is not a cut.
 */
export function segmentCrossesPolygon(polygon: Polygon, from: Point, to: Point): boolean {
  if (pointInPolygon(from, polygon) || pointInPolygon(to, polygon)) return false;
  return polygon.some((a, i) => segmentsCross(from, to, a, polygon[(i + 1) % polygon.length]!));
}
