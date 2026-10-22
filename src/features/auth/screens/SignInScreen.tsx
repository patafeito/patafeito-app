import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { BrandBanner } from '../../../shared/ui/BrandBanner';
import { Button } from '../../../shared/ui/Button';
import { Screen } from '../../../shared/ui/Screen';
import { TextField } from '../../../shared/ui/TextField';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import { apiBaseUrl, ApiError, baseUrl, NetworkError } from '../../../shared/network/api-client';
import { useSession } from '../application/session-context';

export function SignInScreen() {
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

  return <Screen edges={['top', 'left', 'right', 'bottom']}>
    <BrandBanner subtitle="Entre para reencontrar seu pato e continuar sua sequência." />
    <Text style={styles.title}>Bem-vindo de volta</Text>
    <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="voce@exemplo.com" />
    <TextField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Sua senha" />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button label={submitting ? 'Entrando…' : 'Entrar'} disabled={submitting} onPress={() => void submit()} />
    <Link href="/sign-up" style={styles.link}>Ainda não tenho conta</Link>
    {__DEV__ ? <Text style={styles.debug}>API: {address}</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 28 },
  body: { ...typography.body, color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  error: { ...typography.body, color: colors.danger, fontSize: 14 },
  link: { ...typography.label, color: colors.primary, fontSize: 15, textAlign: 'center', paddingVertical: spacing.md },
  debug: { ...typography.body, color: colors.textMuted, fontSize: 11, textAlign: 'center' },
});
