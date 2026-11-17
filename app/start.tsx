/**
 * Owner: P1. Choose the Pattern Library or a blank Freestyle canvas.
 */
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export default function StartDesigning() {
  const { dispatch } = useProject();

  return (
    <Screen title="Start Designing">
      <AppText color={colors.inkMuted}>
        Follow a guided pattern, or arrange pieces freely on a blank canvas.
      </AppText>
      <Button label="Pattern Library" icon="pattern" onPress={() => router.push('/patterns')} />
      <Button
        label="Freestyle"
        variant="secondary"
        icon="scrap"
        onPress={() => {
          dispatch({ type: 'SELECT_MODE', mode: { kind: 'freestyle' } });
          router.push('/studio');
        }}
      />
    </Screen>
  );
}
