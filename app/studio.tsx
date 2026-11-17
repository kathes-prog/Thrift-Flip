/**
 * Owner: P2. Arrange, cut and manage pieces in 2D; switch to the 3D preview
 * (P3's component) for the skirt. Places P1's <FabricTracker />.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { getPattern } from '@/fixtures/patterns';
import { SkirtPreview } from '@/features/preview3d/SkirtPreview';
import { StudioCanvas } from '@/features/studio/StudioCanvas';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors, spacing } from '@/theme';

export default function Studio() {
  const { project, canUndo, undo } = useProject();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const pattern = project.mode?.kind === 'pattern' ? getPattern(project.mode.patternId) : undefined;
  const tray = project.pieces.filter((p) => p.status === 'tray');

  return (
    // The canvas must own its pan gestures, so this screen doesn't scroll as a whole.
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <StubBanner
          owner="P2"
          note="Pieces on canvas, tray placement, move / rotate / flip / cut tools."
        />
        <AppText variant="heading">
          {pattern ? pattern.name : project.mode?.kind === 'freestyle' ? 'Freestyle' : 'No design'}
        </AppText>
        <View style={styles.toolbar}>
          <Button
            label="2D"
            variant={view === '2d' ? 'primary' : 'secondary'}
            onPress={() => setView('2d')}
          />
          <Button
            label="3D"
            icon="cube"
            variant={view === '3d' ? 'primary' : 'secondary'}
            disabled={!pattern?.has3dPreview}
            onPress={() => setView('3d')}
          />
          <Button label="Undo" icon="undo" variant="secondary" disabled={!canUndo} onPress={undo} />
        </View>
        {view === '2d' ? <StudioCanvas mode={project.mode} /> : <SkirtPreview project={project} />}
        <AppText variant="heading">Tray</AppText>
        {tray.length === 0 ? <AppText color={colors.inkMuted}>Tray is empty.</AppText> : null}
        {tray.map((piece) => (
          <View key={piece.id} style={styles.trayRow}>
            <View style={[styles.dot, { backgroundColor: piece.color }]} />
            <AppText style={{ flex: 1 }}>{piece.displayName}</AppText>
            <AppText color={colors.inkMuted}>{formatArea(piece.areaCm2)}</AppText>
          </View>
        ))}
        <FabricTracker />
        <Button label="Cutting plan" icon="save" onPress={() => router.push('/cutting-plan')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  toolbar: { flexDirection: 'row', gap: spacing.sm },
  trayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
