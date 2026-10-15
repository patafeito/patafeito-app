import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme/tokens';
export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}><Text style={styles.label}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({ button: { backgroundColor: colors.primary, borderRadius: 14, padding: spacing.md, alignItems: 'center' }, label: { color: colors.text, fontWeight: '700', fontSize: 16 } });
