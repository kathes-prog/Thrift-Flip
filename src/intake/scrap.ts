/**
 * Owner: P1.
 *
 * The scrap form accepts a photo plus positive width and length in cm.
 * Missing, zero or invalid values show feedback next to that field.
 */
import type { FabricPiece, MaterialSource } from '@/model/types';
import { todo } from '@/todo';

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
  return todo('P1', 'validateScrapInput');
}

/** One rectangular piece, areaCm2 = width × length, drawn in a representative shade. */
export function createScrap(
  valid: Extract<ScrapValidation, { ok: true }>,
  ids: { sourceId: string; pieceId: string },
): { source: MaterialSource; piece: FabricPiece } {
  return todo('P1', 'createScrap');
}
