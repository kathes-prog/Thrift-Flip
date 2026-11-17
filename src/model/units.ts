/**
 * Shared contract: geometry units.
 *
 * All geometry is stored in DESIGN UNITS, which are centimetres. A polygon's
 * area in design units² is therefore its area in cm². Convert to screen points
 * only when rendering or reading gestures (see src/geometry/transform.ts).
 *
 * Keep full precision internally; round only for display (formatArea).
 */

export type Cm = number;
export type Cm2 = number;

export interface Point {
  x: Cm;
  y: Cm;
}

/** Closed polygon, vertices in order, last vertex NOT repeated. */
export type Polygon = Point[];

/** Rectangle polygon centred on the origin. Handy for fixtures. */
export function rect(widthCm: Cm, heightCm: Cm): Polygon {
  const w = widthCm / 2;
  const h = heightCm / 2;
  return [
    { x: -w, y: -h },
    { x: w, y: -h },
    { x: w, y: h },
    { x: -w, y: h },
  ];
}

/** Display-only rounding, e.g. 11856 -> "11,856 cm²". */
export function formatArea(areaCm2: Cm2): string {
  return `${Math.round(areaCm2).toLocaleString('en-US')} cm²`;
}
