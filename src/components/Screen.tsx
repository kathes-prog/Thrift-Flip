/**
 * Shared: a Zine page. Speckled photocopy paper behind everything, an
 * optional typewriter kicker ("STEP 2/4") and a tilted cut-out title whose
 * `highlight` words get a highlighter swipe.
 *
 * The native header is transparent (app/_layout), so a strip of the same paper
 * sits behind the status bar and back button: scrolled content slides under it
 * instead of colliding with the clock. `footer` pins the main action to the
 * bottom so it's always on screen.
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, text } from '@/theme';

import { AppText } from './AppText';
import { Highlight, PaperBackground } from './zine/Decor';

interface ScreenProps {
  title?: string;
  /** Part of the title to highlight, e.g. title "Garment map", highlight "map". */
  highlight?: string;
  /** Small typewriter line above the title. */
  kicker?: string;
  children: ReactNode;
  /** Pinned below the scrolling content, e.g. the screen's main button. */
  footer?: ReactNode;
  /** Set false for screens (like the Studio canvas) that must own their gestures. */
  scroll?: boolean;
}

/** Height of the native stack header's bar, below the status bar. */
const HEADER_HEIGHT = 44;
/** Headlines may grow with the iOS text size, but only this far. */
export const TITLE_MAX_SCALE = 1.15;

export function Screen({ title, highlight, kicker, children, footer, scroll = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topBar = insets.top + HEADER_HEIGHT;
  const bottom = footer ? spacing.md : insets.bottom + spacing.xl;
  const contentStyle = [styles.content, { paddingTop: topBar, paddingBottom: bottom }];
  const body = (
    <>
      {kicker ? <AppText variant="kicker">{kicker}</AppText> : null}
      {title ? <Title title={title} highlight={highlight} /> : null}
      {children}
    </>
  );
  return (
    <View style={styles.safe}>
      <PaperBackground />
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={contentStyle}>
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, ...contentStyle]}>{body}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <PaperBackground />
          {footer}
        </View>
      ) : null}
      {/* Paper strip behind the status bar and the header's back button. */}
      <View style={[styles.topBar, { height: topBar }]} pointerEvents="none">
        <PaperBackground />
      </View>
    </View>
  );
}

function Title({ title, highlight = '' }: { title: string; highlight?: string }) {
  const upper = title.toUpperCase();
  const at = highlight ? upper.indexOf(highlight.toUpperCase()) : -1;
  const end = at + highlight.length;
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={TITLE_MAX_SCALE}
      style={[text.title, styles.title]}
    >
      {at < 0 ? (
        upper
      ) : (
        <>
          {upper.slice(0, at)}
          <Highlight>{upper.slice(at, end)}</Highlight>
          {upper.slice(end)}
        </>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  title: {
    color: colors.ink,
    marginBottom: spacing.xs,
    transform: [{ rotate: '-2deg' }],
    alignSelf: 'flex-start',
  },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    gap: spacing.sm,
    // Solid: iOS can't dash a single border side.
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    overflow: 'hidden',
  },
});
