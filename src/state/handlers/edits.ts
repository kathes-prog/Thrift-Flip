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
 * - Each fragment records its parent and its sibling (cutFrom), so
 *   UNCUT_PIECE can join the two halves back any time later.
 * - UNCUT_PIECE restores the parent where the chosen half is now and removes
 *   the other half. Rejected when the other half was cut again, stitched or
 *   discarded.
 * - FLIP_PIECE mirrors the piece as seen on screen (horizontal or vertical).
 * - STITCH_PIECES joins two overlapping canvas pieces into one piece
 *   (outline = union, area = sum). Rejected when they don't overlap.
 * - RETURN_PIECE sends a canvas piece back to the tray (Discard in the Studio).
 * - CLEAR_CANVAS sends every canvas piece back to the tray (Reset in the Studio).
 *
 * Return the SAME project object when nothing changes.
 */
import { polygonArea } from '@/geometry/area';
import { cutPolygon } from '@/geometry/cut';
import { segmentCrossesPolygon } from '@/geometry/hitTest';
import { designToLocal, pieceToDesign } from '@/geometry/transform';
import { unionPolygons } from '@/geometry/union';
import type { FabricPiece, Project } from '@/model/types';

import type {
  CutPieceAction,
  EditAction,
  FlipPieceAction,
  StitchPiecesAction,
  UncutPieceAction,
} from '../actions';

export function handleEditAction(project: Project, action: EditAction): Project {
  switch (action.type) {
    case 'MOVE_PIECE': {
      const { x, y } = action.position;
      return updatePiece(project, action.pieceId, (piece) =>
        piece.position.x === x && piece.position.y === y ? piece : { ...piece, position: { x, y } },
      );
    }
    case 'ROTATE_PIECE': {
      const rotationDeg = normalizeDegrees(action.rotationDeg);
      return updatePiece(project, action.pieceId, (piece) =>
        piece.rotationDeg === rotationDeg ? piece : { ...piece, rotationDeg },
      );
    }
    case 'FLIP_PIECE':
      return flipPiece(project, action);
    case 'RECOLOR_PIECE':
      return updatePiece(project, action.pieceId, (piece) =>
        piece.color === action.color ? piece : { ...piece, color: action.color },
      );
    case 'CUT_PIECE':
      return cutPiece(project, action);
    case 'UNCUT_PIECE':
      return uncutPiece(project, action);
    case 'STITCH_PIECES':
      return stitchPieces(project, action);
    case 'RETURN_PIECE':
      return updatePiece(project, action.pieceId, (piece) =>
        piece.status === 'canvas' ? { ...piece, status: 'tray' } : piece,
      );
    case 'CLEAR_CANVAS':
      if (!project.pieces.some((piece) => piece.status === 'canvas')) return project;
      return {
        ...project,
        pieces: project.pieces.map((piece) =>
          piece.status === 'canvas' ? { ...piece, status: 'tray' } : piece,
        ),
      };
  }
}

/**
 * Mirror the piece on screen. The model only mirrors across the piece's own
 * vertical axis (before rotation), so a screen mirror becomes:
 *   left-right: flipped toggles, rotation r -> -r
 *   upside-down: flipped toggles, rotation r -> 180 - r
 */
function flipPiece(project: Project, action: FlipPieceAction): Project {
  return updatePiece(project, action.pieceId, (piece) => ({
    ...piece,
    flipped: !piece.flipped,
    rotationDeg: normalizeDegrees(
      action.axis === 'horizontal' ? -piece.rotationDeg : 180 - piece.rotationDeg,
    ),
  }));
}

function stitchPieces(project: Project, action: StitchPiecesAction): Project {
  const [aId, bId] = action.pieceIds;
  if (aId === bId) return project;
  const a = project.pieces.find((p) => p.id === aId);
  const b = project.pieces.find((p) => p.id === bId);
  if (!a || !b || a.status !== 'canvas' || b.status !== 'canvas') return project;

  const outline = unionPolygons(pieceToDesign(a), pieceToDesign(b));
  if (!outline) return project;

  // The joined piece starts unrotated, centred on its own bounding box.
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  const centre = {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
  const merged: FabricPiece = {
    ...withoutCutFrom(a),
    id: action.mergedId,
    displayName: `${a.displayName} + ${b.displayName}`,
    category: 'panel',
    polygon: outline.map((p) => ({ x: p.x - centre.x, y: p.y - centre.y })),
    areaCm2: a.areaCm2 + b.areaCm2,
    position: centre,
    rotationDeg: 0,
    flipped: false,
  };

  // The joined piece takes the first piece's place in the drawing order.
  const pieces = project.pieces.filter((p) => p.id !== bId).map((p) => (p === a ? merged : p));
  return { ...project, pieces };
}

/** Keep angles in [0, 360) so 450° and 90° are the same rotation. */
function normalizeDegrees(deg: number): number {
  const d = deg % 360;
  // `+ 0` turns -0 into 0.
  return d < 0 ? d + 360 : d + 0;
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
    cutFrom: { parent, siblingId: action.fragmentIds[1 - i]! },
  }));

  // Fragments take the parent's place in the list, so drawing order doesn't change.
  const pieces = [...project.pieces];
  pieces.splice(index, 1, ...fragments);
  return { ...project, pieces };
}

/**
 * The chosen half's other half, when the two can still be joined back:
 * it must still exist (not cut again or stitched) and not be discarded.
 */
export function uncutPartner(project: Project, piece: FabricPiece): FabricPiece | null {
  if (!piece.cutFrom) return null;
  const { siblingId } = piece.cutFrom;
  const sibling = project.pieces.find((p) => p.id === siblingId);
  return sibling && sibling.status !== 'discarded' ? sibling : null;
}

function uncutPiece(project: Project, action: UncutPieceAction): Project {
  const index = project.pieces.findIndex((p) => p.id === action.pieceId);
  const piece = project.pieces[index];
  if (!piece?.cutFrom) return project;
  const sibling = uncutPartner(project, piece);
  if (!sibling) return project;

  // The halves keep the parent's local coordinates, so the parent drawn with
  // this half's placement covers this half exactly and adds the other half
  // back on in its original spot.
  const restored: FabricPiece = {
    ...piece.cutFrom.parent,
    position: piece.position,
    rotationDeg: piece.rotationDeg,
    flipped: piece.flipped,
    status: piece.status,
  };
  const pieces = project.pieces
    .map((p, i) => (i === index ? restored : p))
    .filter((p) => p.id !== sibling.id);
  return { ...project, pieces };
}

function withoutCutFrom(piece: FabricPiece): FabricPiece {
  const copy = { ...piece };
  delete copy.cutFrom;
  return copy;
}
