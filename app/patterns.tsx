/**
 * Owner: P1. Compare estimated fabric needs, show shortages, and add another
 * garment or a measured scrap when more material is needed.
 * Zine look: each pattern is a torn card; a shortage gets a pink stamp and
 * the fix buttons right on the card.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { Stamp, TapeLabel } from '@/components/zine/Decor';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { TornPaper } from '@/components/zine/TornPaper';
import { patterns } from '@/fixtures/patterns';
import { FabricTracker } from '@/features/tracker/FabricTracker';
import { formatArea } from '@/model/units';
import { useProject } from '@/state/ProjectContext';
import { selectPatternFit } from '@/state/selectors';
import { colors, fonts, spacing, text, tiltAt } from '@/theme';

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
  const { project, dispatch } = useProject();
  const alert = useZineAlert();
  const addGarment = () => alert('Not built yet', 'TODO(P1): add second garment');
  const addScrap = () => alert('Not built yet', 'TODO(P1): measured scrap form');

  return (
    <Screen title="Pick a pattern" highlight="pattern">
      <StubBanner
        owner="P1"
        note="Tracker totals (dashes for now), shortage warnings, Add garment flow, scrap form."
      />
      <FabricTracker showStub={false} />

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

      <View style={styles.fixRow}>
        <View style={styles.fix}>
          <Button label="Add garment" icon="add" variant="secondary" onPress={addGarment} />
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
  stampRoom: { marginTop: spacing.md },
  stamp: { position: 'absolute', right: 6, top: -18 },
});
