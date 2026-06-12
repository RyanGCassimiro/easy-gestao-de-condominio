import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ITEMS: { name: string; label: string; icon: IconName; iconFocused: IconName }[] = [
  { name: 'index',      label: 'Início',   icon: 'home-outline',      iconFocused: 'home' },
  { name: 'feed',       label: 'Feed',     icon: 'storefront-outline', iconFocused: 'storefront' },
  { name: 'reservas',   label: 'Reservas', icon: 'calendar-outline',  iconFocused: 'calendar' },
  { name: 'avisos',     label: 'Avisos',   icon: 'megaphone-outline',  iconFocused: 'megaphone' },
  { name: 'assembleias', label: 'Mais',    icon: 'grid-outline',       iconFocused: 'grid' },
];

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#8B4513',
        tabBarInactiveTintColor: '#999',
        tabBarStyle:             { backgroundColor: '#FAF7F4', borderTopColor: '#EDE0D4' },
        headerStyle:             { backgroundColor: '#FAF7F4' },
        headerTintColor:         '#8B4513',
        headerTitleStyle:        { fontWeight: 'bold' },
      }}
    >
      {TAB_ITEMS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, size }) => (
              <Ionicons name={focused ? tab.iconFocused : tab.icon} size={size} color={focused ? '#8B4513' : '#999'} />
            ),
          }}
        />
      ))}
      {/* Telas extras acessíveis mas sem tab */}
      <Tabs.Screen name="achados"  options={{ href: null }} />
      <Tabs.Screen name="fofuras"  options={{ href: null }} />
    </Tabs>
  );
}
