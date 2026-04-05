import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tab, focused && styles.tabFocused]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  )
}

export default function MemberLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.bar, tabBarShowLabel: false }}>
      <Tabs.Screen name="sessions"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏋️" label="Séances"    focused={focused} /> }} />
      <Tabs.Screen name="bookings"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Réservations" focused={focused} /> }} />
      <Tabs.Screen name="abonnement"    options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" label="Abonnement"  focused={focused} /> }} />
      <Tabs.Screen name="notifications" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Notifs"      focused={focused} /> }} />
      <Tabs.Screen name="profile"       options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil"      focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar:          { backgroundColor: Colors.surface, borderTopColor: Colors.border, borderTopWidth: 1, height: 72, paddingBottom: 8 },
  tab:          { alignItems: 'center', paddingTop: 6, gap: 2 },
  tabFocused:   {},
  icon:         { fontSize: 20 },
  label:        { fontSize: 9, color: Colors.textMuted, fontWeight: '500' },
  labelFocused: { color: Colors.blue, fontWeight: '700' },
})
