/**
 * Owner: P2. A tray card in the "Fabric pieces" sheet: the piece's real
 * outline in denim, a + badge, its name and size. Tapping it adds the piece.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon as SvgPolygon } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import type { FabricPiece } from '@/model/types';
import type { Polygon } from '@/model/units';
import { Icon, spacing } from '@/theme';

import { DenimDefs } from './denim';
import { studio } from './studioStyle';

const THUMB_W = 96;
const THUMB_H = 72;

export function bounds(polygon: Polygon) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/** "31 × 101 cm" from the piece's own outline. */
export function sizeLabel(polygon: Polygon) {
  const b = bounds(polygon);
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
  return `${fmt(b.width)} × ${fmt(b.height)} cm`;
}

export function PieceCard({ piece, onPress }: { piece: FabricPiece; onPress: () => void }) {
  const b = bounds(piece.polygon);
  // Leave a little room around the shape so the stroke isn't clipped.
  const pad = Math.max(b.width, b.height) * 0.04;
  const viewBox = `${b.minX - pad} ${b.minY - pad} ${b.width + pad * 2} ${b.height + pad * 2}`;
  const outline = piece.polygon.map((p) => `${p.x},${p.y}`).join(' ');
  const patternId = `twill-${piece.id}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${piece.displayName} to the canvas`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <Svg width={THUMB_W} height={THUMB_H} viewBox={viewBox}>
          <DenimDefs id={patternId} spacing={Math.max(b.width, b.height) / 18} />
          <SvgPolygon points={outline} fill={piece.color} strokeLinejoin="round" />
          <SvgPolygon points={outline} fill={`url(#${patternId})`} />
        </Svg>
        <View style={styles.plus}>
          <Icon name="add" size={14} color={studio.ink} />
        </View>
      </View>
      <AppText variant="label" color={studio.ink} numberOfLines={1} style={styles.name}>
        {piece.displayName}
      </AppText>
      <AppText variant="caption" color={studio.muted} style={styles.size}>
        {sizeLabel(piece.polygon)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 120, gap: 2, padding: spacing.xs, borderRadius: 12 },
  pressed: { backgroundColor: '#EFEDE7' },
  thumb: {
    height: THUMB_H + 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  plus: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: studio.plus,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  name: { fontSize: 13 },
  size: { fontSize: 12, lineHeight: 15 },
});
