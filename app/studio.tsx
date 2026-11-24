/**
 * Owner: P2. The Design Studio, laid out like the hi-fi Figma frame:
 * header (back · title · Done), canvas bar (mode · 3D · Show guide), the
 * canvas with Store / Discard, the tool row, and the "Fabric pieces" sheet
 * (a drawer: drag it down to give the canvas more room, back up to see the cards).
 *
 * - Tapping a tray card sends PLACE_PIECE; P1's inventory handler decides
 *   whether it may go on the canvas (e.g. a third jeans pocket is rejected).
 * - Discard sends the selection back to the tray (RETURN_PIECE); Store sends
 *   P1's STORE_PIECE. Reset sends every canvas piece back (CLEAR_CANVAS).
 * - Rotate, Cut and Stitch are finger gestures on the canvas (StudioCanvas).
 * - The 3D view is P3's <SkirtPreview />. The sheet's totals come from P1's
 *   selectTracker() (with a temporary fallback while it returns zeros).
 */
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { pieceAt } from '@/geometry/hitTest';
import { SkirtPreview } from '@/features/preview3d/SkirtPreview';
import { newFragmentIds, newMergedId } from '@/features/studio/ids';
import { PIECE_COLORS } from '@/features/studio/palette';
import { PieceCard } from '@/features/studio/PieceCard';
import { PieceDrawer } from '@/features/studio/PieceDrawer';
import { StudioCanvas, type CanvasTool } from '@/features/studio/StudioCanvas';
import { studio } from '@/features/studio/studioStyle';
import { fallbackTotals, testPieceProject } from '@/features/studio/testPieces';
import { ToolButton } from '@/features/studio/ToolButton';
import type { FabricPiece } from '@/model/types';
import { formatArea, type Point } from '@/model/units';
import type { ProjectAction } from '@/state/actions';
import { useProject } from '@/state/ProjectContext';
import { applyProjectAction } from '@/state/reducer';
import { selectTracker } from '@/state/selectors';
import { Icon, radii, spacing, type IconName } from '@/theme';

/** The quick-turn buttons in the Rotate row turn the piece this far. */
const ROTATE_STEP_DEG = 90;
/** Points sampled along a stitch line to find the pieces it joins. */
const STITCH_SAMPLES = 40;

/** The tool whose option row or mode is open. Only one at a time. */
type Tool = 'rotate' | 'color' | 'flip' | 'cut' | 'stitch';

