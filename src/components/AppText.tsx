import { Text, type TextProps } from 'react-native';

import { colors, text, type TextVariant } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

/**
 * How far each style may grow with the iOS text size. Text still gets bigger
 * for people who need it, but chunky Bowlby headlines and the tightly packed
 * Studio controls can't grow until they push the layout off screen.
 */
const MAX_SCALE: Record<TextVariant, number> = {
  display: 1.15,
  title: 1.15,
  heading: 1.15,
  body: 1.3,
  bodyStrong: 1.3,
  caption: 1.3,
  label: 1.2,
  kicker: 1.2,
};

export function AppText({
  variant = 'body',
  color = colors.ink,
  style,
  maxFontSizeMultiplier,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_SCALE[variant]}
      style={[text[variant], { color }, style]}
    />
  );
}
