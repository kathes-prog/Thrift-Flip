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
import { todo } from '@/todo';

type Placement = Pick<FabricPiece, 'position' | 'rotationDeg' | 'flipped'>;

/** How the design canvas is drawn on screen: screen = design × scale + offset. */
export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function localToDesign(placement: Placement, point: Point): Point {
  return todo('P2', 'localToDesign');
}

export function designToLocal(placement: Placement, point: Point): Point {
  return todo('P2', 'designToLocal');
}

/** The piece's outline in design coordinates. */
export function pieceToDesign(piece: Pick<FabricPiece, 'polygon'> & Placement): Polygon {
  return todo('P2', 'pieceToDesign');
}

export function designToScreen(viewport: Viewport, point: Point): Point {
  return todo('P2', 'designToScreen');
}

export function screenToDesign(viewport: Viewport, point: Point): Point {
  return todo('P2', 'screenToDesign');
}
