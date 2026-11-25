import type { GuideRegion } from '@/model/types';
import type { Point, Polygon } from '@/model/units';

const EPS = 1e-9;

function signedArea(poly: Polygon): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!,
      q = poly[(i + 1) % poly.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** > 0 when p is left of a->b (the inside, for a positive-area clip polygon) */
function side(p: Point, a: Point, b: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function intersect(s: Point, e: Point, a: Point, b: Point): Point {
  const ds = side(s, a, b);
  const de = side(e, a, b);
  const denom = ds - de;
  if (Math.abs(denom) < EPS) return e;
  const t = ds / denom;
  return { x: s.x + (e.x - s.x) * t, y: s.y + (e.y - s.y) * t };
}

function dedupe(poly: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of poly) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1e-7) out.push(p);
  }
  while (
    out.length > 1 &&
    Math.hypot(out[0]!.x - out[out.length - 1]!.x, out[0]!.y - out[out.length - 1]!.y) <= 1e-7
  )
    out.pop();
  return out;
}

export function clipToRegion(subject: Polygon, region: GuideRegion): Polygon[] {
  if (subject.length < 3 || region.polygon.length < 3) return [];

  // Normalize so the interior is always on the left of every clip edge
  const clip = signedArea(region.polygon) >= 0 ? region.polygon : [...region.polygon].reverse();

  let output: Point[] = [...subject];

  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i]!;
    const b = clip[(i + 1) % clip.length]!;
    const input = output;
    output = [];

    for (let j = 0; j < input.length; j++) {
      const cur = input[j]!;
      const prev = input[(j + input.length - 1) % input.length]!;
      const curIn = side(cur, a, b) >= -EPS;
      const prevIn = side(prev, a, b) >= -EPS;

      if (curIn) {
        if (!prevIn) output.push(intersect(prev, cur, a, b));
        output.push(cur);
      } else if (prevIn) {
        output.push(intersect(prev, cur, a, b));
      }
    }
  }

  const result = dedupe(output);
  if (result.length < 3 || Math.abs(signedArea(result)) < 1e-6) return [];
  return [result];
}
