/**
 * Owner: P1. Compare estimated fabric needs, show shortages, and add another
 * garment or a measured scrap when more material is needed.
 * Zine look: each pattern is a torn card; a shortage gets a pink stamp and
 * the fix buttons right on the card. The scrap form is a sub-screen here
 * (also opened from the Garment Map with ?add=scrap).
 */
import { uuid } from 'expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { HardShadow, Stamp, TapeLabel } from '@/components/zine/Decor';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { TornPaper } from '@/components/zine/TornPaper';
import { patterns } from '@/fixtures/patterns';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { copyPhotoToDocuments, pickPhoto, type PickedPhoto } from '@/intake/photos';
import { createScrap, validateScrapInput, type ScrapFieldErrors } from '@/intake/scrap';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { selectPatternFit } from '@/state/selectors';
import { colors, fonts, Icon, lines, spacing, text, tiltAt } from '@/theme';

/** Cards alternate between white and photocopy-cream paper. */
const CARD_PAPER = [colors.surface, '#F8F1DC', colors.surface] as const;

/** A small line sketch of each garment, drawn like a pattern-envelope thumbnail. */
const SKETCHES: Record<string, string> = {
  tote: 'M8 20h32l-3 24H11z M17 20c0-12 14-12 14 0',
  'cropped-top': 'M10 8h8l3 4h6l3-4h8l6 12-6 2v14H10V22l-6-2z',
  skirt: 'M16 6h16l10 36H6z M16 12h16',
};

function PatternSketch({ id, color }: { id: string; color: string }) {
  const d = SKETCHES[id];
  if (!d) return null;
  return (
    <Svg width={52} height={52} viewBox="0 0 48 48" accessibilityElementsHidden>
      <Path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="miter" />
    </Svg>
  );
}

