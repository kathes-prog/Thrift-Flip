/**
 * Owner: P2. A compact Studio toolbar button: icon above a small label.
 */
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, Icon, radii, spacing, type IconName } from '@/theme';

interface ToolButtonProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  /** Highlighted, e.g. while the colour swatches are open. */
  active?: boolean;
}

export function ToolButton({ label, icon, onPress, disabled, active }: ToolButtonProps) {
  const color = active ? colors.inkInverse : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        active && styles.active,
        pressed && !active && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={22} color={color} />
      <AppText variant="caption" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
  },
  active: { backgroundColor: colors.primary },
  pressed: { backgroundColor: colors.border },
  disabled: { opacity: 0.35 },
});
