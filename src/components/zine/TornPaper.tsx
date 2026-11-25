/**
 * Shared: a scrap of paper with ripped top and bottom edges, drawn behind its
 * children. The edge pattern is fixed (seeded by `seed`), so a scrap keeps the
 * same tear on every render.
 */
import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

/** Tooth heights (0–1) cycled along an edge. */
const TEETH = [0.2, 0.9, 0.4, 1, 0.1, 0.7, 0.3, 0.95, 0.5, 0.15, 0.8, 0.35];
const TOOTH_WIDTH = 14;

interface TornPaperProps {
  children: ReactNode;
  color?: string;
  /** Degrees. Small values (±2) look hand-placed. */
  tilt?: number;
  /** How deep the tear bites into the paper, in points. */
  depth?: number;
  /** Shifts the tear pattern so neighbouring scraps don't match. */
  seed?: number;
  style?: StyleProp<ViewStyle>;
}

export function TornPaper({
  children,
  color = colors.surface,
  tilt = 0,
  depth = 5,
  seed = 0,
  style,
}: TornPaperProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };

  return (
    <View
      onLayout={onLayout}
      style={[styles.base, { transform: [{ rotate: `${tilt}deg` }] }, style]}
    >
      {size ? (
        <Svg style={StyleSheet.absoluteFill} width={size.w} height={size.h} pointerEvents="none">
          <Path d={tornPath(size.w, size.h, depth, seed)} fill={color} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

export function tornPath(w: number, h: number, depth: number, seed: number) {
  const steps = Math.max(2, Math.round(w / TOOTH_WIDTH));
  const tooth = (i: number) => (TEETH[(i + seed) % TEETH.length] ?? 0) * depth;
  let d = `M0 ${tooth(0)}`;
  for (let i = 1; i <= steps; i++) d += ` L${(w * i) / steps} ${tooth(i)}`;
  for (let i = steps; i >= 0; i--) d += ` L${(w * i) / steps} ${h - tooth(i + 5)}`;
  return `${d} Z`;
}

const styles = StyleSheet.create({
  // Padding keeps content clear of the tear.
  base: { paddingVertical: 14, paddingHorizontal: 16 },
});
