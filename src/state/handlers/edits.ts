/**
 * Owner: P2 (2D editor and touch).
 *
 * Rules (build plan):
 * - Placement and orientation never change a piece's areaCm2.
 * - MOVE_PIECE is committed once on gesture release.
 * - CUT_PIECE: convert the endpoints to the piece's local coordinates
 *   (geometry/transform.ts), cut with geometry/cut.ts. The drawn line must
 *   start and end outside the piece. If the cut is invalid,
 *   return the project unchanged (the UI shows "draw across the piece").
 *   If valid, replace the parent with two fragments in ONE edit:
 *     - ids from action.fragmentIds
 *     - same status, sourceId, originalPieceId, color as the parent
 *     - areaCm2 = parent.areaCm2 × (fragment polygon area / parent polygon area)
 *
 * - MOVE_PIECE moves every piece stitched to it by the same amount.
 * - RESIZE_PIECE scales the outline about the piece's centre; area × factor².
 * - STITCH_PIECES / UNSTITCH_PIECE set or clear groupId (canvas pieces only).
 *
 * Return the SAME project object when nothing changes.
 */
import { polygonArea } from '@/geometry/area';
import { cutPolygon } from '@/geometry/cut';
import { segmentCrossesPolygon } from '@/geometry/hitTest';
import { designToLocal } from '@/geometry/transform';
import type { FabricPiece, Project } from '@/model/types';

import type {
  CutPieceAction,
  EditAction,
  MovePieceAction,
  ResizePieceAction,
  StitchPiecesAction,
  UnstitchPieceAction,
} from '../actions';

/** A resize that would leave a piece smaller than this (cm²) is rejected. */
const MIN_AREA_CM2 = 1;

export function handleEditAction(project: Project, action: EditAction): Project {
  switch (action.type) {
    case 'MOVE_PIECE':
      return movePiece(project, action);
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
    case 'RESIZE_PIECE':
      return resizePiece(project, action);
    case 'STITCH_PIECES':
      return stitchPieces(project, action);
    case 'UNSTITCH_PIECE':
      return unstitchPiece(project, action);
  }
}

/** Move a piece, and every piece stitched to it by the same amount. */
function movePiece(project: Project, action: MovePieceAction): Project {
  const piece = project.pieces.find((p) => p.id === action.pieceId);
  if (!piece) return project;
  const dx = action.position.x - piece.position.x;
  const dy = action.position.y - piece.position.y;
  if (dx === 0 && dy === 0) return project;
  const moves = (p: FabricPiece) =>
    p.id === piece.id || (piece.groupId !== undefined && p.groupId === piece.groupId);
  return {
    ...project,
    pieces: project.pieces.map((p) =>
      moves(p) ? { ...p, position: { x: p.position.x + dx, y: p.position.y + dy } } : p,
    ),
  };
}

function resizePiece(project: Project, action: ResizePieceAction): Project {
  const { factor } = action;
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return project;
  return updatePiece(project, action.pieceId, (piece) => {
    const areaCm2 = piece.areaCm2 * factor * factor;
    if (areaCm2 < MIN_AREA_CM2) return piece;
    // Local coordinates are centred on the piece, so scaling them keeps it in place.
    const polygon = piece.polygon.map((p) => ({ x: p.x * factor, y: p.y * factor }));
    return { ...piece, polygon, areaCm2 };
  });
}

function stitchPieces(project: Project, action: StitchPiecesAction): Project {
  const [aId, bId] = action.pieceIds;
  if (aId === bId) return project;
  const a = project.pieces.find((p) => p.id === aId);
  const b = project.pieces.find((p) => p.id === bId);
  if (!a || !b || a.status !== 'canvas' || b.status !== 'canvas') return project;
  if (a.groupId !== undefined && a.groupId === b.groupId) return project;
  // Everything already stitched to either piece joins the new group too.
  const joins = (p: FabricPiece) =>
    p.id === aId ||
    p.id === bId ||
    (a.groupId !== undefined && p.groupId === a.groupId) ||
    (b.groupId !== undefined && p.groupId === b.groupId);
  return {
    ...project,
    pieces: project.pieces.map((p) => (joins(p) ? { ...p, groupId: action.groupId } : p)),
  };
}

function unstitchPiece(project: Project, action: UnstitchPieceAction): Project {
  const piece = project.pieces.find((p) => p.id === action.pieceId);
  if (!piece || piece.groupId === undefined) return project;
  const { groupId } = piece;
  const rest = project.pieces.filter((p) => p.id !== piece.id && p.groupId === groupId);
  // A group of one is no group: release the last piece as well.
  const release = (p: FabricPiece) => p.id === piece.id || (rest.length === 1 && p === rest[0]);
  return {
    ...project,
    pieces: project.pieces.map((p) => {
      if (!release(p)) return p;
      const { groupId: _dropped, ...loose } = p;
      return loose;
    }),
  };
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
  // The user must draw all the way across the piece, not stop inside it.
  if (!segmentCrossesPolygon(parent.polygon, from, to)) return project;
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
