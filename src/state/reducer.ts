/**
 * Shared: root reducer with undo history.
 *
 * Routes each ProjectAction to its owner's handler. Any action whose handler
 * returns a NEW project object becomes one undo step; returning the same
 * object (a rejected or no-op action) records nothing.
 */
import type { Project } from '@/model/types';

import type { AppAction, ProjectAction } from './actions';
import { handleEditAction } from './handlers/edits';
import { handleInventoryAction } from './handlers/inventory';
import { handleSourceAction } from './handlers/sources';

export const MAX_HISTORY = 100;

export interface HistoryState {
  past: Project[];
  present: Project;
}

export type ApplyAction = (project: Project, action: ProjectAction) => Project;

export function applyProjectAction(project: Project, action: ProjectAction): Project {
  switch (action.type) {
    case 'ADD_GARMENT':
    case 'ADD_SCRAP':
    case 'SELECT_MODE':
      return handleSourceAction(project, action);
    case 'PLACE_PIECE':
    case 'STORE_PIECE':
    case 'RESTORE_PIECE':
    case 'DISCARD_PIECE':
      return handleInventoryAction(project, action);
    case 'MOVE_PIECE':
    case 'ROTATE_PIECE':
    case 'FLIP_PIECE':
    case 'RECOLOR_PIECE':
    case 'CUT_PIECE':
      return handleEditAction(project, action);
  }
}

/** Factory so tests can inject a fake applyAction while handlers are still stubs. */
export function createRootReducer(apply: ApplyAction = applyProjectAction) {
  return function rootReducer(state: HistoryState, action: AppAction): HistoryState {
    switch (action.type) {
      case 'LOAD_PROJECT':
        return { past: [], present: action.project };
      case 'UNDO': {
        const previous = state.past.at(-1);
        if (!previous) return state;
        return { past: state.past.slice(0, -1), present: previous };
      }
      default: {
        const next = apply(state.present, action);
        if (next === state.present) return state;
        return { past: [...state.past, state.present].slice(-MAX_HISTORY), present: next };
      }
    }
  };
}

export const rootReducer = createRootReducer();

export function initHistory(project: Project): HistoryState {
  return { past: [], present: project };
}
