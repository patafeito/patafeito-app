import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../features/auth/application/session-context';
import { useTheme } from '../../shared/theme/ThemeProvider';

export default function AuthLayout() {
  const { status } = useSession();
  const { colors } = useTheme();
  if (status === 'signed-in') return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
