import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IconName; iconFocused: IconName }[] = [
  { name: 'index',    label: 'Início',   icon: 'home-outline',       iconFocused: 'home' },
  { name: 'feed',     label: 'Feed',     icon: 'storefront-outline',  iconFocused: 'storefront' },
  { name: 'reservas', label: 'Reservas', icon: 'calendar-outline',    iconFocused: 'calendar' },
  { name: 'avisos',   label: 'Avisos',   icon: 'megaphone-outline',   iconFocused: 'megaphone' },
  { name: 'mais',     label: 'Mais',     icon: 'grid-outline',        iconFocused: 'grid' },
];

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   COLORS.terracota,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle:             { backgroundColor: COLORS.card, borderTopColor: '#EDE0D4', height: 60 },
        tabBarLabelStyle:        { fontSize: 11, marginBottom: 4 },
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={focused ? COLORS.terracota : COLORS.textMuted}
              />
            ),
          }}
        />
      ))}
      {/* Telas acessíveis via navegação, sem tab própria */}
      <Tabs.Screen name="assembleias" options={{ href: null }} />
      <Tabs.Screen name="achados"     options={{ href: null }} />
      <Tabs.Screen name="fofuras"     options={{ href: null }} />
    </Tabs>
  );
}
