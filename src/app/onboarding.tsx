import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../shared/ui/Button';
import { Screen } from '../shared/ui/Screen';
import { colors, spacing } from '../shared/theme/tokens';

const species = ['Gatinho lunar', 'Cachorro solar', 'Capivara cósmica'];
export default function Onboarding() {
  const [selected, setSelected] = useState(species[0]);
  const [name, setName] = useState('Pata');
  return <Screen><Text style={styles.eyebrow}>BEM-VINDO AO PATAFEITO</Text><Text style={styles.title}>Escolha seu parceiro de foco</Text><Text style={styles.body}>Ele vai acompanhar cada pequena vitória da sua rotina.</Text>
    <View style={styles.options}>{species.map((item) => <Text key={item} accessibilityRole="button" onPress={() => setSelected(item)} style={[styles.option, selected === item && styles.optionSelected]}>{item}</Text>)}</View>
    <Text style={styles.label}>Como ele vai se chamar?</Text><TextInput value={name} onChangeText={setName} maxLength={15} style={styles.input} placeholder="De 2 a 15 caracteres" placeholderTextColor={colors.textMuted} />
    <Button label="Começar a jornada" onPress={() => router.replace('/(tabs)')} /></Screen>;
}
const styles = StyleSheet.create({ eyebrow: { color: colors.primary, fontWeight: '700', letterSpacing: 1 }, title: { color: colors.text, fontSize: 28, fontWeight: '800' }, body: { color: colors.textMuted, fontSize: 16, lineHeight: 24 }, options: { gap: spacing.sm }, option: { color: colors.text, backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, overflow: 'hidden' }, optionSelected: { borderWidth: 2, borderColor: colors.primary }, label: { color: colors.text, fontWeight: '700', marginTop: spacing.md }, input: { color: colors.text, backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, fontSize: 16 } });
