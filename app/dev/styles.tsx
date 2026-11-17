/**
 * Shared: requirement 2 (Hello Styles). Shows every colour token, every font
 * family and weight, and every icon, so they can be checked on the iPhone.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, fontList, Icon, iconNames, radii, spacing, text } from '@/theme';

export default function HelloStyles() {
  return (
    <Screen title="Hello Styles">
      <Card>
        <AppText variant="heading">Colours</AppText>
        <View style={styles.grid}>
          {Object.entries(colors).map(([name, value]) => (
            <View key={name} style={styles.swatchCell}>
              <View style={[styles.swatch, { backgroundColor: value }]} />
              <AppText variant="caption">{name}</AppText>
              <AppText variant="caption" color={colors.inkMuted}>
                {value}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Fonts and weights</AppText>
        {fontList.map(({ family, label }) => (
          <AppText key={family} style={{ fontFamily: family, fontSize: 18 }}>
            {label} · Thrifted denim 0123456789
          </AppText>
        ))}
      </Card>

      <Card>
        <AppText variant="heading">Text styles</AppText>
        {(Object.keys(text) as (keyof typeof text)[]).map((variant) => (
          <AppText key={variant} variant={variant}>
            {variant}
          </AppText>
        ))}
      </Card>

      <Card>
        <AppText variant="heading">Icons</AppText>
        <View style={styles.grid}>
          {iconNames.map((name) => (
            <View key={name} style={styles.iconCell}>
              <Icon name={name} size={28} />
              <AppText variant="caption">{name}</AppText>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatchCell: { width: 96, gap: 2 },
  swatch: {
    height: 40,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconCell: { width: 72, alignItems: 'center', gap: 4 },
});
