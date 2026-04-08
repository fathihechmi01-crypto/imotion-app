import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { TopNav } from '@/components/ui/TopNav'
import { MemberDrawer, useMemberDrawer } from '@/components/ui/MemberDrawer'
import { reservationsService } from '@/services/reservations.service'
import { sessionsService } from '@/services/sessions.service'
import { format, isAfter } from 'date-fns'
import { fr } from 'date-fns/locale'

const NAV_CARDS = [
  {
    icon: '🏋️',
    label: 'Séances',
    sub: 'Parcourir les cours',
    path: '/member/sessions',
    gradient: ['rgba(41,171,226,0.25)', 'rgba(41,171,226,0.05)'] as const,
    border: Colors.blue,
  },
  {
    icon: '🗓',
    label: 'Calendrier',
    sub: 'Vue mensuelle',
    path: '/member/calendar',
    gradient: ['rgba(41,171,226,0.18)', 'rgba(41,171,226,0.03)'] as const,
    border: Colors.blue,
  },
  {
    icon: '📅',
    label: 'Réservations',
    sub: 'Mes séances bookées',
    path: '/member/bookings',
    gradient: ['rgba(201,169,110,0.25)', 'rgba(201,169,110,0.05)'] as const,
    border: Colors.gold,
  },
  {
    icon: '💳',
    label: 'Abonnement',
    sub: 'Mon forfait actif',
    path: '/member/abonnement',
    gradient: ['rgba(201,169,110,0.18)', 'rgba(201,169,110,0.03)'] as const,
    border: Colors.gold,
  },
  {
    icon: '🔔',
    label: 'Notifications',
    sub: 'Alertes et messages',
    path: '/member/notifications',
    gradient: ['rgba(138,138,138,0.18)', 'rgba(138,138,138,0.03)'] as const,
    border: Colors.silver,
  },
  {
    icon: '👤',
    label: 'Mon profil',
    sub: 'Poids · Photo · Objectif',
    path: '/member/profile',
    gradient: ['rgba(138,138,138,0.18)', 'rgba(138,138,138,0.03)'] as const,
    border: Colors.silver,
  },
]

export default function HomeScreen() {
  const { visible, open, close } = useMemberDrawer()
  const { user } = useAuthStore()

  const { data: myReservations = [], isLoading, refetch } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.getAll({ upcoming_only: true }),
  })

  // Next upcoming reservation
  const upcoming = (myReservations as any[])
    .filter((r: any) => isAfter(new Date(`${r.seance_date}T${r.seance_heure}`), new Date()))
    .sort((a: any, b: any) => `${a.seance_date}${a.seance_heure}`.localeCompare(`${b.seance_date}${b.seance_heure}`))

  const nextResa = upcoming[0]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <TopNav
        title="iMotion Club"
        subtitle="BONJOUR"
        onMenuPress={open}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero greeting */}
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(41,171,226,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={styles.greeting}>
            Bonjour, {user?.nom?.split(' ')[0]} 👋
          </Text>
          <Text style={styles.heroSub}>Prêt pour votre prochaine séance ?</Text>
        </View>

        {/* Next reservation banner */}
        {nextResa && (
          <TouchableOpacity
            style={styles.nextBanner}
            onPress={() => router.push('/member/bookings')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.blue + '30', Colors.blue + '10']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={styles.nextLeft}>
              <Text style={styles.nextLabel}>PROCHAINE SÉANCE</Text>
              <Text style={styles.nextSport}>{nextResa.seance_sport}</Text>
              <Text style={styles.nextDate}>
                {format(new Date(`${nextResa.seance_date}T12:00:00`), 'EEEE d MMM', { locale: fr })}
                {' · '}{nextResa.seance_heure?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.nextRight}>
              <Text style={styles.nextArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{upcoming.length}</Text>
            <Text style={styles.statLbl}>À venir</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{(sessions as any[]).length}</Text>
            <Text style={styles.statLbl}>Séances dispo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: user?.is_flagged ? Colors.error : Colors.success }]}>
              {user?.no_show_count ?? 0}/3
            </Text>
            <Text style={styles.statLbl}>Absences</Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>NAVIGATION</Text>

        {/* Nav cards grid */}
        <View style={styles.grid}>
          {NAV_CARDS.map((card) => (
            <TouchableOpacity
              key={card.path}
              style={[styles.card, { borderColor: card.border + '40' }]}
              onPress={() => router.push(card.path as any)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={card.gradient as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={styles.cardIcon}>{card.icon}</Text>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardSub}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <MemberDrawer visible={visible} onClose={close} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  hero:         { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  greeting:     { color: Colors.textPrimary, fontSize: 26, fontWeight: '900' },
  heroSub:      { color: Colors.textMuted, fontSize: 14, marginTop: 4 },

  nextBanner:   { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: Colors.blue + '40' },
  nextLeft:     { flex: 1, gap: 2 },
  nextLabel:    { color: Colors.blue, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  nextSport:    { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  nextDate:     { color: Colors.textSecondary, fontSize: 13, textTransform: 'capitalize' },
  nextRight:    { paddingLeft: 12 },
  nextArrow:    { color: Colors.blue, fontSize: 28, fontWeight: '300' },

  statsRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, marginBottom: 20 },
  statBox:      { flex: 1, alignItems: 'center', gap: 2 },
  statVal:      { color: Colors.textPrimary, fontSize: 22, fontWeight: '900' },
  statLbl:      { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  statDivider:  { width: 1, height: 32, backgroundColor: Colors.border },

  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 2, paddingHorizontal: 20, marginBottom: 12 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  card:         { width: '47%', borderRadius: 16, padding: 18, gap: 6, overflow: 'hidden', borderWidth: 1, backgroundColor: Colors.surface },
  cardIcon:     { fontSize: 28 },
  cardLabel:    { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  cardSub:      { color: Colors.textMuted, fontSize: 11 },
})