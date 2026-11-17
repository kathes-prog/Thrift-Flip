/**
 * Owner: P2 (2D editor and touch).
 *
 * Rules (build plan):
 * - Placement and orientation never change a piece's areaCm2.
 * - MOVE_PIECE is committed once on gesture release.
 * - CUT_PIECE: convert the endpoints to the piece's local coordinates
 *   (geometry/transform.ts), cut with geometry/cut.ts. If the cut is invalid,
 *   return the project unchanged (the UI shows "draw across the piece").
 *   If valid, replace the parent with two fragments in ONE edit:
 *     - ids from action.fragmentIds
 *     - same status, sourceId, originalPieceId, color as the parent
 *     - areaCm2 = parent.areaCm2 × (fragment polygon area / parent polygon area)
 *
 * Return the SAME project object when nothing changes.
 */
import type { Project } from '@/model/types';

import type { EditAction } from '../actions';

export function handleEditAction(project: Project, action: EditAction): Project {
  switch (action.type) {
    case 'MOVE_PIECE':
      // TODO(P2)
      return project;
    case 'ROTATE_PIECE':
      // TODO(P2)
      return project;
    case 'FLIP_PIECE':
      // TODO(P2)
      return project;
    case 'RECOLOR_PIECE':
      // TODO(P2)
      return project;
    case 'CUT_PIECE':
      // TODO(P2)
      return project;
  }
}
