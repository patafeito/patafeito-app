import { useEffect, useRef, useState } from 'react';
import type { PetVisualState } from '../domain/pet-sprites';

const contentPauseMs = 6000;
const contentPoseMs = 2400;

export function useAmbientPose(mood: PetVisualState, enabled = true): PetVisualState {
  const [showingMood, setShowingMood] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!enabled || mood !== 'happy') return;

    const cycle = (visible: boolean) => {
      timer.current = setTimeout(() => {
        setShowingMood(visible);
        cycle(!visible);
      }, visible ? contentPauseMs : contentPoseMs);
    };
    cycle(true);
    return () => { clearTimeout(timer.current); setShowingMood(false); };
  }, [enabled, mood]);

  if (mood !== 'happy') return mood;
  return showingMood ? 'happy' : 'idle';
}
