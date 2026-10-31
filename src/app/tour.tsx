import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { speciesById } from '../features/onboarding/domain/species';
import { tourSlides } from '../features/onboarding/domain/tour';
import { PetSprite } from '../features/pet/components/PetSprite';
import { loadLocalPet } from '../features/pet/infrastructure/local-pet-repository';
import { useLocalData } from '../shared/hooks/use-local-data';
import { useReducedMotion } from '../shared/hooks/use-reduced-motion';
import { Button } from '../shared/ui/Button';
import { useTheme, useThemedStyles, type Theme } from '../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../shared/theme/tokens';

/**
 * Apresentação do app em páginas: boas-vindas, um módulo por página e o convite para começar.
 * Abre sozinha logo depois de criar o pato (`first=1`) e pode ser revista pelo Perfil.
 */
export default function TourScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const { data: pet } = useLocalData(loadLocalPet);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);

  const species = speciesById(pet?.speciesId);
  const petName = pet?.name ?? species.name;
  const total = tourSlides.length + 2;
  const last = page === total - 1;

  function goTo(index: number) {
    const target = Math.max(0, Math.min(total - 1, index));
    scrollRef.current?.scrollTo({ x: target * width, animated: !reducedMotion });
    setPage(target);
  }

  function finish(startWithTask = false) {
    if (first) router.replace(startWithTask ? { pathname: '/(tabs)/tasks', params: { new: '1' } } : '/(tabs)');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.top}>
      <Text style={styles.counter} accessibilityLabel={`Página ${page + 1} de ${total}`}>{page + 1}/{total}</Text>
      {!last ? <Button label="Pular" variant="ghost" size="compact" onPress={() => finish()} /> : <View />}
    </View>

    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onScrollEnd}
      style={styles.pager}
    >
      <View style={[styles.page, { width }]} accessible accessibilityLabel={`Boas-vindas. ${petName} vai acompanhar sua rotina.`}>
        <PetSprite species={species.id} state="cheer" height={180} />
        <Text style={styles.eyebrow}>BEM-VINDO AO PATAFEITO</Text>
        <Text style={styles.title}>{petName} vai acompanhar sua rotina</Text>
        <Text style={styles.body}>Cada tarefa e cada ciclo de foco viram XP e moedas. O pato evolui com você, fica feliz quando você cumpre o combinado e sente falta quando você some.</Text>
        <View style={styles.loop} accessible={false}>
          {(['checkmark-circle', 'sparkles', 'paw'] as const).map((icon, index) => <View key={icon} style={styles.loopItem}>
            {index > 0 ? <Ionicons name="arrow-forward" size={18} color={colors.textSecondary} /> : null}
            <View style={styles.loopIcon}><Ionicons name={icon} size={24} color={colors.primary} /></View>
          </View>)}
        </View>
        <Text style={styles.caption}>Tarefa → recompensa → pato feliz</Text>
      </View>

      {tourSlides.map((slide) => <View key={slide.id} style={[styles.page, { width }]} accessible accessibilityLabel={`${slide.title}. ${slide.where}. ${slide.points.join(' ')}`}>
        <View style={styles.iconCircle}><Ionicons name={slide.icon} size={44} color={colors.primary} /></View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.where}>{slide.where}</Text>
        <View style={styles.points}>
          {slide.points.map((point) => <View key={point} style={styles.point}>
            <Ionicons name="checkmark" size={18} color={colors.success} style={styles.pointIcon} />
            <Text style={styles.pointText}>{point}</Text>
          </View>)}
        </View>
      </View>)}

      <View style={[styles.page, { width }]} accessible accessibilityLabel={`Tudo pronto. Crie sua primeira tarefa e ${petName} comemora com você.`}>
        <PetSprite species={species.id} state="happy" height={180} />
        <Text style={styles.title}>Tudo pronto!</Text>
        <Text style={styles.body}>Comece pequeno: uma tarefa clara já é progresso. Quando concluir, {petName} comemora com você.</Text>
        <Text style={styles.caption}>Você pode rever este guia em Perfil → Como usar o Patafeito.</Text>
      </View>
    </ScrollView>

    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: total }, (_, index) => <View key={index} style={[styles.dot, index === page && styles.dotActive]} />)}
    </View>

    <View style={styles.actions}>
      {last ? <>
        <Button label="Criar minha primeira tarefa" icon="add" onPress={() => finish(true)} />
        <Button label="Ir para o início" variant="secondary" onPress={() => finish()} />
      </> : <View style={styles.row}>
        {page > 0 ? <View style={styles.cell}><Button label="Voltar" variant="secondary" onPress={() => goTo(page - 1)} /></View> : null}
        <View style={styles.cell}><Button label={page === 0 ? 'Conhecer o app' : 'Próximo'} icon="arrow-forward" onPress={() => goTo(page + 1)} /></View>
      </View>}
    </View>
  </SafeAreaView>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, minHeight: 48 },
  counter: { ...typography.caption, color: colors.textSecondary },
  pager: { flex: 1 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  eyebrow: { ...typography.label, color: colors.primary, letterSpacing: 1 },
  title: { ...typography.title, fontSize: 26, lineHeight: 32, color: colors.text, textAlign: 'center' },
  where: { ...typography.label, color: colors.primary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  caption: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  loop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loopItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loopIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  points: { alignSelf: 'stretch', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  point: { flexDirection: 'row', gap: spacing.sm },
  pointIcon: { marginTop: 2 },
  pointText: { ...typography.body, color: colors.text, flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { width: 20, backgroundColor: colors.primary },
  actions: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
});
