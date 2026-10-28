import type { PropsWithChildren, RefObject } from 'react';
import type { ScrollViewInstance, StyleProp, ViewStyle } from 'react-native';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return <SafeAreaView edges={edges} style={styles.safe}>
    {scroll
      ? <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.surface} /> : undefined}
      >{content}</ScrollView>
      : content}
  </SafeAreaView>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  // Largura máxima só para tablets; no celular ocupa tudo com respiro de 16.
  content: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
});
