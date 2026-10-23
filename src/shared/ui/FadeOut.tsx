import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../hooks/use-reduced-motion';

type FadeOutProps = PropsWithChildren<{
  /** Começa a sumir quando vira `true`. */
  active: boolean;
  delayMs?: number;
  durationMs?: number;
  onDone?: () => void;
}>;

/** Espera um instante e some com fade, encolhendo de leve. Com movimento reduzido, só o fade. */
export function FadeOut({ active, delayMs = 900, durationMs = 380, onDone, children }: FadeOutProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    if (!active) return;
    const animation = Animated.sequence([
      Animated.delay(delayMs),
      Animated.timing(progress, { toValue: 1, duration: durationMs, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) onDoneRef.current?.(); });
    return () => animation.stop();
  }, [active, delayMs, durationMs, progress]);

  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, reducedMotion ? 1 : 0.96] });
  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}
