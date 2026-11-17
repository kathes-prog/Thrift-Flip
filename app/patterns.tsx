/**
 * Owner: P1. Compare estimated fabric needs, show shortages, and add another
 * garment or a measured scrap when more material is needed.
 */
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { patterns } from '@/fixtures/patterns';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { selectPatternFit } from '@/state/selectors';
import { colors } from '@/theme';

export default function PatternLibrary() {
  const { project, dispatch } = useProject();

  return (
    <Screen title="Pattern Library">
      <StubBanner owner="P1" note="Shortage warnings, Add garment flow, measured scrap form." />
      <FabricTracker />
      {patterns.map((pattern) => {
        const fit = selectPatternFit(project, pattern);
        return (
          <Card key={pattern.id}>
            <AppText variant="heading">{pattern.name}</AppText>
            <AppText color={colors.inkMuted}>Needs {formatArea(pattern.estimatedAreaCm2)}</AppText>
            {fit.shortageCm2 > 0 ? (
              <AppText color={colors.danger}>Short by {formatArea(fit.shortageCm2)}</AppText>
            ) : null}
            <Button
              label="Use this pattern"
              variant="secondary"
              onPress={() => {
                dispatch({ type: 'SELECT_MODE', mode: { kind: 'pattern', patternId: pattern.id } });
                router.push('/studio');
              }}
            />
          </Card>
        );
      })}
      <Button
        label="Add garment"
        icon="add"
        variant="secondary"
        onPress={() => Alert.alert('Not built yet', 'TODO(P1): add second garment')}
      />
      <Button
        label="Add scrap"
        icon="scrap"
        variant="secondary"
        onPress={() => Alert.alert('Not built yet', 'TODO(P1): measured scrap form')}
      />
    </Screen>
  );
}
