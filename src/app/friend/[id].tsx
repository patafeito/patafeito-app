import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { cheer, fetchProfile, removeFriend, sendRequest, type Profile } from '../../features/friends/infrastructure/friends-api';
import { speciesById } from '../../features/onboarding/domain/species';
import { PetSprite } from '../../features/pet/components/PetSprite';
import { ApiError, NetworkError } from '../../shared/network/api-client';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { useConfirm } from '../../shared/ui/ConfirmDialog';
import { Screen } from '../../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

function errorText(error: unknown, fallback: string) {
  if (error instanceof NetworkError) return 'Precisa de conexão. Tente de novo quando a rede voltar.';
  return error instanceof ApiError ? error.message : fallback;
}

/** Perfil de outra pessoa (HU31). Para amigos: pato, nível, sequência e XP; para os demais, só o básico. */
export default function FriendProfileScreen() {
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile>();
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async () => {
    try {
      setProfile(await fetchProfile(id));
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível abrir este perfil.'), ok: false });
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function act(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage({ text: success, ok: true });
      await load();
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível concluir agora.'), ok: false });
    }
  }

  function unfriend() {
    if (!profile) return;
    confirm({
      title: 'Desfazer amizade?',
      message: `Você e ${profile.displayName} deixam de aparecer no ranking um do outro.`,
      confirmLabel: 'Desfazer',
      destructive: true,
      onConfirm: () => void removeFriend(profile.id).then(() => router.back()).catch((error: unknown) => setMessage({ text: errorText(error, 'Não foi possível desfazer agora.'), ok: false })),
    });
  }

  if (!profile) return <Screen edges={['left', 'right']}>
    {message ? <Text style={styles.error}>{message.text}</Text> : <Text style={styles.muted}>Carregando…</Text>}
  </Screen>;

  const friend = profile.relation === 'friend' ? profile : undefined;
  return <Screen edges={['left', 'right', 'bottom']}>
    <View style={styles.header}>
      {profile.pet ? <PetSprite species={speciesById(profile.pet.speciesId).id} state={friend?.online ? 'happy' : 'idle'} height={140} /> : null}
      <Text style={styles.name}>{profile.displayName}</Text>
      <Text style={styles.muted}>{profile.handle ? `@${profile.handle}` : ''}{friend ? ` · ${friend.online ? 'Online' : 'Offline'}` : ''}</Text>
      {profile.pet ? <Text style={styles.muted}>Pato {profile.pet.name} · nível {profile.pet.level}</Text> : null}
    </View>

    {friend ? <View style={styles.grid}>
      <Metric label="Dias seguidos" value={String(friend.streak)} />
      <Metric label="XP na semana" value={String(friend.periodXp)} />
      <Metric label="XP total" value={String(friend.xpTotal)} />
    </View> : <Card tone="muted"><Text style={styles.muted}>Sequência, XP e status ficam visíveis depois que vocês forem amigos.</Text></Card>}

    {message ? <Text style={message.ok ? styles.success : styles.error} accessibilityLiveRegion="polite">{message.text}</Text> : null}

    {friend ? <>
      <Button label="Incentivar" icon="heart" onPress={() => void act(() => cheer(profile.id), `${profile.displayName} vai receber seu incentivo.`)} />
      <Button label="Desfazer amizade" variant="dangerOutline" onPress={unfriend} />
    </> : profile.relation === 'none' && profile.handle
      ? <Button label="Adicionar amigo" icon="person-add" onPress={() => void act(() => sendRequest(profile.handle!), 'Pedido de amizade enviado.')} />
      : profile.relation === 'incoming' && profile.handle
        ? <Button label="Aceitar pedido" icon="checkmark" onPress={() => void act(() => sendRequest(profile.handle!), 'Agora vocês são amigos.')} />
        : profile.relation === 'outgoing' ? <Text style={styles.muted}>Pedido enviado. Aguardando resposta.</Text> : null}
    {dialog}
  </Screen>;
}

function Metric({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.metric} accessible accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md },
  name: { ...typography.title, color: colors.text },
  muted: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  success: { ...typography.bodySm, color: colors.success, textAlign: 'center' },
  error: { ...typography.bodySm, color: colors.danger, textAlign: 'center' },
  grid: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  metricValue: { ...typography.numeric, fontSize: 20, lineHeight: 26, color: colors.text },
  metricLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
