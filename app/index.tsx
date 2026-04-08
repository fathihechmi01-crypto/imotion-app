import { useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'

export default function Index() {
  const { user, isLoading, isAuthenticated, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 13 }}>Chargement...</Text>
      </View>
    )
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/auth/login" />
  }

  if (user.is_admin === 1) {
    return <Redirect href="/admin/dashboard" />
  }

  // Members land on home
  return <Redirect href="/member/home" />
}