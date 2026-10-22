import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../features/auth/application/session-context';
import { colors } from '../../shared/theme/tokens';

export default function AuthLayout() {
  const { status } = useSession();
  if (status === 'signed-in') return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
