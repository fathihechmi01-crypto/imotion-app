import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'

interface Props { visible: boolean; onClose: () => void }

const MENU_ITEMS = [
  { icon: '🏠', label: 'Accueil',          path: '/member/home' },
  { icon: '🏋️', label: 'Séances',          path: '/member/sessions' },
  { icon: '🗓',  label: 'Calendrier',       path: '/member/calendar' },
  { icon: '📅', label: 'Mes réservations', path: '/member/bookings' },
  { icon: '💳', label: 'Mon abonnement',   path: '/member/abonnement' },
  { icon: '🔔', label: 'Notifications',    path: '/member/notifications' },
  { icon: '👤', label: 'Mon profil',       path: '/member/profile' },
]

export function MemberDrawer({ visible, onClose }: Props) {
  const { user, logout } = useAuthStore()
  const go = (path: string) => { onClose(); setTimeout(() => router.push(path as any), 100) }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.panel}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}><Text style={styles.logoI}>i</Text></View>
              <View>
                <Text style={styles.logoMotion}>motion</Text>
                <Text style={styles.logoClub}>club</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {user && (
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{user.nom.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.nom}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>NAVIGATION</Text>
            {MENU_ITEMS.map(item => (
              <TouchableOpacity key={item.path} style={styles.item} onPress={() => go(item.path)}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); logout() }}>
            <Text style={styles.logoutTxt}>Se déconnecter</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

export function useMemberDrawer() {
  const [visible, setVisible] = useState(false)
  return { visible, open: useCallback(() => setVisible(true), []), close: useCallback(() => setVisible(false), []) }
}

const styles = StyleSheet.create({
  root:       { flex: 1, flexDirection: 'row' },
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel:      { width: '78%', backgroundColor: Colors.surface, borderRightWidth: 1, borderRightColor: Colors.border },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark:   { width: 34, height: 34, borderRadius: 9, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoI:      { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic' },
  logoMotion: { color: Colors.silver, fontSize: 16, fontWeight: '800' },
  logoClub:   { color: Colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  closeBtn:   { padding: 8 },
  closeTxt:   { color: Colors.textSecondary, fontSize: 18 },
  userRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.blueDim, borderWidth: 1, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: Colors.blue, fontWeight: '800', fontSize: 18 },
  userName:   { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  userEmail:  { color: Colors.textMuted, fontSize: 12 },
  sectionLabel:{ color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 2, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  item:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  itemIcon:   { fontSize: 20, width: 28 },
  itemLabel:  { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 },
  itemArrow:  { color: Colors.textMuted, fontSize: 22 },
  logoutBtn:  { margin: 16, padding: 14, borderRadius: 12, backgroundColor: Colors.error + '15', borderWidth: 1, borderColor: Colors.error + '40', alignItems: 'center' },
  logoutTxt:  { color: Colors.error, fontWeight: '700', fontSize: 15 },
})