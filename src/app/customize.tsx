import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { xpEarnedToday } from '../features/pet/domain/emotion';
import { PetStage } from '../features/pet/components/PetStage';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { isShowable, itemImage } from '../features/shop/domain/catalog';
import { cachedCatalog, listLocalInventory, setEquipped } from '../features/shop/infrastructure/shop-repository';
import { listLocalTasks } from '../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../shared/hooks/use-local-data';
import { ApiError, NetworkError } from '../shared/network/api-client';
import { Button } from '../shared/ui/Button';
import { EmptyState } from '../shared/ui/EmptyState';
import { SectionHeader } from '../shared/ui/Headers';
import { Screen } from '../shared/ui/Screen';
import { useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

async function loadCustomize() {
  const [pet, catalog, inventory, tasks] = await Promise.all([loadLocalPet(), cachedCatalog(), listLocalInventory(), listLocalTasks()]);
  const owned = new Map(inventory.map((row) => [row.itemId, row]));
  const scenes = catalog.filter((item) => item.slot === 'background' && isShowable(item) && owned.has(item.id))
    .map((item) => ({ item, equipped: owned.get(item.id)!.equipped }));
  return { pet, scenes, dailyXp: xpEarnedToday(tasks) };
}

/**
 * Customização (Tela 7): pré-visualiza o visual antes de aplicar e só grava ao tocar em "Salvar".
 * Hoje personaliza o cenário; acessórios entram quando houver arte para cada pato.
 */
export default function CustomizeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { data, reload } = useLocalData(loadCustomize);
  // `undefined` = ainda não mexeu (mostra o equipado); `null` = escolheu "Liso".
  const [choice, setChoice] = useState<string | null>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();

  const equipped = data?.scenes.find((scene) => scene.equipped)?.item;
  const selectedId = choice === undefined ? equipped?.id ?? null : choice;
  const selected = data?.scenes.find((scene) => scene.item.id === selectedId)?.item;
  const changed = selectedId !== (equipped?.id ?? null);

  async function save() {
    setSaving(true);
    try {
      if (selected) await setEquipped(selected.id, true);
      else if (equipped) await setEquipped(equipped.id, false);
      setChoice(undefined);
      setMessage({ text: selected ? `${selected.name} agora é o cenário do seu pato.` : 'Cenário removido.', ok: true });
      await reload();
    } catch (error) {
      setMessage({ text: error instanceof NetworkError ? 'Precisamos de conexão para salvar o visual.' : error instanceof ApiError ? error.message : 'Não foi possível salvar agora.', ok: false });
    } finally {
      setSaving(false);
    }
  }

  if (!data?.pet) return <Screen edges={['left', 'right']}><Text style={styles.muted}>Seu pato aparece aqui assim que for criado.</Text></Screen>;

  return <Screen edges={['left', 'right', 'bottom']}>
    <PetStage pet={data.pet} streak={0} aspectRatio={1.25} backgroundSku={selected?.sku} showStats={false} dailyXp={data.dailyXp} onPampered={() => void reload()} />
    {changed ? <Text style={styles.preview} accessibilityLiveRegion="polite">Pré-visualização: toque em Salvar para aplicar.</Text> : null}

    <SectionHeader title="Cenário" />
    {data.scenes.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenes}>
      <SceneOption label="Liso" selected={!selected} onPress={() => setChoice(null)} />
      {data.scenes.map(({ item }) => <SceneOption key={item.id} label={item.name} image={itemImage(item.sku)} selected={selected?.id === item.id} onPress={() => setChoice(item.id)} />)}
    </ScrollView>
      : <EmptyState species="mare" title="Nenhum cenário ainda" message="Compre cenários na loja para mudar o fundo do seu pato." />}

    {message ? <Text style={message.ok ? styles.success : styles.error} accessibilityLiveRegion="polite">{message.text}</Text> : null}
    <Button label={saving ? 'Salvando…' : 'Salvar'} icon="checkmark" disabled={!changed || saving} onPress={() => void save()} />
    <Button label="Comprar mais itens na loja" icon="storefront-outline" variant="secondary" onPress={() => router.push('/shop')} />
  </Screen>;
}

function SceneOption({ label, image, selected, onPress }: { label: string; image?: ReturnType<typeof itemImage>; selected: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`Cenário ${label}`} onPress={onPress} style={styles.sceneOption}>
    <View style={[styles.sceneThumb, selected && styles.sceneSelected]}>
      {image ? <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors /> : null}
    </View>
    <Text style={[styles.sceneLabel, selected && styles.sceneLabelSelected]} numberOfLines={1}>{label}</Text>
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  muted: { ...typography.body, color: colors.textSecondary },
  preview: { ...typography.caption, color: colors.primary, textAlign: 'center' },
  success: { ...typography.bodySm, color: colors.success },
  error: { ...typography.bodySm, color: colors.danger },
  scenes: { gap: spacing.ms, paddingVertical: spacing.xs },
  sceneOption: { width: 92, gap: spacing.xs, alignItems: 'center' },
  sceneThumb: { width: 92, height: 68, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 2, borderColor: colors.border },
  sceneSelected: { borderColor: colors.primary, borderWidth: 3 },
  sceneLabel: { ...typography.caption, color: colors.textSecondary },
  sceneLabelSelected: { color: colors.text, fontFamily: typography.label.fontFamily },
});
