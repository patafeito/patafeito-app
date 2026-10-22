import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../features/auth/application/session-context';
import { speciesById } from '../features/onboarding/domain/species';
import { preloadSpecies } from '../features/pet/domain/pet-sprites';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { fetchPet } from '../features/pet/infrastructure/pet-api';
import { colors } from '../shared/theme/tokens';

export default function Index() {
  const { status } = useSession();
  const [hasPet, setHasPet] = useState<boolean>();

  useEffect(() => {
    if (status !== 'signed-in') return;
    void (async () => {
      const pet = (await loadLocalPet()) ?? (await fetchPet().catch(() => undefined));
      if (pet) await preloadSpecies(speciesById(pet.speciesId).id);
      setHasPet(!!pet);
    })();
  }, [status]);

  if (status === 'loading' || (status === 'signed-in' && hasPet === undefined)) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }
  if (status === 'signed-out') return <Redirect href="/sign-in" />;
  return <Redirect href={hasPet ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
