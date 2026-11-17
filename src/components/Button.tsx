import { Pressable, StyleSheet, View } from 'react-native';

import { colors, Icon, radii, spacing, type IconName } from '@/theme';

import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled }: ButtonProps) {
  const primary = variant === 'primary';
  const fg = primary ? colors.inkInverse : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && primary && { backgroundColor: colors.primaryPressed },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={fg} /> : null}
        <AppText variant="label" color={fg}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
