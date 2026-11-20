/**
 * Owner: P2. The Design Studio, laid out like the hi-fi Figma frame:
 * header (back · title · Done), canvas bar (mode · 3D · Show guide), the
 * canvas with Store / Discard, the tool row, and the "Fabric pieces" sheet.
 *
 * - Tapping a tray card sends PLACE_PIECE; P1's inventory handler decides
 *   whether it may go on the canvas (e.g. a third jeans pocket is rejected).
 * - Store / Discard send P1's STORE_PIECE / DISCARD_PIECE for the selection.
 * - The 3D view is P3's <SkirtPreview />. The sheet's totals come from P1's
 *   selectTracker().
 */
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { SkirtPreview } from '@/features/preview3d/SkirtPreview';
import { newFragmentIds, newGroupId } from '@/features/studio/ids';
import { PIECE_COLORS } from '@/features/studio/palette';
import { PieceCard, sizeLabel } from '@/features/studio/PieceCard';
import { StudioCanvas } from '@/features/studio/StudioCanvas';
import { studio } from '@/features/studio/studioStyle';
import { ToolButton } from '@/features/studio/ToolButton';
import type { FabricPiece } from '@/model/types';
import { formatArea, type Point } from '@/model/units';
import type { ProjectAction } from '@/state/actions';
import { useProject } from '@/state/ProjectContext';
import { applyProjectAction } from '@/state/reducer';
import { selectTracker } from '@/state/selectors';
import { Icon, radii, spacing, type IconName } from '@/theme';

/** Each tap of Rotate turns the selected piece this far clockwise. */
const ROTATE_STEP_DEG = 90;
/** Each tap of Resize − / + scales the selected piece by this factor. */
const RESIZE_STEP = 1.1;

/** The tool whose option row or mode is open. Only one at a time. */
type Tool = 'color' | 'resize' | 'cut' | 'stitch';

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
  const tracker = selectTracker(project);

  // A selection only counts while that piece is on the canvas (undo or a cut can remove it).
  const selected = onCanvas.find((p) => p.id === selectedId);
  // Tools only stay open while there is something selected to use them on.
  const tool = selected ? openTool : null;

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

  const toggleTool = (next: Tool) => {
    setOpenTool(tool === next ? null : next);
    setNotice(null);
  };

  // ---- canvas callbacks

  const onTap = (pieceId: string | null) => {
    if (tool === 'stitch' && selected) {
      if (pieceId && pieceId !== selected.id) {
        attempt(
          { type: 'STITCH_PIECES', pieceIds: [selected.id, pieceId], groupId: newGroupId() },
          'Those pieces are already stitched together.',
        );
      }
      setOpenTool(null);
      return;
    }
    select(pieceId);
  };

  const onDragStart = (pieceId: string) => {
    if (pieceId !== selectedId) select(pieceId);
  };

  const onCut = (from: Point, to: Point) => {
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
      onPress: () =>
        selected &&
        dispatch({
          type: 'ROTATE_PIECE',
          pieceId: selected.id,
          rotationDeg: selected.rotationDeg + ROTATE_STEP_DEG,
        }),
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
      onPress: () => selected && dispatch({ type: 'FLIP_PIECE', pieceId: selected.id }),
    },
    {
      label: 'Resize',
      icon: 'resize',
      disabled: !selected,
      active: tool === 'resize',
      onPress: () => toggleTool('resize'),
    },
    {
      label: 'Cut',
      icon: 'cut',
      disabled: !selected,
      active: tool === 'cut',
      onPress: () => toggleTool('cut'),
    },
    {
      label: selected?.groupId ? 'Unstitch' : 'Stitch',
      icon: 'stitch',
      disabled: !selected,
      active: tool === 'stitch',
      onPress: () => {
        if (selected?.groupId) {
          dispatch({ type: 'UNSTITCH_PIECE', pieceId: selected.id });
          setOpenTool(null);
        } else {
          toggleTool('stitch');
        }
      },
    },
  ];

  const hint =
    tool === 'cut'
      ? 'Drag a line across the selected piece to cut it.'
      : tool === 'stitch'
        ? `Tap another piece to stitch it to ${selected?.displayName ?? 'this one'}.`
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
            cutMode={tool === 'cut'}
            onCut={onCut}
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
                    { type: 'DISCARD_PIECE', pieceId: selected.id },
                    `${selected.displayName} can't be discarded right now.`,
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tools}
        style={styles.toolsScroll}
      >
        {tools.map((t) => (
          <ToolButton key={t.icon} {...t} />
        ))}
      </ScrollView>

      {/* Option area: a fixed height, so opening a tool never resizes the canvas */}
      <View style={styles.optionArea}>
        {selected && tool === 'color' ? (
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
        ) : selected && tool === 'resize' ? (
          <View style={styles.optionRow}>
            <StepButton
              label="−"
              accessibilityLabel="Make smaller"
              onPress={() =>
                attempt(
                  { type: 'RESIZE_PIECE', pieceId: selected.id, factor: 1 / RESIZE_STEP },
                  'This piece is as small as it can go.',
                )
              }
            />
            <View style={styles.resizeInfo}>
              <AppText variant="label" color={studio.ink}>
                {sizeLabel(selected.polygon)}
              </AppText>
              <AppText variant="caption" color={notice ? studio.discard : studio.muted}>
                {notice ?? formatArea(selected.areaCm2)}
              </AppText>
            </View>
            <StepButton
              label="+"
              accessibilityLabel="Make bigger"
              onPress={() =>
                dispatch({ type: 'RESIZE_PIECE', pieceId: selected.id, factor: RESIZE_STEP })
              }
            />
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

      {/* Fabric pieces sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}>
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
      </View>
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
  toolsScroll: { flexGrow: 0 },
  tools: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: 2 },
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
  sheet: {
    backgroundColor: studio.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
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
