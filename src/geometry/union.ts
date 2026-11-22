/**
 * Owner: P2. Pure functions only.
 *
 * Outline of two overlapping polygons joined into one (Greiner–Hormann
 * union). Used by Stitch: the two pieces must overlap where they're sewn.
 */
import type { Point, Polygon } from '@/model/units';

import { polygonArea } from './area';
import { pointInPolygon } from './hitTest';

const EPSILON = 1e-9;
/** Tiny shifts (cm) tried when the outlines touch exactly at a corner or along an edge. */
const NUDGES: Point[] = [
  { x: 0, y: 0 },
  { x: 1e-4, y: 2e-4 },
  { x: -2e-4, y: 1e-4 },
  { x: 3e-4, y: -1e-4 },
];

interface Node {
  x: number;
  y: number;
  intersection: boolean;
  /** Position along the edge this node sits on (intersections only). */
  alpha: number;
  neighbor: Node | null;
  /** Moving forward from here goes inside the other polygon. */
  entry: boolean;
  visited: boolean;
  next: Node;
  prev: Node;
}

function node(p: Point, intersection = false, alpha = 0): Node {
  const n = {
    x: p.x,
    y: p.y,
    intersection,
    alpha,
    neighbor: null,
    entry: false,
    visited: false,
  } as unknown as Node;
  n.next = n;
  n.prev = n;
  return n;
}

/** Thrown when the outlines touch exactly, so the caller can nudge and retry. */
class Degenerate extends Error {}

interface Crossing {
  i: number;
  j: number;
  t: number;
  u: number;
  point: Point;
}

function crossings(a: Polygon, b: Polygon): Crossing[] {
  const out: Crossing[] = [];
  for (let i = 0; i < a.length; i++) {
    const p1 = a[i]!;
    const p2 = a[(i + 1) % a.length]!;
    for (let j = 0; j < b.length; j++) {
      const q1 = b[j]!;
      const q2 = b[(j + 1) % b.length]!;
      const rx = p2.x - p1.x;
      const ry = p2.y - p1.y;
      const sx = q2.x - q1.x;
      const sy = q2.y - q1.y;
      const denom = rx * sy - ry * sx;
      const qpx = q1.x - p1.x;
      const qpy = q1.y - p1.y;
      if (Math.abs(denom) < EPSILON) {
        // Parallel: only a problem when the edges lie on the same line.
        if (Math.abs(qpx * ry - qpy * rx) < EPSILON) {
          const len2 = rx * rx + ry * ry || 1;
          const t0 = (qpx * rx + qpy * ry) / len2;
          const t1 = ((q2.x - p1.x) * rx + (q2.y - p1.y) * ry) / len2;
          if (Math.max(t0, t1) >= -EPSILON && Math.min(t0, t1) <= 1 + EPSILON) {
            throw new Degenerate();
          }
        }
        continue;
      }
      const t = (qpx * sy - qpy * sx) / denom;
      const u = (qpx * ry - qpy * rx) / denom;
      if (t < -EPSILON || t > 1 + EPSILON || u < -EPSILON || u > 1 + EPSILON) continue;
      if (t < EPSILON || t > 1 - EPSILON || u < EPSILON || u > 1 - EPSILON) throw new Degenerate();
      out.push({ i, j, t, u, point: { x: p1.x + t * rx, y: p1.y + t * ry } });
    }
  }
  return out;
}

/** Build a circular list of a polygon's vertices with the crossings slotted into their edges. */
function buildList(polygon: Polygon, onEdge: (edge: number) => Node[]): Node {
  const nodes: Node[] = [];
  polygon.forEach((p, edge) => {
    nodes.push(node(p));
    nodes.push(...onEdge(edge).sort((m, n) => m.alpha - n.alpha));
  });
  nodes.forEach((n, k) => {
    n.next = nodes[(k + 1) % nodes.length]!;
    n.prev = nodes[(k - 1 + nodes.length) % nodes.length]!;
  });
  return nodes[0]!;
}

function markEntries(start: Node, other: Polygon) {
  let inside = pointInPolygon(start, other);
  let n = start;
  do {
    if (n.intersection) {
      n.entry = !inside;
      inside = !inside;
    }
    n = n.next;
  } while (n !== start);
}

function tryUnion(a: Polygon, b: Polygon): Polygon | null {
  const found = crossings(a, b);

  if (found.length === 0) {
    // No crossing edges: one contains the other, or they don't touch at all.
    if (pointInPolygon(a[0]!, b)) return [...b];
    if (pointInPolygon(b[0]!, a)) return [...a];
    return null;
  }

  const pairs = found.map((c) => {
    const na = node(c.point, true, c.t);
    const nb = node(c.point, true, c.u);
    na.neighbor = nb;
    nb.neighbor = na;
    return { c, na, nb };
  });
  const startA = buildList(a, (edge) => pairs.filter((p) => p.c.i === edge).map((p) => p.na));
  const startB = buildList(b, (edge) => pairs.filter((p) => p.c.j === edge).map((p) => p.nb));
  markEntries(startA, b);
  markEntries(startB, a);

  // Walk the parts of each outline that lie outside the other one.
  const loops: Polygon[] = [];
  for (const { na } of pairs) {
    if (na.visited) continue;
    const loop: Point[] = [];
    let current: Node = na;
    let guard = 0;
    do {
      current.visited = true;
      if (current.neighbor) current.neighbor.visited = true;
      const forward = !current.entry;
      do {
        loop.push({ x: current.x, y: current.y });
        current = forward ? current.next : current.prev;
        if (++guard > 10_000) return null;
      } while (!current.intersection);
      current = current.neighbor!;
    } while (!current.visited);
    loops.push(loop);
  }

  // Holes come out as extra loops; the outline is the biggest one.
  const outline = loops.reduce<Polygon | null>(
    (best, loop) => (!best || polygonArea(loop) > polygonArea(best) ? loop : best),
    null,
  );
  if (!outline || outline.length < 3) return null;
  if (polygonArea(outline) + EPSILON < Math.max(polygonArea(a), polygonArea(b))) return null;
  return outline;
}

/**
 * The outline of `a` and `b` joined together, or null when they don't overlap
 * (two separate shapes can't become one piece).
 */
export function unionPolygons(a: Polygon, b: Polygon): Polygon | null {
  if (a.length < 3 || b.length < 3) return null;
  for (const nudge of NUDGES) {
    try {
      return tryUnion(
        a,
        b.map((p) => ({ x: p.x + nudge.x, y: p.y + nudge.y })),
      );
    } catch (e) {
      if (!(e instanceof Degenerate)) throw e;
    }
  }
  return null;
}
