import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'

interface Props {
  title: string
  subtitle?: string
  showBack?: boolean
  rightContent?: React.ReactNode
  onMenuPress?: () => void
}

export function TopNav({ title, subtitle, showBack, rightContent, onMenuPress }: Props) {
  return (
    <View style={styles.nav}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconTxt}>‹</Text>
          </TouchableOpacity>
        ) : onMenuPress ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
            <Text style={styles.menuTxt}>☰</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.center}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {rightContent}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nav:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  left:      { width: 44 },
  center:    { flex: 1 },
  right:     { width: 44, alignItems: 'flex-end' },
  iconBtn:   { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconTxt:   { color: Colors.textPrimary, fontSize: 26, lineHeight: 30 },
  menuTxt:   { color: Colors.textPrimary, fontSize: 18 },
  subtitle:  { color: Colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title:     { color: Colors.textPrimary, fontSize: 22, fontWeight: '900' },
})