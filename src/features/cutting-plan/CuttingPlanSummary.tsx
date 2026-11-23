import { View, Text, StyleSheet } from 'react-native';
import type { Project } from '@/model/types';
import { colors, spacing } from '@/theme';

export function CuttingPlanSummary({ project }: { project: Project }) {
  const placed = project.pieces.filter((p) => p.status === 'canvas');
  const usedArea = placed.reduce((sum, p) => sum + p.areaCm2, 0);
  const sources = new Set(placed.map((p) => p.sourceId)).size;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cut & Stitch Plan</Text>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{placed.length}</Text>
          <Text style={styles.statLabel}>Pieces used</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(usedArea).toLocaleString()}</Text>
          <Text style={styles.statLabel}>cm² denim</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{sources}</Text>
          <Text style={styles.statLabel}>Sources used</Text>
        </View>
      </View>

      <View style={styles.planList}>
        {[
          ['01', 'Cut the body panels', '2 × 34 × 38 cm from the lower legs'],
          ['02', 'Prepare the straps', '2 × 8 × 62 cm; fold edges inward'],
          ['03', 'Join the bag body', 'Faces together, stitch side and base seams'],
          ['04', 'Finish & attach straps', 'Topstitch opening, attach 9 cm from edges'],
        ].map(([n, t, d]) => (
          <View key={n} style={styles.step}>
            <Text style={styles.stepNum}>{n}</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t}</Text>
              <Text style={styles.stepDesc}>{d}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md, color: colors.ink },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.inkMuted, marginTop: 4 },
  planList: { gap: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md },
  stepNum: { fontSize: 14, fontWeight: '700', color: colors.inkMuted, marginTop: 2 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  stepDesc: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
});
