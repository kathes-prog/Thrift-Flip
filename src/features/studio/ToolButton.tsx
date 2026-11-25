/**
 * Owner: P2. A Studio tool as a strip of label-maker tape: black with white
 * embossed type. The open tool turns hot pink; unavailable tools fade to a grey outline.
 */
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/theme';

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
  const fg = active ? studio.ink : disabled ? studio.faint : studio.toolText;
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
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon name={icon} size={18} color={fg} />
      <AppText
        variant="label"
        color={fg}
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label.toUpperCase()}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexBasis: '18%',
    flexGrow: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2,
    backgroundColor: studio.tool,
    // the raised edge of embossed tape
    borderTopWidth: 2,
    borderTopColor: '#333333',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  active: { backgroundColor: studio.toolActive, borderTopColor: studio.toolActive },
  // Unavailable: a faded outline on paper, so an idle toolbar doesn't read as broken.
  disabled: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: studio.faint,
    borderTopColor: studio.faint,
    borderBottomColor: studio.faint,
  },
  pressed: { backgroundColor: '#3A3A3A' },
  label: { fontSize: 10, lineHeight: 12, letterSpacing: 0.8 },
});
