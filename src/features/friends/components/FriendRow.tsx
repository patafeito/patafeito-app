import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { speciesById } from '../../onboarding/domain/species';
import { PetSprite } from '../../pet/components/PetSprite';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing, typography } from '../../../shared/theme/tokens';
import type { PublicPet } from '../infrastructure/friends-api';

type FriendRowProps = {
  displayName: string;
  handle: string | null;
  pet: PublicPet | null;
  /** Linha de detalhes (nível, sequência, XP). */
  detail?: string;
  online?: boolean;
  /** Posição no ranking, quando houver. */
  position?: number;
  highlight?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
};

/** Pessoa numa lista social: pato, nome, @usuário e status em texto (não só pela cor). */
export function FriendRow({ displayName, handle, pet, detail, online, position, highlight, onPress, trailing }: FriendRowProps) {
  const styles = useThemedStyles(makeStyles);
  const status = online === undefined ? '' : online ? 'Online' : 'Offline';
  const label = [position ? `${position}º lugar` : '', displayName, handle ? `@${handle}` : '', status, detail ?? ''].filter(Boolean).join(', ');
  return <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={label}
    disabled={!onPress}
    onPress={onPress}
    style={({ pressed }) => [styles.row, highlight && styles.highlight, pressed && onPress && styles.pressed]}
  >
    {position ? <Text style={styles.position}>{position}º</Text> : null}
    <View style={styles.avatar}>
      {pet ? <PetSprite species={speciesById(pet.speciesId).id} state="idle" height={44} still /> : null}
      {online !== undefined ? <View style={[styles.dot, online ? styles.dotOnline : styles.dotOffline]} /> : null}
    </View>
    <View style={styles.text}>
      <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
      <Text style={styles.handle} numberOfLines={1}>{handle ? `@${handle}` : ''}{status ? ` · ${status}` : ''}</Text>
      {detail ? <Text style={styles.detail} numberOfLines={1}>{detail}</Text> : null}
    </View>
    {trailing}
  </Pressable>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms, padding: spacing.ms, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  highlight: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.85 },
  position: { ...typography.numeric, width: 28, textAlign: 'center', color: colors.text },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, overflow: 'visible' },
  dot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.surface },
  dotOnline: { backgroundColor: colors.success },
  dotOffline: { backgroundColor: colors.textDisabled },
  text: { flex: 1, gap: 2 },
  name: { ...typography.subheading, color: colors.text },
  handle: { ...typography.caption, color: colors.textSecondary },
  detail: { ...typography.caption, color: colors.textSecondary },
});