export default function Studio() {
  const insets = useSafeAreaInsets();
  const { project, dispatch, canUndo, undo, canRedo, redo } = useProject();
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [showGuide, setShowGuide] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openTool, setOpenTool] = useState<Tool | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pattern = project.mode?.kind === 'pattern' ? getPattern(project.mode.patternId) : undefined;
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;
  const tray = project.pieces.filter((p) => p.status === 'tray');
  const onCanvas = project.pieces.filter((p) => p.status === 'canvas');
  const p1Tracker = selectTracker(project);
  // TEMP: P1's selectTracker() returns zeros until it's built.
  const tracker = p1Tracker.recoveredCm2 > 0 ? p1Tracker : fallbackTotals(project);

  // TEMP: give an empty project the sample pieces so every tool can be tried.
  const isEmpty = project.pieces.length === 0;
  useEffect(() => {
    if (!isEmpty) return;
    const sample = testPieceProject(project);
    if (sample) dispatch({ type: 'LOAD_PROJECT', project: sample });
  }, [isEmpty, project, dispatch]);

  // A selection only counts while that piece is on the canvas (undo or a cut can remove it).
  const selected = onCanvas.find((p) => p.id === selectedId);
  // Stitch needs two pieces on the canvas; every other tool needs a selection.
  const tool =
    openTool === 'stitch' ? (onCanvas.length >= 2 ? 'stitch' : null) : selected ? openTool : null;
  const canvasTool: CanvasTool =
    tool === 'rotate' || tool === 'cut' || tool === 'stitch' ? tool : 'move';

  const title = pattern ? `${pattern.name} design` : 'Untitled design';
  const subtitle =
    onCanvas.length === 0
      ? 'No pieces placed yet'
      : `${onCanvas.length} ${onCanvas.length === 1 ? 'piece' : 'pieces'} on the canvas`;

  const select = (pieceId: string | null) => {
    setSelectedId(pieceId);
    setNotice(null);
    if (pieceId !== selectedId) setOpenTool(null);
  };

  /** Dispatch if the action changes the project; otherwise show why not. */
  const attempt = (action: ProjectAction, rejected: string) => {
    if (applyProjectAction(project, action) === project) {
      setNotice(rejected);
      return false;
    }
    dispatch(action);
    setNotice(null);
    return true;
  };

  /** Every piece on the canvas goes back to the tray, as one undo step. */
  const resetCanvas = () => {
    if (attempt({ type: 'CLEAR_CANVAS' }, 'The canvas is already empty.')) {
      setSelectedId(null);
      setOpenTool(null);
    }
  };

  const toggleTool = (next: Tool) => {
    setOpenTool(tool === next ? null : next);
    setNotice(null);
  };

  // ---- canvas callbacks

  const onTap = (pieceId: string | null) => select(pieceId);

  const onDragStart = (pieceId: string) => {
    if (pieceId !== selectedId) select(pieceId);
  };

  const cut = (from: Point, to: Point) => {
    if (!selected) return;
    const done = attempt(
      {
        type: 'CUT_PIECE',
        pieceId: selected.id,
        from,
        to,
        fragmentIds: newFragmentIds(selected.originalPieceId),
      },
      'Draw across the piece, from outside one edge to outside the other.',
    );
    if (done) {
      setOpenTool(null);
      setSelectedId(null);
    }
  };

  /** The first two different pieces the line passes over, in the order it meets them. */
  const piecesAlong = (from: Point, to: Point) => {
    const found: string[] = [];
    for (let i = 0; i <= STITCH_SAMPLES; i++) {
      const t = i / STITCH_SAMPLES;
      const hit = pieceAt(onCanvas, {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
      });
      if (hit && !found.includes(hit.id)) found.push(hit.id);
      if (found.length === 2) break;
    }
    return found;
  };

  const stitch = (from: Point, to: Point) => {
    const [a, b] = piecesAlong(from, to);
    if (!a || !b) {
      setNotice('Draw the line from one piece onto another.');
      return;
    }
    const mergedId = newMergedId();
    const done = attempt(
      { type: 'STITCH_PIECES', pieceIds: [a, b], mergedId },
      'Overlap the two pieces where the seam goes, then draw across it.',
    );
    if (done) {
      setOpenTool(null);
      setSelectedId(mergedId);
    }
  };

  const onStroke = (from: Point, to: Point) =>
    tool === 'stitch' ? stitch(from, to) : cut(from, to);

  const place = (piece: FabricPiece) => {
    const done = attempt(
      {
        type: 'PLACE_PIECE',
        pieceId: piece.id,
        position: { x: canvas.widthCm / 2, y: canvas.heightCm / 2 },
      },
      `${piece.displayName} can't go on the canvas.`,
    );
    if (done) {
      setSelectedId(piece.id);
      setOpenTool(null);
    }
  };

  // ---- tool row

  const tools: {
    label: string;
    icon: IconName;
    onPress: () => void;
    disabled: boolean;
    active?: boolean;
  }[] = [
    { label: 'Undo', icon: 'undo', onPress: undo, disabled: !canUndo },
    { label: 'Redo', icon: 'redo', onPress: redo, disabled: !canRedo },
    {
      label: 'Rotate',
      icon: 'rotate',
      disabled: !selected,
      active: tool === 'rotate',
      onPress: () => toggleTool('rotate'),
    },
    {
      label: 'Color',
      icon: 'color',
      disabled: !selected,
      active: tool === 'color',
      onPress: () => toggleTool('color'),
    },
    {
      label: 'Flip',
      icon: 'flip',
      disabled: !selected,
      active: tool === 'flip',
      onPress: () => toggleTool('flip'),
    },
    {
      label: 'Cut',
      icon: 'cut',
      disabled: !selected,
      active: tool === 'cut',
      onPress: () => toggleTool('cut'),
    },
    {
      label: 'Stitch',
      icon: 'stitch',
      disabled: onCanvas.length < 2,
      active: tool === 'stitch',
      onPress: () => toggleTool('stitch'),
    },
    {
      label: 'Reset',
      icon: 'reset',
      disabled: onCanvas.length === 0,
      onPress: resetCanvas,
    },
  ];

  const hint =
    tool === 'cut'
      ? 'Drag a line across the selected piece to cut it.'
      : tool === 'stitch'
        ? 'Overlap two pieces, then draw a line from one onto the other.'
        : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.headerSide}
        >
          <Icon name="back" size={24} color={studio.ink} />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText variant="heading" color={studio.ink} numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color={studio.muted}>
            {subtitle}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.push('/cutting-plan')}
          style={[styles.headerSide, styles.headerRight]}
        >
          <AppText variant="heading" color={studio.sage}>
            Done
          </AppText>
        </Pressable>
      </View>

      {/* Canvas bar */}
      <View style={styles.canvasBar}>
        <AppText variant="caption" color={studio.muted}>
          {pattern ? `${pattern.name} pattern` : 'Blank canvas'}
        </AppText>
        <View style={styles.canvasBarRight}>
          {pattern?.has3dPreview ? (
            <Pressable hitSlop={8} onPress={() => setView(view === '2d' ? '3d' : '2d')}>
              <AppText variant="label" color={studio.sage}>
                {view === '2d' ? 'View in 3D' : 'Back to 2D'}
              </AppText>
            </Pressable>
          ) : null}
          {pattern && view === '2d' ? (
            <Pressable hitSlop={8} onPress={() => setShowGuide(!showGuide)}>
              <AppText variant="label" color={studio.sage}>
                {showGuide ? 'Hide guide' : 'Show guide'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Canvas */}
      <View style={styles.canvasArea}>
        {view === '2d' ? (
          <StudioCanvas
            mode={project.mode}
            pieces={project.pieces}
            selectedId={selected?.id ?? null}
            showGuide={showGuide}
            onTap={onTap}
            onDragStart={onDragStart}
            onMove={(pieceId, position) => dispatch({ type: 'MOVE_PIECE', pieceId, position })}
            tool={canvasTool}
            onRotate={(pieceId, rotationDeg) =>
              dispatch({ type: 'ROTATE_PIECE', pieceId, rotationDeg })
            }
            onStroke={onStroke}
          >
            <View style={styles.canvasActions} pointerEvents="box-none">
              <FloatingAction
                label="Store"
                icon="store"
                disabled={!selected}
                onPress={() =>
                  selected &&
                  attempt(
                    { type: 'STORE_PIECE', pieceId: selected.id },
                    `${selected.displayName} can't be stored right now.`,
                  )
                }
              />
              <FloatingAction
                label="Discard"
                icon="discard"
                tone="danger"
                disabled={!selected}
                onPress={() =>
                  selected &&
                  attempt(
                    { type: 'RETURN_PIECE', pieceId: selected.id },
                    `${selected.displayName} can't be removed right now.`,
                  )
                }
              />
            </View>
          </StudioCanvas>
        ) : (
          <View style={styles.preview}>
            <SkirtPreview project={project} />
          </View>
        )}
      </View>

      {/* Tool row */}
      <View style={styles.tools}>
        {tools.map((t) => (
          <ToolButton key={t.icon} {...t} />
        ))}
      </View>

      {/* Option area: a fixed height, so opening a tool never resizes the canvas */}
      <View style={styles.optionArea}>
        {selected && tool === 'rotate' ? (
          <View style={styles.optionRow}>
            <StepButton
              label="↺"
              accessibilityLabel="Turn 90 degrees left"
              onPress={() =>
                dispatch({
                  type: 'ROTATE_PIECE',
                  pieceId: selected.id,
                  rotationDeg: selected.rotationDeg - ROTATE_STEP_DEG,
                })
              }
            />
            <View style={styles.resizeInfo}>
              <AppText variant="label" color={studio.ink}>
                {`${Math.round(selected.rotationDeg)}°`}
              </AppText>
              <AppText variant="caption" color={studio.muted}>
                Drag on the canvas to turn it
              </AppText>
            </View>
            <StepButton
              label="↻"
              accessibilityLabel="Turn 90 degrees right"
              onPress={() =>
                dispatch({
                  type: 'ROTATE_PIECE',
                  pieceId: selected.id,
                  rotationDeg: selected.rotationDeg + ROTATE_STEP_DEG,
                })
              }
            />
          </View>
        ) : selected && tool === 'flip' ? (
          <View style={[styles.optionRow, styles.flipRow]}>
            <OptionButton
              label="↔  Left to right"
              onPress={() =>
                dispatch({ type: 'FLIP_PIECE', pieceId: selected.id, axis: 'horizontal' })
              }
            />
            <OptionButton
              label="↕  Top to bottom"
              onPress={() =>
                dispatch({ type: 'FLIP_PIECE', pieceId: selected.id, axis: 'vertical' })
              }
            />
          </View>
        ) : selected && tool === 'color' ? (
          <View style={styles.optionRow}>
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
        ) : notice || hint ? (
          <AppText
            variant="caption"
            color={notice ? studio.discard : studio.muted}
            style={styles.message}
          >
            {notice ?? hint}
          </AppText>
        ) : null}
      </View>

      {/* Fabric pieces sheet: drag it down to give the canvas more room */}
      <PieceDrawer
        bottomInset={insets.bottom + spacing.sm}
        header={
          <View style={styles.sheetHeader}>
            <View>
              <AppText variant="heading" color={studio.ink}>
                Fabric pieces
              </AppText>
              <AppText variant="caption" color={studio.muted}>
                {formatArea(tracker.availableCm2)} available
              </AppText>
            </View>
            <View style={styles.usage}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(100, Math.max(0, tracker.percentUsed))}%` },
                  ]}
                />
              </View>
              <AppText variant="caption" color={studio.muted}>
                {Math.round(tracker.percentUsed)}% used
              </AppText>
            </View>
          </View>
        }
      >
        {tray.length === 0 ? (
          <AppText variant="caption" color={studio.muted} style={styles.trayEmpty}>
            Every piece is on the canvas.
          </AppText>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cards}
          >
            {tray.map((piece) => (
              <PieceCard key={piece.id} piece={piece} onPress={() => place(piece)} />
            ))}
          </ScrollView>
        )}
      </PieceDrawer>
    </View>
  );
}

function FloatingAction({
  label,
  icon,
  onPress,
  disabled,
  tone,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled: boolean;
  tone?: 'danger';
}) {
  const color = tone === 'danger' ? studio.discard : studio.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.floating,
        tone === 'danger' && { borderColor: studio.discardBorder },
        disabled && styles.floatingDisabled,
        pressed && styles.floatingPressed,
      ]}
    >
      <Icon name={icon} size={20} color={color} />
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

function OptionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.floatingPressed]}
    >
      <AppText variant="label" color={studio.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StepButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.step, pressed && styles.floatingPressed]}
    >
      <AppText variant="heading" color={studio.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: studio.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: studio.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: studio.canvasBorder,
  },
  headerSide: { width: 56, justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { flex: 1, alignItems: 'center' },
  canvasBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  canvasBarRight: { flexDirection: 'row', gap: spacing.md },
  canvasArea: { flex: 1, paddingHorizontal: spacing.md },
  preview: { flex: 1, justifyContent: 'center' },
  canvasActions: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: studio.canvasBorder,
    backgroundColor: studio.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatingDisabled: { opacity: 0.45 },
  floatingPressed: { backgroundColor: '#EFEDE7' },
  tools: { flexDirection: 'row', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  optionArea: { height: 56, justifyContent: 'center', paddingHorizontal: spacing.lg },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: studio.canvasBorder,
  },
  swatchChosen: { borderWidth: 3, borderColor: studio.selection },
  resizeInfo: { alignItems: 'center' },
  flipRow: { justifyContent: 'center', gap: spacing.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: studio.canvasBorder,
    backgroundColor: studio.card,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: studio.canvasBorder,
    backgroundColor: studio.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { textAlign: 'center' },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  usage: { alignItems: 'flex-end', gap: spacing.xs, paddingTop: spacing.xs },
  track: {
    width: 150,
    height: 6,
    borderRadius: 3,
    backgroundColor: studio.track,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: studio.sage },
  cards: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  trayEmpty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
