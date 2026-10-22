import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../../shared/ui/Badge';
import { Card } from '../../../shared/ui/Card';
import { DuckStatus } from '../../../shared/ui/DuckStatus';
import { ExperienceBar } from '../../../shared/ui/ExperienceBar';
import { colors, radius, spacing, typography } from '../../../shared/theme/tokens';
import { speciesById } from '../../onboarding/domain/species';
import { usePetReaction } from '../application/pet-mood';
import { useAmbientPose } from '../application/use-ambient-pose';
import { levelProgress } from '../domain/progression';
import { moodFor, type PetVisualState } from '../domain/pet-sprites';
import { PetSprite } from './PetSprite';
import type { Pet } from '../domain/pet';

type PetStageProps = {
  pet: Pet;
  streak: number;
  pendingXp?: number;
  spriteHeight?: number;
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

export function PetStage({ pet, streak, pendingXp = 0, spriteHeight = 220 }: PetStageProps) {
  const species = speciesById(pet.speciesId);
  const progress = levelProgress(pet.xpTotal);
  const reaction = usePetReaction();
  const [touch, setTouch] = useState<{ state: PetVisualState; thought: string }>();
  const touchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchCount = useRef(0);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  const mood = moodFor(pet);
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

  return <Card tone="raised" style={styles.card}>
    <View style={styles.header}>
      <View style={styles.identity}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.species}>{species.name} · {species.tagline}</Text>
      </View>
      {streak > 0 ? <Badge tone="experience">{streak} {streak === 1 ? 'dia' : 'dias'} seguidos</Badge> : null}
    </View>

    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Fazer carinho em ${pet.name}`}
      accessibilityHint="O pato reage ao toque."
      onPress={greet}
      style={styles.stage}
    >
      <View style={[styles.ground, { width: spriteHeight * 0.72 }]} />
      <PetSprite species={species.id} state={state} height={spriteHeight} />
    </Pressable>

    <Text style={styles.thought}>{thought}</Text>

    <ExperienceBar level={progress.level} value={progress.value} nextLevelAt={progress.nextLevelAt} />
    {pendingXp > 0 ? <Text style={styles.pending}>+{pendingXp} XP aguardando confirmação do servidor.</Text> : null}

    <View style={styles.statuses}>
      <View style={styles.status}><DuckStatus label="Fome" value={pet.hunger} icon="restaurant-outline" color={colors.experience} /></View>
      <View style={styles.status}><DuckStatus label="Energia" value={pet.health} icon="flash-outline" color={colors.primary} /></View>
      <View style={styles.status}><DuckStatus label="Felicidade" value={pet.happiness} icon="heart-outline" color={colors.success} /></View>
    </View>
  </Card>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, alignItems: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  identity: { flexShrink: 1 },
  name: { ...typography.display, color: colors.text, fontSize: 24 },
  species: { ...typography.body, color: colors.textMuted, fontSize: 14 },
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingTop: spacing.sm },
  ground: { height: 14, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, position: 'absolute', bottom: 2, opacity: 0.9 },
  thought: { ...typography.body, color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  pending: { ...typography.body, color: colors.experience, fontSize: 13, textAlign: 'center' },
  statuses: { flexDirection: 'row', gap: spacing.md },
  status: { flex: 1 },
});
