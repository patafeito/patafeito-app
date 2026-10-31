import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '../features/auth/application/session-context';
import { FriendRow } from '../features/friends/components/FriendRow';
import {
  fetchRanking, listFriends, listRequests, respondRequest, searchUsers, sendRequest,
  type FriendRequest, type FriendSummary, type RankingEntry, type SearchResult,
} from '../features/friends/infrastructure/friends-api';
import { ApiError, NetworkError } from '../shared/network/api-client';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { ChipGroup } from '../shared/ui/ChipGroup';
import { EmptyState } from '../shared/ui/EmptyState';
import { SectionHeader } from '../shared/ui/Headers';
import { Screen } from '../shared/ui/Screen';
import { TextField } from '../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { spacing, typography } from '../shared/theme/tokens';

type Tab = 'friends' | 'search' | 'ranking';
const tabs: { value: Tab; label: string }[] = [
  { value: 'friends', label: 'Meus amigos' },
  { value: 'search', label: 'Buscar' },
  { value: 'ranking', label: 'Ranking' },
];

function errorText(error: unknown, fallback: string) {
  if (error instanceof NetworkError) return 'Amigos e ranking precisam de conexão. Tente de novo quando a rede voltar.';
  return error instanceof ApiError ? error.message : fallback;
}

function detailOf(friend: FriendSummary, xpLabel = 'XP na semana', xp = friend.periodXp) {
  return `Nível ${friend.pet?.level ?? 1} · ${friend.streak} ${friend.streak === 1 ? 'dia' : 'dias'} seguidos · ${xp} ${xpLabel}`;
}

