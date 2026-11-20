/**
 * Owner: P2. Pure functions only: no React, no screen units.
 */
import type { Cm2, Polygon } from '@/model/units';

/** Unsigned area of a simple polygon in cm² (shoelace formula). */
export function polygonArea(polygon: Polygon): Cm2 {
  let twiceArea = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    twiceArea += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twiceArea) / 2;
}
