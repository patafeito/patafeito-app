import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { colors, spacing, typography } from '../../shared/theme/tokens';

const iconByRoute = {
  index: 'home-outline',
  tasks: 'checkmark-circle-outline',
  pet: 'paw-outline',
  focus: 'timer-outline',
  profile: 'person-outline',
} as const;

export default function TabsLayout() {
  return <Tabs screenOptions={({ route }) => ({
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    sceneStyle: { backgroundColor: colors.background },
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle, height: 68, paddingTop: spacing.xs },
    tabBarLabelStyle: { ...typography.label, fontSize: 11, marginBottom: spacing.xs },
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
