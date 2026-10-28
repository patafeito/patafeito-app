import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { spacing, typography } from '../theme/tokens';

type ScreenHeaderProps = { title: string; subtitle?: string; trailing?: ReactNode };

/** Título da tela (Fredoka) com subtítulo opcional e ações à direita. */
export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.screenHeader}>
    <View style={styles.titles}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
  </View>;
}

type SectionHeaderProps = { title: string; actionLabel?: string; onAction?: () => void };

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.sectionHeader}>
    <Text style={styles.section} accessibilityRole="header">{title}</Text>
    {actionLabel && onAction ? <Pressable accessibilityRole="link" onPress={onAction} hitSlop={12}>
      {({ pressed }) => <Text style={[styles.action, pressed && styles.actionPressed]}>{actionLabel}</Text>}
    </Pressable> : null}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screenHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, minHeight: 48 },
  titles: { flex: 1, gap: 2 },
  title: { ...typography.title, fontSize: 28, lineHeight: 34, color: colors.text },
  subtitle: { ...typography.bodySm, color: colors.textSecondary },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  section: { ...typography.heading, color: colors.text },
  action: { ...typography.label, color: colors.primary },
  actionPressed: { opacity: 0.7 },
});
