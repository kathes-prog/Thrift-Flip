/**
 * Shared contract: where things live on the device.
 *
 * Everything is under the app's document directory. Paths stored in the
 * project are RELATIVE to it, so they survive app reinstalls and container moves.
 *
 *   <document>/project.json        the saved project (P3 writes, P3 reads)
 *   <document>/images/<uuid>.jpg   copied photos     (P1 writes, P3 references)
 */
export const PROJECT_FILE = 'project.json';
export const IMAGES_DIR = 'images';

export function imagePath(fileName: string): string {
  return `${IMAGES_DIR}/${fileName}`;
}
