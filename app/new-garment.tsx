/**
 * Owner: P1. Choose the jeans photo, then Analyze garment loads the
 * ten-piece sample inventory with a visible "sample analysis" label.
 */
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { jeansSource, makeJeansPieces } from '@/fixtures/jeans';
import { pickPhoto } from '@/intake/photos';
import { useProject } from '@/state/ProjectContext';
import { colors } from '@/theme';

export default function NewGarment() {
  const { dispatch } = useProject();

  async function choosePhoto() {
    try {
      await pickPhoto();
    } catch (e) {
      Alert.alert('Not built yet', String(e));
    }
  }

  return (
    <Screen title="New Garment">
      <StubBanner
        owner="P1"
        note="Photo picker and preview. Analyze dispatches ADD_GARMENT, which is a no-op until P1 builds it."
      />
      <Card>
        <AppText color={colors.inkMuted}>No photo selected.</AppText>
        <Button label="Choose photo" icon="photo" variant="secondary" onPress={choosePhoto} />
      </Card>
      <Button
        label="Analyze garment"
        icon="garment"
        onPress={() => {
          dispatch({ type: 'ADD_GARMENT', source: jeansSource, pieces: makeJeansPieces() });
          router.push('/garment-map');
        }}
      />
    </Screen>
  );
}
