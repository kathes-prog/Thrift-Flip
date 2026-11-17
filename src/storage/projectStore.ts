/**
 * Owner: P3.
 *
 * Save one project locally as versioned JSON (see storage/paths.ts).
 * Use expo-file-system's File / Paths API:
 *   new File(Paths.document, PROJECT_FILE).write(JSON.stringify(project))
 * Reject or migrate files whose schemaVersion differs from SCHEMA_VERSION.
 */
import type { Project } from '@/model/types';
import { todo } from '@/todo';

/** Write a snapshot of the project. Resolves once the write has succeeded. */
export async function saveProject(project: Project): Promise<void> {
  return todo('P3', 'saveProject');
}

/** The saved project, or null when nothing has been saved yet. */
export async function loadProject(): Promise<Project | null> {
  return todo('P3', 'loadProject');
}
