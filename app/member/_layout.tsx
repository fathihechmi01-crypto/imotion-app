import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  )
}

export default function MemberLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏋️" label="Séances" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Mes résa" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Notifs" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
  },
  tabItem:        { alignItems: 'center', paddingTop: 6, gap: 3 },
  tabItemFocused: {},
  tabIcon:        { fontSize: 22 },
  tabIconFocused: {},
  tabLabel:       { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  tabLabelFocused:{ color: Colors.blue, fontWeight: '700' },
})
