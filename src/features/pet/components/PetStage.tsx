import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Card } from '../../../shared/ui/Card';
import { DuckStatus } from '../../../shared/ui/DuckStatus';
import { ExperienceBar } from '../../../shared/ui/ExperienceBar';
import { SceneFrame } from '../../../shared/ui/SceneFrame';
import { useTheme, useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import { speciesById } from '../../onboarding/domain/species';
import { itemImage } from '../../shop/domain/catalog';
import { usePetReaction } from '../application/pet-mood';
import { useAmbientPose } from '../application/use-ambient-pose';
import { usePetStats } from '../application/use-pet-stats';
import { levelProgress } from '../domain/progression';
import { moodFor, type PetVisualState } from '../domain/pet-sprites';
import { PetSprite } from './PetSprite';
import type { Pet } from '../domain/pet';

type PetStageProps = {
  pet: Pet;
  streak: number;
  pendingXp?: number;
  /** Largura/altura do palco: mais largo no Início, mais alto na página do pato. */
  aspectRatio?: number;
  /** Sku do cenário equipado na loja; sem ele, o palco fica liso. */
  backgroundSku?: string;
  /** No Início, os status ficam na página do pato para não competir com as tarefas. */
  showStats?: boolean;
};

const petThoughts: Record<PetVisualState, string> = {
  idle: 'Por aqui, com você.',
  blink: 'Por aqui, com você.',
  happy: 'Que bom te ver!',
  cheer: 'Patafeito! Isso foi ótimo.',
  focus: 'Bora focar junto?',
  tired: 'Hoje bateu um cansaço.',
  eating: 'Tô com fome…',
};

const petThoughtsWhenTouched = ['Oi!', 'Mais carinho!', 'Hehe, faz cócegas.', 'Tô pronto pro próximo passo.'];
const touchReactionMs = 1400;

export function PetStage({ pet, streak, pendingXp = 0, aspectRatio = 1.25, backgroundSku, showStats = true }: PetStageProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const background = backgroundSku ? itemImage(backgroundSku) : undefined;
  const species = speciesById(pet.speciesId);
  const progress = levelProgress(pet.xpTotal);
  const reaction = usePetReaction();
  const [touch, setTouch] = useState<{ state: PetVisualState; thought: string }>();
  const touchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchCount = useRef(0);
  const [stageHeight, setStageHeight] = useState(240);
  // O pato ocupa ~70% da altura e pisa no chão do cenário (≈9% acima da borda de baixo).
  const spriteHeight = Math.round(stageHeight * 0.7);
  const groundOffset = Math.round(stageHeight * 0.09);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  const stats = usePetStats(pet);
  const mood = moodFor(stats);
  const ambient = useAmbientPose(mood, !reaction && !touch);
  const state = reaction?.state ?? touch?.state ?? ambient;
  const thought = reaction?.message ?? touch?.thought ?? petThoughts[mood];

  function greet() {
    touchCount.current += 1;
    const alternate: PetVisualState = touchCount.current % 2 === 0 ? 'happy' : 'cheer';
    setTouch({
      state: alternate === state ? (alternate === 'cheer' ? 'happy' : 'cheer') : alternate,
      thought: petThoughtsWhenTouched[touchCount.current % petThoughtsWhenTouched.length],
    });
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setTouch(undefined), touchReactionMs);
  }

  return <Card tone="elevated" style={styles.card}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fazer carinho em ${pet.name}`}
      accessibilityHint="O pato reage ao toque."
      onPress={greet}
    >
      <SceneFrame scene={background} aspectRatio={aspectRatio} onHeightChange={setStageHeight}>
        <View style={[styles.pet, { marginBottom: groundOffset }]}>
          <View style={[styles.shadow, { width: spriteHeight * 0.5, height: Math.max(8, spriteHeight * 0.07), bottom: -spriteHeight * 0.025 }]} />
          <PetSprite species={species.id} state={state} height={spriteHeight} />
        </View>
        {streak > 0 ? <View style={styles.streak} accessible accessibilityLabel={`${streak} ${streak === 1 ? 'dia' : 'dias'} seguidos`}>
          <Ionicons name="flame" size={14} color={colors.tertiary} />
          <Text style={styles.streakText}>{streak}</Text>
        </View> : null}
      </SceneFrame>
    </Pressable>

    <View style={styles.header}>
      <View style={styles.identity}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.species}>{species.name} · {species.tagline}</Text>
      </View>
    </View>

    <View style={styles.bubble} accessibilityLiveRegion="polite">
      <View style={styles.bubbleTail} />
      <Text style={styles.thought}>{thought}</Text>
    </View>

    <ExperienceBar level={progress.level} value={progress.value} nextLevelAt={progress.nextLevelAt} />
    {pendingXp > 0 ? <Text style={styles.pending}>+{pendingXp} XP aguardando confirmação do servidor.</Text> : null}

    {showStats ? <View style={styles.statuses}>
      <View style={styles.status}><DuckStatus label="Saciedade" value={stats.hunger} icon="restaurant" tone="xp" /></View>
      <View style={styles.status}><DuckStatus label="Energia" value={stats.energy} icon="flash" tone="water" /></View>
      <View style={styles.status}><DuckStatus label="Felicidade" value={stats.happiness} icon="heart" tone="habit" /></View>
    </View> : null}
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { gap: spacing.ms, padding: spacing.ms },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.xs },
  identity: { flexShrink: 1 },
  name: { ...typography.title, color: colors.text },
  species: { ...typography.bodySm, color: colors.textSecondary },
  pet: { alignItems: 'center', justifyContent: 'flex-end' },
  // Sombra elíptica sob os pés; fica atrás do sprite e não acompanha a respiração.
  shadow: { position: 'absolute', alignSelf: 'center', borderRadius: radius.pill, backgroundColor: 'rgba(16, 35, 58, 0.3)', transform: [{ scaleY: 0.6 }] },
  streak: { position: 'absolute', top: spacing.sm, left: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surfaceElevated },
  streakText: { ...typography.numeric, fontSize: 13, lineHeight: 18, color: colors.text },
  bubble: { alignSelf: 'flex-start', maxWidth: '100%', marginLeft: spacing.xs, paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.md, borderTopLeftRadius: radius.xs, backgroundColor: colors.surfaceMuted },
  bubbleTail: { position: 'absolute', top: -6, left: 10, width: 12, height: 12, backgroundColor: colors.surfaceMuted, transform: [{ rotate: '45deg' }] },
  thought: { ...typography.bodySm, color: colors.text },
  pending: { ...typography.caption, color: colors.rewardText },
  statuses: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xs, paddingBottom: spacing.xs },
  status: { flex: 1 },
});
