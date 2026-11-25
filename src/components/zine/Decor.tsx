/**
 * Shared: small Zine pieces — the speckled photocopy background, masking
 * tape, the rubber stamp, highlighter text and a hard offset shadow.
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { colors, fonts, hardShadow, lines } from '@/theme';

/** Fills its parent with the photocopy dot texture. Put it first, behind content. */
export function PaperBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="paper-dots" patternUnits="userSpaceOnUse" width={6} height={6}>
          <Circle cx={3} cy={3} r={0.8} fill={colors.paperDot} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={colors.background} />
      <Rect width="100%" height="100%" fill="url(#paper-dots)" />
    </Svg>
  );
}

/** A strip of translucent tape, absolutely placed by the caller. */
export function Tape({ style, tilt = -6 }: { style?: ViewStyle; tilt?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.tape, { transform: [{ rotate: `${tilt}deg` }] }, style]}
    />
  );
}

/** A tilted rubber stamp, e.g. "644 cm² SHORT". */
export function Stamp({
  children,
  color = colors.danger,
  tilt = -8,
  style,
}: {
  children: ReactNode;
  color?: string;
  tilt?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[styles.stamp, { borderColor: color, transform: [{ rotate: `${tilt}deg` }] }, style]}
    >
      <Text maxFontSizeMultiplier={1.15} style={[styles.stampText, { color }]}>
        {children}
      </Text>
    </View>
  );
}

/** Words with a highlighter swipe behind them. Use inside a Text. */
export function Highlight({
  children,
  color = colors.highlight,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: TextStyle;
}) {
  return <Text style={[{ backgroundColor: color }, style]}>{children}</Text>;
}

/** Wraps a block with a solid offset shadow (RN shadows are blurry; zines aren't). */
export function HardShadow({
  children,
  color = colors.pink,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      <View style={[StyleSheet.absoluteFill, styles.shadow, { backgroundColor: color }]} />
      {children}
    </View>
  );
}

const LABEL_TONES = {
  ink: { bg: colors.ink, fg: colors.inkInverse },
  highlight: { bg: colors.highlight, fg: colors.ink },
  pink: { bg: colors.pink, fg: colors.ink },
} as const;

/** A "label-maker" tag, for small headings like PILE or NOTE. */
export function TapeLabel({
  children,
  tone = 'ink',
  style,
}: {
  children: ReactNode;
  tone?: keyof typeof LABEL_TONES;
  style?: ViewStyle;
}) {
  const t = LABEL_TONES[tone];
  return (
    <View style={[styles.label, { backgroundColor: t.bg }, style]}>
      <Text maxFontSizeMultiplier={1.2} style={[styles.labelText, { color: t.fg }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tape: { position: 'absolute', width: 78, height: 22, backgroundColor: colors.tape },
  stamp: {
    alignSelf: 'flex-start',
    borderWidth: lines.heavy,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
  },
  stampText: { fontFamily: fonts.display, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  shadow: { transform: [{ translateX: hardShadow.x }, { translateY: hardShadow.y }] },
  label: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  labelText: { fontFamily: fonts.typeBold, fontSize: 12, lineHeight: 16, letterSpacing: 1 },
});
