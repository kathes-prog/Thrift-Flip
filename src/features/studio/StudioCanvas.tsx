/**
 * Owner: P2.
 *
 * Draws the pattern guide (or a blank Freestyle canvas) and the fabric
 * polygons in the SAME SVG viewBox, which is the design canvas in cm.
 *
 * Touch:
 * - Tap a piece to select it; tap empty canvas to deselect.
 * - Drag a piece to move it. The canvas claims the gesture once the finger
 *   moves, the piece follows the finger locally, and MOVE_PIECE is sent once
 *   on release. A cancelled drag snaps back.
 * - In cut mode, dragging draws a straight line instead; on release the line
 *   is handed to onCut (in design coordinates). Pieces don't move.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Svg, { Line, Polygon as SvgPolygon, Rect, Text as SvgText } from 'react-native-svg';

import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { pieceAt } from '@/geometry/hitTest';
import { pieceToDesign, screenToDesign, type Viewport } from '@/geometry/transform';
import type { DesignMode, FabricPiece } from '@/model/types';
import type { Point, Polygon } from '@/model/units';
import { colors, radii } from '@/theme';

/** Finger travel (points) before a touch counts as a drag instead of a tap. */
const DRAG_START_DISTANCE = 4;

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

interface StudioCanvasProps {
  mode: DesignMode | null;
  /** Every piece in the project; only those with status 'canvas' are drawn, in list order. */
  pieces: readonly FabricPiece[];
  selectedId: string | null;
  /** A piece id, or null when the user taps empty canvas. */
  onSelect: (pieceId: string | null) => void;
  /** Called once when a drag ends, with the piece's new centre in design coordinates. */
  onMove: (pieceId: string, position: Point) => void;
  /** When true, dragging draws a cut line instead of moving a piece. */
  cutMode: boolean;
  /** Called once when a cut line is released, with both ends in design coordinates. */
  onCut: (from: Point, to: Point) => void;
}

/** A piece being dragged: how far it has moved so far, in cm. */
interface Drag {
  pieceId: string;
  dx: number;
  dy: number;
}

/** A cut line being drawn, in design coordinates (cm). */
interface CutLine {
  from: Point;
  to: Point;
}

export function StudioCanvas({
  mode,
  pieces,
  selectedId,
  onSelect,
  onMove,
  cutMode,
  onCut,
}: StudioCanvasProps) {
  const pattern = mode?.kind === 'pattern' ? getPattern(mode.patternId) : undefined;
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;

  // The SVG fills this view exactly, so screen points map to cm by one scale factor.
  const [viewport, setViewport] = useState<Viewport>({ scale: 1, offsetX: 0, offsetY: 0 });
  const onLayout = (e: LayoutChangeEvent) =>
    setViewport({ scale: e.nativeEvent.layout.width / canvas.widthCm, offsetX: 0, offsetY: 0 });

  const [drag, setDrag] = useState<Drag | null>(null);
  // The piece under the finger when the touch began; null when it began on empty canvas.
  const dragId = useRef<string | null>(null);

  const [cutLine, setCutLine] = useState<CutLine | null>(null);
  // Where the cut stroke started, in design coordinates.
  const cutStart = useRef<Point | null>(null);

  // Gesture callbacks read the latest props through this ref, never stale ones.
  const latest = useRef({ pieces, viewport, onSelect, onMove, cutMode, onCut });
  useLayoutEffect(() => {
    latest.current = { pieces, viewport, onSelect, onMove, cutMode, onCut };
  });

  const toDesign = (x: number, y: number) => screenToDesign(latest.current.viewport, { x, y });

  const pieceUnder = (x: number, y: number) => pieceAt(latest.current.pieces, toDesign(x, y));

  const tap = useTapGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.canceled) return;
      latest.current.onSelect(pieceUnder(e.x, e.y)?.id ?? null);
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
      if (dragId.current) latest.current.onSelect(dragId.current);
    },
    onUpdate: (e) => {
      if (cutStart.current) {
        setCutLine({ from: cutStart.current, to: toDesign(e.x, e.y) });
        return;
      }
      const pieceId = dragId.current;
      if (!pieceId) return;
      const { scale } = latest.current.viewport;
      setDrag({ pieceId, dx: e.translationX / scale, dy: e.translationY / scale });
    },
    onDeactivate: (e) => {
      if (cutStart.current) {
        if (!e.canceled) latest.current.onCut(cutStart.current, toDesign(e.x, e.y));
        return;
      }
      const pieceId = dragId.current;
      const piece = latest.current.pieces.find((p) => p.id === pieceId);
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

  // While dragging, draw the piece where the finger is, not where the project says.
  const shown = (piece: FabricPiece): FabricPiece =>
    drag?.pieceId === piece.id
      ? { ...piece, position: { x: piece.position.x + drag.dx, y: piece.position.y + drag.dy } }
      : piece;

  const placed = pieces.filter((piece) => piece.status === 'canvas').map(shown);
  const selected = placed.find((piece) => piece.id === selectedId);

  return (
    <View style={[styles.frame, { aspectRatio: canvas.widthCm / canvas.heightCm }]}>
      <GestureDetector gesture={gesture}>
        <View style={styles.touchArea} onLayout={onLayout}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${canvas.widthCm} ${canvas.heightCm}`}>
            <Rect width={canvas.widthCm} height={canvas.heightCm} fill={colors.surface} />
            {pattern?.guideRegions.map((region) => (
              <SvgPolygon
                key={region.id}
                points={points(region.polygon)}
                fill={colors.guideFill}
                stroke={colors.guideStroke}
                strokeWidth={0.4}
                strokeDasharray="1.5 1"
              />
            ))}
            {pattern?.guideRegions.map((region) => {
              const c = centroid(region.polygon);
              return (
                <SvgText
                  key={`${region.id}-label`}
                  x={c.x}
                  y={c.y}
                  fontSize={3.5}
                  fill={colors.inkMuted}
                  textAnchor="middle"
                >
                  {region.label}
                </SvgText>
              );
            })}
            {placed.map((piece) => (
              <SvgPolygon
                key={piece.id}
                points={points(pieceToDesign(piece))}
                fill={piece.color}
                stroke={colors.ink}
                strokeOpacity={0.35}
                strokeWidth={0.3}
                strokeLinejoin="round"
              />
            ))}
            {selected ? (
              <SvgPolygon
                points={points(pieceToDesign(selected))}
                fill="none"
                stroke={colors.selection}
                strokeWidth={0.8}
                strokeDasharray="2 1"
                strokeLinejoin="round"
              />
            ) : null}
            {cutLine ? (
              <Line
                x1={cutLine.from.x}
                y1={cutLine.from.y}
                x2={cutLine.to.x}
                y2={cutLine.to.y}
                stroke={colors.danger}
                strokeWidth={0.6}
                strokeDasharray="2 1.2"
                strokeLinecap="round"
              />
            ) : null}
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  touchArea: { flex: 1 },
});
