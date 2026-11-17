/**
 * Owner: P1 (materials and tracking).
 *
 * Rules (build plan):
 * - Each piece id has exactly one status: tray | canvas | stored | discarded.
 * - PLACE_PIECE applies only to eligible tray pieces. Anything else (already on
 *   the canvas, stored, discarded, unknown id — e.g. a "third" jeans pocket)
 *   is rejected by returning the project unchanged.
 * - STORE_PIECE: canvas -> stored. RESTORE_PIECE: stored -> tray.
 * - DISCARD_PIECE: -> discarded; only Undo brings it back.
 * - Invariant after every action: used + available + discarded = recovered.
 *
 * Return the SAME project object when nothing changes.
 */
import type { Project } from '@/model/types';

import type { InventoryAction } from '../actions';

export function handleInventoryAction(project: Project, action: InventoryAction): Project {
  switch (action.type) {
    case 'PLACE_PIECE':
      // TODO(P1)
      return project;
    case 'STORE_PIECE':
      // TODO(P1)
      return project;
    case 'RESTORE_PIECE':
      // TODO(P1)
      return project;
    case 'DISCARD_PIECE':
      // TODO(P1)
      return project;
  }
}
