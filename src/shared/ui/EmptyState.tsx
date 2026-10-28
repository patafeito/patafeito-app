import { StyleSheet, Text, View } from 'react-native';
import { PetSprite } from '../../features/pet/components/PetSprite';
import type { SpeciesId } from '../../features/onboarding/domain/species';
import type { PetVisualState } from '../../features/pet/domain/pet-sprites';
import { useThemedStyles, type Theme } from '../theme/ThemeProvider';
import { radius, spacing, typography } from '../theme/tokens';
import { Button } from './Button';

type EmptyStateProps = {
  species: SpeciesId;
  state?: PetVisualState;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vazio ilustrado: o mascote do contexto explica e convida para o primeiro passo. */
export function EmptyState({ species, state = 'idle', title, message, actionLabel, onAction }: EmptyStateProps) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.container}>
    <PetSprite species={species} state={state} height={112} still />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction ? <Button label={actionLabel} variant="tertiary" size="compact" onPress={onAction} /> : null}
  </View>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong },
  title: { ...typography.subheading, color: colors.text, textAlign: 'center' },
  message: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },
});
