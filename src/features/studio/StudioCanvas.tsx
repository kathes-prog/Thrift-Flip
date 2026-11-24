/**
 * Owner: P2.
 *
 * The design canvas: a gridded sheet that fills the space it is given, with
 * the pattern guide (optional) and the fabric pieces drawn in design units
 * (cm). The design area is fitted and centred, so the grid simply continues
 * to the edges of the frame. When the frame grows (the Studio's drawer is
 * tucked away), pieces keep their size and the extra room appears below.
 *
 * Touch:
 * - Tap reports the piece under the finger (or null) through onTap.
 * What a drag does depends on `tool`:
 * - 'move': drag a piece to move it. It follows the finger locally and
 *   onMove is called once on release. A cancelled drag snaps back.
 * - 'rotate': drag anywhere to spin the selected piece about its centre. Its
 *   position is locked; the angle snaps to whole degrees (and to 45° steps
 *   when close) and onRotate is called once on release.
 * - 'cut' / 'stitch': dragging draws a straight line; on release it is handed
 *   to onStroke in design coordinates. Pieces don't move.
 *
 * Anything passed as children (Store / Discard buttons) floats over the canvas.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Polygon as SvgPolygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { pieceAt } from '@/geometry/hitTest';
import { pieceToDesign, screenToDesign, type Viewport } from '@/geometry/transform';
import type { DesignMode, FabricPiece } from '@/model/types';
import type { Point, Polygon } from '@/model/units';
import { Icon, radii, spacing } from '@/theme';

import { DenimDefs } from './denim';
import { studio } from './studioStyle';

/** Finger travel (points) before a touch counts as a drag instead of a tap. */
const DRAG_START_DISTANCE = 4;
/** Grid spacing on the canvas, in cm. */
const GRID_CM = 5;
/** Empty space kept around the design area when fitting it, as a share of the frame. */
const FIT_MARGIN = 0.04;
/** While rotating, angles this close to a multiple of 45° snap onto it. */
const SNAP_DEG = 4;
/** Fabric opacity while a pattern guide is showing, so the guide shows through. */
const PIECE_OPACITY_OVER_GUIDE = 0.78;
/** Strength of the light guide outline and labels drawn over fabric. */
const GUIDE_ON_FABRIC_OPACITY = 0.75;

export type CanvasTool = 'move' | 'rotate' | 'cut' | 'stitch';

function snapAngle(deg: number) {
  const nearest45 = Math.round(deg / 45) * 45;
  const snapped = Math.abs(deg - nearest45) <= SNAP_DEG ? nearest45 : Math.round(deg);
  return ((snapped % 360) + 360) % 360;
}

function angleDeg(from: Point, to: Point) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function points(polygon: Polygon) {
  return polygon.map((p) => `${p.x},${p.y}`).join(' ');
}

