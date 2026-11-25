import { StyleSheet, View } from 'react-native';

import { colors, lines, spacing } from '@/theme';

import { AppText } from './AppText';
import { TapeLabel } from './zine/Decor';

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
      <TapeLabel>{`STUB · ${owner}`}</TapeLabel>
      <AppText variant="caption" color={colors.inkMuted} style={styles.note}>
        {`${ownerNames[owner]}: ${note}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: lines.thin,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    padding: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  note: { flex: 1, fontSize: 11, lineHeight: 15 },
});
