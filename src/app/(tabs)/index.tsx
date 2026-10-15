import { Text, StyleSheet, View } from 'react-native';
import { Screen } from '../../shared/ui/Screen';
import { Button } from '../../shared/ui/Button';
import { colors, spacing } from '../../shared/theme/tokens';
import { router } from 'expo-router';
export default function HomeScreen() { return <Screen><Text style={styles.greeting}>Oi! Vamos fazer hoje valer a pena.</Text><View style={styles.pet}><Text style={styles.petEmoji}>🐾</Text><View><Text style={styles.petName}>Pata · nível 1</Text><Text style={styles.muted}>Feliz por estar com você</Text></View></View><View style={styles.card}><Text style={styles.cardTitle}>Sua próxima vitória</Text><Text style={styles.muted}>Crie uma tarefa ou inicie um ciclo de foco.</Text></View><Button label="Criar tarefa" onPress={() => router.push('/(tabs)/tasks')} /></Screen> }
const styles = StyleSheet.create({ greeting: { color: colors.text, fontSize: 24, fontWeight: '800' }, pet: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, petEmoji: { fontSize: 48 }, petName: { color: colors.text, fontWeight: '800', fontSize: 18 }, muted: { color: colors.textMuted, lineHeight: 22 }, card: { borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: spacing.lg, gap: spacing.sm }, cardTitle: { color: colors.text, fontWeight: '700', fontSize: 17 } });
