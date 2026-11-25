/**
 * Owner: P1. Placed in the Studio by P2 and shown on the Pattern Library.
 * Must reflect add/store/restore/discard within one second (it re-renders
 * from project state, so this holds as long as selectors stay cheap).
 * Zine look: a ruled box of tallies; "Used" is highlighted.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { StubBanner } from '@/components/StubBanner';
import { formatArea } from '@/model/units';
import { selectTracker } from '@/state/selectors';
import { useProject } from '@/state/ProjectContext';
import { colors, fonts, lines, spacing } from '@/theme';

/** `showStub`: pass false where the screen already shows a stub banner for P1. */
export function FabricTracker({ showStub = true }: { showStub?: boolean } = {}) {
  const { project } = useProject();
  const t = selectTracker(project);
  // With nothing recovered yet, show dashes rather than a row of "0 cm²" that
  // reads like a real (and alarming) result.
  const empty = t.recoveredCm2 <= 0;
  const area = (cm2: number) => (empty ? '—' : formatArea(cm2));
  const cells: { label: string; value: string; hot?: boolean }[] = [
    { label: 'RECOVERED', value: area(t.recoveredCm2) },
    {
      label: empty ? 'USED' : `USED · ${Math.round(t.percentUsed)}%`,
      value: area(t.usedCm2),
      hot: true,
    },
    { label: 'AVAILABLE', value: area(t.availableCm2) },
    { label: 'STORED', value: area(t.storedCm2) },
  ];
  if (t.discardedCm2 > 0) cells.push({ label: 'DISCARDED', value: formatArea(t.discardedCm2) });

  return (
    <View style={styles.wrap}>
      {showStub ? (
        <StubBanner owner="P1" note="Selectors return zeros until P1 builds them." />
      ) : null}
      <View style={styles.box} accessibilityLabel="Fabric tracker">
        {cells.map((c, i) => (
          <View
            key={c.label}
            style={[styles.cell, i > 0 && styles.divider, c.hot && styles.hot]}
            accessible
            accessibilityLabel={`${c.label} ${c.value}`}
          >
            <AppText variant="kicker" style={styles.cellLabel}>
              {c.label}
            </AppText>
            <AppText
              variant="heading"
              style={styles.cellValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {c.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  box: {
    flexDirection: 'row',
    borderWidth: lines.bold,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
  },
  cell: { flex: 1, paddingHorizontal: 6, paddingVertical: 6 },
  divider: { borderLeftWidth: 1, borderLeftColor: colors.ink },
  hot: { backgroundColor: colors.highlight },
  cellLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.4 },
  // Typewriter, not Bowlby: Bowlby One has no ² glyph.
  cellValue: { fontFamily: fonts.typeBold, fontSize: 15, lineHeight: 20 },
});
