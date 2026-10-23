import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { TextField } from '../../../shared/ui/TextField';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import { useSession } from '../../auth/application/session-context';
import { changePassword, PendingChangesError, resetProgress, updateProfile } from '../application/account';
import { validateDisplayName, validateEmail, validateNewPassword } from '../domain/account';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof NetworkError || error instanceof PendingChangesError) return error.message;
  return fallback;
}

export function EditProfileCard() {
  const { user, updateUser } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();
  const emailChanged = !!user && email.trim() !== user.email;

  function openForm() {
    setName(user?.displayName ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setErrors({});
    setNotice(undefined);
    setOpen(true);
  }

  async function save() {
    const next = {
      name: validateDisplayName(name),
      email: validateEmail(email),
      password: emailChanged && !password ? 'Digite sua senha atual para trocar o e-mail.' : undefined,
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        displayName: name.trim(),
        ...(emailChanged ? { email: email.trim(), currentPassword: password } : {}),
      });
      updateUser(updated);
      setOpen(false);
      setNotice('Perfil atualizado.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_PASSWORD') setErrors({ password: error.message });
      else if (error instanceof ApiError && error.code === 'EMAIL_IN_USE') setErrors({ email: error.message });
      else setErrors({ form: errorMessage(error, 'Não foi possível salvar agora.') });
    } finally {
      setSaving(false);
    }
  }

  return <Card tone="raised" style={styles.card}>
    {open ? <>
      <Text style={styles.cardTitle}>Editar perfil</Text>
      <TextField label="Nome" value={name} onChangeText={setName} maxLength={80} autoComplete="name" error={errors.name} />
      <TextField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      {emailChanged ? <TextField label="Senha atual" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" error={errors.password} hint="Necessária para trocar o e-mail de acesso." /> : null}
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      <Button label={saving ? 'Salvando…' : 'Salvar'} onPress={() => void save()} disabled={saving} />
      <Button label="Cancelar" variant="ghost" onPress={() => setOpen(false)} disabled={saving} />
    </> : <>
      <Text style={styles.name}>{user?.displayName ?? 'Sua conta'}</Text>
      <Text style={styles.muted}>{user?.email ?? ''}</Text>
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      <Button label="Editar perfil" variant="secondary" onPress={openForm} />
    </>}
  </Card>;
}

export function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();

  function reset(isOpen: boolean) {
    setCurrent('');
    setNext('');
    setConfirmation('');
    setErrors({});
    setOpen(isOpen);
  }

  async function save() {
    const nextErrors = { current: current ? undefined : 'Digite sua senha atual.', next: validateNewPassword(next, confirmation) };
    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next) return;
    setSaving(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      reset(false);
      setNotice('Senha alterada. Os outros aparelhos vão precisar entrar de novo.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_PASSWORD') setErrors({ current: error.message });
      else setErrors({ form: errorMessage(error, 'Não foi possível trocar a senha agora.') });
    } finally {
      setSaving(false);
    }
  }

  return <Card style={styles.card}>
    <Text style={styles.cardTitle}>Senha</Text>
    {open ? <>
      <TextField label="Senha atual" value={current} onChangeText={setCurrent} secureTextEntry autoComplete="current-password" error={errors.current} />
      <TextField label="Nova senha" value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" hint="Pelo menos 8 caracteres." />
      <TextField label="Confirmar nova senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" error={errors.next} />
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      <Button label={saving ? 'Salvando…' : 'Trocar senha'} onPress={() => void save()} disabled={saving} />
      <Button label="Cancelar" variant="ghost" onPress={() => reset(false)} disabled={saving} />
    </> : <>
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      <Button label="Alterar senha" variant="secondary" onPress={() => { setNotice(undefined); reset(true); }} />
    </>}
  </Card>;
}

export function ResetProgressCard({ onReset }: { onReset: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string>();
  const { confirm: ask, dialog } = useConfirm();

  function confirm() {
    if (!password) return setError('Digite sua senha atual para confirmar.');
    setError(undefined);
    ask({
      title: 'Resetar progresso?',
      message: 'XP, nível, moedas, itens, ciclos de foco e tarefas concluídas serão apagados. Isso não pode ser desfeito.',
      confirmLabel: 'Resetar',
      destructive: true,
      onConfirm: () => void reset(),
    });
  }

  async function reset() {
    setResetting(true);
    try {
      await resetProgress(password);
      setPassword('');
      setNotice('Progresso zerado. Seu pato está pronto para recomeçar.');
      onReset();
    } catch (caught) {
      setError(caught instanceof ApiError && caught.code === 'INVALID_PASSWORD' ? caught.message : errorMessage(caught, 'Não foi possível resetar agora.'));
    } finally {
      setResetting(false);
    }
  }

  return <Card style={[styles.card, styles.danger]}>
    <Text style={styles.cardTitle}>Resetar progresso</Text>
    <Text style={styles.muted}>Zera XP, nível, moedas, itens, ciclos de foco e tarefas concluídas. Seu pato e as tarefas pendentes continuam.</Text>
    <View style={styles.card}>
      <TextField label="Senha atual" value={password} onChangeText={(text) => { setPassword(text); setError(undefined); }} secureTextEntry autoComplete="current-password" error={error} />
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      <Button label={resetting ? 'Resetando…' : 'Resetar progresso'} variant="secondary" onPress={confirm} disabled={resetting} />
    </View>
    {dialog}
  </Card>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  danger: { borderColor: colors.danger, borderWidth: 1 },
  name: { ...typography.heading, color: colors.text, fontSize: 18 },
  cardTitle: { ...typography.heading, color: colors.text, fontSize: 17 },
  muted: { ...typography.body, color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  success: { ...typography.body, color: colors.success, fontSize: 14 },
  error: { ...typography.body, color: colors.danger, fontSize: 14 },
});
