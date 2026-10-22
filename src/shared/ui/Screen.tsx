import type { PropsWithChildren, RefObject } from 'react';
import type { ScrollViewInstance, StyleProp, ViewStyle } from 'react-native';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/tokens';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: readonly Edge[];
  scrollRef?: RefObject<ScrollViewInstance | null>;
}>;

const defaultEdges: readonly Edge[] = ['left', 'right'];

export function Screen({ children, scroll = true, contentStyle, refreshing, onRefresh, edges = defaultEdges, scrollRef }: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return <SafeAreaView edges={edges} style={styles.safe}>
    {scroll
      ? <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
      >{content}</ScrollView>
      : content}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
});
