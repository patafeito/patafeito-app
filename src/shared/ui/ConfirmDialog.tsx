import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { PixelImage } from './PixelImage';

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
  const styles = useThemedStyles(makeStyles);
  return <Dialog visible={!!request} onClose={onClose}>
    {request ? <>
      {request.image ? <View style={styles.imageFrame}><PixelImage source={request.image} size={88} /></View> : null}
      <Text style={styles.title} accessibilityRole="header">{request.title}</Text>
      {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
      {request.details}
      <View style={styles.actions}>
        <View style={styles.action}><Button label={request.cancelLabel ?? 'Cancelar'} variant="secondary" onPress={onClose} /></View>
        <View style={styles.action}>
          <Button label={request.confirmLabel} variant={request.destructive ? 'danger' : 'primary'} onPress={() => { onClose(); request.onConfirm(); }} />
        </View>
      </View>
    </> : null}
  </Dialog>;
}

/** `confirm(pedido)` abre o diálogo; renderize `dialog` uma vez na tela. */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest>();
  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);
  const dialog = <ConfirmDialog request={request} onClose={() => setRequest(undefined)} />;
  return { confirm, dialog };
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  imageFrame: { alignSelf: 'center', padding: spacing.sm, borderRadius: 999, backgroundColor: colors.surfaceMuted },
  title: { ...typography.title, fontSize: 22, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1 },
});
