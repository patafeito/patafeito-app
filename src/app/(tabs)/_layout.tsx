import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../features/auth/application/session-context';
import { colors, spacing, typography } from '../../shared/theme/tokens';

const iconByRoute = {
  index: 'home-outline',
  tasks: 'checkmark-circle-outline',
  pet: 'paw-outline',
  focus: 'timer-outline',
  profile: 'person-outline',
} as const;

const barHeight = 64;

export default function TabsLayout() {
  const { status } = useSession();
  const insets = useSafeAreaInsets();
  if (status === 'signed-out') return <Redirect href="/sign-in" />;

  return <Tabs screenOptions={({ route }) => ({
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    sceneStyle: { backgroundColor: colors.background },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.borderSubtle,
      height: barHeight + insets.bottom,
      paddingTop: spacing.xs,
      paddingBottom: insets.bottom,
    },
    tabBarItemStyle: { paddingVertical: spacing.xs },
    tabBarLabelStyle: { ...typography.label, fontSize: 11 },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarIcon: ({ color, size }) => <Ionicons name={iconByRoute[route.name as keyof typeof iconByRoute] ?? 'ellipse-outline'} color={color} size={size} />,
  })}>
    <Tabs.Screen name="index" options={{ title: 'Início' }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tarefas' }} />
    <Tabs.Screen name="pet" options={{ title: 'Pato' }} />
    <Tabs.Screen name="focus" options={{ title: 'Foco' }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
  </Tabs>;
}
