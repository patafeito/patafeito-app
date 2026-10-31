import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '../../../shared/ui/Button';
import { TextField } from '../../../shared/ui/TextField';
import { useThemedStyles, type Theme } from '../../../shared/theme/ThemeProvider';
import { typography } from '../../../shared/theme/tokens';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { useSession } from '../application/session-context';
import { AuthLayout } from '../components/AuthLayout';

export function SignUpScreen() {
  const styles = useThemedStyles(makeStyles);
  const { signUp } = useSession();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(undefined);
    if (displayName.trim().length < 2) return setError('Seu nome precisa de ao menos 2 caracteres.');
    if (!email.trim().includes('@')) return setError('Informe um e-mail válido.');
    if (password.length < 8) return setError('A senha precisa de ao menos 8 caracteres.');
    setSubmitting(true);
    try {
      await signUp({ displayName: displayName.trim(), email: email.trim(), password });
    } catch (caught) {
      if (caught instanceof NetworkError) setError('Sem conexão com o servidor. Tente de novo quando a rede voltar.');
      else setError(caught instanceof ApiError ? caught.message : 'Não foi possível criar sua conta agora.');
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthLayout
    title="Crie sua conta"
    subtitle="Um pato vai acompanhar cada pequena vitória da sua rotina."
    error={error}
    footer={<Text style={styles.footer}>Já tem conta? <Link href="/sign-in" style={styles.link}>Entrar</Link></Text>}
  >
    <TextField label="Como podemos te chamar?" value={displayName} onChangeText={setDisplayName} autoComplete="name" textContentType="name" placeholder="Seu nome" maxLength={80} returnKeyType="next" />
    <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="voce@exemplo.com" returnKeyType="next" />
    <TextField label="Senha" value={password} onChangeText={setPassword} password autoComplete="new-password" textContentType="newPassword" hint="Ao menos 8 caracteres." placeholder="Crie uma senha" returnKeyType="go" onSubmitEditing={() => void submit()} />
    <Text style={styles.consent}>Ao criar a conta, você concorda com o uso dos dados descrito em <Link href="/privacy" style={styles.link}>Privacidade e dados</Link>.</Text>
    <Button label={submitting ? 'Criando…' : 'Criar conta'} disabled={submitting} onPress={() => void submit()} />
  </AuthLayout>;
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  footer: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
  link: { ...typography.label, color: colors.primary },
  consent: { ...typography.caption, color: colors.textSecondary },
});
