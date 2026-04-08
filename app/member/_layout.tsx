import { Stack } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function MemberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.black } }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="abonnement" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
    </Stack>
  )
}