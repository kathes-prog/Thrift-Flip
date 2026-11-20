/**
 * Owner: P2.
 *
 * The design canvas: a gridded sheet that fills the space it is given, with
 * the pattern guide (optional) and the fabric pieces drawn in design units
 * (cm). The design area is fitted and centred, so the grid simply continues
 * to the edges of the frame.
 *
 * Touch:
 * - Tap reports the piece under the finger (or null) through onTap.
 * - Drag a piece to move it. The canvas claims the gesture once the finger
 *   moves; the piece (and anything stitched to it) follows the finger
 *   locally, and onMove is called once on release. A cancelled drag snaps back.
 * - In cut mode, dragging draws a straight line instead; on release the line
 *   is handed to onCut (in design coordinates). Pieces don't move.
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
import Svg, { Line, Polygon as SvgPolygon, Rect, Text as SvgText } from 'react-native-svg';

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
  /** When true, dragging draws a cut line instead of moving a piece. */
  cutMode: boolean;
  /** Called once when a cut line is released, with both ends in design coordinates. */
  onCut: (from: Point, to: Point) => void;
  children?: ReactNode;
}

/** A drag in progress: how far the piece (and its group) has moved so far, in cm. */
interface Drag {
  pieceId: string;
  groupId?: string;
  dx: number;
  dy: number;
}

interface CutLine {
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
  cutMode,
  onCut,
  children,
}: StudioCanvasProps) {
  const pattern = mode?.kind === 'pattern' ? getPattern(mode.patternId) : undefined;
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;

  const [size, setSize] = useState<Size | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  // Fit the design area inside the frame, centred, with a small margin.
  let viewport: Viewport = { scale: 1, offsetX: 0, offsetY: 0 };
  if (size) {
    const scale =
      Math.min(size.width / canvas.widthCm, size.height / canvas.heightCm) * (1 - FIT_MARGIN);
    viewport = {
      scale,
      offsetX: (size.width - canvas.widthCm * scale) / 2,
      offsetY: (size.height - canvas.heightCm * scale) / 2,
    };
  }

  const [drag, setDrag] = useState<Drag | null>(null);
  // The piece under the finger when the touch began; null when it began on empty canvas.
  const dragId = useRef<string | null>(null);
  const [cutLine, setCutLine] = useState<CutLine | null>(null);
  // Where the cut stroke started, in design coordinates.
  const cutStart = useRef<Point | null>(null);

  // Gesture callbacks read the latest props through this ref, never stale ones.
  const latest = useRef({ pieces, viewport, onTap, onDragStart, onMove, cutMode, onCut });
  useLayoutEffect(() => {
    latest.current = { pieces, viewport, onTap, onDragStart, onMove, cutMode, onCut };
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
      if (latest.current.cutMode) {
        cutStart.current = toDesign(e.x, e.y);
        dragId.current = null;
      } else {
        cutStart.current = null;
        dragId.current = pieceUnder(e.x, e.y)?.id ?? null;
      }
    },
    onActivate: () => {
      if (dragId.current) latest.current.onDragStart(dragId.current);
    },
    onUpdate: (e) => {
      if (cutStart.current) {
        setCutLine({ from: cutStart.current, to: toDesign(e.x, e.y) });
        return;
      }
      const piece = latest.current.pieces.find((p) => p.id === dragId.current);
      if (!piece) return;
      const { scale } = latest.current.viewport;
      setDrag({
        pieceId: piece.id,
        groupId: piece.groupId,
        dx: e.translationX / scale,
        dy: e.translationY / scale,
      });
    },
    onDeactivate: (e) => {
      if (cutStart.current) {
        if (!e.canceled) latest.current.onCut(cutStart.current, toDesign(e.x, e.y));
        return;
      }
      const piece = latest.current.pieces.find((p) => p.id === dragId.current);
      if (!piece || e.canceled) return;
      const { scale } = latest.current.viewport;
      latest.current.onMove(piece.id, {
        x: piece.position.x + e.translationX / scale,
        y: piece.position.y + e.translationY / scale,
      });
    },
    onFinalize: () => {
      dragId.current = null;
      cutStart.current = null;
      setDrag(null);
      setCutLine(null);
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  // While dragging, draw the piece (and its stitched group) where the finger is.
  const moving = (piece: FabricPiece) =>
    drag !== null &&
    (piece.id === drag.pieceId || (drag.groupId !== undefined && piece.groupId === drag.groupId));
  const shown = (piece: FabricPiece): FabricPiece =>
    drag && moving(piece)
      ? { ...piece, position: { x: piece.position.x + drag.dx, y: piece.position.y + drag.dy } }
      : piece;

  const placed = pieces.filter((piece) => piece.status === 'canvas').map(shown);
  const selected = placed.find((piece) => piece.id === selectedId);
  const groupMates = selected?.groupId
    ? placed.filter((p) => p.groupId === selected.groupId && p.id !== selected.id)
    : [];

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
              {showGuide
                ? pattern?.guideRegions.map((region) => {
                    const c = centroid(region.polygon);
                    return (
                      <SvgText
                        key={`${region.id}-label`}
                        x={c.x}
                        y={c.y}
                        fontSize={12 * px}
                        fontWeight="700"
                        letterSpacing={1.5 * px}
                        fill={studio.muted}
                        textAnchor="middle"
                      >
                        {region.label.toUpperCase()}
                      </SvgText>
                    );
                  })
                : null}
              {placed.map((piece) => (
                <SvgPolygon
                  key={piece.id}
                  points={points(pieceToDesign(piece))}
                  fill={piece.color}
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
                />
              ))}
              {groupMates.map((piece) => (
                <SvgPolygon
                  key={`${piece.id}-group`}
                  points={points(pieceToDesign(piece))}
                  fill="none"
                  stroke={studio.stitch}
                  strokeWidth={2 * px}
                  strokeDasharray={`${3 * px} ${2 * px}`}
                  strokeLinejoin="round"
                />
              ))}
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
              {cutLine ? (
                <Line
                  x1={cutLine.from.x}
                  y1={cutLine.from.y}
                  x2={cutLine.to.x}
                  y2={cutLine.to.y}
                  stroke={studio.cutLine}
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
});
