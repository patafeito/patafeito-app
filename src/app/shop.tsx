import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { celebrate } from '../features/pet/application/pet-mood';
import { cachedBalance, refreshBalance } from '../features/rewards/infrastructure/balance-repository';
import { CoinAmount, ShopItemCard } from '../features/shop/components/ShopItemCard';
import { boostLabel, categories, coinStackIcon, isShowable, itemImage, localDateKey, type ShopCategory, type ShopItem } from '../features/shop/domain/catalog';
import {
  cachedBoosts, cachedCatalog, listLocalInventory, purchase, refreshBoosts, refreshCatalog, refreshInventory, setEquipped, consumeItem,
} from '../features/shop/infrastructure/shop-repository';
import { useLocalData } from '../shared/hooks/use-local-data';
import { ApiError, NetworkError } from '../shared/network/api-client';
import { Card } from '../shared/ui/Card';
import { ChipGroup } from '../shared/ui/ChipGroup';
import { useConfirm } from '../shared/ui/ConfirmDialog';
import { PixelImage } from '../shared/ui/PixelImage';
import { Screen } from '../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

type ShopView = 'shop' | 'bag';

async function loadShop() {
  const [catalog, inventory, boosts, balance] = await Promise.all([cachedCatalog(), listLocalInventory(), cachedBoosts(), cachedBalance()]);
  return { catalog: catalog.filter(isShowable), inventory, boosts, coins: balance?.coins ?? 0 };
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof NetworkError) return 'A loja precisa de conexão. Tente de novo quando a rede voltar.';
  return error instanceof ApiError ? error.message : fallback;
}

