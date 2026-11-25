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
 * - Uncut joins a cut half back with its other half, any time after the cut.
 * - Rotate, Cut and Stitch are finger gestures on the canvas (StudioCanvas).
 * - The 3D view is P3's <SkirtPreview />. The sheet's totals come from P1's
 *   selectTracker() (with a temporary fallback while it returns zeros).
 */
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TapeLabel } from '@/components/zine/Decor';
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
import { colors, Icon, lines, spacing, text, type IconName } from '@/theme';

/** The quick-turn buttons in the Rotate row turn the piece this far. */
const ROTATE_STEP_DEG = 90;
/** How long a canvas toast stays up. */
const TOAST_MS = 3500;
/** New pieces are offset this far (cm) from the last one placed, cycling after a few. */
const PLACE_STAGGER_CM = 4;
const PLACE_STAGGER_STEPS = 5;
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
  // A short "it worked" note (e.g. after a cut). Shares the toast slot with `notice`.
  const [snip, setSnip] = useState<string | null>(null);

  // Toasts float over the canvas and clear themselves, so they never hide the
  // selected piece's own buttons.
  useEffect(() => {
    if (!notice && !snip) return;
    const t = setTimeout(() => {
      setNotice(null);
      setSnip(null);
    }, TOAST_MS);
    return () => clearTimeout(t);
  }, [notice, snip]);

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

  /** Uncut: the selected half and its other half become one piece again, any time after the cut. */
  const joinBack = () => {
    if (!selected) return;
    const done = attempt(
      { type: 'UNCUT_PIECE', pieceId: selected.id },
      "Can't uncut: its other half was cut again, stitched or thrown away.",
    );
    if (done) {
      setOpenTool(null);
      // Keep the joined piece selected (it gets back the original piece's id).
      if (selected.cutFrom) setSelectedId(selected.cutFrom.parent.id);
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
      setSnip('SNIP! Cut into 2 pieces. Select one and tap Uncut to join them back.');
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
        // Each new piece lands a little down-right of the last, so stacked pieces stay visible.
        position: {
          x: canvas.widthCm / 2 + PLACE_STAGGER_CM * (onCanvas.length % PLACE_STAGGER_STEPS),
          y: canvas.heightCm / 2 + PLACE_STAGGER_CM * (onCanvas.length % PLACE_STAGGER_STEPS),
        },
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
      label: 'Uncut',
      icon: 'uncut',
      disabled: !selected?.cutFrom,
      onPress: joinBack,
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
          hitSlop={8}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.floatingPressed]}
        >
          <Icon name="back" size={20} color={studio.ink} />
        </Pressable>
        <View style={styles.headerTitle}>
          <AppText variant="heading" color={studio.ink} numberOfLines={1} style={styles.titleText}>
            {title.toUpperCase()}
          </AppText>
          <AppText variant="caption" color={studio.muted} numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/cutting-plan')}
          style={({ pressed }) => [styles.doneButton, pressed && styles.floatingPressed]}
        >
          <AppText variant="label" color={studio.ink}>
            DONE
          </AppText>
        </Pressable>
      </View>

      {/* Canvas bar */}
      <View style={styles.canvasBar}>
        <TapeLabel>{pattern ? `${pattern.name.toUpperCase()} PATTERN` : 'BLANK CANVAS'}</TapeLabel>
        <View style={styles.canvasBarRight}>
          {pattern?.has3dPreview ? (
            <BarToggle
              label={view === '2d' ? 'VIEW IN 3D' : 'BACK TO 2D'}
              onPress={() => setView(view === '2d' ? '3d' : '2d')}
            />
          ) : null}
          {pattern && view === '2d' ? (
            <BarToggle
              label={showGuide ? 'HIDE GUIDE' : 'SHOW GUIDE'}
              onPress={() => setShowGuide(!showGuide)}
            />
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
          />
        ) : (
          // Clipped so a tall preview can never cover the canvas bar (and its Back to 2D).
          <View style={styles.preview}>
            <SkirtPreview project={project} />
          </View>
        )}
        {notice || snip ? (
          <View
            style={[styles.toast, notice ? styles.toastWarn : styles.toastOk]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            pointerEvents="none"
          >
            {notice ? (
              <AppText style={[text.heading, styles.toastMark]} color={colors.danger}>
                !
              </AppText>
            ) : null}
            <AppText
              variant="caption"
              color={notice ? studio.ink : colors.highlight}
              style={styles.toastText}
              numberOfLines={3}
            >
              {notice ?? snip}
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Tool row */}
      <View style={styles.tools}>
        {tools.map((t) => (
          // In 3D you can't see what you'd change, so editing waits for 2D.
          <ToolButton key={t.icon} {...t} disabled={t.disabled || view === '3d'} />
        ))}
      </View>

      {/* Option area: a fixed height, so opening a tool never resizes the canvas */}
      <View style={styles.optionArea}>
        {view === '3d' ? (
          <AppText variant="caption" color={studio.muted} style={styles.message}>
            Viewing in 3D. Tap Back to 2D to keep editing.
          </AppText>
        ) : selected && tool === 'rotate' ? (
          <View style={styles.optionRow}>
            <StepButton
              mirrored
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
              label="↔ LEFT–RIGHT"
              onPress={() =>
                dispatch({ type: 'FLIP_PIECE', pieceId: selected.id, axis: 'horizontal' })
              }
            />
            <OptionButton
              label="↕ TOP–BOTTOM"
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
        ) : hint ? (
          <View style={styles.callout}>
            <AppText variant="caption" style={styles.calloutText} numberOfLines={2}>
              {hint}
            </AppText>
          </View>
        ) : selected ? (
          // The selected piece's own actions live here, not floating over the canvas.
          <View style={styles.selectedBar}>
            <View style={styles.selectedInfo}>
              <AppText variant="label" numberOfLines={2} style={styles.selectedName}>
                {selected.displayName.toUpperCase()}
              </AppText>
              <AppText variant="caption" color={studio.muted}>
                {formatArea(selected.areaCm2)}
              </AppText>
            </View>
            <PieceAction
              label="Store"
              icon="store"
              onPress={() =>
                attempt(
                  { type: 'STORE_PIECE', pieceId: selected.id },
                  `${selected.displayName} can't be stored right now.`,
                )
              }
            />
            {/* Returns the piece to the pile (RETURN_PIECE); nothing is thrown away. */}
            <PieceAction
              label="To pile"
              icon="restore"
              onPress={() =>
                attempt(
                  { type: 'RETURN_PIECE', pieceId: selected.id },
                  `${selected.displayName} can't be removed right now.`,
                )
              }
            />
          </View>
        ) : (
          <AppText variant="caption" color={studio.muted} style={styles.message}>
            {onCanvas.length === 0
              ? 'Tap a piece in the pile to add it to the canvas.'
              : 'Tap a piece on the canvas to select it.'}
          </AppText>
        )}
      </View>

      {/* Fabric pieces sheet: drag it down to give the canvas more room */}
      <PieceDrawer
        bottomInset={insets.bottom + spacing.sm}
        header={
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitle}>
              <TapeLabel>THE PILE</TapeLabel>
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
        {view === '3d' ? (
          <AppText variant="caption" color={studio.muted} style={styles.trayEmpty}>
            Go back to 2D to add or move pieces.
          </AppText>
        ) : tray.length === 0 ? (
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

/** Store / To pile for the selected piece. */
function PieceAction({
  label,
  icon,
  onPress,
  tone,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  tone?: 'danger';
}) {
  const color = tone === 'danger' ? studio.discard : studio.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.floating,
        tone === 'danger' && { borderColor: studio.discardBorder },
        pressed && styles.floatingPressed,
      ]}
    >
      <Icon name={icon} size={18} color={color} />
      <AppText variant="label" color={color}>
        {label.toUpperCase()}
      </AppText>
    </Pressable>
  );
}

function BarToggle({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.barToggle, pressed && styles.floatingPressed]}
    >
      <AppText variant="label" color={studio.ink} style={styles.barToggleText}>
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

/** A quarter-turn button: the rotate icon, mirrored for turning left. */
function StepButton({
  mirrored,
  accessibilityLabel,
  onPress,
}: {
  mirrored?: boolean;
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
      <View style={mirrored ? styles.mirrored : undefined}>
        <Icon name="rotate" size={22} color={studio.ink} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: studio.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    backgroundColor: studio.bar,
  },
  backButton: {
    width: 44,
    height: 44,
    borderWidth: lines.bold,
    borderColor: studio.ink,
    backgroundColor: studio.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    height: 44,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: lines.bold,
    borderColor: studio.ink,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, alignItems: 'center' },
  titleText: { transform: [{ rotate: '-2deg' }] },
  barToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: lines.thin,
    borderColor: studio.ink,
    backgroundColor: colors.highlight,
  },
  barToggleText: { fontSize: 11, lineHeight: 14 },
  sheetTitle: { gap: spacing.xs },
  canvasBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  canvasBarRight: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  canvasArea: { flex: 1, paddingHorizontal: spacing.md },
  preview: { flex: 1, overflow: 'hidden' },
  floating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderWidth: lines.bold,
    borderColor: studio.ink,
    backgroundColor: studio.card,
  },
  floatingPressed: { backgroundColor: colors.highlight },
  selectedBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 12, lineHeight: 15 },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderWidth: lines.bold,
    borderStyle: 'dashed',
    borderColor: studio.ink,
  },
  toast: {
    position: 'absolute',
    left: spacing.md + spacing.sm,
    right: spacing.md + spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    transform: [{ rotate: '-1deg' }],
  },
  // Rejected edit: white note, stamp-pink border and "!".
  toastWarn: {
    backgroundColor: colors.surface,
    borderWidth: lines.heavy,
    borderColor: colors.danger,
  },
  // Success: black label-maker strip with highlighter text.
  toastOk: { backgroundColor: colors.ink },
  toastMark: { fontSize: 22, lineHeight: 28 },
  toastText: { flex: 1 },
  calloutText: { flex: 1, color: studio.ink },
  mirrored: { transform: [{ scaleX: -1 }] },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingTop: spacing.sm,
  },
  optionArea: { height: 60, justifyContent: 'center', paddingHorizontal: spacing.md },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  swatch: {
    width: 36,
    height: 36,
    borderWidth: lines.bold,
    borderColor: studio.ink,
  },
  swatchChosen: { borderWidth: 4, borderColor: studio.selection },
  resizeInfo: { alignItems: 'center' },
  flipRow: { justifyContent: 'center', gap: spacing.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderWidth: lines.bold,
    borderColor: studio.ink,
    backgroundColor: studio.card,
  },
  step: {
    width: 44,
    height: 44,
    borderWidth: lines.bold,
    borderColor: studio.ink,
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
    height: 14,
    borderWidth: lines.bold,
    borderColor: studio.ink,
    backgroundColor: studio.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.highlight,
    borderRightWidth: lines.bold,
    borderRightColor: studio.ink,
  },
  cards: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  trayEmpty: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
