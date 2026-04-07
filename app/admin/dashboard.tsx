import { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as SecureStore from 'expo-secure-store'
import { dashboardService } from '@/services/dashboard.service'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Colors, SportColors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { TopNav } from '@/components/ui/TopNav'
import { AdminDrawer, useAdminDrawer } from '@/components/ui/AdminDrawer'

function Stat({ label, value, icon, color, fixed }: { label: string; value: any; icon: string; color?: string; fixed?: boolean }) {
  return (
    <Card style={fixed ? styles.statFixed : styles.stat} elevated>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statVal, color ? { color } : {}]}>{value ?? '—'}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </Card>
  )
}

export default function AdminDashboard() {
  const { visible, open, close } = useAdminDrawer()
  const qc = useQueryClient()
  const [events, setEvents] = useState<string[]>([])
  const [wsToken, setWsToken] = useState<string | null>(null)

  useState(() => {
    const load = async () => {
      const t = Platform.OS === 'web' ? localStorage.getItem('imotion_token') : await SecureStore.getItemAsync('imotion_token')
      setWsToken(t)
    }; load()
  })

  const { data: s, isLoading, refetch } = useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardService.getSummary(), refetchInterval: 60_000 })

  useWebSocket(wsToken, useCallback((e: any) => {
    const msg = e.event === 'booked' ? `🟢 Séance #${e.seance_id} — réservation` : e.event === 'cancelled' ? `🔴 Séance #${e.seance_id} — annulation` : `✅ Check-in #${e.seance_id}`
    setEvents(p => [msg, ...p].slice(0, 5))
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }, []))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav title="Dashboard" subtitle="ADMIN" onMenuPress={open}
        rightContent={
          <View style={styles.live}>
            <View style={styles.liveDot} /><Text style={styles.liveTxt}>Live</Text>
          </View>
        } />

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />} contentContainerStyle={{ paddingBottom: 32 }}>
        {events.length > 0 && (
          <View style={styles.feed}>
            <Text style={styles.feedTitle}>⚡ Temps réel</Text>
            {events.map((e, i) => <Text key={i} style={[styles.feedItem, { opacity: 1 - i * 0.18 }]}>{e}</Text>)}
          </View>
        )}

        <View style={styles.section}><Text style={styles.sLabel}>AUJOURD'HUI</Text>
          <View style={styles.g2}><Stat label="Séances" value={s?.sessions?.today} icon="🏋️" color={Colors.blue} /><Stat label="Check-ins" value={s?.sessions?.today_checkins} icon="✅" color={Colors.success} /></View>
        </View>
        <View style={styles.section}><Text style={styles.sLabel}>MEMBRES</Text>
          <View style={styles.g2}>
            <Stat label="Total" value={s?.members?.total} icon="👥" />
            <Stat label="Abonnés" value={s?.members?.active_subscriptions} icon="🌟" color={Colors.gold} />
            <Stat label="Signalés" value={s?.members?.flagged} icon="⚠️" color={Colors.warning} />
            <Stat label="Attente" value={s?.reservations?.waitlist_entries} icon="⏳" color={Colors.blue} />
          </View>
        </View>
        <View style={styles.section}><Text style={styles.sLabel}>COACHES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row', gap: 10, paddingRight: 4 }}>
            <Stat label="Total" value={s?.coaches?.total} icon="🏅" fixed />
            <Stat label="Actifs" value={s?.coaches?.active} icon="🟢" color={Colors.success} fixed />
            <Stat label="Congé" value={s?.coaches?.on_holiday} icon="🌴" color={Colors.warning} fixed />
          </ScrollView>
        </View>
        <View style={styles.section}><Text style={styles.sLabel}>SÉANCES</Text>
          <View style={styles.g2}><Stat label="Total" value={s?.sessions?.total} icon="📅" /><Stat label="À venir" value={s?.sessions?.upcoming} icon="🔮" color={Colors.blue} /></View>
        </View>
        {s?.sports && (
          <View style={styles.section}><Text style={styles.sLabel}>PAR SPORT</Text>
            {Object.entries(s.sports).map(([sport, d]: [string, any]) => (
              <Card key={sport} style={styles.sportRow} elevated>
                <View style={[styles.dot, { backgroundColor: SportColors[sport] ?? Colors.blue }]} />
                <Text style={styles.sportName}>{sport}</Text>
                <Text style={styles.sportStat}>{d.active_coaches ?? d.coaches} coaches · {d.upcoming_sessions ?? d.sessions} séances</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <AdminDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  live:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.success + '20', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.success + '40' },
  liveDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  liveTxt:   { color: Colors.success, fontWeight: '700', fontSize: 11 },
  feed:      { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  feedTitle: { color: Colors.blue, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  feedItem:  { color: Colors.textSecondary, fontSize: 13 },
  section:   { paddingHorizontal: 20, marginBottom: 20 },
  sLabel:    { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  g2:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  g3: { flexDirection: "row", gap: 10 },
  stat:      { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 16, gap: 4 },
  statFixed: { width: 120, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statIcon:  { fontSize: 24, marginBottom: 2 },
  statVal:   { color: Colors.textPrimary, fontSize: 24, fontWeight: '900' },
  statLbl:   { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sportRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, paddingVertical: 14 },
  dot:       { width: 10, height: 10, borderRadius: 5 },
  sportName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, flex: 1 },
  sportStat: { color: Colors.textSecondary, fontSize: 13 },
})