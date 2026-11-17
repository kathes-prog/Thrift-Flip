/**
 * Owner: P3.
 *
 * TODO(P3): first task — replace this placeholder with a basic rotating mesh
 * using `Canvas` from '@react-three/fiber/native' (backed by expo-gl) and
 * confirm it runs on the demo iPhone. Then build the front/back skirt whose
 * regions match the skirt guide's region IDs (fixtures/patterns.ts
 * SKIRT_REGION), and project clipped pieces onto it from current project state
 * every time the preview opens.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StubBanner } from '@/components/StubBanner';
import type { Project } from '@/model/types';
import { colors, Icon, radii, spacing } from '@/theme';

export function SkirtPreview({ project }: { project: Project }) {
  const placed = project.pieces.filter((p) => p.status === 'canvas').length;
  return (
    <View style={styles.box}>
      <StubBanner owner="P3" note="3D skirt preview goes here." />
      <Icon name="cube" size={48} color={colors.inkMuted} />
      <AppText color={colors.inkMuted}>{placed} placed pieces would appear on the skirt.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
});
