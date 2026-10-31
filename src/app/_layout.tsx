import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans';
import { SessionProvider } from '../features/auth/application/session-context';
import { NotificationsStartup } from '../features/notifications/application/notifications-startup';
import { SyncStartup } from '../features/sync/application/sync-startup';
import { NoticeHost } from '../shared/ui/NoticeHost';
import { ThemeProvider, useTheme } from '../shared/theme/ThemeProvider';
import { fonts } from '../shared/theme/tokens';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Fredoka_600SemiBold, PixelifySans_500Medium,
  });
  return <ThemeProvider>
    {/* Se as fontes falharem, o app segue com as do sistema em vez de travar. */}
    {loaded || error ? <AppStack /> : <Blank />}
  </ThemeProvider>;
}

function Blank() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function AppStack() {
  const { colors, scheme } = useTheme();
  return <SessionProvider>
    <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    <SyncStartup />
    <NotificationsStartup />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: 'Seu pato' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="switch-pet" options={{ title: 'Trocar de pato' }} />
      <Stack.Screen name="shop" options={{ title: 'Loja' }} />
      <Stack.Screen name="customize" options={{ title: 'Personalizar' }} />
      <Stack.Screen name="profile" options={{ title: 'Perfil' }} />
      <Stack.Screen name="achievements" options={{ title: 'Conquistas' }} />
      <Stack.Screen name="friends" options={{ title: 'Amigos' }} />
      <Stack.Screen name="friend/[id]" options={{ title: 'Perfil' }} />
      <Stack.Screen name="history" options={{ title: 'Histórico' }} />
      <Stack.Screen name="reports" options={{ title: 'Relatórios' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacidade e dados' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="focus-mode" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
    <NoticeHost />
  </SessionProvider>;
}
