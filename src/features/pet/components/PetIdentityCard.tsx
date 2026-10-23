import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { TextField } from '../../../shared/ui/TextField';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import { speciesById } from '../../onboarding/domain/species';
import type { Pet } from '../domain/pet';
import { renamePet } from '../infrastructure/pet-api';

/** Apelido do pato e acesso à troca de espécie (com o histórico de tempo com cada um). */
export function PetIdentityCard({ pet, onChanged }: { pet: Pet; onChanged: () => void }) {
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
      <Text style={styles.muted}>{pet.name}, um {speciesById(pet.speciesId).name}.</Text>
      <Button label="Trocar apelido" variant="secondary" onPress={() => { setName(pet.name); setError(undefined); setEditing(true); }} />
      <Button label="Trocar de pato" variant="secondary" onPress={() => router.push('/switch-pet')} />
    </>}
  </Card>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17 },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
