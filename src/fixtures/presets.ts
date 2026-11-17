/**
 * Shared fixture: whole-project presets for independent testing.
 *
 * Loaded from the dev/fixtures screen with LOAD_PROJECT, so each owner can
 * test their area without waiting for the others' screens.
 */
import { SCHEMA_VERSION, type FabricPiece, type Project } from '@/model/types';

import { jeansSource, makeJeansPieces } from './jeans';
import { SKIRT_ID } from './patterns';
import {
  demoScrapSource,
  makeDemoScrapPiece,
  makeSecondGarmentPieces,
  secondGarmentSource,
} from './secondGarment';

export function emptyProject(): Project {
  return {
    id: 'project-local',
    schemaVersion: SCHEMA_VERSION,
    sources: [],
    pieces: [],
    mode: null,
  };
}

function withJeans(): Project {
  return { ...emptyProject(), sources: [jeansSource], pieces: makeJeansPieces() };
}

function withBothGarments(): Project {
  const p = withJeans();
  return {
    ...p,
    sources: [...p.sources, secondGarmentSource],
    pieces: [...p.pieces, ...makeSecondGarmentPieces()],
  };
}

function place(pieces: FabricPiece[], id: string, x: number, y: number, color?: string) {
  return pieces.map((piece) =>
    piece.id === id
      ? { ...piece, status: 'canvas' as const, position: { x, y }, color: color ?? piece.color }
      : piece,
  );
}

/** P3: two skirt layouts with both denim shades, to check that 3D follows 2D changes. */
function skirtLayout(variant: 'A' | 'B'): Project {
  const p = withBothGarments();
  let pieces = p.pieces;
  if (variant === 'A') {
    pieces = place(pieces, 'jeans-pocket-l', 30, 35);
    pieces = place(pieces, 'jeans-yoke-l', 30, 15);
    pieces = place(pieces, 'second-panel', 90, 35);
  } else {
    pieces = place(pieces, 'jeans-pocket-l', 22, 45);
    pieces = place(pieces, 'jeans-yoke-l', 90, 15);
    pieces = place(pieces, 'second-panel', 95, 45, '#6D8FBF');
  }
  return { ...p, pieces, mode: { kind: 'pattern', patternId: SKIRT_ID } };
}

export interface Preset {
  id: string;
  label: string;
  owner: 'P1' | 'P2' | 'P3' | 'Shared';
  make: () => Project;
}

export const presets: Preset[] = [
  { id: 'empty', label: 'Empty project', owner: 'Shared', make: emptyProject },
  { id: 'jeans', label: 'Original jeans only (11,856 cm²)', owner: 'P1', make: withJeans },
  {
    id: 'jeans-second',
    label: 'Jeans + second garment (12,456 cm²)',
    owner: 'P1',
    make: withBothGarments,
  },
  {
    id: 'jeans-scrap',
    label: 'Jeans + 30 × 30 cm scrap (12,756 cm²)',
    owner: 'P1',
    make: () => {
      const p = withJeans();
      return {
        ...p,
        sources: [...p.sources, demoScrapSource],
        pieces: [...p.pieces, makeDemoScrapPiece()],
      };
    },
  },
  {
    id: 'studio-both',
    label: 'Studio: skirt guide, both garments in tray',
    owner: 'P2',
    make: () => ({ ...withBothGarments(), mode: { kind: 'pattern', patternId: SKIRT_ID } }),
  },
  {
    id: 'skirt-a',
    label: 'Skirt layout A (two shades)',
    owner: 'P3',
    make: () => skirtLayout('A'),
  },
  {
    id: 'skirt-b',
    label: 'Skirt layout B (moved + recoloured)',
    owner: 'P3',
    make: () => skirtLayout('B'),
  },
];
