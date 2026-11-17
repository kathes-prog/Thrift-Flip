/**
 * Owner: P2. Pure functions only: no React, no screen units.
 */
import type { Cm2, Polygon } from '@/model/units';
import { todo } from '@/todo';

/** Unsigned area of a simple polygon in cm² (shoelace formula). */
export function polygonArea(polygon: Polygon): Cm2 {
  return todo('P2', 'polygonArea');
}
