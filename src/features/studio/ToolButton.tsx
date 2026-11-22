/**
 * Owner: P2. A Studio toolbar button: icon above a small label, no box,
 * as in the hi-fi Figma. Active tools get a soft highlight.
 */
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, radii, type IconName } from '@/theme';

import { studio } from './studioStyle';

interface ToolButtonProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  /** Highlighted while its option row or mode is open. */
  active?: boolean;
}

export function ToolButton({ label, icon, onPress, disabled, active }: ToolButtonProps) {
  const color = disabled ? studio.faint : active ? studio.sage : studio.ink;
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
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon name={icon} size={24} color={color} />
      <AppText variant="caption" color={color} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  active: { backgroundColor: '#E6ECE6' },
  pressed: { backgroundColor: '#ECEAE4' },
  label: { fontSize: 12, lineHeight: 15 },
});
