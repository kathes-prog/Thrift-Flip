/** Test helpers shared by spec files. Not imported by app code. */
import { presets } from '@/fixtures/presets';
import type { Project } from '@/model/types';
import type { Polygon } from '@/model/units';
import type { ProjectAction } from '@/state/actions';
import { applyProjectAction } from '@/state/reducer';

export function preset(id: string): Project {
  const found = presets.find((p) => p.id === id);
  if (!found) throw new Error(`No preset "${id}"`);
  return found.make();
}

export function applyAll(project: Project, ...actions: ProjectAction[]): Project {
  return actions.reduce(applyProjectAction, project);
}

/** Independent shoelace area, so tests don't depend on the code under test. */
export function shoelace(polygon: Polygon): number {
  let sum = 0;
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!;
    sum += p.x * q.y - q.x * p.y;
  });
  return Math.abs(sum) / 2;
}
