/**
 * Owner: P1.
 *
 * The scrap form accepts a photo plus positive width and length in cm.
 * Missing, zero or invalid values show feedback next to that field.
 */
import type { FabricPiece, MaterialSource } from '@/model/types';
import { rect } from '@/model/units';
import { colors } from '@/theme/tokens';

/** Raw text from the two inputs, exactly as typed. */
export interface ScrapFormInput {
  width: string;
  length: string;
  photoPath: string | null;
}

export type ScrapFieldErrors = Partial<Record<'width' | 'length' | 'photo', string>>;

export type ScrapValidation =
  | { ok: true; widthCm: number; lengthCm: number; photoPath: string }
  | { ok: false; errors: ScrapFieldErrors };

export function validateScrapInput(input: ScrapFormInput): ScrapValidation {
  const widthCm = Number(input.width);
  const lengthCm = Number(input.length);
  const photoPath = input.photoPath?.trim();
  const errors: ScrapFieldErrors = {};

  if (!Number.isFinite(widthCm) || widthCm <= 0) {
    errors.width = 'Enter a positive width in cm.';
  }
  if (!Number.isFinite(lengthCm) || lengthCm <= 0) {
    errors.length = 'Enter a positive length in cm.';
  }
  if (!photoPath) errors.photo = 'Choose a photo.';

  if (!photoPath || errors.width || errors.length) return { ok: false, errors };
  return { ok: true, widthCm, lengthCm, photoPath };
}

/** One rectangular piece, areaCm2 = width × length, drawn in a representative shade. */
export function createScrap(
  valid: Extract<ScrapValidation, { ok: true }>,
  ids: { sourceId: string; pieceId: string },
): { source: MaterialSource; piece: FabricPiece } {
  const { widthCm, lengthCm, photoPath } = valid;
  const displayName = `Scrap ${widthCm} × ${lengthCm} cm`;
  const shade = colors.scrapDefault;

  return {
    source: {
      id: ids.sourceId,
      displayName,
      type: 'scrap',
      photoPath,
      shade,
      isSampleAnalysis: false,
      measured: { widthCm, lengthCm },
    },
    piece: {
      id: ids.pieceId,
      sourceId: ids.sourceId,
      originalPieceId: ids.pieceId,
      displayName,
      category: 'scrap',
      polygon: rect(widthCm, lengthCm),
      areaCm2: widthCm * lengthCm,
      color: shade,
      position: { x: 0, y: 0 },
      rotationDeg: 0,
      flipped: false,
      status: 'tray',
    },
  };
}
