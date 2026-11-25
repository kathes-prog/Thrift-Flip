/**
 * Shared: fonts and text styles for the Zine look.
 * Bowlby One for chunky cut-out headlines, Courier Prime (typewriter) for
 * everything you read and tap. Custom fonts carry their own weight, so no
 * style sets fontWeight.
 */
import { BowlbyOne_400Regular } from '@expo-google-fonts/bowlby-one';
import { CourierPrime_400Regular, CourierPrime_700Bold } from '@expo-google-fonts/courier-prime';
import type { TextStyle } from 'react-native';

/** Passed to useFonts() in app/_layout.tsx. Keys are the fontFamily names. */
export const fontAssets = {
  BowlbyOne_400Regular,
  CourierPrime_400Regular,
  CourierPrime_700Bold,
};

export type FontFamily = keyof typeof fontAssets;

export const fonts = {
  display: 'BowlbyOne_400Regular',
  type: 'CourierPrime_400Regular',
  typeBold: 'CourierPrime_700Bold',
} as const satisfies Record<string, FontFamily>;

/** Every family + weight the app uses. Hello Styles renders each one. */
export const fontList: { family: FontFamily; label: string }[] = [
  { family: 'BowlbyOne_400Regular', label: 'Bowlby One' },
  { family: 'CourierPrime_400Regular', label: 'Courier Prime 400' },
  { family: 'CourierPrime_700Bold', label: 'Courier Prime 700' },
];

// Bowlby One has very tall ascenders: iOS clips its glyphs unless the line
// height is about 1.25× the font size.
export const text = {
  display: { fontFamily: fonts.display, fontSize: 44, lineHeight: 56 },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 41 },
  heading: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.type, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.typeBold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.typeBold, fontSize: 14, lineHeight: 18, letterSpacing: 0.4 },
  caption: { fontFamily: fonts.type, fontSize: 13, lineHeight: 18 },
  /** Small all-caps typewriter line above titles ("STEP 2/4"). */
  kicker: {
    fontFamily: fonts.typeBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof text;
