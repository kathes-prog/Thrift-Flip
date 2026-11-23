/**
 * Owner: P1.
 *
 * Pick a photo with expo-image-picker (launchImageLibraryAsync, images only),
 * then copy it under <document>/images/ with its original extension before
 * saving its relative path on the MaterialSource.
 */
import { uuid } from 'expo';
import { Directory, File, Paths } from 'expo-file-system';
import { launchImageLibraryAsync } from 'expo-image-picker';

import { imagePath, IMAGES_DIR } from '@/storage/paths';

export interface PickedPhoto {
  /** Temporary URI from the picker. Show it immediately; don't save it. */
  uri: string;
  width: number;
  height: number;
}

/** Null when the user cancels; the current screen and project stay as they were. */
export async function pickPhoto(): Promise<PickedPhoto | null> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
  });
  if (result.canceled) return null;

  const { uri, width, height } = result.assets[0]!;
  return { uri, width, height };
}

/** Copy into the app's images folder and return the relative path, e.g. "images/<uuid>.heic". */
export async function copyPhotoToDocuments(uri: string): Promise<string> {
  const source = new File(uri);
  // The picker URI names the actual cached file. Leave unknown extensions unset.
  const extension = /^\.[a-z0-9]{1,10}$/i.test(source.extension) ? source.extension : '';
  const relativePath = imagePath(`${uuid.v4()}${extension}`);
  new Directory(Paths.document, IMAGES_DIR).create({ idempotent: true });
  await source.copy(new File(Paths.document, relativePath));
  return relativePath;
}
