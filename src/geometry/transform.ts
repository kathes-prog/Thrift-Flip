/**
 * Owner: P2. Pure functions only.
 *
 * Coordinate systems:
 * - LOCAL:  a piece's own polygon coordinates (cm), before flip/rotate/move.
 * - DESIGN: the guide canvas (cm). Pattern regions live here.
 * - SCREEN: points on the phone. Only rendering and gestures use these.
 *
 * Local -> design order: flip across local x = 0, rotate by rotationDeg
 * (clockwise, around the local origin), then translate by position.
 *
 * P3's clipping builds on pieceToDesign().
 */
import type { FabricPiece } from '@/model/types';
import type { Point, Polygon } from '@/model/units';

type Placement = Pick<FabricPiece, 'position' | 'rotationDeg' | 'flipped'>;

/** How the design canvas is drawn on screen: screen = design × scale + offset. */
export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Rotate around the origin. With y pointing down, a positive angle turns
 * clockwise on screen.
 */
function rotate(point: Point, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

export function localToDesign(placement: Placement, point: Point): Point {
  const flipped = placement.flipped ? { x: -point.x, y: point.y } : point;
  const turned = rotate(flipped, placement.rotationDeg);
  return { x: turned.x + placement.position.x, y: turned.y + placement.position.y };
}

/** Exact inverse of localToDesign: un-move, un-rotate, then un-flip. */
export function designToLocal(placement: Placement, point: Point): Point {
  const moved = { x: point.x - placement.position.x, y: point.y - placement.position.y };
  const turned = rotate(moved, -placement.rotationDeg);
  return placement.flipped ? { x: -turned.x, y: turned.y } : turned;
}

/** The piece's outline in design coordinates. */
export function pieceToDesign(piece: Pick<FabricPiece, 'polygon'> & Placement): Polygon {
  return piece.polygon.map((point) => localToDesign(piece, point));
}

export function designToScreen(viewport: Viewport, point: Point): Point {
  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  };
}

export function screenToDesign(viewport: Viewport, point: Point): Point {
  return {
    x: (point.x - viewport.offsetX) / viewport.scale,
    y: (point.y - viewport.offsetY) / viewport.scale,
  };
}