/** Tela 13 (HU31, HU32): amigos online e offline, pedidos, busca por @usuário e ranking entre amigos. */
export default function FriendsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendSummary[]>();
  const [requests, setRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [ranking, setRanking] = useState<RankingEntry[]>();
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const [refreshing, setRefreshing] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      const [list, pending] = await Promise.all([listFriends(), listRequests()]);
      setFriends(list);
      setRequests(pending);
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível carregar seus amigos.'), ok: false });
    }
  }, []);

  const loadRanking = useCallback(async (value: 'week' | 'month') => {
    try {
      setRanking(await fetchRanking(value));
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível carregar o ranking.'), ok: false });
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadFriends(); void loadRanking(period); }, [loadFriends, loadRanking, period]));

  async function refresh() {
    setRefreshing(true);
    setMessage(undefined);
    await Promise.all([loadFriends(), loadRanking(period)]);
    setRefreshing(false);
  }

  async function search() {
    const value = query.replace(/^@/, '').trim();
    if (value.length < 3) return setMessage({ text: 'Digite ao menos 3 letras do @usuário.', ok: false });
    setMessage(undefined);
    try {
      setResults(await searchUsers(value));
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível buscar agora.'), ok: false });
    }
  }

  async function act(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage({ text: success, ok: true });
      await loadFriends();
      if (results) await search();
    } catch (error) {
      setMessage({ text: errorText(error, 'Não foi possível concluir agora.'), ok: false });
    }
  }

  const online = (friends ?? []).filter((friend) => friend.online);
  const offline = (friends ?? []).filter((friend) => !friend.online);

  return <Screen edges={['left', 'right', 'bottom']} refreshing={refreshing} onRefresh={() => void refresh()}>
    {user?.handle ? <Text style={styles.muted} accessibilityLabel={`Seu usuário é arroba ${user.handle}`}>Seu @usuário: <Text style={styles.handle}>@{user.handle}</Text> — passe para seus amigos te acharem.</Text> : null}
    <ChipGroup variant="segmented" options={tabs} value={tab} onChange={(value: Tab) => { setTab(value); setMessage(undefined); }} />
    {message ? <Text style={message.ok ? styles.success : styles.error} accessibilityLiveRegion="polite">{message.text}</Text> : null}

    {tab === 'friends' ? <>
      {requests?.incoming.length ? <Card style={styles.card}>
        <Text style={styles.cardTitle}>Pedidos de amizade</Text>
        {requests.incoming.map((request) => <FriendRow
          key={request.id}
          displayName={request.user?.displayName ?? 'Alguém'}
          handle={request.user?.handle ?? null}
          pet={request.user?.pet ?? null}
          trailing={<View style={styles.actions}>
            <Button label="Aceitar" size="compact" onPress={() => void act(() => respondRequest(request.id, true), `Agora você e ${request.user?.displayName ?? 'essa pessoa'} são amigos.`)} />
            <Button label="Recusar" size="compact" variant="ghost" onPress={() => void act(() => respondRequest(request.id, false), 'Pedido recusado.')} />
          </View>}
        />)}
      </Card> : null}

      <Text style={styles.count}>{friends ? `${friends.length} ${friends.length === 1 ? 'amigo' : 'amigos'} · ${online.length} online` : 'Carregando…'}</Text>
      {friends && !friends.length ? <EmptyState species="bento" title="Nenhum amigo ainda" message="Busque pelo @usuário de alguém para competir e se incentivar." actionLabel="Buscar pessoas" onAction={() => setTab('search')} /> : null}
      {online.length ? <View style={styles.list}>
        <SectionHeader title="Online" />
        {online.map((friend) => <FriendRow key={friend.id} {...friend} online detail={detailOf(friend)} onPress={() => router.push(`/friend/${friend.id}`)} />)}
      </View> : null}
      {offline.length ? <View style={styles.list}>
        <SectionHeader title="Offline" />
        {offline.map((friend) => <FriendRow key={friend.id} {...friend} online={false} detail={detailOf(friend)} onPress={() => router.push(`/friend/${friend.id}`)} />)}
      </View> : null}
      {requests?.outgoing.length ? <View style={styles.list}>
        <SectionHeader title="Aguardando resposta" />
        {requests.outgoing.map((request) => <FriendRow key={request.id} displayName={request.user?.displayName ?? 'Alguém'} handle={request.user?.handle ?? null} pet={request.user?.pet ?? null} detail="Pedido enviado" />)}
      </View> : null}
    </> : null}

    {tab === 'search' ? <>
      <TextField label="@usuário" value={query} onChangeText={setQuery} placeholder="ex.: ana_1234" autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => void search()} maxLength={21} />
      <Button label="Buscar" icon="search" onPress={() => void search()} />
      {results && !results.length ? <Text style={styles.muted}>Ninguém com esse @usuário. Confira com a pessoa como está escrito.</Text> : null}
      <View style={styles.list}>
        {(results ?? []).map((result) => <FriendRow
          key={result.id}
          displayName={result.displayName}
          handle={result.handle}
          pet={result.pet}
          detail={result.pet ? `Pato ${result.pet.name} · nível ${result.pet.level}` : undefined}
          onPress={() => router.push(`/friend/${result.id}`)}
          trailing={result.relation === 'none' && result.handle
            ? <Button label="Adicionar" size="compact" icon="person-add" onPress={() => void act(() => sendRequest(result.handle!), `Pedido enviado para @${result.handle}.`)} />
            : result.relation === 'incoming' && result.handle
              ? <Button label="Aceitar" size="compact" onPress={() => void act(() => sendRequest(result.handle!), `Agora você e ${result.displayName} são amigos.`)} />
              : <Text style={styles.muted}>{result.relation === 'friend' ? 'Amigos' : 'Pedido enviado'}</Text>}
        />)}
      </View>
    </> : null}

    {tab === 'ranking' ? <>
      <ChipGroup options={[{ value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mês' }]} value={period} onChange={(value: 'week' | 'month') => { setPeriod(value); void loadRanking(value); }} />
      <Text style={styles.muted}>Só você e seus amigos aparecem aqui, ordenados pelo XP do período.</Text>
      <View style={styles.list}>
        {(ranking ?? []).map((entry) => <FriendRow
          key={entry.id}
          position={entry.position}
          highlight={entry.me}
          displayName={entry.me ? `${entry.displayName} (você)` : entry.displayName}
          handle={entry.handle}
          pet={entry.pet}
          detail={detailOf(entry, period === 'week' ? 'XP na semana' : 'XP no mês')}
          onPress={entry.me ? undefined : () => router.push(`/friend/${entry.id}`)}
        />)}
      </View>
    </> : null}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.bodySm, color: colors.textSecondary },
  handle: { ...typography.label, color: colors.primary },
  success: { ...typography.bodySm, color: colors.success },
  error: { ...typography.bodySm, color: colors.danger },
  card: { gap: spacing.sm },
  cardTitle: { ...typography.heading, color: colors.text },
  count: { ...typography.label, color: colors.text },
  list: { gap: spacing.sm },
  actions: { gap: spacing.xs },
});
