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
import { StubBanner } from '@/components/StubBanner';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export default function GarmentMap() {
  const { project } = useProject();

  return (
    <Screen title="Garment Map">
      <StubBanner
        owner="P1"
        note="Grouped counts, dimensions, sample-analysis label, Add garment and Add scrap."
      />
      {project.sources.length === 0 ? (
        <AppText color={colors.inkMuted}>
          No garments yet. Load a preset from Dev fixtures to see sample data.
        </AppText>
      ) : null}
      {project.sources.map((source) => (
        <Card key={source.id}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: source.shade }]} />
            <AppText variant="heading">{source.displayName}</AppText>
          </View>
          {project.pieces
            .filter((p) => p.sourceId === source.id)
            .map((piece) => (
              <View key={piece.id} style={styles.pieceRow}>
                <AppText>{piece.displayName}</AppText>
                <AppText color={colors.inkMuted}>{formatArea(piece.areaCm2)}</AppText>
              </View>
            ))}
        </Card>
      ))}
      <Button label="Start designing" icon="pattern" onPress={() => router.push('/start')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  pieceRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
