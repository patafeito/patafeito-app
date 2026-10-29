import { useRef, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, type ScrollViewInstance } from 'react-native';
import { KeyboardAwareContext, useKeyboardAwareScroll } from '../hooks/use-keyboard-aware-scroll';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';

type DialogProps = PropsWithChildren<{ visible: boolean; onClose: () => void }>;

/** Base dos modais: fundo escurecido que fecha ao toque e um cartão central acolhedor. */
export function Dialog({ visible, onClose, children }: DialogProps) {
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const keyboard = useKeyboardAwareScroll(scrollRef);
  // O modal ocupa a tela toda (edge-to-edge no Android): o cartão sobe nas duas plataformas e o campo focado é rolado à vista.
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
        {visible ? <Pressable style={styles.sheet} onPress={() => undefined} accessibilityViewIsModal>
          <KeyboardAwareContext value={keyboard.context}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              onScroll={keyboard.onScroll}
              scrollEventThrottle={16}
            >{children}</ScrollView>
          </KeyboardAwareContext>
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
