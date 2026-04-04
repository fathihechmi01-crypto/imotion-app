import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'

export default function Index() {
  const { user, isLoading, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  // ✅ LOADING SCREEN (NO WHITE SCREEN)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    )
  }

  // ❌ NOT LOGGED IN → LOGIN
  if (!user) {
    return <Redirect href="/auth/login" />
  }

  // ✅ ADMIN
  if (user.is_admin === 1) {
    return <Redirect href="/admin/dashboard" />
  }

  // ✅ MEMBER
  return <Redirect href="/member/sessions" />
}