import { useCallback, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Button } from './Button';

export type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Ações que apagam ou não têm volta ganham o botão em vermelho. */
  destructive?: boolean;
  image?: ImageSourcePropType;
  /** Conteúdo extra entre a mensagem e os botões (por exemplo, o saldo depois da compra). */
  details?: ReactNode;
  onConfirm: () => void;
};

/** Diálogo de confirmação no visual do app, no lugar do alerta nativo do sistema. */
export function ConfirmDialog({ request, onClose }: { request?: ConfirmRequest; onClose: () => void }) {
  return <Modal visible={!!request} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar">
      {request ? <Pressable style={styles.sheet} onPress={() => undefined} accessibilityViewIsModal>
        {request.image ? <Image source={request.image} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors /> : null}
        <Text style={styles.title} accessibilityRole="header">{request.title}</Text>
        {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
        {request.details}
        <View style={styles.actions}>
          <View style={styles.action}><Button label={request.cancelLabel ?? 'Cancelar'} variant="secondary" onPress={onClose} /></View>
          <View style={styles.action}>
            <Pressable
              accessibilityRole="button"
              onPress={() => { onClose(); request.onConfirm(); }}
              style={({ pressed }) => [styles.confirm, request.destructive && styles.destructive, pressed && styles.pressed]}
            >
              <Text style={styles.confirmLabel}>{request.confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable> : null}
    </Pressable>
  </Modal>;
}

/** `confirm(pedido)` abre o diálogo; renderize `dialog` uma vez na tela. */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest>();
  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);
  const dialog = <ConfirmDialog request={request} onClose={() => setRequest(undefined)} />;
  return { confirm, dialog };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5, 14, 26, 0.72)', justifyContent: 'center', padding: spacing.lg },
  sheet: {
    alignSelf: 'center', width: '100%', maxWidth: 420, gap: spacing.md, padding: spacing.lg,
    borderRadius: radius.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
  },
  image: { width: 88, height: 88, alignSelf: 'center' },
  title: { ...typography.heading, color: colors.text, fontSize: 19, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  confirm: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, backgroundColor: colors.primary },
  destructive: { backgroundColor: colors.danger },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  confirmLabel: { ...typography.label, color: colors.background, fontSize: 16 },
});
