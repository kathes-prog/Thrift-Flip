/**
 * Owner: P1.
 *
 * Pick a photo with expo-image-picker (launchImageLibraryAsync, images only),
 * then copy it into <document>/images/<uuid>.jpg (storage/paths.ts) before
 * saving its relative path on the MaterialSource.
 */
import { todo } from '@/todo';

export interface PickedPhoto {
  /** Temporary URI from the picker. Show it immediately; don't save it. */
  uri: string;
  width: number;
  height: number;
}

/** Null when the user cancels; the current screen and project stay as they were. */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  return todo('P1', 'pickPhoto');
}

/** Copy into the app's images folder. Returns the RELATIVE path, e.g. "images/<uuid>.jpg". */
export async function copyPhotoToDocuments(uri: string): Promise<string> {
  return todo('P1', 'copyPhotoToDocuments');
}
