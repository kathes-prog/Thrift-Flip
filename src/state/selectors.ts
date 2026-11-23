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
  let recoveredCm2 = 0;
  let usedCm2 = 0;
  let trayCm2 = 0;
  let storedCm2 = 0;
  let discardedCm2 = 0;

  for (const { areaCm2, status } of project.pieces) {
    recoveredCm2 += areaCm2;
    switch (status) {
      case 'canvas':
        usedCm2 += areaCm2;
        break;
      case 'tray':
        trayCm2 += areaCm2;
        break;
      case 'stored':
        storedCm2 += areaCm2;
        break;
      case 'discarded':
        discardedCm2 += areaCm2;
        break;
    }
  }

  return {
    recoveredCm2,
    usedCm2,
    availableCm2: trayCm2 + storedCm2,
    storedCm2,
    discardedCm2,
    percentUsed: recoveredCm2 === 0 ? 0 : (usedCm2 / recoveredCm2) * 100,
  };
}

export function selectPatternFit(project: Project, pattern: Pattern): PatternFit {
  const { recoveredCm2, discardedCm2 } = selectTracker(project);
  const requiredCm2 = pattern.estimatedAreaCm2;
  const usableCm2 = recoveredCm2 - discardedCm2;
  const shortageCm2 = Math.max(0, requiredCm2 - usableCm2);

  return {
    patternId: pattern.id,
    requiredCm2,
    usableCm2,
    shortageCm2,
    eligible: shortageCm2 === 0,
  };
}
