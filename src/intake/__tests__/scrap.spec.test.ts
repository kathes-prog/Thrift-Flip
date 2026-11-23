/** Owner: P1 · requirement 3 (measured scrap). Remove `.skip` when built. */
import { createScrap, validateScrapInput } from '@/intake/scrap';

const photoPath = 'images/scrap.jpg';

describe('P1 · scrap form', () => {
  test.each([
    ['', '30', 'width'],
    ['30', '', 'length'],
    ['0', '30', 'width'],
    ['30', '-5', 'length'],
    ['abc', '30', 'width'],
  ])('width "%s", length "%s" shows an error on %s', (width, length, field) => {
    const result = validateScrapInput({ width, length, photoPath });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveProperty(field);
  });

  test('requires a photo', () => {
    const result = validateScrapInput({ width: '30', length: '30', photoPath: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveProperty('photo');
  });

  test('30 × 30 cm makes one 900 cm² rectangular piece', () => {
    const valid = validateScrapInput({ width: '30', length: '30', photoPath });
    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    const { source, piece } = createScrap(valid, { sourceId: 's1', pieceId: 'p1' });
    expect(source).toMatchObject({
      type: 'scrap',
      photoPath,
      measured: { widthCm: 30, lengthCm: 30 },
    });
    expect(piece).toMatchObject({ sourceId: 's1', areaCm2: 900, status: 'tray' });
    expect(piece.polygon).toHaveLength(4);
  });
});
