import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { TextField } from '../../../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { spacing, typography } from '../../../shared/theme/tokens';
import { useSession } from '../../auth/application/session-context';
import { changePassword, deleteAccount, PendingChangesError, refreshProfile, resetProgress, updateProfile } from '../application/account';
import { validateDisplayName, validateEmail, validateNewPassword } from '../domain/account';

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof NetworkError || error instanceof PendingChangesError) return error.message;
  return fallback;
}

export function EditProfileCard() {
  const styles = useThemedStyles(makeStyles);
  const { user, updateUser } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; handle?: string; password?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();
  const emailChanged = !!user && email.trim() !== user.email;
  const nextHandle = handle.replace(/^@/, '').trim().toLowerCase();
  const handleChanged = !!user && nextHandle !== (user.handle ?? '');

  // Quem entrou antes do @usuário existir ainda não o tem guardado: busca uma vez.
  const handleFetched = useRef(false);
  useEffect(() => {
    if (!user || user.handle || handleFetched.current) return;
    handleFetched.current = true;
    void refreshProfile().then(updateUser).catch(() => undefined);
  }, [user, updateUser]);

  function openForm() {
    setName(user?.displayName ?? '');
    setEmail(user?.email ?? '');
    setHandle(user?.handle ?? '');
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
      handle: handleChanged && !/^[a-z0-9_]{3,20}$/.test(nextHandle) ? 'Use de 3 a 20 letras minúsculas, números ou _.' : undefined,
    };
    setErrors(next);
    if (next.name || next.email || next.password || next.handle) return;
    setSaving(true);
    try {
      const updated = await updateProfile({
        displayName: name.trim(),
        ...(handleChanged ? { handle: nextHandle } : {}),
        ...(emailChanged ? { email: email.trim(), currentPassword: password } : {}),
      });
      updateUser(updated);
      setOpen(false);
      setNotice('Perfil atualizado.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INVALID_PASSWORD') setErrors({ password: error.message });
      else if (error instanceof ApiError && error.code === 'EMAIL_IN_USE') setErrors({ email: error.message });
      else if (error instanceof ApiError && error.code === 'HANDLE_IN_USE') setErrors({ handle: error.message });
      else setErrors({ form: errorMessage(error, 'Não foi possível salvar agora.') });
    } finally {
      setSaving(false);
    }
  }

  return <Card tone="elevated" style={styles.card}>
    {open ? <>
      <Text style={styles.cardTitle}>Editar perfil</Text>
      <TextField label="Nome" value={name} onChangeText={setName} maxLength={80} autoComplete="name" error={errors.name} />
      <TextField label="@usuário" value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} maxLength={21} error={errors.handle} hint="É como seus amigos te encontram. Letras minúsculas, números e _." />
      <TextField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
      {emailChanged ? <TextField label="Senha atual" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" error={errors.password} hint="Necessária para trocar o e-mail de acesso." /> : null}
      {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
      <Button label={saving ? 'Salvando…' : 'Salvar'} onPress={() => void save()} disabled={saving} />
      <Button label="Cancelar" variant="ghost" onPress={() => setOpen(false)} disabled={saving} />
    </> : <>
      <Text style={styles.name}>{user?.displayName ?? 'Sua conta'}</Text>
      <Text style={styles.muted}>{user?.handle ? `@${user.handle} · ` : ''}{user?.email ?? ''}</Text>
      {notice ? <Text style={styles.success}>{notice}</Text> : null}
      <Button label="Editar perfil" variant="secondary" onPress={openForm} />
    </>}
  </Card>;
}

export function ChangePasswordCard() {
  const styles = useThemedStyles(makeStyles);
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
  const styles = useThemedStyles(makeStyles);
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

/** HU09: exclusão definitiva da conta, com senha e confirmação em duas etapas. */
export function DeleteAccountCard() {
  const styles = useThemedStyles(makeStyles);
  const { signOut } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const { confirm: ask, dialog } = useConfirm();

  function confirm() {
    if (!password) return setError('Digite sua senha atual para confirmar.');
    setError(undefined);
    ask({
      title: 'Excluir sua conta?',
      message: 'Conta, pato, tarefas, XP, moedas, itens e histórico serão apagados do servidor e deste aparelho. Isso não pode ser desfeito.',
      confirmLabel: 'Excluir para sempre',
      destructive: true,
      onConfirm: () => void remove(),
    });
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteAccount(password);
      // A sessão já não vale no servidor; sair limpa os tokens e o banco local e volta ao login.
      await signOut();
    } catch (caught) {
      setError(caught instanceof ApiError && caught.code === 'INVALID_PASSWORD' ? caught.message : errorMessage(caught, 'Não foi possível excluir a conta agora.'));
      setDeleting(false);
    }
  }

  return <Card style={[styles.card, styles.danger]}>
    <Text style={styles.cardTitle}>Excluir conta</Text>
    <Text style={styles.muted}>Apaga definitivamente sua conta e todos os seus dados. Precisa de conexão.</Text>
    <View style={styles.card}>
      <TextField label="Senha atual" value={password} onChangeText={(text) => { setPassword(text); setError(undefined); }} secureTextEntry autoComplete="current-password" error={error} />
      <Button label={deleting ? 'Excluindo…' : 'Excluir conta'} variant="danger" icon="trash-outline" onPress={confirm} disabled={deleting} />
    </View>
    {dialog}
  </Card>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { gap: spacing.md },
  danger: { borderColor: colors.danger, borderWidth: 1 },
  name: { ...typography.heading, color: colors.text },
  cardTitle: { ...typography.heading, color: colors.text },
  muted: { ...typography.bodySm, color: colors.textSecondary },
  success: { ...typography.bodySm, color: colors.success },
  error: { ...typography.bodySm, color: colors.danger },
});
