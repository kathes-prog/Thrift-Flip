/**
 * Owner: P1. Choose the Pattern Library or a blank Freestyle canvas.
 * Zine look: two torn cards, one white, one black.
 */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Tape, TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { useProject } from '@/state/ProjectContext';
import { colors, spacing, text } from '@/theme';

export default function StartDesigning() {
  const { dispatch } = useProject();

  return (
    <Screen kicker="Step 3/4" title="How do you want to make it?" highlight="make">
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Follow a pattern"
          onPress={() => router.push('/patterns')}
        >
          {({ pressed }) => (
            <TornPaper
              tilt={-1.5}
              depth={6}
              color={pressed ? colors.highlight : colors.surface}
              style={styles.card}
            >
              <View style={styles.cardHead}>
                <AppText style={[text.title, styles.cardTitle]}>{'FOLLOW A\nPATTERN'}</AppText>
                <TapeLabel tone="highlight">BEGINNER PICK</TapeLabel>
              </View>
              <AppText>
                Tote, skirt or cropped top. We show a guide and tell you if there&apos;s enough
                denim.
              </AppText>
              <AppText variant="label" style={styles.open}>
                PICK A PATTERN →
              </AppText>
            </TornPaper>
          )}
        </Pressable>
        <Tape style={styles.tape} tilt={5} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Freestyle on a blank canvas"
        onPress={() => {
          dispatch({ type: 'SELECT_MODE', mode: { kind: 'freestyle' } });
          router.push('/studio');
        }}
      >
        {({ pressed }) => (
          <TornPaper
            tilt={1.5}
            depth={6}
            seed={4}
            color={pressed ? colors.primaryPressed : colors.ink}
            style={[styles.card, styles.freestyle]}
          >
            <AppText style={[text.title, styles.cardTitle]} color={colors.inkInverse}>
              FREE
              <AppText style={[text.title, styles.cardTitle]} color={colors.highlight}>
                STYLE
              </AppText>
            </AppText>
            <AppText color={colors.inkInverse}>
              Blank canvas. No guide, no rules — just you and the pieces.
            </AppText>
            <AppText variant="label" color={colors.inkInverse} style={styles.open}>
              OPEN CANVAS →
            </AppText>
          </TornPaper>
        )}
      </Pressable>

      <AppText variant="caption" color={colors.inkMuted}>
        Freestyle has no guide, so no fabric estimate.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md + 4, gap: spacing.sm },
  cardHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: { fontSize: 28, lineHeight: 36 },
  freestyle: { marginLeft: spacing.md },
  open: { alignSelf: 'flex-end' },
  tape: { top: -8, right: 70 },
});
