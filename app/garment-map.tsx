/**
 * Owner: P1. Recovered panels, pockets and other pieces with counts,
 * dimensions and areas. Add garment / Add scrap are reachable from here.
 * Zine look: a big total, then each piece group as a torn strip of paper.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import type { FabricPiece, PieceCategory } from '@/model/types';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors, spacing, text, tiltAt } from '@/theme';

function pieceSize(piece: FabricPiece): string {
  const xs = piece.polygon.map(({ x }) => x);
  const ys = piece.polygon.map(({ y }) => y);
  const width = Math.max(...xs) - Math.min(...xs);
  const length = Math.max(...ys) - Math.min(...ys);
  return `${Number(width.toFixed(1))} × ${Number(length.toFixed(1))} cm`;
}

export default function GarmentMap() {
  const { project } = useProject();
  const totalCm2 = project.pieces.reduce((sum, p) => sum + p.areaCm2, 0);
  const garmentLimitReached = project.sources.some(
    (source) => source.type === 'additional-garment',
  );

  return (
    <Screen
      kicker="Step 2/4 · your jeans"
      title="Garment map"
      highlight="garment"
      footer={<Button label="Start designing →" onPress={() => router.push('/start')} />}
    >
      {project.sources.length === 0 ? (
        <AppText color={colors.inkMuted}>
          No garments yet. Load a preset from Dev fixtures to see sample data.
        </AppText>
      ) : (
        <View style={styles.total}>
          {/* Bowlby One has no ² glyph, so the unit is set in the typewriter font. */}
          <AppText style={text.display}>{formatArea(totalCm2).replace(/\s*cm²$/, '')}</AppText>
          <AppText variant="bodyStrong">cm² of denim saved from the landfill</AppText>
          <TapeLabel tone="pink" style={styles.count}>
            {`${project.pieces.length} PIECES ↓`}
          </TapeLabel>
        </View>
      )}

      {project.sources.map((source) => {
        const pieces = project.pieces.filter((piece) => piece.sourceId === source.id);
        const groups = new Map<PieceCategory, FabricPiece[]>();
        for (const piece of pieces) {
          const group = groups.get(piece.category);
          if (group) group.push(piece);
          else groups.set(piece.category, [piece]);
        }

        return (
          <View key={source.id} style={styles.source}>
            <View style={styles.sourceHead}>
              <View style={[styles.swatch, { backgroundColor: source.shade }]} />
              <AppText variant="heading" style={styles.sourceName}>
                {source.displayName.toUpperCase()}
              </AppText>
              {source.isSampleAnalysis ? <TapeLabel>SAMPLE ANALYSIS</TapeLabel> : null}
            </View>
            <AppText variant="caption" color={colors.inkMuted}>
              {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'} ·{' '}
              {formatArea(pieces.reduce((area, piece) => area + piece.areaCm2, 0))}
            </AppText>
            {[...groups].map(([category, group], i) => (
              <TornPaper
                key={category}
                seed={i * 3}
                tilt={tiltAt(i) * 0.6}
                color={i % 4 === 2 ? colors.highlight : colors.surface}
                style={[styles.strip, i % 2 ? styles.stripIndent : undefined]}
              >
                <AppText variant="bodyStrong">
                  {`${String(group.length).padStart(2, '0')}× ${category.replace(/-/g, ' ')}`}
                </AppText>
                {group.map((piece) => (
                  <View key={piece.id} style={styles.pieceRow}>
                    <AppText variant="caption" style={styles.pieceName}>
                      {piece.displayName} · {pieceSize(piece)}
                    </AppText>
                    <AppText variant="caption">{formatArea(piece.areaCm2)}</AppText>
                  </View>
                ))}
              </TornPaper>
            ))}
          </View>
        );
      })}

      <View style={styles.addRow}>
        <View style={styles.add}>
          <Button
            label="+ Garment"
            variant="secondary"
            disabled={garmentLimitReached}
            onPress={() => router.push({ pathname: '/new-garment', params: { from: 'materials' } })}
          />
        </View>
        <View style={styles.add}>
          <Button
            label="+ Scrap"
            variant="secondary"
            onPress={() => router.push({ pathname: '/patterns', params: { add: 'scrap' } })}
          />
        </View>
      </View>
      {garmentLimitReached ? (
        <AppText variant="caption" color={colors.inkMuted}>
          This project already has two garments.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { gap: 2, transform: [{ rotate: '-1.5deg' }] },
  count: { marginTop: spacing.sm },
  source: { gap: spacing.sm },
  sourceHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  sourceName: { flexShrink: 1 },
  swatch: { width: 18, height: 18 },
  strip: { gap: 2 },
  stripIndent: { marginLeft: spacing.sm },
  pieceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  pieceName: { flex: 1 },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  add: { flex: 1 },
});
