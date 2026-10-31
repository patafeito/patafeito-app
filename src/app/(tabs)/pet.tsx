import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import { loadAchievements } from '../../features/achievements/application/load-achievements';
import { speciesById } from '../../features/onboarding/domain/species';
import { PetIdentityCard } from '../../features/pet/components/PetIdentityCard';
import { PetStage } from '../../features/pet/components/PetStage';
import { xpEarnedToday } from '../../features/pet/domain/emotion';
import { minutesUntilPamper } from '../../features/pet/domain/stats';
import { cachedBalance } from '../../features/rewards/infrastructure/balance-repository';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { FoodTray } from '../../features/shop/components/FoodTray';
import { isShowable } from '../../features/shop/domain/catalog';
import { cachedBoosts, cachedCatalog, equippedBackgroundSku, listLocalInventory } from '../../features/shop/infrastructure/shop-repository';
import { currentStreak } from '../../features/tasks/domain/task';
import { listCompletionDates, listLocalTasks } from '../../features/tasks/infrastructure/local-task-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Card } from '../../shared/ui/Card';
import { ScreenHeader } from '../../shared/ui/Headers';
import { IconButton } from '../../shared/ui/IconButton';
import { Screen } from '../../shared/ui/Screen';
import { useTheme, useThemedStyles, type Theme } from '../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../shared/theme/tokens';

async function loadPetScreen() {
  const [pet, completionDates, boosts, backgroundSku, catalog, inventory, achievements, tasks, balance] = await Promise.all([
    loadLocalPet(), listCompletionDates(), cachedBoosts(), equippedBackgroundSku(), cachedCatalog(), listLocalInventory(), loadAchievements(), listLocalTasks(), cachedBalance(),
  ]);
  const owned = new Map(inventory.map((row) => [row.itemId, row]));
  const inBag = (item: (typeof catalog)[number]) => isShowable(item) && (owned.get(item.id)?.quantity ?? 0) > 0;
  const foods = catalog.filter((item) => item.slot === 'food' && inBag(item)).map((item) => ({ item, row: owned.get(item.id)! }));
  // Curar: poderes que recarregam energia (ex.: Café energético).
  const energyItems = catalog.filter((item) => item.slot === 'power' && item.effect.type === 'stats' && (item.effect.energy ?? 0) > 0 && inBag(item))
    .map((item) => ({ item, row: owned.get(item.id)! }));
  return {
    pet, streak: currentStreak(completionDates, new Date(), boosts.protectedDates), backgroundSku, foods, energyItems, achievements,
    dailyXp: xpEarnedToday(tasks), coins: balance?.coins,
  };
}

export default function PetScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { data, reload } = useLocalData(loadPetScreen);
  const pet = data?.pet;
  const species = speciesById(pet?.speciesId);
  const pamperWait = pet ? minutesUntilPamper(pet) : 0;

  if (!pet) {
    return <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Seu pato" />
      <Text style={styles.muted}>Assim que seu pato for criado, saciedade, energia e felicidade aparecem aqui.</Text>
    </Screen>;
  }

  return <Screen edges={['top', 'left', 'right']}>
    <ScreenHeader title="Seu pato" trailing={<IconButton icon="swap-horizontal" label="Trocar de pato" onPress={() => router.push('/switch-pet')} />} />
    <PetStage pet={pet} streak={data.streak} aspectRatio={1.1} backgroundSku={data.backgroundSku} dailyXp={data.dailyXp} onPampered={() => void reload()} />


    <Card style={styles.care}>
      <Text style={styles.cardTitle}>Cuidados</Text>
      <Text style={styles.muted}>Os status caem com o tempo. Tarefas deixam o pato feliz e ciclos de foco recarregam a energia.</Text>
      <View style={styles.careHeader}>
        <Ionicons name="heart" size={18} color={colors.primary} />
        <Text style={styles.subTitle}>Mimar</Text>
      </View>
      <Text style={styles.muted} accessibilityLiveRegion="polite">{pamperWait
        ? `Toque no pato para fazer carinho. O próximo carinho conta em ${pamperWait} min.`
        : 'Toque no pato para fazer carinho: +5 de felicidade, uma vez por hora.'}</Text>
      <View style={styles.careHeader}>
        <Ionicons name="restaurant" size={18} color={colors.primary} />
        <Text style={styles.subTitle}>Alimentar</Text>
      </View>
      <FoodTray foods={data.foods} onFed={() => void reload()} />
      <View style={styles.careHeader}>
        <Ionicons name="medkit" size={18} color={colors.primary} />
        <Text style={styles.subTitle}>Curar</Text>
      </View>
      <FoodTray kind="energy" foods={data.energyItems} onFed={() => void reload()} />
    </Card>

    <View style={styles.links}>
      <LinkTile icon="color-palette" label="Personalizar" detail="Cenário do seu pato" onPress={() => router.push('/customize')} />
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

function LinkTile({ icon, label, detail, onPress }: { icon: 'storefront' | 'trophy' | 'color-palette'; label: string; detail: string; onPress: () => void }) {
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
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  subTitle: { ...typography.label, color: colors.text, marginTop: spacing.xs },
});
