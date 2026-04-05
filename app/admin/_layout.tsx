import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tab, focused && styles.tabFocused]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  )
}

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.bar, tabBarShowLabel: false }}>
      <Tabs.Screen name="dashboard"    options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Board"    focused={focused} /> }} />
      <Tabs.Screen name="calendar"     options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗓"  label="Agenda"   focused={focused} /> }} />
      <Tabs.Screen name="coaches"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏅" label="Coaches"  focused={focused} /> }} />
      <Tabs.Screen name="members"      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Membres"  focused={focused} /> }} />
      <Tabs.Screen name="abonnements"  options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💳" label="Abos"     focused={focused} /> }} />
      <Tabs.Screen name="stats"        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📈" label="Stats"    focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar:          { backgroundColor: Colors.surface, borderTopColor: Colors.border, borderTopWidth: 1, height: 76, paddingBottom: 8 },
  tab:          { alignItems: 'center', paddingTop: 6, gap: 2 },
  tabFocused:   {},
  icon:         { fontSize: 20 },
  label:        { fontSize: 9, color: Colors.textMuted, fontWeight: '500' },
  labelFocused: { color: Colors.gold, fontWeight: '700' },
  dot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold, marginTop: 1 },
})