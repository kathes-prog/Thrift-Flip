import { Text, type TextProps } from 'react-native';

import { colors, text, type TextVariant } from '@/theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function AppText({ variant = 'body', color = colors.ink, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[text[variant], { color }, style]} />;
}
