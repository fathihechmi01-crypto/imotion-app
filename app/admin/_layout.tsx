import { Stack } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function AdminLayout() {
  
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.black } }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="coaches" />
      <Stack.Screen name="members" />
      <Stack.Screen name="abonnements" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="scan" />
    </Stack>
  )
}