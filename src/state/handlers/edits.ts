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
import { polygonArea } from '@/geometry/area';
import { cutPolygon } from '@/geometry/cut';
import { designToLocal } from '@/geometry/transform';
import type { FabricPiece, Project } from '@/model/types';

import type { CutPieceAction, EditAction } from '../actions';

export function handleEditAction(project: Project, action: EditAction): Project {
  switch (action.type) {
    case 'MOVE_PIECE':
      return updatePiece(project, action.pieceId, (piece) =>
        piece.position.x === action.position.x && piece.position.y === action.position.y
          ? piece
          : { ...piece, position: { x: action.position.x, y: action.position.y } },
      );
    case 'ROTATE_PIECE': {
      const rotationDeg = normalizeDegrees(action.rotationDeg);
      return updatePiece(project, action.pieceId, (piece) =>
        piece.rotationDeg === rotationDeg ? piece : { ...piece, rotationDeg },
      );
    }
    case 'FLIP_PIECE':
      return updatePiece(project, action.pieceId, (piece) => ({
        ...piece,
        flipped: !piece.flipped,
      }));
    case 'RECOLOR_PIECE':
      return updatePiece(project, action.pieceId, (piece) =>
        piece.color === action.color ? piece : { ...piece, color: action.color },
      );
    case 'CUT_PIECE':
      return cutPiece(project, action);
  }
}

/** Keep angles in [0, 360) so 450° and 90° are the same rotation. */
function normalizeDegrees(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/**
 * Apply `change` to one piece. Returns the same project when the piece doesn't
 * exist or `change` returns the piece unchanged, so no undo step is recorded.
 */
function updatePiece(
  project: Project,
  pieceId: string,
  change: (piece: FabricPiece) => FabricPiece,
): Project {
  const index = project.pieces.findIndex((p) => p.id === pieceId);
  const piece = project.pieces[index];
  if (!piece) return project;
  const next = change(piece);
  if (next === piece) return project;
  const pieces = [...project.pieces];
  pieces[index] = next;
  return { ...project, pieces };
}

function cutPiece(project: Project, action: CutPieceAction): Project {
  const index = project.pieces.findIndex((p) => p.id === action.pieceId);
  const parent = project.pieces[index];
  if (!parent) return project;

  // The user draws on the canvas; the cut happens in the piece's own coordinates.
  const from = designToLocal(parent, action.from);
  const to = designToLocal(parent, action.to);
  const parts = cutPolygon(parent.polygon, from, to);
  if (!parts) return project;

  const parentArea = polygonArea(parent.polygon);
  const fragments = parts.map((polygon, i): FabricPiece => ({
    // Same placement, source, colour and status: the halves stay exactly where the parent was.
    ...parent,
    id: action.fragmentIds[i]!,
    displayName: `${parent.displayName} (${i + 1}/2)`,
    category: 'fragment',
    polygon,
    areaCm2: parent.areaCm2 * (polygonArea(polygon) / parentArea),
  }));

  // Fragments take the parent's place in the list, so drawing order doesn't change.
  const pieces = [...project.pieces];
  pieces.splice(index, 1, ...fragments);
  return { ...project, pieces };
}
