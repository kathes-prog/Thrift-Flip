/**
 * Owner: P1. Choose the jeans photo, then Analyze garment loads the
 * ten-piece sample inventory with a visible "sample analysis" label.
 * Also used to add the second garment (from=materials).
 * Zine look: the photo is a taped-in polaroid; Analyze is pinned at the bottom.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { HardShadow, Tape, TapeLabel } from '@/components/zine/Decor';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { jeansSource, makeJeansPieces } from '@/fixtures/jeans';
import { makeSecondGarmentPieces, secondGarmentSource } from '@/fixtures/secondGarment';
import { copyPhotoToDocuments, pickPhoto, type PickedPhoto } from '@/intake/photos';
import { useProject } from '@/state/ProjectContext';
import { colors, Icon, lines, spacing } from '@/theme';

export default function NewGarment() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { project, dispatch } = useProject();
  const alert = useZineAlert();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const hasOriginal = project.sources.some((source) => source.type === 'original-garment');
  const garmentLimitReached = project.sources.some(
    (source) => source.type === 'additional-garment',
  );

  async function choosePhoto() {
    setBusy(true);
    try {
      const selected = await pickPhoto();
      if (selected) setPhoto(selected);
    } catch {
      alert('Could not choose a photo', 'Try opening your photo library again.');
    } finally {
      setBusy(false);
    }
  }

  async function analyzeGarment() {
    if (!photo || busy || garmentLimitReached) return;

    setBusy(true);
    try {
      const photoPath = await copyPhotoToDocuments(photo.uri);
      const source = hasOriginal ? secondGarmentSource : jeansSource;
      const pieces = hasOriginal ? makeSecondGarmentPieces() : makeJeansPieces();
      dispatch({ type: 'ADD_GARMENT', source: { ...source, photoPath }, pieces });
      if (from === 'materials') router.back();
      else router.push('/garment-map');
    } catch {
      alert('Could not save the photo', 'Try again or choose a different photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      kicker={hasOriginal ? 'Second garment' : 'Step 1/4'}
      title={hasOriginal ? 'Add a garment' : 'Snap your garment'}
      highlight="garment"
      footer={
        garmentLimitReached ? undefined : (
          <Button
            label={photo ? 'Analyze it →' : 'Pick a photo first'}
            onPress={analyzeGarment}
            disabled={!photo || busy}
          />
        )
      }
    >
      {garmentLimitReached ? (
        <AppText color={colors.inkMuted}>This project already has two garments.</AppText>
      ) : (
        <>
          <View style={styles.polaroidWrap}>
            <HardShadow color={colors.ink} style={styles.polaroid}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={photo ? 'Change the garment photo' : 'Choose a garment photo'}
                onPress={choosePhoto}
                disabled={busy}
                style={styles.polaroidInner}
              >
                {photo ? (
                  <Image
                    accessibilityLabel="Selected garment photo"
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.photo, styles.photoEmpty]}>
                    <Icon name="photo" size={36} color={colors.ink} />
                    <AppText variant="label">TAP TO ADD A PHOTO</AppText>
                  </View>
                )}
                <AppText variant="label">{photo ? 'tap to change' : 'no photo yet'}</AppText>
              </Pressable>
            </HardShadow>
            <Tape style={styles.tape} tilt={-4} />
          </View>

          <View style={styles.note}>
            <TapeLabel>NOTE</TapeLabel>
            <AppText variant="caption">
              Sample analysis uses a preset inventory for the garment you photograph. Your photo is
              saved with the project.
            </AppText>
          </View>
        </>
      )}
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
  photo: { width: '100%', aspectRatio: 1.15 },
  photoEmpty: {
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
