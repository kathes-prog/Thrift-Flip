/**
 * Owner: P1. Recovered panels, pockets and other pieces with counts,
 * dimensions and areas. Add garment / Add scrap are reachable from here.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import type { FabricPiece, PieceCategory } from '@/model/types';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors, spacing } from '@/theme';

function pieceSize(piece: FabricPiece): string {
  const xs = piece.polygon.map(({ x }) => x);
  const ys = piece.polygon.map(({ y }) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const length = Math.max(...ys) - Math.min(...ys);
  return `${Number(width.toFixed(1))} × ${Number(length.toFixed(1))} cm`;
}

export default function GarmentMap() {
  const { project } = useProject();
  const garmentLimitReached = project.sources.some(
    (source) => source.type === 'additional-garment',
  );

  return (
    <Screen title="Garment Map">
      {project.sources.length === 0 ? (
        <AppText color={colors.inkMuted}>
          No garments yet. Load a preset from Dev fixtures to see sample data.
        </AppText>
      ) : null}
      {project.sources.map((source) => {
        const pieces = project.pieces.filter((piece) => piece.sourceId === source.id);
        const groups = new Map<PieceCategory, FabricPiece[]>();
        for (const piece of pieces) {
          const group = groups.get(piece.category);
          if (group) group.push(piece);
          else groups.set(piece.category, [piece]);
        }

        return (
          <Card key={source.id}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: source.shade }]} />
              <AppText variant="heading">{source.displayName}</AppText>
            </View>
            <AppText color={colors.inkMuted}>
              {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'} ·{' '}
              {formatArea(pieces.reduce((area, piece) => area + piece.areaCm2, 0))}
              {source.isSampleAnalysis ? ' · Sample analysis' : ''}
            </AppText>
            {[...groups].map(([category, group]) => (
              <View key={category} style={styles.group}>
                <AppText variant="bodyStrong" style={styles.category}>
                  {category.replace(/-/g, ' ')} ({group.length})
                </AppText>
                {group.map((piece) => (
                  <AppText key={piece.id} color={colors.inkMuted}>
                    {piece.displayName} · {pieceSize(piece)} · {formatArea(piece.areaCm2)}
                  </AppText>
                ))}
              </View>
            ))}
          </Card>
        );
      })}
      <Button
        label="Add garment"
        icon="add"
        variant="secondary"
        disabled={garmentLimitReached}
        onPress={() => router.push({ pathname: '/new-garment', params: { from: 'materials' } })}
      />
      <Button
        label="Add scrap"
        icon="scrap"
        variant="secondary"
        onPress={() => router.push({ pathname: '/patterns', params: { add: 'scrap' } })}
      />
      <Button label="Start designing" icon="pattern" onPress={() => router.push('/start')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7 },
  group: { gap: spacing.xs },
  category: { textTransform: 'capitalize' },
});
