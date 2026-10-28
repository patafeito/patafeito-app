import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { TextField } from '../../../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../../shared/theme/tokens';
import { speciesById } from '../../onboarding/domain/species';
import type { Pet } from '../domain/pet';
import { renamePet } from '../infrastructure/pet-api';

/** Apelido do pato e acesso à troca de espécie (com o histórico de tempo com cada um). */
export function PetIdentityCard({ pet, onChanged }: { pet: Pet; onChanged: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet.name);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 15) return setError('O apelido precisa ter de 2 a 15 caracteres.');
    setSaving(true);
    try {
      await renamePet(trimmed);
      setEditing(false);
      onChanged();
    } catch (caught) {
      if (caught instanceof NetworkError) setError('Precisamos de conexão para trocar o apelido.');
      else setError(caught instanceof ApiError ? caught.message : 'Não foi possível trocar o apelido agora.');
    } finally {
      setSaving(false);
    }
  }

  return <Card style={styles.card}>
    <Text style={styles.cardTitle}>Seu pato</Text>
    {editing ? <>
      <TextField label="Apelido" value={name} onChangeText={(text) => { setName(text); setError(undefined); }} maxLength={15} error={error} hint="De 2 a 15 caracteres." />
      <Button label={saving ? 'Salvando…' : 'Salvar apelido'} onPress={() => void save()} disabled={saving} />
      <Button label="Cancelar" variant="ghost" onPress={() => setEditing(false)} disabled={saving} />
    </> : <>
      <Text style={styles.muted}>{pet.name === speciesById(pet.speciesId).name ? `Apelido: ${pet.name}` : `${pet.name}, um ${speciesById(pet.speciesId).name}`}.</Text>
      <View style={styles.actions}>
        <View style={styles.action}><Button label="Trocar apelido" icon="pencil-outline" variant="secondary" size="compact" onPress={() => { setName(pet.name); setError(undefined); setEditing(true); }} /></View>
        <View style={styles.action}><Button label="Trocar de pato" icon="swap-horizontal" variant="secondary" size="compact" onPress={() => router.push('/switch-pet')} /></View>
      </View>
    </>}
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { gap: spacing.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flexGrow: 1, flexBasis: 160 },
  cardTitle: { ...typography.heading, color: colors.text },
  muted: { ...typography.bodySm, color: colors.textSecondary },
});
