/**
 * Owner: P3.
 */
import { File, Paths } from 'expo-file-system';
import { type Project, SCHEMA_VERSION } from '@/model/types';

const PROJECT_FILE = 'project.json';

export async function saveProject(project: Project): Promise<void> {
  const file = new File(Paths.document, PROJECT_FILE);
  // .write() is synchronous in the new API, so this is fine.
  file.write(JSON.stringify(project));
}

export async function loadProject(): Promise<Project | null> {
  const file = new File(Paths.document, PROJECT_FILE);

  if (!file.exists) {
    return null;
  }

  try {
    // Added 'await' here because file.text() returns a Promise in Expo SDK 58
    const content = await file.text();
    const project = JSON.parse(content) as Project;

    if (project.schemaVersion !== SCHEMA_VERSION) {
      console.warn('Project schema version mismatch');
      return null;
    }

    return project;
  } catch (e) {
    console.error('Failed to load project', e);
    return null;
  }
}
