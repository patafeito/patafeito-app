import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Badge } from '../../../shared/ui/Badge';
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
import { pamperPet } from '../application/pamper-pet';
import { levelProgress } from '../domain/progression';
import { DEFAULT_DAILY_GOAL_XP, emotionFor, emotionLabel, emotionReason, type Emotion } from '../domain/emotion';
import { LOW_STAT, moodFor, type PetVisualState } from '../domain/pet-sprites';
import type { PetStats } from '../domain/stats';
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
  /** XP de tarefas concluídas hoje, para a meta diária (RN13) e o humor. */
  dailyXp?: number;
  /** Chamado quando um carinho contou, para a tela recarregar o pato com a felicidade nova. */
  onPampered?: () => void;
};

const emotionTone = { happy: 'success', neutral: 'neutral', sad: 'primary', down: 'danger' } as const;
const emotionThoughts: Partial<Record<Emotion, string>> = {
  sad: 'Tô meio pra baixo hoje…',
  down: 'Não tô nada bem. Me ajuda?',
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

/** Fala do status ruim mais baixo; `undefined` se nenhum está ruim. */
function lowStatThought(stats: PetStats) {
  const lowest = ([['hunger', 'Tô com fome…'], ['energy', 'Hoje bateu um cansaço.'], ['happiness', 'Tô meio pra baixo…']] as const)
    .filter(([key]) => stats[key] <= LOW_STAT)
    .sort(([a], [b]) => stats[a] - stats[b])[0];
  return lowest?.[1];
}

const petThoughtsWhenTouched = ['Oi!', 'Mais carinho!', 'Hehe, faz cócegas.', 'Tô pronto pro próximo passo.'];
const touchReactionMs = 1400;
/** Altura dos pés acima da base do quadro, em fração da altura do sprite (margem transparente dos PNGs). */
const FEET_LINE = 0.022;

export function PetStage({ pet, streak, pendingXp = 0, aspectRatio = 1.25, backgroundSku, showStats = true, dailyXp = 0, onPampered }: PetStageProps) {
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
  const goal = { targetXp: DEFAULT_DAILY_GOAL_XP, earnedXp: dailyXp };
  const emotion = emotionFor(pet, stats, goal);
  // Triste ou abatido, o pato fica cabisbaixo mesmo com os status razoáveis.
  const mood: PetVisualState = emotion === 'sad' || emotion === 'down' ? 'tired' : moodFor(stats);
  const ambient = useAmbientPose(mood, !reaction && !touch);
  const state = reaction?.state ?? touch?.state ?? ambient;
  // A pose é a mesma (cansado) para qualquer status ruim; a fala diz qual é o problema.
  const thought = reaction?.message ?? touch?.thought ?? (emotion === 'down' ? emotionThoughts.down : undefined)
    ?? lowStatThought(stats) ?? emotionThoughts[emotion] ?? petThoughts[mood];

  /** Tocar no pato é o Mimar: conta uma vez por hora; nos outros toques ele só reage. */
  async function greet() {
    touchCount.current += 1;
    const alternate: PetVisualState = touchCount.current % 2 === 0 ? 'happy' : 'cheer';
    const pampered = await pamperPet();
    setTouch({
      state: pampered.counted ? 'cheer' : alternate === state ? (alternate === 'cheer' ? 'happy' : 'cheer') : alternate,
      thought: pampered.counted ? 'Que carinho bom! +5 de felicidade.' : petThoughtsWhenTouched[touchCount.current % petThoughtsWhenTouched.length],
    });
    if (pampered.counted) onPampered?.();
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => setTouch(undefined), touchReactionMs);
  }

  return <Card tone="elevated" style={styles.card}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fazer carinho em ${pet.name}`}
      accessibilityHint="Mimar: +5 de felicidade, uma vez por hora. O pato reage a cada toque."
      onPress={() => void greet()}
    >
      <SceneFrame scene={background} aspectRatio={aspectRatio} onHeightChange={setStageHeight}>
        <View style={[styles.pet, { marginBottom: groundOffset }]}>
          {/* Os quadros têm 2% de margem transparente embaixo: a elipse fica centrada nessa linha dos pés,
              e não abaixo dela, senão a sombra aparece descolada do pato. */}
          <View style={[styles.shadow, { width: spriteHeight * 0.46, height: Math.max(8, spriteHeight * 0.06), bottom: spriteHeight * (FEET_LINE - 0.03) }]} />
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
      <View accessible accessibilityLabel={`Humor: ${emotionLabel[emotion]}. ${emotionReason(emotion, pet, stats, goal)}`}>
        <Badge tone={emotionTone[emotion]}>{`Humor: ${emotionLabel[emotion]}`}</Badge>
      </View>
    </View>

    <View style={styles.bubble} accessibilityLiveRegion="polite">
      <View style={styles.bubbleTail} />
      <Text style={styles.thought}>{thought}</Text>
    </View>

    <ExperienceBar level={progress.level} value={progress.value} nextLevelAt={progress.nextLevelAt} />
    {pendingXp > 0 ? <Text style={styles.pending}>+{pendingXp} XP aguardando confirmação do servidor.</Text> : null}

    {showStats ? <Text style={styles.goal}>{`Meta do dia: ${Math.min(goal.earnedXp, goal.targetXp)}/${goal.targetXp} XP · ${emotionReason(emotion, pet, stats, goal)}`}</Text> : null}
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
  goal: { ...typography.caption, color: colors.textSecondary, paddingHorizontal: spacing.xs },
  statuses: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xs, paddingBottom: spacing.xs },
  status: { flex: 1 },
});
