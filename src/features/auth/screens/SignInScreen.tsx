import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { typography } from '../../../shared/theme/tokens';
import { apiBaseUrl, ApiError, baseUrl, NetworkError } from '../../../shared/network/api-client';
import { useSession } from '../application/session-context';
import { AuthLayout } from '../components/AuthLayout';

export function SignInScreen() {
  const styles = useThemedStyles(makeStyles);
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState(apiBaseUrl());

  useEffect(() => { if (__DEV__) void baseUrl().then(setAddress); }, []);

  async function submit() {
    setError(undefined);
    if (!email.trim() || !password) return setError('Informe e-mail e senha.');
    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (caught) {
      if (caught instanceof NetworkError) setError('Sem conexão com o servidor. Tente de novo quando a rede voltar.');
      else setError(caught instanceof ApiError ? caught.message : 'Não foi possível entrar agora.');
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthLayout
    title="Bem-vindo de volta"
    subtitle="Entre para reencontrar seu pato e continuar sua sequência."
    error={error}
    footer={<>
      <Text style={styles.footer}>Ainda não tem conta? <Link href="/sign-up" style={styles.link}>Criar conta</Link></Text>
      {__DEV__ ? <Text style={styles.debug}>API: {address}</Text> : null}
    </>}
  >
    <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="voce@exemplo.com" returnKeyType="next" />
    <TextField label="Senha" value={password} onChangeText={setPassword} password autoComplete="current-password" textContentType="password" placeholder="Sua senha" returnKeyType="go" onSubmitEditing={() => void submit()} />
    <Button label={submitting ? 'Entrando…' : 'Entrar'} disabled={submitting} onPress={() => void submit()} />
  </AuthLayout>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  footer: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  link: { ...typography.label, color: colors.primary },
  debug: { ...typography.caption, color: colors.textDisabled, textAlign: 'center' },
});
