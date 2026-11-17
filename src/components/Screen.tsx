import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

interface ScreenProps {
  title?: string;
  children: ReactNode;
  /** Set false for screens (like the Studio canvas) that must own their gestures. */
  scroll?: boolean;
}

export function Screen({ title, children, scroll = true }: ScreenProps) {
  const body = (
    <>
      {title ? (
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{body}</ScrollView>
      ) : (
        <>{body}</>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  title: { marginBottom: spacing.xs },
});
