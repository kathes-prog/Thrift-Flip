/**
 * Owner: P3. Pure functions only.
 *
 * Used by the 3D preview: take a placed piece's outline in design coordinates
 * (geometry/transform.ts pieceToDesign) and keep only the part inside a guide
 * region, so it can be mapped onto that region of the skirt.
 */
import type { GuideRegion } from '@/model/types';
import type { Polygon } from '@/model/units';
import { todo } from '@/todo';

/** Parts of `subject` that lie inside `region` (empty when they don't overlap). */
export function clipToRegion(subject: Polygon, region: GuideRegion): Polygon[] {
  return todo('P3', 'clipToRegion');
}
