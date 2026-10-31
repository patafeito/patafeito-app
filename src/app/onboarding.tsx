import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { speciesList, type SpeciesId } from '../features/onboarding/domain/species';
import { PetSprite } from '../features/pet/components/PetSprite';
import { createPet } from '../features/pet/infrastructure/pet-api';
import { ApiError, NetworkError } from '../shared/network/api-client';
import { Badge } from '../shared/ui/Badge';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { TextField } from '../shared/ui/TextField';
import { useTheme, useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { spacing, typography } from '../shared/theme/tokens';

export default function Onboarding() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [selected, setSelected] = useState<SpeciesId>('pingo');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const species = speciesList.find((item) => item.id === selected)!;

  async function confirm() {
    const trimmed = name.trim();
    setError(undefined);
    if (trimmed.length < 2 || trimmed.length > 15) return setError('O nome precisa ter de 2 a 15 caracteres.');
    setSubmitting(true);
    try {
      await createPet({ speciesId: selected, name: trimmed });
      // Primeiro acesso: apresenta os módulos antes de abrir o Início.
      router.replace({ pathname: '/tour', params: { first: '1' } });
    } catch (caught) {
      if (caught instanceof NetworkError) setError('Precisamos de conexão para criar seu pato. Tente de novo quando a rede voltar.');
      else setError(caught instanceof ApiError ? caught.message : 'Não foi possível criar seu pato agora.');
    } finally {
      setSubmitting(false);
    }
  }

  return <Screen edges={['left', 'right', 'bottom']}>
    <Text style={styles.eyebrow}>BEM-VINDO AO PATAFEITO</Text>
    <Text style={styles.title}>Escolha seu pato</Text>
    <Text style={styles.body}>Todos evoluem igual. O que muda é o jeito de te acompanhar.</Text>

    {speciesList.map((item) => {
      const active = item.id === selected;
      return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => setSelected(item.id)}>
        <Card tone={active ? 'primary' : 'default'} style={[styles.option, active && { borderColor: colors[item.accent] }]}>
          <PetSprite species={item.id} state={active ? 'cheer' : 'idle'} height={96} still={!active} />
          <View style={styles.optionText}>
            <Text style={styles.optionName}>{item.name} <Text style={styles.optionTagline}>— {item.tagline}</Text></Text>
            <Text style={styles.optionBody}>{item.personality}</Text>
            <Text style={styles.optionBody}>{item.indicatedFor}</Text>
            <Badge tone={active ? 'primary' : 'neutral'}>{item.mission}</Badge>
          </View>
        </Card>
      </Pressable>;
    })}

    <TextField
      label={`Como ${species.name} vai se chamar?`}
      value={name}
      onChangeText={setName}
      maxLength={15}
      placeholder="De 2 a 15 caracteres"
      hint="Você pode usar o nome sugerido ou inventar o seu."
      error={error}
    />
    <Button label={submitting ? 'Criando…' : 'Começar a jornada'} disabled={submitting} onPress={() => void confirm()} />
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  eyebrow: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  title: { ...typography.title, color: colors.text, fontSize: 28, lineHeight: 34 },
  body: { ...typography.body, color: colors.textSecondary },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionText: { flex: 1, gap: spacing.xs },
  optionName: { ...typography.heading, color: colors.text },
  optionTagline: { ...typography.bodySm, color: colors.textSecondary },
  optionBody: { ...typography.bodySm, color: colors.textSecondary },
});
