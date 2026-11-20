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
