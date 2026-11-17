import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';

export type Owner = 'P1' | 'P2' | 'P3' | 'Shared';

const ownerNames: Record<Owner, string> = {
  P1: 'Person 1 · Materials and tracking',
  P2: 'Person 2 · 2D editor and touch',
  P3: 'Person 3 · 3D and output',
  Shared: 'Shared',
};

/** Marks placeholder UI so nobody mistakes a stub for finished work. Remove when built. */
export function StubBanner({ owner, note }: { owner: Owner; note: string }) {
  return (
    <View style={styles.banner}>
      <AppText variant="label" color={colors.warning}>
        STUB · {ownerNames[owner]}
      </AppText>
      <AppText variant="caption" color={colors.inkMuted}>
        {note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.warning,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 2,
  },
});
