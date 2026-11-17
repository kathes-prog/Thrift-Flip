/**
 * Owner: P1 (materials and tracking).
 *
 * Everything shown in the fabric tracker and the pattern warning is DERIVED
 * here from project state. Never store these numbers in the project.
 *
 * Build plan rules:
 * - recovered  = sum of original piece areas from all garments + scraps.
 *                A cut never adds area (fragments sum to their parent).
 * - used       = pieces on the canvas.
 * - available  = pieces in the tray + stored (stored also reported on its own).
 * - discarded  = pieces marked discarded.
 * - percentUsed = used / recovered × 100, or 0 when recovered is 0.
 * - shortage   = max(0, pattern estimate − (recovered − discarded)).
 */
import type { Pattern, Project } from '@/model/types';
import type { Cm2 } from '@/model/units';

export interface TrackerTotals {
  recoveredCm2: Cm2;
  usedCm2: Cm2;
  availableCm2: Cm2;
  storedCm2: Cm2;
  discardedCm2: Cm2;
  percentUsed: number;
}

export interface PatternFit {
  patternId: string;
  requiredCm2: Cm2;
  usableCm2: Cm2;
  shortageCm2: Cm2;
  eligible: boolean;
}

export function selectTracker(project: Project): TrackerTotals {
  // TODO(P1): stub returns zeros so screens render.
  return {
    recoveredCm2: 0,
    usedCm2: 0,
    availableCm2: 0,
    storedCm2: 0,
    discardedCm2: 0,
    percentUsed: 0,
  };
}

export function selectPatternFit(project: Project, pattern: Pattern): PatternFit {
  // TODO(P1): stub reports no shortage.
  return {
    patternId: pattern.id,
    requiredCm2: pattern.estimatedAreaCm2,
    usableCm2: 0,
    shortageCm2: 0,
    eligible: true,
  };
}
