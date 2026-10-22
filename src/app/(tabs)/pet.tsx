import { StyleSheet, Text } from 'react-native';
import { speciesById } from '../../features/onboarding/domain/species';
import { PetStage } from '../../features/pet/components/PetStage';
import { loadLocalPet } from '../../features/pet/infrastructure/local-pet-repository';
import { currentStreak } from '../../features/tasks/domain/task';
import { countCompletedTasks, listCompletionDates } from '../../features/tasks/infrastructure/local-task-repository';
import { countCompletedSessions } from '../../features/focus/infrastructure/local-focus-repository';
import { useLocalData } from '../../shared/hooks/use-local-data';
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
  const { data } = useLocalData(loadPetScreen);
  const pet = data?.pet;
  const species = speciesById(pet?.speciesId);

  if (!pet) {
    return <Screen>
      <Text style={styles.title}>Seu pato</Text>
      <Text style={styles.muted}>Assim que seu pato for criado, fome, energia e felicidade aparecem aqui.</Text>
    </Screen>;
  }

  return <Screen>
    <Text style={styles.title}>Seu pato</Text>
    <PetStage pet={pet} streak={data.streak} spriteHeight={240} />
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
