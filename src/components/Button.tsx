/**
 * Shared: Zine buttons.
 * - primary: a black block with a hot-pink hard shadow (the one main action)
 * - secondary: a dashed outline, like a cut-here line
 * - highlight: highlighter-yellow fill with a black outline (small positive actions)
 */
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts, hardShadow, Icon, lines, spacing, type IconName } from '@/theme';

import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'highlight';
  icon?: IconName;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled }: ButtonProps) {
  const primary = variant === 'primary';
  const fg = disabled || primary ? colors.inkInverse : colors.ink;
  return (
    <View style={primary && !disabled ? styles.shadowRoom : undefined}>
      {primary && !disabled ? <View style={styles.shadow} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'secondary' && styles.secondary,
          variant === 'highlight' && styles.highlight,
          pressed && primary && styles.primaryPressed,
          pressed && !primary && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <AppText
            variant="label"
            color={fg}
            style={primary ? styles.primaryLabel : styles.secondaryLabel}
          >
            {label.toUpperCase()}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowRoom: { marginRight: hardShadow.x, marginBottom: hardShadow.y },
  shadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.pink,
    transform: [{ translateX: hardShadow.x }, { translateY: hardShadow.y }],
  },
  base: {
    minHeight: 52,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: {
    borderWidth: lines.bold,
    borderStyle: 'dashed',
    borderColor: colors.ink,
    backgroundColor: 'transparent',
  },
  highlight: {
    borderWidth: lines.bold,
    borderColor: colors.ink,
    backgroundColor: colors.highlight,
  },
  pressed: { backgroundColor: colors.surface },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primaryLabel: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24, letterSpacing: 0 },
  secondaryLabel: { letterSpacing: 1 },
});
