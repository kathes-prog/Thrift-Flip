/**
 * Owner: P1. Placed in the Studio by P2 and shown on the Pattern Library.
 * Must reflect add/store/restore/discard within one second (it re-renders
 * from project state, so this holds as long as selectors stay cheap).
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { StubBanner } from '@/components/StubBanner';
import { formatArea } from '@/model/units';
import { selectTracker } from '@/state/selectors';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export function FabricTracker() {
  const { project } = useProject();
  const t = selectTracker(project);
  const rows: [string, string][] = [
    ['Recovered', formatArea(t.recoveredCm2)],
    ['Used', `${formatArea(t.usedCm2)} · ${Math.round(t.percentUsed)}%`],
    ['Available', formatArea(t.availableCm2)],
    ['Stored', formatArea(t.storedCm2)],
  ];
  if (t.discardedCm2 > 0) rows.push(['Discarded', formatArea(t.discardedCm2)]);

  return (
    <Card>
      <StubBanner owner="P1" note="Selectors return zeros until P1 builds them." />
      <AppText variant="heading">Fabric tracker</AppText>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <AppText color={colors.inkMuted}>{label}</AppText>
          <AppText variant="bodyStrong">{value}</AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
