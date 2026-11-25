/**
 * Shared: a Zine-styled replacement for Alert.alert — a torn note on a dimmed
 * page with one OK button. Wrap the app in <ZineAlertProvider> (app/_layout)
 * and call `const alert = useZineAlert(); alert('Saved', 'Your project…')`.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { colors, spacing, text } from '@/theme';

import { AppText } from '../AppText';
import { Button } from '../Button';
import { Tape } from './Decor';
import { TornPaper } from './TornPaper';

type ShowAlert = (title: string, message?: string) => void;

const AlertContext = createContext<ShowAlert | null>(null);

export function ZineAlertProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ title: string; message?: string } | null>(null);
  const show = useCallback<ShowAlert>((title, message) => setCurrent({ title, message }), []);
  const close = () => setCurrent(null);

  return (
    <AlertContext.Provider value={show}>
      {children}
      <Modal
        visible={current !== null}
        transparent
        animationType="fade"
        onRequestClose={close}
        accessibilityViewIsModal
      >
        <View style={styles.backdrop}>
          <View style={styles.noteWrap}>
            <TornPaper tilt={-1.5} depth={6} style={styles.note}>
              <AppText accessibilityRole="header" style={[text.title, styles.title]}>
                {current?.title.toUpperCase()}
              </AppText>
              {current?.message ? <AppText>{current.message}</AppText> : null}
              <View style={styles.ok}>
                <Button label="OK" onPress={close} />
              </View>
            </TornPaper>
            <Tape style={styles.tape} tilt={-5} />
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

/** Returns `alert(title, message?)`. Falls back to nothing outside the provider. */
export function useZineAlert(): ShowAlert {
  return useContext(AlertContext) ?? noop;
}

const noop: ShowAlert = () => {};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  noteWrap: { alignSelf: 'stretch' },
  note: { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.sm },
  title: { fontSize: 26, lineHeight: 33, color: colors.ink },
  ok: { marginTop: spacing.sm },
  tape: { top: -10, alignSelf: 'center' },
});
