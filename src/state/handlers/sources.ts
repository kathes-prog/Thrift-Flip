/**
 * Owner: P1 (materials and tracking).
 *
 * Rules (build plan):
 * - ADD_GARMENT appends the source and its pieces, all in the tray.
 *   At most one additional garment per project.
 * - ADD_SCRAP appends one rectangular piece whose area = width × length.
 * - SELECT_MODE sets the guided pattern or Freestyle.
 *
 * Return the SAME project object when nothing changes, so no empty undo step
 * is recorded.
 */
import type { Project } from '@/model/types';

import type { SourceAction } from '../actions';

export function handleSourceAction(project: Project, action: SourceAction): Project {
  switch (action.type) {
    case 'ADD_GARMENT':
      // TODO(P1)
      return project;
    case 'ADD_SCRAP':
      // TODO(P1)
      return project;
    case 'SELECT_MODE':
      // TODO(P1)
      return project;
  }
}
