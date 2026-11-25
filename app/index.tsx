/**
 * Shared: requirement 1 (Hello World) and the launch screen, as the Zine
 * cover: cut-out ransom-note letters, a short pitch and the one big action.
 * The dev links stay reachable at the bottom for testing.
 */
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Highlight, PaperBackground, Stamp, Tape, TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { colors, fonts, lines, spacing, text } from '@/theme';

/** Each cut-out letter: its paper, ink and tilt. */
const LETTERS: { ch: string; bg: string; fg: string; tilt: number; outline?: boolean }[][] = [
  [
    { ch: 'T', bg: colors.ink, fg: colors.inkInverse, tilt: -4 },
    { ch: 'H', bg: colors.highlight, fg: colors.ink, tilt: 3 },
    { ch: 'R', bg: colors.surface, fg: colors.ink, tilt: -2, outline: true },
    { ch: 'I', bg: colors.pink, fg: colors.ink, tilt: 5 },
    { ch: 'F', bg: colors.ink, fg: colors.inkInverse, tilt: -3 },
    { ch: 'T', bg: colors.surface, fg: colors.ink, tilt: 2, outline: true },
  ],
  [
    { ch: 'F', bg: colors.denimOriginal, fg: colors.inkInverse, tilt: 2 },
    { ch: 'L', bg: colors.highlight, fg: colors.ink, tilt: -5 },
    { ch: 'I', bg: colors.ink, fg: colors.inkInverse, tilt: 3 },
    { ch: 'P', bg: colors.pink, fg: colors.ink, tilt: -2 },
  ],
];

const STEPS = [
  'Snap your old jeans',
  'See every piece you can save',
  'Lay them out on a pattern',
  'Cut with a plan',
];

export default function Home() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <PaperBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <AppText variant="kicker">Issue #01 · upcycling for beginners</AppText>

        <View accessible accessibilityRole="header" accessibilityLabel="Thrift Flip">
          {LETTERS.map((row, r) => (
            <View key={r} style={styles.letterRow}>
              {row.map((l, i) => (
                <View
                  key={i}
                  style={[
                    styles.letter,
                    r === 1 && styles.letterBig,
                    { backgroundColor: l.bg, transform: [{ rotate: `${l.tilt}deg` }] },
                    l.outline && styles.letterOutline,
                  ]}
                >
                  <Text
                    maxFontSizeMultiplier={1}
                    style={[styles.letterText, r === 1 && styles.letterTextBig, { color: l.fg }]}
                  >
                    {l.ch}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.pitchRow}>
          <AppText style={styles.pitch}>
            Plan your cut <Highlight style={styles.bold}>before</Highlight> the scissors come out.
            Old jeans → new thing. No wasted denim.
          </AppText>
          <Stamp tilt={10}>{'0% NEW\nFABRIC'}</Stamp>
        </View>

        {/* How it works: the four steps as a taped-in strip. */}
        <View style={styles.howWrap}>
          <TornPaper tilt={-1} depth={5} style={styles.how}>
            <TapeLabel>HOW IT WORKS</TapeLabel>
            {STEPS.map((step, i) => (
              <View key={step} style={styles.step}>
                <AppText style={[text.heading, styles.stepNo]}>{i + 1}</AppText>
                <AppText style={styles.stepText}>{step}</AppText>
              </View>
            ))}
          </TornPaper>
          <Tape style={styles.howTape} tilt={4} />
        </View>

        <View style={styles.spacer} />

        <Button label="+ Start a new flip" onPress={() => router.push('/new-garment')} />
        <AppText variant="caption" color={colors.inkMuted} style={styles.center}>
          one project at a time · saved on this iPhone
        </AppText>

        <View style={styles.devLinks}>
          <DevLink label="Hello Styles" onPress={() => router.push('/dev/styles')} />
          <DevLink label="Dev fixtures" onPress={() => router.push('/dev/fixtures')} />
        </View>
      </ScrollView>
    </View>
  );
}

function DevLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.devLink}>
      <AppText variant="kicker" color={colors.inkMuted}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.md + 2, gap: spacing.md },
  letterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  letter: { paddingHorizontal: 7, paddingVertical: 2, minWidth: 40, alignItems: 'center' },
  letterBig: { minWidth: 60 },
  letterOutline: { borderWidth: lines.bold, borderColor: colors.ink },
  letterText: { fontFamily: fonts.display, fontSize: 44, lineHeight: 54 },
  letterTextBig: { fontSize: 62, lineHeight: 74 },
  pitchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  pitch: { flex: 1, fontSize: 17, lineHeight: 24, transform: [{ rotate: '-1deg' }] },
  bold: { fontFamily: fonts.typeBold },
  spacer: { flex: 1, minHeight: spacing.md },
  howWrap: { marginTop: spacing.sm },
  how: { gap: spacing.sm, paddingVertical: spacing.md + 2 },
  howTape: { top: -8, right: 40 },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  stepNo: { width: 22, fontSize: 20, lineHeight: 26 },
  stepText: { flex: 1 },
  center: { textAlign: 'center' },
  devLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  devLink: { paddingVertical: spacing.sm },
});
