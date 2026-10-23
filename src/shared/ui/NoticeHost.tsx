import { useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Notice = { id: number; message: string; tone: 'info' | 'warning' };

let current: Notice | undefined;
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const visibleMs = 6000;

function emit() {
  for (const listener of listeners) listener();
}

/** Aviso que aparece por cima de qualquer tela, para o que acontece fora da ação do usuário (como a sincronização). */
export function showNotice(message: string, tone: Notice['tone'] = 'info') {
  current = { id: nextId += 1, message, tone };
  emit();
  clearTimeout(timer);
  timer = setTimeout(dismissNotice, visibleMs);
}

export function dismissNotice() {
  clearTimeout(timer);
  current = undefined;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const snapshot = () => current;

/** Renderize uma vez, no layout raiz. */
export function NoticeHost() {
  const notice = useSyncExternalStore(subscribe, snapshot, snapshot);
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!notice) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [notice, opacity]);

  if (!notice) return null;
  return <Animated.View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm, opacity }]}>
    <Pressable
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityHint="Toque para fechar."
      onPress={dismissNotice}
      style={[styles.notice, notice.tone === 'warning' && styles.warning]}
    >
      <Text style={styles.message}>{notice.message}</Text>
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center' },
  notice: {
    width: '100%', maxWidth: 480, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
  },
  warning: { borderColor: colors.danger },
  message: { ...typography.body, color: colors.text, fontSize: 14, lineHeight: 20 },
});
