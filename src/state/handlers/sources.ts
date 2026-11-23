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
    case 'ADD_GARMENT': {
      const { source, pieces } = action;
      if (
        source.type === 'scrap' ||
        project.sources.some((existing) => existing.type === source.type)
      ) {
        return project;
      }

      return {
        ...project,
        sources: [...project.sources, source],
        pieces: [
          ...project.pieces,
          ...pieces.map((piece) => ({ ...piece, status: 'tray' as const })),
        ],
      };
    }
    case 'ADD_SCRAP':
      return {
        ...project,
        sources: [...project.sources, action.source],
        pieces: [...project.pieces, action.piece],
      };
    case 'SELECT_MODE': {
      const current = project.mode;
      const next = action.mode;
      if (current?.kind === 'freestyle' && next.kind === 'freestyle') return project;
      if (
        current?.kind === 'pattern' &&
        next.kind === 'pattern' &&
        current.patternId === next.patternId
      ) {
        return project;
      }
      return { ...project, mode: next };
    }
  }
}
