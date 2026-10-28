import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type DialogProps = PropsWithChildren<{ visible: boolean; onClose: () => void }>;

/** Base dos modais: fundo escurecido que fecha ao toque e um cartão central acolhedor. */
export function Dialog({ visible, onClose, children }: DialogProps) {
  const styles = useThemedStyles(makeStyles);
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        {visible ? <Pressable style={styles.sheet} onPress={() => undefined} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>{children}</ScrollView>
        </Pressable> : null}
      </Pressable>
    </KeyboardAvoidingView>
  </Modal>;
}

const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'center', padding: spacing.lg },
  sheet: {
    alignSelf: 'center', width: '100%', maxWidth: 420, maxHeight: '90%',
    borderRadius: radius.xl, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, ...elevation[2],
  },
  content: { gap: spacing.md, padding: spacing.lg },
});
