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
import type { FabricPiece, Project } from '@/model/types';

import type { InventoryAction } from '../actions';

export function handleInventoryAction(project: Project, action: InventoryAction): Project {
  const index = project.pieces.findIndex((piece) => piece.id === action.pieceId);
  const piece = project.pieces[index];
  if (!piece) return project;

  let updatedPiece: FabricPiece;
  switch (action.type) {
    case 'PLACE_PIECE':
      if (piece.status !== 'tray') return project;
      updatedPiece = { ...piece, status: 'canvas', position: action.position };
      break;
    case 'STORE_PIECE':
      if (piece.status !== 'canvas') return project;
      updatedPiece = { ...piece, status: 'stored' };
      break;
    case 'RESTORE_PIECE':
      if (piece.status !== 'stored') return project;
      updatedPiece = { ...piece, status: 'tray' };
      break;
    case 'DISCARD_PIECE':
      if (piece.status === 'discarded') return project;
      updatedPiece = { ...piece, status: 'discarded' };
      break;
  }

  const pieces = [...project.pieces];
  pieces[index] = updatedPiece;
  return { ...project, pieces };
}
