import { useEffect } from 'react'
import { View } from 'react-native'
import openAdminDrawer from './_layout'
import { Colors } from '@/constants/colors'

export default function MenuScreen() {
  useEffect(() => { openAdminDrawer() }, [])
  return <View style={{ flex: 1, backgroundColor: Colors.black }} />
}
