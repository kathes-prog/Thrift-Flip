/**
 * Owner: P1. Compare estimated fabric needs, show shortages, and add another
 * garment or a measured scrap when more material is needed.
 * Zine look: each pattern is a torn card; a shortage gets a pink stamp and
 * the fix buttons right on the card.
 */
import { uuid } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, TextInput } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { patterns } from '@/fixtures/patterns';
import { copyPhotoToDocuments, pickPhoto, type PickedPhoto } from '@/intake/photos';
import { createScrap, validateScrapInput, type ScrapFieldErrors } from '@/intake/scrap';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { selectPatternFit } from '@/state/selectors';
import { colors, radii, spacing } from '@/theme';

export default function PatternLibrary() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const [addingScrap, setAddingScrap] = useState(false);
  const { project, dispatch } = useProject();
  const garmentLimitReached = project.sources.some(
    (source) => source.type === 'additional-garment',
  );

  if (add === 'scrap' || addingScrap) {
    return (
      <ScrapForm
        onClose={() => {
          if (add === 'scrap') router.back();
          else setAddingScrap(false);
        }}
      />
    );
  }

  return (
    <Screen title="Pattern Library">
      <FabricTracker />
      {patterns.map((pattern) => {
        const fit = selectPatternFit(project, pattern);
        const short = fit.shortageCm2 > 0;
        const fg = short ? colors.inkInverse : colors.ink;
        const use = () => {
          dispatch({ type: 'SELECT_MODE', mode: { kind: 'pattern', patternId: pattern.id } });
          router.push('/studio');
        };
        const card = (pressed: boolean) => (
          <TornPaper
            seed={i * 4}
            tilt={tiltAt(i)}
            color={
              short ? colors.ink : pressed ? colors.highlight : CARD_PAPER[i % CARD_PAPER.length]
            }
            style={[styles.card, i % 2 ? styles.cardRight : styles.cardLeft]}
          >
            <View style={styles.head}>
              <PatternSketch id={pattern.id} color={fg} />
              <View style={styles.headText}>
                <AppText style={[text.heading, styles.name]} color={fg}>
                  {pattern.name.toUpperCase()}
                </AppText>
                <AppText color={fg}>needs {formatArea(pattern.estimatedAreaCm2)}</AppText>
                {pattern.has3dPreview || (!short && fit.usableCm2 > 0) ? (
                  <View style={styles.tags}>
                    {pattern.has3dPreview ? (
                      <TapeLabel tone="highlight">3D PREVIEW</TapeLabel>
                    ) : null}
                    {!short && fit.usableCm2 > 0 ? <TapeLabel>✓ FITS</TapeLabel> : null}
                  </View>
                ) : null}
              </View>
              {short ? null : (
                <AppText style={[text.title, styles.arrow]} color={fg}>
                  →
                </AppText>
              )}
            </View>
            {short ? (
              <>
                <AppText color={colors.inkInverse}>Add more fabric to unlock it:</AppText>
                <View style={styles.fixRow}>
                  <View style={styles.fix}>
                    <Button label="+ Scrap" variant="highlight" onPress={addScrap} />
                  </View>
                  <View style={styles.fix}>
                    <Button label="+ 2nd garment" variant="highlight" onPress={addGarment} />
                  </View>
                </View>
              </>
            ) : null}
          </TornPaper>
        );
        return (
          <View key={pattern.id} style={short ? styles.stampRoom : undefined}>
            {short ? (
              card(false)
            ) : (
              // The whole card is the button: no separate "Use it" control.
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use the ${pattern.name} pattern`}
                onPress={use}
              >
                {({ pressed }) => card(pressed)}
              </Pressable>
            )}
            {short ? (
              <Stamp tilt={9} style={styles.stamp}>
                {/* Bowlby One has no ² glyph */}
                {`${formatArea(fit.shortageCm2).replace(/\s*cm²$/, '')} SQ CM\nSHORT`}
              </Stamp>
            ) : null}
          </View>
        );
      })}
      <Button
        label="Add garment"
        icon="add"
        variant="secondary"
        disabled={garmentLimitReached}
        onPress={() => router.push({ pathname: '/new-garment', params: { from: 'materials' } })}
      />
      <Button
        label="Add scrap"
        icon="scrap"
        variant="secondary"
        onPress={() => setAddingScrap(true)}
      />
    </Screen>
  );
}

function ScrapForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useProject();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [errors, setErrors] = useState<ScrapFieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function choosePhoto() {
    setBusy(true);
    try {
      const selected = await pickPhoto();
      if (selected) {
        setPhoto(selected);
        setErrors((current) => ({ ...current, photo: undefined }));
      }
    } catch {
      Alert.alert('Could not choose a photo', 'Try opening your photo library again.');
    } finally {
      setBusy(false);
    }
  }

  async function addScrap() {
    if (busy) return;
    const valid = validateScrapInput({ width, length, photoPath: photo?.uri ?? null });
    if (!valid.ok) {
      setErrors(valid.errors);
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const photoPath = await copyPhotoToDocuments(valid.photoPath);
      const scrap = createScrap(
        { ...valid, photoPath },
        { sourceId: uuid.v4(), pieceId: uuid.v4() },
      );
      dispatch({ type: 'ADD_SCRAP', ...scrap });
      onClose();
    } catch {
      Alert.alert('Could not save the photo', 'Try again or choose a different photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Add Scrap">
      <Card>
        {photo ? (
          <Image
            accessibilityLabel="Selected scrap photo"
            source={{ uri: photo.uri }}
            style={styles.preview}
            resizeMode="contain"
          />
        ) : null}
        <Button
          label={photo ? 'Change photo' : 'Choose photo'}
          icon="photo"
          variant="secondary"
          onPress={choosePhoto}
          disabled={busy}
        />
        {errors.photo ? <AppText color={colors.danger}>{errors.photo}</AppText> : null}
        <AppText variant="label">Width (cm)</AppText>
        <TextInput
          accessibilityLabel="Width in centimetres"
          value={width}
          onChangeText={setWidth}
          keyboardType="decimal-pad"
          editable={!busy}
          style={styles.input}
        />
        {errors.width ? <AppText color={colors.danger}>{errors.width}</AppText> : null}
        <AppText variant="label">Length (cm)</AppText>
        <TextInput
          accessibilityLabel="Length in centimetres"
          value={length}
          onChangeText={setLength}
          keyboardType="decimal-pad"
          editable={!busy}
          style={styles.input}
        />
        {errors.length ? <AppText color={colors.danger}>{errors.length}</AppText> : null}
      </Card>
      <Button label="Add scrap" icon="scrap" onPress={addScrap} disabled={busy} />
      <Button label="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 180, borderRadius: radii.md },
  input: {
    color: colors.ink,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
});
