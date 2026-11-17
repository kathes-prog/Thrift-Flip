/**
 * Shared: requirement 1 (Hello World) and the launch screen.
 * Later this can redirect straight to New Garment; keep the dev links
 * reachable somewhere for testing.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme';

export default function Home() {
  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="display">Hello World</AppText>
        <AppText color={colors.inkMuted}>Thrift Flip Studio · skeleton build</AppText>
      </View>
      <Button label="Start a project" icon="garment" onPress={() => router.push('/new-garment')} />
      <Button
        label="Hello Styles"
        variant="secondary"
        icon="pattern"
        onPress={() => router.push('/dev/styles')}
      />
      <Button
        label="Dev fixtures"
        variant="secondary"
        icon="restore"
        onPress={() => router.push('/dev/fixtures')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingVertical: spacing.xl, gap: spacing.sm },
});
