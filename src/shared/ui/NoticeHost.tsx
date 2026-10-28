import { useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { motion, radius, spacing, typography } from '../theme/tokens';

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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!notice) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: motion.base, useNativeDriver: true }).start();
  }, [notice, opacity]);

  if (!notice) return null;
  const warning = notice.tone === 'warning';
  return <Animated.View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm, opacity }]}>
    <Pressable
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityHint="Toque para fechar."
      onPress={dismissNotice}
      style={[styles.notice, warning && styles.warning]}
    >
      <Ionicons name={warning ? 'cloud-offline-outline' : 'information-circle-outline'} size={20} color={warning ? colors.danger : colors.primary} />
      <Text style={styles.message}>{notice.message}</Text>
    </Pressable>
  </Animated.View>;
}

const makeStyles = ({ colors, elevation }: Theme) => StyleSheet.create({
  host: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center' },
  notice: {
    width: '100%', maxWidth: 480, padding: spacing.md, borderRadius: radius.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, ...elevation[2],
  },
  warning: { borderColor: colors.danger },
  message: { ...typography.bodySm, color: colors.text, flex: 1 },
});
