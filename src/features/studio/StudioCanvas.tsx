/**
 * Owner: P2.
 *
 * Draws the pattern guide (or a blank Freestyle canvas) and, once built, the
 * fabric polygons in the SAME SVG viewBox, which is the design canvas in cm.
 *
 * Placed pieces are drawn with geometry/transform.ts.
 *
 * TODO(P2): selection outline,
 * tap to select, pan to move (canvas claims the gesture once movement starts,
 * commit MOVE_PIECE on release, restore on cancel), cut mode with a live line.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon as SvgPolygon, Rect, Text as SvgText } from 'react-native-svg';

import { FREESTYLE_CANVAS, getPattern } from '@/fixtures/patterns';
import { pieceToDesign } from '@/geometry/transform';
import type { DesignMode, FabricPiece } from '@/model/types';
import type { Polygon } from '@/model/units';
import { colors, radii } from '@/theme';

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
}

export function StudioCanvas({ mode, pieces }: StudioCanvasProps) {
  const pattern = mode?.kind === 'pattern' ? getPattern(mode.patternId) : undefined;
  const canvas = pattern?.canvas ?? FREESTYLE_CANVAS;

  return (
    <View style={[styles.frame, { aspectRatio: canvas.widthCm / canvas.heightCm }]}>
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
        {pieces
          .filter((piece) => piece.status === 'canvas')
          .map((piece) => (
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
      </Svg>
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
});