export default function PatternLibrary() {
  const { add } = useLocalSearchParams<{ add?: string }>();
  const [addingScrap, setAddingScrap] = useState(false);
  const { project, dispatch } = useProject();
  const garmentLimitReached = project.sources.some(
    (source) => source.type === 'additional-garment',
  );
  const addGarment = () => router.push({ pathname: '/new-garment', params: { from: 'materials' } });
  const addScrap = () => setAddingScrap(true);

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
    <Screen title="Pick a pattern" highlight="pattern">
      <FabricTracker />

      {patterns.map((pattern, i) => {
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
                    <Button
                      label="+ 2nd garment"
                      variant="highlight"
                      disabled={garmentLimitReached}
                      onPress={addGarment}
                    />
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

      <View style={styles.fixRow}>
        <View style={styles.fix}>
          <Button
            label="Add garment"
            icon="add"
            variant="secondary"
            disabled={garmentLimitReached}
            onPress={addGarment}
          />
        </View>
        <View style={styles.fix}>
          <Button label="Add scrap" icon="scrap" variant="secondary" onPress={addScrap} />
        </View>
      </View>
      <AppText variant="caption" color={colors.inkMuted}>
        One extra garment per project. Scraps are measured rectangles.
      </AppText>
    </Screen>
  );
}

/** Measured scrap: photo + width × length (cm) → one rectangle (ADD_SCRAP). */
function ScrapForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useProject();
  const alert = useZineAlert();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [errors, setErrors] = useState<ScrapFieldErrors>({});
  const [busy, setBusy] = useState(false);

  const w = Number(width);
  const l = Number(length);
  const preview = w > 0 && l > 0 ? formatArea(w * l) : null;

  async function choosePhoto() {
    setBusy(true);
    try {
      const selected = await pickPhoto();
      if (selected) {
        setPhoto(selected);
        setErrors((current) => ({ ...current, photo: undefined }));
      }
    } catch {
      alert('Could not choose a photo', 'Try opening your photo library again.');
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
      alert('Could not save the photo', 'Try again or choose a different photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="Add a scrap"
      highlight="scrap"
      footer={
        <View style={styles.fixRow}>
          <View style={styles.fix}>
            <Button label="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
          </View>
          <View style={styles.fixWide}>
            <Button label="Add to my pile" onPress={addScrap} disabled={busy} />
          </View>
        </View>
      }
    >
      <View style={styles.scrapHead}>
        <HardShadow color={colors.ink} style={styles.scrapPhotoWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={photo ? 'Change the scrap photo' : 'Choose a scrap photo'}
            onPress={choosePhoto}
            disabled={busy}
            style={[styles.scrapPhoto, errors.photo ? styles.fieldError : null]}
          >
            {photo ? (
              <Image
                accessibilityLabel="Selected scrap photo"
                source={{ uri: photo.uri }}
                style={styles.scrapImage}
                resizeMode="cover"
              />
            ) : (
              <>
                <Icon name="photo" size={28} color={colors.ink} />
                <AppText variant="label">ADD PHOTO</AppText>
              </>
            )}
          </Pressable>
        </HardShadow>
        <AppText variant="caption" style={styles.scrapHint}>
          Lay it flat and measure the <AppText variant="label">largest rectangle</AppText> you can
          cut from it. We treat every scrap as one rectangle.
        </AppText>
      </View>
      {errors.photo ? <ErrorTag>{errors.photo}</ErrorTag> : null}

      <Field
        label="WIDTH (CM)"
        value={width}
        onChange={setWidth}
        error={errors.width}
        editable={!busy}
      />
      <Field
        label="LENGTH (CM)"
        value={length}
        onChange={setLength}
        error={errors.length}
        editable={!busy}
      />

      {preview ? (
        <View style={styles.scrapPreview}>
          <View style={[styles.scrapSwatch, { backgroundColor: colors.scrapDefault }]} />
          <View>
            <AppText variant="caption">{`${width} × ${length} would add`}</AppText>
            <AppText style={styles.scrapArea}>{`+${preview}`}</AppText>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  editable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  editable: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label.toLowerCase()}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        editable={editable}
        style={[styles.input, error ? styles.fieldError : null]}
      />
      {error ? <ErrorTag>{error}</ErrorTag> : null}
    </View>
  );
}

function ErrorTag({ children }: { children: string }) {
  return (
    <View style={styles.errorTag} accessibilityRole="alert">
      <AppText variant="label" color={colors.inkInverse}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.md + 4, gap: spacing.sm },
  cardLeft: { marginRight: spacing.sm },
  cardRight: { marginLeft: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  headText: { flex: 1, gap: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  // Typewriter, not Bowlby: Bowlby One has no → glyph.
  arrow: { fontFamily: fonts.typeBold, fontSize: 30, lineHeight: 38 },
  name: { fontSize: 22, lineHeight: 28 },
  fixRow: { flexDirection: 'row', gap: spacing.sm },
  fix: { flex: 1 },
  fixWide: { flex: 2 },
  scrapHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scrapPhotoWrap: { width: 120, transform: [{ rotate: '-2deg' }] },
  scrapPhoto: {
    height: 120,
    borderWidth: lines.bold,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  scrapImage: { width: '100%', height: '100%' },
  scrapHint: { flex: 1 },
  field: { gap: spacing.xs },
  input: {
    minHeight: 52,
    borderWidth: lines.bold,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm + 4,
    fontFamily: fonts.typeBold,
    fontSize: 22,
    color: colors.ink,
  },
  fieldError: { borderColor: colors.danger, borderWidth: lines.heavy },
  errorTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ rotate: '-1deg' }],
  },
  scrapPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 4,
    borderWidth: lines.bold,
    borderStyle: 'dashed',
    borderColor: colors.ink,
  },
  scrapSwatch: { width: 52, height: 52, transform: [{ rotate: '-4deg' }] },
  scrapArea: { fontFamily: fonts.typeBold, fontSize: 24, lineHeight: 30 },
  stampRoom: { marginTop: spacing.md },
  stamp: { position: 'absolute', right: 6, top: -18 },
});
