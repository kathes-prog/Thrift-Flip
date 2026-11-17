/**
 * Shared: fonts and text styles.
 *
 * TODO(skeleton): confirm which family and weight each text style uses in the
 * Figma Make prototype. Current guess: Manrope for headings, DM Sans for body.
 */
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import type { TextStyle } from 'react-native';

/** Passed to useFonts() in app/_layout.tsx. Keys are the fontFamily names. */
export const fontAssets = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_800ExtraBold,
};

export type FontFamily = keyof typeof fontAssets;

/** Every family + weight the app uses. Hello Styles renders each one. */
export const fontList: { family: FontFamily; label: string }[] = [
  { family: 'DMSans_400Regular', label: 'DM Sans 400' },
  { family: 'DMSans_500Medium', label: 'DM Sans 500' },
  { family: 'DMSans_700Bold', label: 'DM Sans 700' },
  { family: 'Manrope_400Regular', label: 'Manrope 400' },
  { family: 'Manrope_600SemiBold', label: 'Manrope 600' },
  { family: 'Manrope_800ExtraBold', label: 'Manrope 800' },
];

export const text = {
  display: { fontFamily: 'Manrope_800ExtraBold', fontSize: 32, lineHeight: 38 },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: 'Manrope_600SemiBold', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: 'DMSans_500Medium', fontSize: 16, lineHeight: 22 },
  label: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof text;
