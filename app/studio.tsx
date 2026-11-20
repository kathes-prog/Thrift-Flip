/**
 * Owner: P2. Arrange, cut and manage pieces in 2D; switch to the 3D preview
 * (P3's component) for the skirt. Places P1's <FabricTracker />.
 *
 * Tapping a tray piece sends PLACE_PIECE; P1's inventory handler decides
 * whether it may go on the canvas (e.g. a third jeans pocket is rejected).
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { SkirtPreview } from '@/features/preview3d/SkirtPreview';
import { newFragmentIds } from '@/features/studio/ids';
import { PIECE_COLORS } from '@/features/studio/palette';
import { StudioCanvas } from '@/features/studio/StudioCanvas';
import { ToolButton } from '@/features/studio/ToolButton';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { formatArea, type Point } from '@/model/units';
import type { FabricPiece } from '@/model/types';
import type { CutPieceAction, PlacePieceAction } from '@/state/actions';
import { useProject } from '@/state/ProjectContext';
import { applyProjectAction } from '@/state/reducer';
import { colors, Icon, radii, spacing } from '@/theme';

/** Each tap of Rotate turns the selected piece this far clockwise. */
const ROTATE_STEP_DEG = 90;

export default function Studio() {
  const { project, dispatch, canUndo, undo } = useProject();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A selection only counts while that piece is on the canvas (undo or a cut can remove it).
  const selected = project.pieces.find((p) => p.id === selectedId && p.status === 'canvas');
  const [colorsOpen, setColorsOpen] = useState(false);
  const [cutMode, setCutMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Cut mode only means something while a piece is selected.
  const cutting = cutMode && Boolean(selected);

  const select = (pieceId: string | null) => {
    setSelectedId(pieceId);
    setNotice(null);
  };

  const cut = (from: Point, to: Point) => {
    if (!selected) return;
    const action: CutPieceAction = {
      type: 'CUT_PIECE',
      pieceId: selected.id,
      from,
      to,
      fragmentIds: newFragmentIds(selected.originalPieceId),
    };
    // The reducer is pure, so trying the cut first tells us whether it is valid.
    if (applyProjectAction(project, action) === project) {
      setNotice('Draw across the piece, from outside one edge to outside the other.');
      return;
    }
    dispatch(action);
    setCutMode(false);
    setSelectedId(null);
    setNotice(null);
  };
  const pattern = project.mode?.kind === 'pattern' ? getPattern(project.mode.patternId) : undefined;
  const tray = project.pieces.filter((p) => p.status === 'tray');
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;

  const place = (piece: FabricPiece) => {
    const action: PlacePieceAction = {
      type: 'PLACE_PIECE',
      pieceId: piece.id,
      position: { x: canvas.widthCm / 2, y: canvas.heightCm / 2 },
    };
    if (applyProjectAction(project, action) === project) {
      setNotice(`${piece.displayName} can't go on the canvas.`);
      return;
    }
    dispatch(action);
    setSelectedId(piece.id);
    setCutMode(false);
    setNotice(null);
  };

  return (
    // The canvas must own its pan gestures, so it stays fixed at the top and
    // only the panel underneath it scrolls.
    <Screen scroll={false}>
      <View style={styles.fixed}>
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
            onSelect={select}
            onMove={(pieceId, position) => dispatch({ type: 'MOVE_PIECE', pieceId, position })}
            cutMode={cutting}
            onCut={cut}
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
          <ToolButton
            label="Cut"
            icon="cut"
            disabled={!selected}
            active={cutting}
            onPress={() => {
              setCutMode(!cutting);
              setNotice(null);
            }}
          />
        </View>
        {cutting || notice ? (
          <AppText variant="caption" color={notice ? colors.danger : colors.inkMuted}>
            {notice ?? 'Drag a line across the selected piece to cut it.'}
          </AppText>
        ) : null}
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
          <Pressable
            key={piece.id}
            accessibilityRole="button"
            accessibilityLabel={`Add ${piece.displayName} to the canvas`}
            onPress={() => place(piece)}
            style={({ pressed }) => [styles.trayRow, pressed && styles.trayRowPressed]}
          >
            <View style={[styles.dot, { backgroundColor: piece.color }]} />
            <AppText style={{ flex: 1 }}>{piece.displayName}</AppText>
            <AppText color={colors.inkMuted}>{formatArea(piece.areaCm2)}</AppText>
            <Icon name="add" size={20} color={colors.primary} />
          </Pressable>
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
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  trayRowPressed: { backgroundColor: colors.border },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
