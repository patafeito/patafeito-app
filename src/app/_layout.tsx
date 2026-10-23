import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../features/auth/application/session-context';
import { SyncStartup } from '../features/sync/application/sync-startup';
import { NoticeHost } from '../shared/ui/NoticeHost';
import { colors } from '../shared/theme/tokens';

export default function RootLayout() {
  return <SessionProvider>
    <StatusBar style="light" />
    <SyncStartup />
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: 'Seu pato' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="switch-pet" options={{ title: 'Trocar de pato' }} />
      <Stack.Screen name="shop" options={{ title: 'Loja' }} />
    </Stack>
    <NoticeHost />
  </SessionProvider>;
}
