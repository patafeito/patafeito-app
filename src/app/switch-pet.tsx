import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { speciesById, speciesList, type SpeciesId } from '../features/onboarding/domain/species';
import { PetSprite } from '../features/pet/components/PetSprite';
import { formatCompanionTime, summarizeCompanions } from '../features/pet/domain/companions';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { fetchPetHistory, switchPet } from '../features/pet/infrastructure/pet-api';
import { useLocalData } from '../shared/hooks/use-local-data';
import { ApiError, NetworkError } from '../shared/network/api-client';
import { Badge } from '../shared/ui/Badge';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { Screen } from '../shared/ui/Screen';
import { TextField } from '../shared/ui/TextField';
import { colors, spacing, typography } from '../shared/theme/tokens';

async function loadSwitchContext() {
  const [pet, history] = await Promise.all([loadLocalPet(), fetchPetHistory().catch(() => undefined)]);
  return { pet, companions: history ? summarizeCompanions(history) : undefined };
}

export default function SwitchPetScreen() {
  const { data } = useLocalData(loadSwitchContext);
  const [selected, setSelected] = useState<SpeciesId>();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const currentId = data?.pet?.speciesId;
  const options = speciesList.filter((species) => species.id !== currentId);

  function choose(id: SpeciesId) {
    setSelected(id);
    setError(undefined);
    // Voltar para um pato antigo sugere o último apelido usado com ele.
    setName(data?.companions?.find((item) => item.speciesId === id)?.lastName ?? speciesById(id).name);
  }

  async function confirm() {
    if (!selected) return setError('Escolha o novo pato.');
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 15) return setError('O apelido precisa ter de 2 a 15 caracteres.');
    setSaving(true);
    try {
      await switchPet({ speciesId: selected, name: trimmed });
      router.back();
    } catch (caught) {
      if (caught instanceof NetworkError) setError('Precisamos de conexão para trocar de pato. Tente de novo quando a rede voltar.');
      else setError(caught instanceof ApiError ? caught.message : 'Não foi possível trocar de pato agora.');
    } finally {
      setSaving(false);
    }
  }

  return <Screen edges={['left', 'right', 'bottom']}>
    <Card>
      <Text style={styles.cardTitle}>Seu tempo com cada pato</Text>
      {data?.companions === undefined ? <Text style={styles.muted}>{data ? 'Sem conexão para carregar o histórico agora.' : 'Carregando…'}</Text>
        : <View style={styles.history}>
          {data.companions.map((item) => <View key={item.speciesId} style={styles.historyRow}>
            <PetSprite species={speciesById(item.speciesId).id} state="idle" height={48} still />
            <View style={styles.historyText}>
              <Text style={styles.historyName}>{item.lastName} <Text style={styles.muted}>· {speciesById(item.speciesId).name}</Text></Text>
              <Text style={styles.muted}>{formatCompanionTime(item.totalMs)}{item.periods > 1 ? ` em ${item.periods} períodos` : ''}</Text>
            </View>
            {item.current ? <Badge tone="primary">Atual</Badge> : null}
          </View>)}
        </View>}
    </Card>

    <Text style={styles.title}>Escolha o novo pato</Text>
    <Text style={styles.muted}>XP, nível, moedas e status continuam com você.</Text>
    {options.map((item) => {
      const active = item.id === selected;
      return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => choose(item.id)}>
        <Card tone={active ? 'primary' : 'default'} style={[styles.option, active && { borderColor: item.accent }]}>
          <PetSprite species={item.id} state={active ? 'cheer' : 'idle'} height={80} still={!active} />
          <View style={styles.historyText}>
            <Text style={styles.historyName}>{item.name} <Text style={styles.muted}>— {item.tagline}</Text></Text>
            <Text style={styles.muted}>{item.personality}</Text>
          </View>
        </Card>
      </Pressable>;
    })}

    {selected ? <TextField label="Apelido" value={name} onChangeText={(text) => { setName(text); setError(undefined); }} maxLength={15} hint="De 2 a 15 caracteres." /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button label={saving ? 'Trocando…' : 'Trocar de pato'} onPress={() => void confirm()} disabled={saving || !selected} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.heading, color: colors.text, fontSize: 18 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17, marginBottom: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  error: { ...typography.body, color: colors.danger, fontSize: 14 },
  history: { gap: spacing.sm },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  historyText: { flex: 1, gap: 2 },
  historyName: { ...typography.label, color: colors.text, fontSize: 15 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
