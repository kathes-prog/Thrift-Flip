/**
 * Shared: a square cut-out of white paper with a heavy outline. Pass `tilt`
 * (degrees) to make it look hand-placed; use <TornPaper> for ripped edges.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, lines, spacing } from '@/theme';

export function Card({
  children,
  style,
  tilt = 0,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tilt?: number;
}) {
  return (
    <View style={[styles.card, tilt ? { transform: [{ rotate: `${tilt}deg` }] } : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: lines.bold,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
