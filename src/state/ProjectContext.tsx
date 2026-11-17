/**
 * Shared: the one active project, available to every screen in the stack.
 */
import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { emptyProject } from '@/fixtures/presets';
import type { Project } from '@/model/types';

import type { AppAction } from './actions';
import { initHistory, rootReducer } from './reducer';

interface ProjectContextValue {
  project: Project;
  dispatch: (action: AppAction) => void;
  canUndo: boolean;
  undo: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  children,
  initialProject,
}: {
  children: ReactNode;
  initialProject?: Project;
}) {
  const [state, dispatch] = useReducer(rootReducer, initialProject ?? emptyProject(), initHistory);

  const value = useMemo<ProjectContextValue>(
    () => ({
      project: state.present,
      dispatch,
      canUndo: state.past.length > 0,
      undo: () => dispatch({ type: 'UNDO' }),
    }),
    [state],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside <ProjectProvider>');
  return ctx;
}
