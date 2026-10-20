import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../shared/theme/tokens';
import { SyncStartup } from '../features/sync/application/sync-startup';

export default function RootLayout() {
  return <><StatusBar style="light" /><SyncStartup /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="onboarding" options={{ title: 'Seu parceiro' }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /></Stack></>;
}
