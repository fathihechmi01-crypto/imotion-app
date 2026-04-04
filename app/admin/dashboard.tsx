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
import { useAuthStore } from '@/store/auth.store'
import { useEffect } from 'react'
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: string; color?: string; sub?: string
}) {
  return (
    <Card style={styles.statCard} elevated>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Card>
  )
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [liveEvents, setLiveEvents] = useState<string[]>([])

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getSummary,
    refetchInterval: 60_000,
  })

  // Get stored token for WS
  const [wsToken, setWsToken] = useState<string | null>(null)


  useEffect(() => {
    const load = async () => {
      const t =
        Platform.OS === 'web'
          ? localStorage.getItem('imotion_token')
          : await SecureStore.getItemAsync('imotion_token')

      setWsToken(t)
    }

    load()
  }, [])

  const onWsEvent = useCallback((e: any) => {
    const msg = e.event === 'booked'
      ? `🟢 Séance #${e.seance_id} — nouvelle réservation`
      : e.event === 'cancelled'
        ? `🔴 Séance #${e.seance_id} — annulation`
        : `✅ Séance #${e.seance_id} — check-in`

    setLiveEvents((prev) => [msg, ...prev].slice(0, 5))
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }, [])

  useWebSocket(wsToken, onWsEvent)

  const s = summary

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <LinearGradient colors={['rgba(201,169,110,0.12)', 'transparent']} style={styles.headerGlow} pointerEvents="none" />
        <View style={styles.header}>
          <View>
            <Text style={styles.adminLabel}>ADMIN</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Live feed */}
        {liveEvents.length > 0 && (
          <View style={styles.liveFeed}>
            <Text style={styles.liveFeedTitle}>⚡ Activité en temps réel</Text>
            {liveEvents.map((e, i) => (
              <Text key={i} style={[styles.liveFeedItem, { opacity: 1 - i * 0.18 }]}>{e}</Text>
            ))}
          </View>
        )}

        {/* Today */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AUJOURD'HUI</Text>
          <View style={styles.grid2}>
            <StatCard label="Séances" value={s?.sessions?.today ?? '—'} icon="🏋️" color={Colors.blue} />
            <StatCard label="Check-ins" value={s?.sessions?.today_checkins ?? '—'} icon="✅" color={Colors.success} />
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MEMBRES</Text>
          <View style={styles.grid2}>
            <StatCard label="Total" value={s?.members?.total ?? '—'} icon="👥" />
            <StatCard label="Abonnés actifs" value={s?.members?.active_subscriptions ?? '—'} icon="🌟" color={Colors.gold} />
            <StatCard label="Signalés" value={s?.members?.flagged ?? '—'} icon="⚠️" color={Colors.warning} />
            <StatCard label="Liste d'attente" value={s?.reservations?.waitlist_entries ?? '—'} icon="⏳" color={Colors.blue} />
          </View>
        </View>

        {/* Coaches */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COACHES</Text>
          <View style={styles.grid3}>
            <StatCard label="Total" value={s?.coaches?.total ?? '—'} icon="🏅" />
            <StatCard label="Actifs" value={s?.coaches?.active ?? '—'} icon="🟢" color={Colors.success} />
            <StatCard label="Congé" value={s?.coaches?.on_holiday ?? '—'} icon="🌴" color={Colors.warning} />
          </View>
        </View>

        {/* Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SÉANCES</Text>
          <View style={styles.grid2}>
            <StatCard label="Total" value={s?.sessions?.total ?? '—'} icon="📅" />
            <StatCard label="À venir" value={s?.sessions?.upcoming ?? '—'} icon="🔮" color={Colors.blue} />
          </View>
        </View>

        {/* Per-sport */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAR SPORT</Text>
          {s?.sports && Object.entries(s.sports).map(([sport, data]: [string, any]) => (
            <Card key={sport} style={styles.sportRow} elevated>
              <View style={[styles.sportDot, { backgroundColor: SportColors[sport] ?? Colors.blue }]} />
              <Text style={styles.sportName}>{sport}</Text>
              <View style={styles.sportStats}>
                <Text style={styles.sportStat}>{data.coaches} coaches</Text>
                <Text style={styles.sportDivider}>·</Text>
                <Text style={styles.sportStat}>{data.upcoming_sessions} séances</Text>
              </View>
            </Card>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  adminLabel: { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.success + '40' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.success, fontWeight: '700', fontSize: 12 },
  liveFeed: { marginHorizontal: 20, marginBottom: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 6 },
  liveFeedTitle: { color: Colors.blue, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  liveFeedItem: { color: Colors.textSecondary, fontSize: 13 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  grid3: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 16, gap: 4 },
  statIcon: { fontSize: 24, marginBottom: 2 },
  statValue: { color: Colors.textPrimary, fontSize: 24, fontWeight: '900' },
  statLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  statSub: { color: Colors.textMuted, fontSize: 10 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 14 },
  sportDot: { width: 10, height: 10, borderRadius: 5 },
  sportName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15, flex: 1 },
  sportStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sportStat: { color: Colors.textSecondary, fontSize: 13 },
  sportDivider: { color: Colors.textMuted },
})
