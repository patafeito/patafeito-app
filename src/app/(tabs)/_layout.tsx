import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../features/auth/application/session-context';
import { useReducedMotion } from '../../shared/hooks/use-reduced-motion';
import { useTheme } from '../../shared/theme/ThemeProvider';
import { fonts, radius, spacing } from '../../shared/theme/tokens';

/** Ícone vazado quando inativo, cheio quando ativo — o estado não depende só da cor. */
const iconByRoute = {
  index: ['home-outline', 'home'],
  tasks: ['checkmark-circle-outline', 'checkmark-circle'],
  habits: ['leaf-outline', 'leaf'],
  focus: ['timer-outline', 'timer'],
  pet: ['paw-outline', 'paw'],
} as const;

const barHeight = 64;

type TabButtonProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  'aria-selected'?: boolean;
  testID?: string;
};

/**
 * Botão da aba sem o ripple/hover padrão (a mancha cinza que vazava da aba). O retorno visual fica no conteúdo:
 * leve transparência ao passar o mouse e um "afundar" ao tocar.
 */
function TabButton({ children, style, onPress, onLongPress, accessibilityLabel, accessibilityState, testID, ...rest }: TabButtonProps) {
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const selected = accessibilityState?.selected ?? rest['aria-selected'];
  return <Pressable
    accessibilityRole="tab"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ selected }}
    testID={testID}
    onPress={onPress}
    onLongPress={onLongPress ?? undefined}
    onHoverIn={() => setHovered(true)}
    onHoverOut={() => setHovered(false)}
    style={[style, styles.button]}
  >
    {({ pressed }) => <View style={[styles.content, hovered && !selected && styles.hovered, pressed && !reducedMotion && styles.pressed]}>{children}</View>}
  </Pressable>;
}

export default function TabsLayout() {
  const { status } = useSession();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (status === 'signed-out') return <Redirect href="/sign-in" />;

  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    sceneStyle: { backgroundColor: colors.background },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: barHeight + insets.bottom,
      paddingTop: spacing.sm,
      paddingBottom: insets.bottom,
    },
    // Em telas largas o padrão põe o rótulo ao lado do ícone; mantemos sempre embaixo.
    tabBarLabelPosition: 'below-icon',
    tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11, marginTop: 2 },
    tabBarActiveTintColor: colors.onPrimarySoft,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarButton: (props) => <TabButton {...props} />,
    tabBarIcon: ({ color, focused }) => {
      const icons = iconByRoute[route.name as keyof typeof iconByRoute];
      return <View style={[styles.icon, focused && { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icons ? icons[focused ? 1 : 0] : 'ellipse-outline'} color={color} size={22} />
      </View>;
    },
  })}>
    <Tabs.Screen name="index" options={{ title: 'Início' }} />
    <Tabs.Screen name="tasks" options={{ title: 'Tarefas' }} />
    <Tabs.Screen name="habits" options={{ title: 'Hábitos' }} />
    <Tabs.Screen name="focus" options={{ title: 'Foco' }} />
    <Tabs.Screen name="pet" options={{ title: 'Pato' }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  content: { alignItems: 'center', justifyContent: 'center' },
  hovered: { opacity: 0.75 },
  pressed: { transform: [{ scale: 0.94 }] },
  icon: { width: 56, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