function centroid(polygon: Polygon) {
  const n = polygon.length || 1;
  return {
    x: polygon.reduce((s, p) => s + p.x, 0) / n,
    y: polygon.reduce((s, p) => s + p.y, 0) / n,
  };
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

interface StudioCanvasProps {
  mode: DesignMode | null;
  /** Every piece in the project; only those with status 'canvas' are drawn, in list order. */
  pieces: readonly FabricPiece[];
  selectedId: string | null;
  showGuide: boolean;
  /** A tap: the piece under the finger, or null on empty canvas. */
  onTap: (pieceId: string | null) => void;
  /** A drag started on this piece (so the screen can select it). */
  onDragStart: (pieceId: string) => void;
  /** Called once when a drag ends, with the piece's new centre in design coordinates. */
  onMove: (pieceId: string, position: Point) => void;
  /** What dragging does (see above). */
  tool: CanvasTool;
  /** Rotate tool: called once on release with the selected piece's new angle. */
  onRotate: (pieceId: string, rotationDeg: number) => void;
  /** Cut / stitch tools: called once when the line is released, ends in design coordinates. */
  onStroke: (from: Point, to: Point) => void;
  children?: ReactNode;
}

/** A drag in progress: how far the piece has moved so far, in cm. */
interface Drag {
  pieceId: string;
  dx: number;
  dy: number;
}

/** A rotation in progress: the angle the selected piece is shown at. */
interface Spin {
  pieceId: string;
  rotationDeg: number;
}

interface Stroke {
  from: Point;
  to: Point;
}

interface Size {
  width: number;
  height: number;
}

export function StudioCanvas({
  mode,
  pieces,
  selectedId,
  showGuide,
  onTap,
  onDragStart,
  onMove,
  tool,
  onRotate,
  onStroke,
  children,
}: StudioCanvasProps) {
  const pattern = mode?.kind === 'pattern' ? getPattern(mode.patternId) : undefined;
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;

  // `fit` is the smallest frame seen at this width. Fitting to it (not to the
  // current frame) means pieces keep their size when the Studio's drawer is
  // tucked away and the frame grows: the extra room just shows more grid below.
  const [frame, setFrame] = useState<{ size: Size; fit: Size } | null>(null);
  const size = frame?.size ?? null;
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setFrame((prev) => {
      const keep = prev && prev.fit.width === width && prev.fit.height <= height;
      return { size: { width, height }, fit: keep ? prev.fit : { width, height } };
    });
  };

  // Fit the design area inside that frame, centred, with a small margin.
  let viewport: Viewport = { scale: 1, offsetX: 0, offsetY: 0 };
  if (frame) {
    const { fit } = frame;
    const scale =
      Math.min(fit.width / canvas.widthCm, fit.height / canvas.heightCm) * (1 - FIT_MARGIN);
    viewport = {
      scale,
      offsetX: (frame.size.width - canvas.widthCm * scale) / 2,
      offsetY: (fit.height - canvas.heightCm * scale) / 2,
    };
  }

  const [drag, setDrag] = useState<Drag | null>(null);
  // The piece under the finger when the touch began; null when it began on empty canvas.
  const dragId = useRef<string | null>(null);
  const [spin, setSpin] = useState<Spin | null>(null);
  // Rotation: the piece's starting angle, and how far the finger has swept around its centre.
  const spinStart = useRef<{
    pieceId: string;
    centre: Point;
    base: number;
    last: number;
    swept: number;
  } | null>(null);
  const [stroke, setStroke] = useState<Stroke | null>(null);
  // Where the cut / stitch line started, in design coordinates.
  const strokeStart = useRef<Point | null>(null);

  // Gesture callbacks read the latest props through this ref, never stale ones.
  const latest = useRef({
    pieces,
    viewport,
    selectedId,
    tool,
    onTap,
    onDragStart,
    onMove,
    onRotate,
    onStroke,
  });
  useLayoutEffect(() => {
    latest.current = {
      pieces,
      viewport,
      selectedId,
      tool,
      onTap,
      onDragStart,
      onMove,
      onRotate,
      onStroke,
    };
  });

  const toDesign = (x: number, y: number) => screenToDesign(latest.current.viewport, { x, y });
  const pieceUnder = (x: number, y: number) => pieceAt(latest.current.pieces, toDesign(x, y));

  const tap = useTapGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.canceled) return;
      latest.current.onTap(pieceUnder(e.x, e.y)?.id ?? null);
    },
  });

  const pan = usePanGesture({
    runOnJS: true,
    minDistance: DRAG_START_DISTANCE,
    onBegin: (e) => {
      dragId.current = null;
      strokeStart.current = null;
      spinStart.current = null;
      const { tool: current, pieces: all, selectedId: sel } = latest.current;
      if (current === 'cut' || current === 'stitch') {
        strokeStart.current = toDesign(e.x, e.y);
      } else if (current === 'rotate') {
        const piece = all.find((p) => p.id === sel && p.status === 'canvas');
        if (!piece) return;
        const start = angleDeg(piece.position, toDesign(e.x, e.y));
        spinStart.current = {
          pieceId: piece.id,
          centre: piece.position,
          base: piece.rotationDeg,
          last: start,
          swept: 0,
        };
      } else {
        dragId.current = pieceUnder(e.x, e.y)?.id ?? null;
      }
    },
    onActivate: () => {
      if (dragId.current) latest.current.onDragStart(dragId.current);
    },
    onUpdate: (e) => {
      if (strokeStart.current) {
        setStroke({ from: strokeStart.current, to: toDesign(e.x, e.y) });
        return;
      }
      const s0 = spinStart.current;
      if (s0) {
        const now = angleDeg(s0.centre, toDesign(e.x, e.y));
        // Add up small steps so crossing ±180° doesn't make the piece jump.
        let step = now - s0.last;
        if (step > 180) step -= 360;
        if (step < -180) step += 360;
        s0.swept += step;
        s0.last = now;
        setSpin({ pieceId: s0.pieceId, rotationDeg: snapAngle(s0.base + s0.swept) });
        return;
      }
      const piece = latest.current.pieces.find((p) => p.id === dragId.current);
      if (!piece) return;
      const { scale } = latest.current.viewport;
      setDrag({ pieceId: piece.id, dx: e.translationX / scale, dy: e.translationY / scale });
    },
    onDeactivate: (e) => {
      if (e.canceled) return;
      if (strokeStart.current) {
        latest.current.onStroke(strokeStart.current, toDesign(e.x, e.y));
        return;
      }
      const s0 = spinStart.current;
      if (s0) {
        latest.current.onRotate(s0.pieceId, snapAngle(s0.base + s0.swept));
        return;
      }
      const piece = latest.current.pieces.find((p) => p.id === dragId.current);
      if (!piece) return;
      const { scale } = latest.current.viewport;
      latest.current.onMove(piece.id, {
        x: piece.position.x + e.translationX / scale,
        y: piece.position.y + e.translationY / scale,
      });
    },
    onFinalize: () => {
      dragId.current = null;
      strokeStart.current = null;
      spinStart.current = null;
      setDrag(null);
      setSpin(null);
      setStroke(null);
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  // While dragging or rotating, draw the piece where the finger has put it.
  const shown = (piece: FabricPiece): FabricPiece => {
    if (drag?.pieceId === piece.id) {
      return {
        ...piece,
        position: { x: piece.position.x + drag.dx, y: piece.position.y + drag.dy },
      };
    }
    if (spin?.pieceId === piece.id) return { ...piece, rotationDeg: spin.rotationDeg };
    return piece;
  };

  const guideShown = showGuide && !!pattern;
  const placed = pieces.filter((piece) => piece.status === 'canvas').map(shown);
  const selected = placed.find((piece) => piece.id === selectedId);

  // The Svg covers the whole frame; its viewBox is the frame in design units.
  const { scale, offsetX, offsetY } = viewport;
  const view = size
    ? {
        x: -offsetX / scale,
        y: -offsetY / scale,
        width: size.width / scale,
        height: size.height / scale,
      }
    : null;
  // Lines are sized in screen points, so they look the same at any zoom.
  const px = 1 / scale;
  const gridXs = view
    ? range(Math.ceil(view.x / GRID_CM), Math.floor((view.x + view.width) / GRID_CM))
    : [];
  const gridYs = view
    ? range(Math.ceil(view.y / GRID_CM), Math.floor((view.y + view.height) / GRID_CM))
    : [];

  const guideLabels = (fill: string) =>
    pattern?.guideRegions.map((region) => {
      const c = centroid(region.polygon);
      return (
        <SvgText
          key={`${region.id}-label-${fill}`}
          x={c.x}
          y={c.y}
          fontSize={12 * px}
          fontWeight="700"
          letterSpacing={1.5 * px}
          fill={fill}
          textAnchor="middle"
        >
          {region.label.toUpperCase()}
        </SvgText>
      );
    });

  return (
    <View style={styles.frame}>
      <GestureDetector gesture={gesture}>
        <View style={styles.touchArea} onLayout={onLayout}>
          {view ? (
            <Svg
              width="100%"
              height="100%"
              viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
            >
              <DenimDefs id="denim" spacing={1.4} />
              <Rect
                x={view.x}
                y={view.y}
                width={view.width}
                height={view.height}
                fill={studio.canvas}
              />
              {gridXs.map((i) => (
                <Line
                  key={`gx${i}`}
                  x1={i * GRID_CM}
                  y1={view.y}
                  x2={i * GRID_CM}
                  y2={view.y + view.height}
                  stroke={studio.grid}
                  strokeWidth={px}
                />
              ))}
              {gridYs.map((i) => (
                <Line
                  key={`gy${i}`}
                  x1={view.x}
                  y1={i * GRID_CM}
                  x2={view.x + view.width}
                  y2={i * GRID_CM}
                  stroke={studio.grid}
                  strokeWidth={px}
                />
              ))}
              {showGuide
                ? pattern?.guideRegions.map((region) => (
                    <SvgPolygon
                      key={region.id}
                      points={points(region.polygon)}
                      fill={studio.guideFill}
                      fillOpacity={0.7}
                      stroke={studio.guideStroke}
                      strokeWidth={1.5 * px}
                      strokeDasharray={`${4 * px} ${3 * px}`}
                    />
                  ))
                : null}
              {placed.map((piece) => (
                <SvgPolygon
                  key={piece.id}
                  points={points(pieceToDesign(piece))}
                  fill={piece.color}
                  fillOpacity={guideShown ? PIECE_OPACITY_OVER_GUIDE : 1}
                  stroke={studio.ink}
                  strokeOpacity={0.3}
                  strokeWidth={px}
                  strokeLinejoin="round"
                />
              ))}
              {placed.map((piece) => (
                <SvgPolygon
                  key={`${piece.id}-twill`}
                  points={points(pieceToDesign(piece))}
                  fill="url(#denim)"
                  fillOpacity={guideShown ? PIECE_OPACITY_OVER_GUIDE : 1}
                />
              ))}
              {/* Guide labels sit above the fabric so they're never hidden. */}
              {guideShown ? guideLabels(studio.muted) : null}
              {/* Where fabric covers the guide, redraw its outline and labels in a
                  light colour, clipped to the pieces, so the pattern still reads. */}
              {guideShown && placed.length > 0 ? (
                <>
                  <Defs>
                    <ClipPath id="on-fabric">
                      {placed.map((piece) => (
                        <SvgPolygon key={piece.id} points={points(pieceToDesign(piece))} />
                      ))}
                    </ClipPath>
                  </Defs>
                  <G clipPath="url(#on-fabric)" opacity={GUIDE_ON_FABRIC_OPACITY}>
                    {pattern?.guideRegions.map((region) => (
                      <SvgPolygon
                        key={`${region.id}-on-fabric`}
                        points={points(region.polygon)}
                        fill="none"
                        stroke={studio.card}
                        strokeWidth={1.5 * px}
                        strokeDasharray={`${4 * px} ${3 * px}`}
                      />
                    ))}
                    {guideLabels(studio.card)}
                  </G>
                </>
              ) : null}
              {selected ? (
                <SvgPolygon
                  points={points(pieceToDesign(selected))}
                  fill="none"
                  stroke={studio.selection}
                  strokeWidth={2.5 * px}
                  strokeDasharray={`${6 * px} ${3 * px}`}
                  strokeLinejoin="round"
                />
              ) : null}
              {selected && tool === 'rotate' ? (
                <Circle
                  cx={selected.position.x}
                  cy={selected.position.y}
                  r={4 * px}
                  fill={studio.selection}
                />
              ) : null}
              {stroke ? (
                <Line
                  x1={stroke.from.x}
                  y1={stroke.from.y}
                  x2={stroke.to.x}
                  y2={stroke.to.y}
                  stroke={tool === 'stitch' ? studio.stitch : studio.cutLine}
                  strokeWidth={2 * px}
                  strokeDasharray={`${6 * px} ${4 * px}`}
                  strokeLinecap="round"
                />
              ) : null}
            </Svg>
          ) : null}
          {placed.length === 0 ? (
            <View style={styles.empty} pointerEvents="none">
              <Icon name="layers" size={40} color={studio.muted} />
              <AppText variant="heading" color={studio.muted}>
                Build your design
              </AppText>
              <AppText variant="caption" color={studio.muted}>
                Tap a fabric piece below to add it
              </AppText>
            </View>
          ) : null}
          {spin ? (
            <View style={styles.anglePill} pointerEvents="none">
              <AppText variant="label" color={studio.card}>
                {`${spin.rotationDeg}°`}
              </AppText>
            </View>
          ) : null}
        </View>
      </GestureDetector>
      {children ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: studio.canvasBorder,
    backgroundColor: studio.canvas,
  },
  touchArea: { flex: 1 },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  overlay: { ...StyleSheet.absoluteFill },
  anglePill: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: studio.ink,
  },
});
