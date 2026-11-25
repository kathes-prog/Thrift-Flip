/**
 * Owner: P1. Choose the jeans photo, then Analyze garment loads the
 * ten-piece sample inventory with a visible "sample analysis" label.
 * Zine look: the photo is a taped-in polaroid.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { HardShadow, TapeLabel, Tape } from '@/components/zine/Decor';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { jeansSource, makeJeansPieces } from '@/fixtures/jeans';
import { pickPhoto } from '@/intake/photos';
import { useProject } from '@/state/ProjectContext';
import { colors, Icon, lines, spacing } from '@/theme';

export default function NewGarment() {
  const { dispatch } = useProject();
  const alert = useZineAlert();

  async function choosePhoto() {
    try {
      await pickPhoto();
    } catch (e) {
      alert('Not built yet', String(e));
    }
  }

  return (
    <Screen
      kicker="Step 1/4"
      title="Snap your garment"
      highlight="garment"
      footer={
        <Button
          label="Analyze it →"
          onPress={() => {
            dispatch({ type: 'ADD_GARMENT', source: jeansSource, pieces: makeJeansPieces() });
            router.push('/garment-map');
          }}
        />
      }
    >
      <StubBanner
        owner="P1"
        note="Photo picker and preview. Analyze dispatches ADD_GARMENT, which is a no-op until P1 builds it."
      />

      <View style={styles.polaroidWrap}>
        <HardShadow color={colors.ink} style={styles.polaroid}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a photo of your garment"
            onPress={choosePhoto}
            style={styles.polaroidInner}
          >
            <View style={styles.photo}>
              <Icon name="photo" size={36} color={colors.ink} />
              <AppText variant="label">TAP TO ADD A PHOTO</AppText>
            </View>
            <AppText variant="label">no photo yet</AppText>
          </Pressable>
        </HardShadow>
        <Tape style={styles.tape} tilt={-4} />
      </View>

      <View style={styles.note}>
        <TapeLabel>NOTE</TapeLabel>
        <AppText variant="caption">
          This build uses a sample analysis of one pair of jeans. Your photo is saved with the
          project.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  polaroidWrap: { alignItems: 'center', paddingVertical: spacing.md },
  // Sized so the pinned Analyze button and the note stay on screen.
  polaroid: { width: '66%', transform: [{ rotate: '2.5deg' }] },
  polaroidInner: {
    backgroundColor: colors.surface,
    borderWidth: lines.bold,
    borderColor: colors.ink,
    padding: spacing.sm + 4,
    paddingBottom: spacing.md,
    gap: spacing.sm + 4,
  },
  photo: {
    aspectRatio: 1.15,
    backgroundColor: colors.guideFill,
    borderWidth: lines.thin,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tape: { top: 6, alignSelf: 'center', width: 96 },
  note: { gap: spacing.xs, transform: [{ rotate: '-0.5deg' }] },
});
