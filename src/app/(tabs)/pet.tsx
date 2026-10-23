import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { speciesById } from '../../features/onboarding/domain/species';
import { feedPet } from '../../features/pet/application/feed-pet';
import { PetIdentityCard } from '../../features/pet/components/PetIdentityCard';
import { PetStage } from '../../features/pet/components/PetStage';
import { FEED_COST_COINS } from '../../features/pet/domain/stats';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { currentStreak } from '../../features/tasks/domain/task';
import { countCompletedTasks, listCompletionDates } from '../../features/tasks/infrastructure/local-task-repository';
import { countCompletedSessions } from '../../features/focus/infrastructure/local-focus-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Screen } from '../../shared/ui/Screen';
import { colors, spacing, typography } from '../../shared/theme/tokens';

async function loadPetScreen() {
  const [pet, completionDates, completedTasks, completedSessions] = await Promise.all([
    loadLocalPet(), listCompletionDates(), countCompletedTasks(), countCompletedSessions(),
  ]);
  return { pet, streak: currentStreak(completionDates), completedTasks, completedSessions };
}

export default function PetScreen() {
  const { data, reload } = useLocalData(loadPetScreen);
  const [feedMessage, setFeedMessage] = useState<string>();
  const [feeding, setFeeding] = useState(false);
  const pet = data?.pet;
  const species = speciesById(pet?.speciesId);

  if (!pet) {
    return <Screen>
      <Text style={styles.title}>Seu pato</Text>
      <Text style={styles.muted}>Assim que seu pato for criado, saciedade, energia e felicidade aparecem aqui.</Text>
    </Screen>;
  }

  async function feed() {
    if (!pet) return;
    setFeeding(true);
    try {
      setFeedMessage((await feedPet(pet)).message);
      await reload();
    } finally {
      setFeeding(false);
    }
  }

  return <Screen>
    <Text style={styles.title}>Seu pato</Text>
    <PetStage pet={pet} streak={data.streak} spriteHeight={240} />
    <Card>
      <Text style={styles.cardTitle}>Cuidados</Text>
      <Text style={styles.muted}>Os status caem com o tempo. Tarefas deixam o pato feliz, ciclos de foco recarregam a energia e a comida custa moedas.</Text>
      <Button label={`Alimentar · ${FEED_COST_COINS} moedas`} onPress={feed} disabled={feeding} />
      {feedMessage ? <Text style={styles.muted}>{feedMessage}</Text> : null}
    </Card>
    <Card>
      <Text style={styles.cardTitle}>Missão do dia</Text>
      <Text style={styles.muted}>{species.mission}</Text>
    </Card>
    <Card>
      <Text style={styles.cardTitle}>Conquistas</Text>
      <Text style={styles.muted}>{data.completedTasks} {data.completedTasks === 1 ? 'tarefa concluída' : 'tarefas concluídas'}</Text>
      <Text style={styles.muted}>{data.completedSessions} {data.completedSessions === 1 ? 'ciclo de foco' : 'ciclos de foco'}</Text>
      <Text style={styles.muted}>Melhor sequência atual: {data.streak} {data.streak === 1 ? 'dia' : 'dias'}</Text>
    </Card>
    <PetIdentityCard key={`${pet.speciesId}:${pet.name}`} pet={pet} onChanged={() => void reload()} />
    <Card>
      <Text style={styles.cardTitle}>Sobre {species.name}</Text>
      <Text style={styles.muted}>{species.personality}</Text>
      <Text style={styles.muted}>{species.indicatedFor}</Text>
    </Card>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 26 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17, marginBottom: spacing.xs },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
});
