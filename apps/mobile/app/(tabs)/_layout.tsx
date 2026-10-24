import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: '#85948c',
        tabBarStyle: { height: 67, paddingTop: 7, paddingBottom: 8, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bản đồ',
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Tin đã báo',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'Thông tin',
          tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
