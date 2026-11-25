/**
 * Owner: P1. Choose the jeans photo, then Analyze garment loads the
 * ten-piece sample inventory with a visible "sample analysis" label.
 * Zine look: the photo is a taped-in polaroid.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { jeansSource, makeJeansPieces } from '@/fixtures/jeans';
import { makeSecondGarmentPieces, secondGarmentSource } from '@/fixtures/secondGarment';
import { copyPhotoToDocuments, pickPhoto, type PickedPhoto } from '@/intake/photos';
import { useProject } from '@/state/ProjectContext';
import { colors, radii } from '@/theme';

export default function NewGarment() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { project, dispatch } = useProject();
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
      Alert.alert('Could not choose a photo', 'Try opening your photo library again.');
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
      Alert.alert('Could not save the photo', 'Try again or choose a different photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={hasOriginal ? 'Add Garment' : 'New Garment'}>
      {garmentLimitReached ? (
        <AppText color={colors.inkMuted}>This project already has two garments.</AppText>
      ) : (
        <>
          <AppText color={colors.inkMuted}>
            Sample analysis uses a preset inventory for the garment you photograph.
          </AppText>
          <Card>
            {photo ? (
              <Image
                accessibilityLabel="Selected garment photo"
                source={{ uri: photo.uri }}
                style={styles.preview}
                resizeMode="contain"
              />
            ) : (
              <AppText color={colors.inkMuted}>Choose a photo to analyze your garment.</AppText>
            )}
            <Button
              label={photo ? 'Change photo' : 'Choose photo'}
              icon="photo"
              variant="secondary"
              onPress={choosePhoto}
              disabled={busy}
            />
          </Card>
          <Button
            label="Analyze garment"
            icon="garment"
            onPress={analyzeGarment}
            disabled={!photo || busy}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 220, borderRadius: radii.md },
});
