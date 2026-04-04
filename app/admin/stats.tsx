import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'
import { Colors, SportColors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'

const { width } = Dimensions.get('window')
const BAR_WIDTH = width - 80

export default function AdminStatsScreen() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: dashboardService.getStats,
  })

  const maxWeekly = stats?.weeklyTrend
    ? Math.max(...stats.weeklyTrend.map((w: any) => w.reservations), 1)
    : 1

  const maxHour = stats?.busiestHours
    ? Math.max(...stats.busiestHours.map((h: any) => h.reservations), 1)
    : 1

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={styles.header}>
          <Text style={styles.adminLabel}>ADMIN</Text>
          <Text style={styles.title}>Statistiques</Text>
        </View>

        {/* Retention */}
        {stats?.retention && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RÉTENTION MEMBRES</Text>
            <Card elevated>
              <View style={styles.retentionRow}>
                <View style={styles.retentionCircle}>
                  <Text style={styles.retentionPct}>{stats.retention.retention_rate}%</Text>
                  <Text style={styles.retentionLabel}>actifs</Text>
                </View>
                <View style={styles.retentionDetails}>
                  <View style={styles.retentionItem}>
                    <View style={[styles.retentionDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.retentionText}>Abonnements actifs : <Text style={{ color: Colors.success, fontWeight: '700' }}>{stats.retention.active_subscriptions}</Text></Text>
                  </View>
                  <View style={styles.retentionItem}>
                    <View style={[styles.retentionDot, { backgroundColor: Colors.error }]} />
                    <Text style={styles.retentionText}>Expirés : <Text style={{ color: Colors.error, fontWeight: '700' }}>{stats.retention.expired_or_unpaid}</Text></Text>
                  </View>
                  <View style={styles.retentionItem}>
                    <View style={[styles.retentionDot, { backgroundColor: Colors.textMuted }]} />
                    <Text style={styles.retentionText}>Sans abonnement : <Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>{stats.retention.no_subscription}</Text></Text>
                  </View>
                  <View style={styles.retentionItem}>
                    <View style={[styles.retentionDot, { backgroundColor: Colors.warning }]} />
                    <Text style={styles.retentionText}>Signalés : <Text style={{ color: Colors.warning, fontWeight: '700' }}>{stats.retention.flagged_members}</Text></Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* No-show rate */}
        {stats?.noShowRate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAUX D'ABSENCE</Text>
            <Card elevated>
              <View style={styles.noShowRow}>
                <Text style={styles.noShowValue}>{stats.noShowRate.no_show_rate}%</Text>
                <Text style={styles.noShowLabel}>d'absences non justifiées</Text>
              </View>
              <View style={styles.noShowBar}>
                <View style={[styles.noShowFill, {
                  width: `${Math.min(stats.noShowRate.no_show_rate, 100)}%` as any,
                  backgroundColor: stats.noShowRate.no_show_rate > 20 ? Colors.error : Colors.warning,
                }]} />
              </View>
              <Text style={styles.noShowSub}>{stats.noShowRate.no_shows} absences sur {stats.noShowRate.total_reservations} réservations</Text>
            </Card>
          </View>
        )}

        {/* Weekly trend */}
        {stats?.weeklyTrend && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RÉSERVATIONS (8 SEMAINES)</Text>
            <Card elevated style={{ gap: 12 }}>
              {stats.weeklyTrend.map((w: any, i: number) => {
                const pct = w.reservations / maxWeekly
                const weekLabel = w.week_start.slice(5).replace('-', '/')
                return (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel}>{weekLabel}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, {
                        width: `${Math.round(pct * 100)}%` as any,
                        backgroundColor: Colors.blue,
                        opacity: 0.5 + pct * 0.5,
                      }]} />
                    </View>
                    <Text style={styles.barValue}>{w.reservations}</Text>
                  </View>
                )
              })}
            </Card>
          </View>
        )}

        {/* Busiest hours */}
        {stats?.busiestHours && stats.busiestHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HEURES DE POINTE</Text>
            <Card elevated style={{ gap: 10 }}>
              {stats.busiestHours.map((h: any, i: number) => {
                const pct = h.reservations / maxHour
                return (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barLabel}>{h.heure}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, {
                        width: `${Math.round(pct * 100)}%` as any,
                        backgroundColor: Colors.gold,
                        opacity: 0.5 + pct * 0.5,
                      }]} />
                    </View>
                    <Text style={styles.barValue}>{h.reservations}</Text>
                  </View>
                )
              })}
            </Card>
          </View>
        )}

        {/* Fill rate */}
        {stats?.fillRate && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAUX DE REMPLISSAGE (RÉCENTES)</Text>
            <Card elevated style={{ gap: 10 }}>
              {stats.fillRate.slice(0, 8).map((s: any) => {
                const color = s.fill_rate >= 100 ? Colors.error : s.fill_rate >= 75 ? Colors.success : Colors.blue
                return (
                  <View key={s.seance_id} style={styles.fillRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.fillLabel}>{s.sport} · {s.date}</Text>
                      <View style={styles.fillTrack}>
                        <View style={[styles.fillBar, { width: `${s.fill_rate}%` as any, backgroundColor: color }]} />
                      </View>
                    </View>
                    <Text style={[styles.fillPct, { color }]}>{s.fill_rate}%</Text>
                  </View>
                )
              })}
            </Card>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  adminLabel:      { color: Colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title:           { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  section:         { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel:    { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  // Retention
  retentionRow:    { flexDirection: 'row', alignItems: 'center', gap: 20 },
  retentionCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  retentionPct:    { color: Colors.blue, fontSize: 22, fontWeight: '900' },
  retentionLabel:  { color: Colors.textMuted, fontSize: 11 },
  retentionDetails:{ flex: 1, gap: 8 },
  retentionItem:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  retentionDot:    { width: 8, height: 8, borderRadius: 4 },
  retentionText:   { color: Colors.textSecondary, fontSize: 12 },
  // No-show
  noShowRow:       { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  noShowValue:     { color: Colors.textPrimary, fontSize: 36, fontWeight: '900' },
  noShowLabel:     { color: Colors.textSecondary, fontSize: 13 },
  noShowBar:       { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  noShowFill:      { height: 6, borderRadius: 3 },
  noShowSub:       { color: Colors.textMuted, fontSize: 12 },
  // Bars
  barRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel:        { color: Colors.textSecondary, fontSize: 12, width: 40, textAlign: 'right' },
  barTrack:        { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  barFill:         { height: 10, borderRadius: 5 },
  barValue:        { color: Colors.textPrimary, fontWeight: '700', fontSize: 12, width: 28, textAlign: 'right' },
  // Fill rate
  fillRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fillLabel:       { color: Colors.textSecondary, fontSize: 11 },
  fillTrack:       { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fillBar:         { height: 8, borderRadius: 4 },
  fillPct:         { fontWeight: '800', fontSize: 14, width: 44, textAlign: 'right' },
})
