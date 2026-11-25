/**
 * Shared: requirement 2 (Hello Styles). Shows every colour token, every font
 * family and weight, every icon and every Zine building block (buttons, torn
 * paper, tape, stamp, label tags, popup), so they can be checked on the iPhone.
 */
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { StubBanner } from '@/components/StubBanner';
import { Highlight, Stamp, Tape, TapeLabel } from '@/components/zine/Decor';
import { TornPaper } from '@/components/zine/TornPaper';
import { useZineAlert } from '@/components/zine/ZineAlert';
import { colors, fontList, Icon, iconNames, radii, spacing, text } from '@/theme';

export default function HelloStyles() {
  const alert = useZineAlert();
  return (
    <Screen title="Hello Styles">
      <Card>
        <AppText variant="heading">Zine kit</AppText>
        <AppText variant="kicker">Buttons</AppText>
        <Button label="Primary" onPress={() => {}} />
        <Button label="Secondary" variant="secondary" onPress={() => {}} />
        <Button label="Highlight" variant="highlight" onPress={() => {}} />
        <Button label="Disabled" disabled onPress={() => {}} />
        <AppText variant="kicker">Paper, tape, stamp, tags</AppText>
        <View style={styles.kitRow}>
          <TornPaper tilt={-1.5} color={colors.guideFill} style={styles.kitPaper}>
            <AppText>Torn paper</AppText>
          </TornPaper>
          <Tape style={styles.kitTape} />
        </View>
        <View style={styles.kitRow}>
          <Stamp>{'644 SQ CM\nSHORT'}</Stamp>
          <View style={styles.kitTags}>
            <TapeLabel>INK TAG</TapeLabel>
            <TapeLabel tone="highlight">HIGHLIGHT TAG</TapeLabel>
            <TapeLabel tone="pink">PINK TAG</TapeLabel>
          </View>
        </View>
        <AppText>
          Body text with a <Highlight>highlighter</Highlight> swipe.
        </AppText>
        <StubBanner owner="Shared" note="Stub banner, shown on unfinished screens." />
        <Button
          label="Show popup"
          variant="secondary"
          onPress={() => alert('Popup', 'The Zine replacement for iOS alerts.')}
        />
      </Card>

      <Card>
        <AppText variant="heading">Colours</AppText>
        <View style={styles.grid}>
          {Object.entries(colors).map(([name, value]) => (
            <View key={name} style={styles.swatchCell}>
              <View style={[styles.swatch, { backgroundColor: value }]} />
              {/* Break opportunities before capitals: "denim·Original", not "denimOrigina·l". */}
              <AppText variant="caption">{name.replace(/([A-Z])/g, '\u200B$1')}</AppText>
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
  // Wide enough that long token names wrap at a capital, not mid-word.
  swatchCell: { width: 104, gap: 2 },
  kitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  kitPaper: { flex: 1 },
  kitTape: { top: -6, left: 40 },
  kitTags: { flex: 1, gap: spacing.xs },
  swatch: {
    height: 40,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconCell: { width: 72, alignItems: 'center', gap: 4 },
});
