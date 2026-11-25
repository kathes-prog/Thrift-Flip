/**
 * Owner: P3.
 *
 * TODO(P3): show the selected pattern, placed pieces and their source
 * garments, and the total used area. Show template-specific steps when the
 * pattern has prepared instructions, or a material summary for Freestyle.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StubBanner } from '@/components/StubBanner';
import { TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { getPattern } from '@/fixtures/patterns';
import type { Project } from '@/model/types';
import { formatArea } from '@/model/units';
import { colors, lines, spacing, text } from '@/theme';

export function CuttingPlanSummary({ project }: { project: Project }) {
  const mode = project.mode;
  const name =
    mode?.kind === 'pattern'
      ? (getPattern(mode.patternId)?.name ?? 'Unknown pattern')
      : mode?.kind === 'freestyle'
        ? 'Freestyle'
        : 'No design chosen';
  const placed = project.pieces.filter((p) => p.status === 'canvas');
  const usedCm2 = placed.reduce((sum, p) => sum + p.areaCm2, 0);

  return (
    <View style={styles.wrap}>
      <StubBanner owner="P3" note="Summary, sources, used area and construction steps." />
      <TornPaper depth={4} style={styles.summary}>
        <AppText style={text.title}>{name.toUpperCase()}</AppText>
        <AppText variant="bodyStrong">
          {placed.length} {placed.length === 1 ? 'piece' : 'pieces'} · {formatArea(usedCm2)} used
        </AppText>
      </TornPaper>
      <TapeLabel>WHAT GOES WHERE</TapeLabel>
      {placed.length === 0 ? (
        <AppText variant="caption" color={colors.inkMuted}>
          Nothing on the canvas yet. Place pieces in the Studio and they&apos;ll be listed here.
        </AppText>
      ) : (
        <View style={styles.list}>
          {placed.map((piece, i) => (
            <View key={piece.id} style={[styles.row, i > 0 && styles.divider]}>
              <View style={[styles.swatch, { backgroundColor: piece.color }]} />
              <View style={styles.piece}>
                <AppText>{piece.displayName}</AppText>
                <AppText variant="caption" color={colors.inkMuted}>
                  {project.sources.find((s) => s.id === piece.sourceId)?.displayName ?? '?'}
                </AppText>
              </View>
              <AppText variant="bodyStrong">{formatArea(piece.areaCm2)}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  summary: { gap: spacing.xs },
  // A ruled box: solid lines, since iOS can't dash a single border side.
  list: { borderWidth: lines.bold, borderColor: colors.ink, backgroundColor: colors.surface },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink },
  swatch: { width: 14, height: 28, borderWidth: 1.5, borderColor: colors.ink },
  piece: { flex: 1 },
});
