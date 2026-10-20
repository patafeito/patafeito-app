import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return <SafeAreaView style={styles.safe}>{scroll ? <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView> : content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
});
