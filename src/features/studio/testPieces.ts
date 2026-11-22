/**
 * Owner: P2. TEMPORARY stand-ins until P1's intake and tracker are built.
 *
 * - testPieceProject(): the sample jeans + second garment inventory, so the
 *   Studio has fabric pieces to try every tool on. Loaded only when the
 *   project has no pieces at all, so real imports are never replaced.
 * - fallbackTotals(): sheet numbers worked out from the pieces themselves,
 *   used only while P1's selectTracker() still returns zeros.
 *
 * TODO(P1/P2): delete this file once intake and selectTracker() work.
 */
import { presets } from '@/fixtures/presets';
import type { Project } from '@/model/types';
import type { TrackerTotals } from '@/state/selectors';

export function testPieceProject(current: Project): Project | null {
  const preset = presets.find((p) => p.id === 'jeans-second');
  if (!preset) return null;
  const sample = preset.make();
  return { ...current, sources: sample.sources, pieces: sample.pieces };
}

export function fallbackTotals(project: Project): TrackerTotals {
  const sum = (status: string) =>
    project.pieces.filter((p) => p.status === status).reduce((s, p) => s + p.areaCm2, 0);
  const usedCm2 = sum('canvas');
  const storedCm2 = sum('stored');
  const availableCm2 = sum('tray') + storedCm2;
  const discardedCm2 = sum('discarded');
  const recoveredCm2 = usedCm2 + availableCm2 + discardedCm2;
  return {
    recoveredCm2,
    usedCm2,
    availableCm2,
    storedCm2,
    discardedCm2,
    percentUsed: recoveredCm2 > 0 ? (usedCm2 / recoveredCm2) * 100 : 0,
  };
}
