/**
 * Owner: P1. Recovered panels, pockets and other pieces with counts,
 * dimensions and areas. Add garment / Add scrap are reachable from here.
 * Zine look: a big total, then each piece as a torn strip of paper.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors, spacing, text, tiltAt } from '@/theme';

export default function GarmentMap() {
  const { project } = useProject();
  const totalCm2 = project.pieces.reduce((sum, p) => sum + p.areaCm2, 0);

  return (
    <Screen
      kicker="Step 2/4 · your jeans"
      title="Garment map"
      highlight="garment"
      footer={<Button label="Start designing →" onPress={() => router.push('/start')} />}
    >
      <StubBanner
        owner="P1"
        note="Grouped counts, dimensions, sample-analysis label, Add garment and Add scrap."
      />

      {project.sources.length === 0 ? (
        <AppText color={colors.inkMuted}>
          No garments yet. Load a preset from Dev fixtures to see sample data.
        </AppText>
      ) : (
        <View style={styles.total}>
          {/* Bowlby One has no ² glyph, so the unit is set in the typewriter font. */}
          <AppText style={[text.display, styles.totalNumber]}>
            {formatArea(totalCm2).replace(/\s*cm²$/, '')}
          </AppText>
          <AppText variant="bodyStrong">cm² of denim saved from the landfill</AppText>
          <TapeLabel tone="pink" style={styles.count}>
            {`${project.pieces.length} PIECES ↓`}
          </TapeLabel>
        </View>
      )}

      {project.sources.map((source) => (
        <View key={source.id} style={styles.source}>
          <View style={styles.sourceHead}>
            <View style={[styles.swatch, { backgroundColor: source.shade }]} />
            <AppText variant="heading">{source.displayName.toUpperCase()}</AppText>
          </View>
          {project.pieces
            .filter((p) => p.sourceId === source.id)
            .map((piece, i) => (
              <TornPaper
                key={piece.id}
                seed={i * 3}
                tilt={tiltAt(i) * 0.6}
                color={i % 4 === 2 ? colors.highlight : colors.surface}
                style={i % 2 ? styles.stripIndent : undefined}
              >
                <View style={styles.pieceRow}>
                  <AppText style={styles.pieceName}>{piece.displayName}</AppText>
                  <AppText variant="bodyStrong">{formatArea(piece.areaCm2)}</AppText>
                </View>
              </TornPaper>
            ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { gap: 2, transform: [{ rotate: '-1.5deg' }] },
  totalNumber: { color: colors.ink },
  count: { marginTop: spacing.sm },
  source: { gap: spacing.sm },
  sourceHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 18, height: 18 },
  stripIndent: { marginLeft: spacing.sm },
  pieceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  pieceName: { flex: 1 },
});
