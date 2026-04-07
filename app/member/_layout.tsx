import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tab}>
      <Text style={[styles.icon, focused && { opacity: 1 }]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused && <View style={styles.activeLine} />}
    </View>
  )
}

export default function MemberLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.bar, tabBarShowLabel: false }}>
      <Tabs.Screen name="sessions"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏋️" label="Séances"    focused={focused} /> }} />
      <Tabs.Screen name="bookings"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Mes résa"   focused={focused} /> }} />
      <Tabs.Screen name="abonnement"    options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" label="Abonnement" focused={focused} /> }} />
      <Tabs.Screen name="notifications" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Notifs"     focused={focused} /> }} />
      <Tabs.Screen name="profile"       options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profil"     focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar:        { backgroundColor: Colors.surface, borderTopColor: Colors.border, borderTopWidth: 1, height: 68, paddingBottom: 4 },
  tab:        { alignItems: 'center', paddingTop: 6, gap: 2, minWidth: 56 },
  icon:       { fontSize: 22, opacity: 0.5 },
  label:      { fontSize: 9, color: Colors.textMuted, fontWeight: '500' },
  labelActive:{ color: Colors.blue, fontWeight: '700' },
  activeLine: { position: 'absolute', bottom: -6, width: 20, height: 2, backgroundColor: Colors.blue, borderRadius: 1 },
})