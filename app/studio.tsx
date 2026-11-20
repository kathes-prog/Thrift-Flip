/**
 * Owner: P2. Arrange, cut and manage pieces in 2D; switch to the 3D preview
 * (P3's component) for the skirt. Places P1's <FabricTracker />.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { getPattern } from '@/fixtures/patterns';
import { SkirtPreview } from '@/features/preview3d/SkirtPreview';
import { PIECE_COLORS } from '@/features/studio/palette';
import { StudioCanvas } from '@/features/studio/StudioCanvas';
import { ToolButton } from '@/features/studio/ToolButton';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { colors, radii, spacing } from '@/theme';

/** Each tap of Rotate turns the selected piece this far clockwise. */
const ROTATE_STEP_DEG = 90;

export default function Studio() {
  const { project, dispatch, canUndo, undo } = useProject();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A selection only counts while that piece is on the canvas (undo or a cut can remove it).
  const selected = project.pieces.find((p) => p.id === selectedId && p.status === 'canvas');
  const [colorsOpen, setColorsOpen] = useState(false);
  const pattern = project.mode?.kind === 'pattern' ? getPattern(project.mode.patternId) : undefined;
  const tray = project.pieces.filter((p) => p.status === 'tray');

  return (
    // The canvas must own its pan gestures, so it stays fixed at the top and
    // only the panel underneath it scrolls.
    <Screen scroll={false}>
      <View style={styles.fixed}>
        <StubBanner
          owner="P2"
          note="Pieces on canvas, tray placement, move / rotate / flip / cut tools."
        />
        <AppText variant="heading">
          {pattern ? pattern.name : project.mode?.kind === 'freestyle' ? 'Freestyle' : 'No design'}
        </AppText>
        <View style={styles.viewToggle}>
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
        </View>
        {view === '2d' ? (
          <StudioCanvas
            mode={project.mode}
            pieces={project.pieces}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onMove={(pieceId, position) => dispatch({ type: 'MOVE_PIECE', pieceId, position })}
          />
        ) : (
          <SkirtPreview project={project} />
        )}
        <View style={styles.tools}>
          <ToolButton label="Undo" icon="undo" disabled={!canUndo} onPress={undo} />
          <ToolButton
            label="Rotate"
            icon="rotate"
            disabled={!selected}
            onPress={() =>
              selected &&
              dispatch({
                type: 'ROTATE_PIECE',
                pieceId: selected.id,
                rotationDeg: selected.rotationDeg + ROTATE_STEP_DEG,
              })
            }
          />
          <ToolButton
            label="Colour"
            icon="color"
            disabled={!selected}
            active={Boolean(selected) && colorsOpen}
            onPress={() => setColorsOpen((open) => !open)}
          />
          <ToolButton
            label="Flip"
            icon="flip"
            disabled={!selected}
            onPress={() => selected && dispatch({ type: 'FLIP_PIECE', pieceId: selected.id })}
          />
        </View>
        {selected && colorsOpen ? (
          <View style={styles.swatches}>
            {PIECE_COLORS.map((color) => (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${color}`}
                accessibilityState={{ selected: selected.color === color }}
                onPress={() => dispatch({ type: 'RECOLOR_PIECE', pieceId: selected.id, color })}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  selected.color === color && styles.swatchChosen,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
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
  fixed: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  panel: { flex: 1 },
  panelContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  viewToggle: { flexDirection: 'row', gap: spacing.sm },
  tools: { flexDirection: 'row', gap: spacing.xs },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchChosen: { borderWidth: 3, borderColor: colors.selection },
  trayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