export default function ShopScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data, reload } = useLocalData(loadShop);
  const [view, setView] = useState<ShopView>('shop');
  const [category, setCategory] = useState<ShopCategory>('food');
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState<string>();
  const { confirm, dialog } = useConfirm();

  // Ao abrir, busca o catálogo, o inventário e o saldo atuais; o cache segura a tela sem rede.
  useEffect(() => {
    void Promise.all([refreshCatalog(), refreshInventory(), refreshBoosts(), refreshBalance()])
      .catch(() => setMessage('Sem conexão: mostrando a última versão da loja.'))
      .finally(() => void reload());
  }, [reload]);

  const owned = new Map((data?.inventory ?? []).map((row) => [row.itemId, row]));
  const visible = (data?.catalog ?? []).filter((item) => item.slot === category);
  const bag = visible.filter((item) => (owned.get(item.id)?.quantity ?? 0) > 0);

  async function run(itemId: string, action: () => Promise<string | void>, fallback: string) {
    setBusy(itemId);
    try {
      const result = await action();
      if (result) setMessage(result);
      await reload();
    } catch (error) {
      setMessage(errorMessage(error, fallback));
    } finally {
      setBusy(undefined);
    }
  }

  function buy(item: ShopItem) {
    const coins = data?.coins ?? 0;
    confirm({
      title: `Comprar ${item.name}?`,
      message: item.description,
      image: item.slot === 'background' ? undefined : itemImage(item.sku),
      details: <View style={styles.receipt}>
        <View style={styles.receiptRow}><Text style={styles.muted}>Preço</Text><CoinAmount value={item.priceCoins} /></View>
        <View style={styles.receiptRow}><Text style={styles.muted}>Saldo depois</Text><CoinAmount value={coins - item.priceCoins} /></View>
      </View>,
      confirmLabel: 'Comprar',
      onConfirm: () => void run(item.id, async () => {
        await purchase(item.id);
        return item.consumable ? `${item.name} foi para a mochila.` : `${item.name} é seu. Use na mochila.`;
      }, 'Não foi possível comprar agora.'),
    });
  }

  function use(item: ShopItem) {
    void run(item.id, async () => {
      await consumeItem(item.id, item.effect.type === 'streak_shield' ? localDateKey() : undefined);
      if (item.slot === 'food') {
        celebrate('eating', { message: 'Nhac! Que delícia.' });
        return `Seu pato comeu ${item.name.toLowerCase()}.`;
      }
      if (item.effect.type === 'stats') celebrate('happy', { message: 'Energia lá em cima!' });
      if (item.effect.type === 'streak_shield') return 'Hoje está protegido: a sequência não se perde.';
      return `${item.name} ativado.`;
    }, 'Não foi possível usar este item agora.');
  }

  function toggleScene(item: ShopItem, equipped: boolean) {
    void run(item.id, async () => {
      await setEquipped(item.id, !equipped);
      return equipped ? 'Cenário removido.' : `${item.name} agora é o cenário do seu pato.`;
    }, 'Não foi possível trocar o cenário agora.');
  }

  return <Screen edges={['left', 'right', 'bottom']}>
    <Card tone="elevated" style={styles.balance}>
      <View style={styles.balanceStage}><PixelImage source={coinStackIcon} size={56} /></View>
      <View style={styles.balanceText}>
        <Text style={styles.muted}>Suas moedas</Text>
        <CoinAmount value={data?.coins ?? 0} size={28} />
        <Text style={styles.hint}>Ganhe concluindo tarefas, hábitos e ciclos de foco.</Text>
      </View>
    </Card>

    {data?.boosts.active.length || data?.boosts.protectedDates.includes(localDateKey()) ? <Card tone="muted" style={styles.boosts}>
      <Text style={styles.cardTitle}>Poderes ativos</Text>
      {data.boosts.active.map((boost, index) => <Text key={`${boost.effect}-${index}`} style={styles.muted}>{boostLabel(boost)}</Text>)}
      {data.boosts.protectedDates.includes(localDateKey()) ? <Text style={styles.muted}>Sequência protegida hoje</Text> : null}
    </Card> : null}

    <ChipGroup variant="segmented" options={[{ value: 'shop', label: 'Loja' }, { value: 'bag', label: 'Mochila' }]} value={view} onChange={(value: ShopView) => { setView(value); setMessage(undefined); }} />
    <ChipGroup options={categories} value={category} onChange={setCategory} />
    {message ? <Text style={styles.message}>{message}</Text> : null}

    {view === 'shop' ? <View style={styles.grid}>
      {visible.map((item) => {
        const ownedScene = !item.consumable && owned.has(item.id);
        return <ShopItemCard
          key={item.id}
          item={item}
          price={item.priceCoins}
          quantity={item.consumable ? owned.get(item.id)?.quantity ?? 0 : undefined}
          actionLabel={ownedScene ? 'Na mochila' : (data?.coins ?? 0) < item.priceCoins ? 'Faltam moedas' : 'Comprar'}
          unaffordable={!ownedScene && (data?.coins ?? 0) < item.priceCoins}
          disabled={ownedScene || busy === item.id || (data?.coins ?? 0) < item.priceCoins}
          onAction={() => buy(item)}
        />;
      })}
      {!visible.length ? <Text style={styles.muted}>A loja ainda não carregou. Conecte-se para ver os itens.</Text> : null}
    </View> : <View style={styles.grid}>
      {bag.map((item) => {
        const row = owned.get(item.id)!;
        return item.consumable
          ? <ShopItemCard key={item.id} item={item} quantity={row.quantity} actionLabel={item.slot === 'food' ? 'Dar ao pato' : 'Usar'} disabled={busy === item.id} onAction={() => use(item)} />
          : <ShopItemCard key={item.id} item={item} equipped={row.equipped} actionLabel={row.equipped ? 'Tirar' : 'Usar cenário'} actionVariant={row.equipped ? 'secondary' : 'tertiary'} disabled={busy === item.id} onAction={() => toggleScene(item, row.equipped)} />;
      })}
      {!bag.length ? <Text style={styles.muted}>Nada aqui ainda. Compre na loja e o item aparece na mochila.</Text> : null}
    </View>}
    {dialog}
  </Screen>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  balance: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balanceStage: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.rewardSoft },
  balanceText: { gap: 2, flex: 1 },
  hint: { ...typography.caption, color: colors.textSecondary },
  boosts: { gap: spacing.xs },
  cardTitle: { ...typography.heading, color: colors.text },
  muted: { ...typography.bodySm, color: colors.textSecondary },
  message: { ...typography.bodySm, color: colors.success },
  receipt: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.ms },
});
