/**
 * Owner: P3. Summary of the design: pieces used, area, sources, and the
 * cut-and-stitch steps. Zine look: a torn summary card with three tallies,
 * then the steps as numbered typewriter lines.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { getPattern } from '@/fixtures/patterns';
import type { Project } from '@/model/types';
import { formatArea } from '@/model/units';
import { colors, fonts, lines, spacing, text } from '@/theme';

const STEPS: [string, string, string][] = [
  ['01', 'Cut the body panels', '2 × 34 × 38 cm from the lower legs'],
  ['02', 'Prepare the straps', '2 × 8 × 62 cm; fold edges inward'],
  ['03', 'Join the bag body', 'Faces together, stitch side and base seams'],
  ['04', 'Finish & attach straps', 'Topstitch opening, attach 9 cm from edges'],
];

export function CuttingPlanSummary({ project }: { project: Project }) {
  const mode = project.mode;
  const name =
    mode?.kind === 'pattern'
      ? (getPattern(mode.patternId)?.name ?? 'Unknown pattern')
      : mode?.kind === 'freestyle'
        ? 'Freestyle'
        : 'Cut & stitch plan';
  const placed = project.pieces.filter((p) => p.status === 'canvas');
  const usedArea = placed.reduce((sum, p) => sum + p.areaCm2, 0);
  const sources = new Set(placed.map((p) => p.sourceId)).size;

  const stats: [string, string][] = [
    [String(placed.length), 'PIECES USED'],
    [formatArea(usedArea).replace(/\s*cm²$/, ''), 'CM² DENIM'],
    [String(sources), 'SOURCES'],
  ];

  return (
    <View style={styles.wrap}>
      <TornPaper depth={4} style={styles.summary}>
        <AppText style={text.title}>{name.toUpperCase()}</AppText>
        <View style={styles.stats}>
          {stats.map(([value, label], i) => (
            <View key={label} style={[styles.stat, i > 0 && styles.statDivider]}>
              {/* Typewriter numbers: Bowlby One has no ² glyph. */}
              <AppText style={styles.statValue}>{value}</AppText>
              <AppText variant="kicker" style={styles.statLabel}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </TornPaper>

      <TapeLabel>HOW TO MAKE IT</TapeLabel>
      <View style={styles.list}>
        {STEPS.map(([n, title, detail], i) => (
          <View key={n} style={[styles.step, i > 0 && styles.divider]}>
            <AppText style={[text.heading, styles.stepNo]}>{n}</AppText>
            <View style={styles.stepText}>
              <AppText variant="bodyStrong">{title}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>
                {detail}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  summary: { gap: spacing.sm },
  stats: { flexDirection: 'row', borderWidth: lines.bold, borderColor: colors.ink },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  statValue: { fontFamily: fonts.typeBold, fontSize: 22, lineHeight: 28, color: colors.ink },
  statLabel: { fontSize: 9, lineHeight: 12 },
  // A ruled box: solid lines, since iOS can't dash a single border side.
  list: { borderWidth: lines.bold, borderColor: colors.ink, backgroundColor: colors.surface },
  step: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink },
  stepNo: { width: 30, fontSize: 18, lineHeight: 24 },
  stepText: { flex: 1, gap: 2 },
});
