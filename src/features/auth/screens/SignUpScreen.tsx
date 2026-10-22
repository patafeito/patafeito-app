import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { BrandBanner } from '../../../shared/ui/BrandBanner';
import { Button } from '../../../shared/ui/Button';
import { Screen } from '../../../shared/ui/Screen';
import { TextField } from '../../../shared/ui/TextField';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import { ApiError, NetworkError } from '../../../shared/network/api-client';
import { useSession } from '../application/session-context';

export function SignUpScreen() {
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

  return <Screen edges={['top', 'left', 'right', 'bottom']}>
    <BrandBanner subtitle="Um pato vai acompanhar cada pequena vitória da sua rotina." />
    <Text style={styles.title}>Crie sua conta</Text>
    <TextField label="Como podemos te chamar?" value={displayName} onChangeText={setDisplayName} autoComplete="name" placeholder="Seu nome" maxLength={80} />
    <TextField label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="voce@exemplo.com" />
    <TextField label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" hint="Ao menos 8 caracteres." placeholder="Crie uma senha" />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button label={submitting ? 'Criando…' : 'Criar conta'} disabled={submitting} onPress={() => void submit()} />
    <Link href="/sign-in" style={styles.link}>Já tenho conta</Link>
  </Screen>;
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text, fontSize: 28 },
  body: { ...typography.body, color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  error: { ...typography.body, color: colors.danger, fontSize: 14 },
  link: { ...typography.label, color: colors.primary, fontSize: 15, textAlign: 'center', paddingVertical: spacing.md },
});
