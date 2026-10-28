import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useReducedMotion } from '../../../shared/hooks/use-reduced-motion';
import type { SpeciesId } from '../../onboarding/domain/species';
import { petSprite, petVisualStates, preloadSpecies, spriteAspectRatio, type PetVisualState } from '../domain/pet-sprites';

type PetSpriteProps = {
  species: SpeciesId;
  state?: PetVisualState;
  height?: number;
  still?: boolean;
};

const blinkDurationMs = 140;
const minPauseMs = 2200;
const extraPauseMs = 3200;
const breathCycleMs = 2600;

export function PetSprite({ species, state = 'idle', height = 160, still = false }: PetSpriteProps) {
  const reducedMotion = useReducedMotion();
  // Fora da tela visível, nada de loop: poupa bateria.
  const focused = useIsFocused();
  const animated = !still && !reducedMotion && focused;
  const [blinking, setBlinking] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [breath] = useState(() => new Animated.Value(0));
  const [hop] = useState(() => new Animated.Value(0));

  useEffect(() => { void preloadSpecies(species); }, [species]);

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1, duration: breathCycleMs / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breath, { toValue: 0, duration: breathCycleMs / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => { loop.stop(); breath.setValue(0); };
  }, [animated, breath]);

  useEffect(() => {
    if (!animated || state !== 'cheer') return;
    const jump = Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(hop, { toValue: 0, duration: 260, easing: Easing.bounce, useNativeDriver: true }),
    ]);
    jump.start();
    return () => { jump.stop(); hop.setValue(0); };
  }, [animated, hop, state]);

  useEffect(() => {
    if (!animated || state !== 'idle') return;

    const schedule = () => {
      blinkTimer.current = setTimeout(() => {
        setBlinking(true);
        blinkTimer.current = setTimeout(() => { setBlinking(false); schedule(); }, blinkDurationMs);
      }, minPauseMs + Math.random() * extraPauseMs);
    };
    schedule();
    return () => { clearTimeout(blinkTimer.current); setBlinking(false); };
  }, [animated, species, state]);

  const transform = useMemo(() => [
    { translateY: Animated.add(
      breath.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.012] }),
      hop.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.12] }),
    ) },
    { scaleY: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
    { scaleX: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 0.994] }) },
  ], [breath, height, hop]);

  const current = blinking ? 'blink' : state;
  const width = height * spriteAspectRatio(species);
  const frames = still ? [current] : petVisualStates;

  return <Animated.View style={[styles.stage, { width, height, transform }]}>
    {frames.map((frame) => <Image
      key={frame}
      accessibilityIgnoresInvertColors
      fadeDuration={0}
      source={petSprite(species, frame)}
      style={[styles.frame, { width, height }, frame === current ? styles.visible : styles.hidden]}
      resizeMode="contain"
    />)}
  </Animated.View>;
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'center', transformOrigin: 'bottom' },
  frame: { position: 'absolute', left: 0, top: 0 },
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
});
