import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { loadAchievements } from '../../features/achievements/application/load-achievements';
import { speciesById } from '../../features/onboarding/domain/species';
import { PetIdentityCard } from '../../features/pet/components/PetIdentityCard';
import { PetStage } from '../../features/pet/components/PetStage';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { FoodTray } from '../../features/shop/components/FoodTray';
import { isShowable, itemImage } from '../../features/shop/domain/catalog';
import { cachedBoosts, cachedCatalog, equippedBackgroundSku, listLocalInventory, setEquipped } from '../../features/shop/infrastructure/shop-repository';
import { currentStreak } from '../../features/tasks/domain/task';
import { listCompletionDates } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { ApiError, NetworkError } from '../../shared/network/api-client';
import { Card } from '../../shared/ui/Card';
import { ScreenHeader, SectionHeader } from '../../shared/ui/Headers';
import { IconButton } from '../../shared/ui/IconButton';
import { Screen } from '../../shared/ui/Screen';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

async function loadPetScreen() {
  const [pet, completionDates, boosts, backgroundSku, catalog, inventory, achievements] = await Promise.all([
    loadLocalPet(), listCompletionDates(), cachedBoosts(), equippedBackgroundSku(), cachedCatalog(), listLocalInventory(), loadAchievements(),
  ]);
  const owned = new Map(inventory.map((row) => [row.itemId, row]));
  const foods = catalog.filter((item) => item.slot === 'food' && isShowable(item) && (owned.get(item.id)?.quantity ?? 0) > 0)
    .map((item) => ({ item, row: owned.get(item.id)! }));
  const scenes = catalog.filter((item) => item.slot === 'background' && isShowable(item) && owned.has(item.id))
    .map((item) => ({ item, equipped: owned.get(item.id)!.equipped }));
  return { pet, streak: currentStreak(completionDates, new Date(), boosts.protectedDates), backgroundSku, foods, scenes, achievements };
}

export default function PetScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { data, reload } = useLocalData(loadPetScreen);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const pet = data?.pet;
  const species = speciesById(pet?.speciesId);

  async function chooseScene(itemId: string | undefined) {
    if (!data || busy) return;
    const current = data.scenes.find((scene) => scene.equipped);
    if (current?.item.id === itemId) return;
    setBusy(true);
    try {
      if (itemId) await setEquipped(itemId, true);
      else if (current) await setEquipped(current.item.id, false);
      setMessage(undefined);
      await reload();
    } catch (error) {
      setMessage(error instanceof NetworkError ? 'Precisamos de conexão para trocar o cenário.' : error instanceof ApiError ? error.message : 'Não foi possível trocar o cenário agora.');
    } finally {
      setBusy(false);
    }
  }

  if (!pet) {
    return <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Seu pato" />
      <Text style={styles.muted}>Assim que seu pato for criado, saciedade, energia e felicidade aparecem aqui.</Text>
    </Screen>;
  }

  return <Screen edges={['top', 'left', 'right']}>
    <ScreenHeader title="Seu pato" trailing={<IconButton icon="swap-horizontal" label="Trocar de pato" onPress={() => router.push('/switch-pet')} />} />
    <PetStage pet={pet} streak={data.streak} aspectRatio={1.1} backgroundSku={data.backgroundSku} />

    {data.scenes.length ? <View style={styles.section}>
      <SectionHeader title="Cenário" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenes}>
        <SceneOption label="Liso" selected={!data.scenes.some((scene) => scene.equipped)} onPress={() => void chooseScene(undefined)} />
        {data.scenes.map(({ item, equipped }) => <SceneOption key={item.id} label={item.name} image={itemImage(item.sku)} selected={equipped} onPress={() => void chooseScene(item.id)} />)}
      </ScrollView>
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </View> : null}

    <Card style={styles.care}>
      <Text style={styles.cardTitle}>Cuidados</Text>
      <Text style={styles.muted}>Os status caem com o tempo. Tarefas deixam o pato feliz, ciclos de foco recarregam a energia e a comida vem da loja.</Text>
      <FoodTray foods={data.foods} onFed={() => void reload()} />
    </Card>

    <View style={styles.links}>
      <LinkTile icon="storefront" label="Loja" detail="Comida, poderes e cenários" onPress={() => router.push('/shop')} />
      <LinkTile icon="trophy" label="Conquistas" detail={`${data.achievements.unlocked} de ${data.achievements.progress.length}`} onPress={() => router.push('/achievements')} />
    </View>

    <Card tone="muted">
      <View style={styles.missionHeader}>
        <Ionicons name="flag" size={18} color={colors[species.accent]} />
        <Text style={styles.cardTitle}>Missão do dia</Text>
      </View>
      <Text style={styles.muted}>{species.mission}</Text>
    </Card>

    <PetIdentityCard key={`${pet.speciesId}:${pet.name}`} pet={pet} onChanged={() => void reload()} />

    <Card tone="muted">
      <Text style={styles.cardTitle}>Sobre {species.name}</Text>
      <Text style={styles.muted}>{species.personality} {species.indicatedFor}</Text>
    </Card>
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

function LinkTile({ icon, label, detail, onPress }: { icon: 'storefront' | 'trophy'; label: string; detail: string; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${detail}`} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}>
    <View style={styles.tileIcon}><Ionicons name={icon} size={20} color={colors.rewardText} /></View>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={styles.tileDetail} numberOfLines={2}>{detail}</Text>
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  cardTitle: { ...typography.heading, color: colors.text },
  care: { gap: spacing.sm },
  muted: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.bodySm, color: colors.danger },
  section: { gap: spacing.sm },
  scenes: { gap: spacing.ms, paddingVertical: spacing.xs },
  sceneOption: { width: 84, gap: spacing.xs, alignItems: 'center' },
  sceneThumb: { width: 84, height: 64, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderWidth: 2, borderColor: colors.border },
  sceneSelected: { borderColor: colors.primary, borderWidth: 3 },
  sceneLabel: { ...typography.caption, color: colors.textSecondary },
  sceneLabelSelected: { color: colors.text, fontFamily: typography.label.fontFamily },
  links: { flexDirection: 'row', gap: spacing.ms },
  tile: { flex: 1, gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tilePressed: { backgroundColor: colors.surfaceMuted },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.rewardSoft, marginBottom: spacing.xs },
  tileLabel: { ...typography.subheading, color: colors.text },
  tileDetail: { ...typography.caption, color: colors.textSecondary },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
