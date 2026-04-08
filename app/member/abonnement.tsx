import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { TopNav } from '@/components/ui/TopNav'
import { MemberDrawer, useMemberDrawer } from '@/components/ui/MemberDrawer'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { abonnementsService } from '@/services/abonnements.service'
import { paiementsService } from '@/services/paiements.service'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TIER_COLOR = { basic: Colors.silver, premium: Colors.blue, vip: Colors.gold }
const TIER_ICON  = { basic: '⚡', premium: '🌟', vip: '👑' }
const TIER_PERKS: Record<string, string[]> = {
  basic:   ['2 séances / semaine', 'Réservation en ligne', 'QR code check-in'],
  premium: ['Séances illimitées', 'Réservation prioritaire', 'QR code check-in', 'Accès toutes disciplines'],
  vip:     ['Séances illimitées', 'Accès solo prioritaire', 'QR code check-in', 'Accès toutes disciplines', 'Support prioritaire'],
}

export default function MemberAbonnementScreen() {
  const { data: sub, isLoading: loadSub, refetch: refSub } = useQuery({
    queryKey: ['my-abonnement'],
    queryFn: abonnementsService.getMine,
  })
  const { data: paiements = [], isLoading: loadPay, refetch: refPay } = useQuery({
    queryKey: ['my-paiements'],
    queryFn: paiementsService.getMine,
  })

  const isLoading = loadSub || loadPay
  const refetch = () => { refSub(); refPay() }

  const today  = new Date()
  const daysLeft = sub ? differenceInDays(new Date(sub.date_fin), today) : null
  const subColor = sub ? (TIER_COLOR[sub.type as keyof typeof TIER_COLOR] ?? Colors.blue) : Colors.textMuted
  const subIcon  = sub ? (TIER_ICON[sub.type as keyof typeof TIER_ICON]  ?? '⚡') : ''
  const perks    = sub ? (TIER_PERKS[sub.type] ?? []) : []
  const expired  = daysLeft !== null && daysLeft < 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.blue} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mon Abonnement</Text>
        </View>

        {/* Subscription card */}
        {sub ? (
          <View style={styles.section}>
            <Card style={[styles.subCard, { borderColor: subColor + '40' }]}>
              <LinearGradient
                colors={[subColor + '22', 'transparent']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Tier header */}
              <View style={styles.subHeader}>
                <View style={[styles.tierBadge, { backgroundColor: subColor + '33', borderColor: subColor }]}>
                  <Text style={[styles.tierText, { color: subColor }]}>{subIcon} {sub.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sub.is_paid && !expired ? Colors.success + '22' : Colors.error + '22', borderColor: sub.is_paid && !expired ? Colors.success : Colors.error }]}>
                  <Text style={[styles.statusText, { color: sub.is_paid && !expired ? Colors.success : Colors.error }]}>
                    {expired ? '● Expiré' : sub.is_paid ? '● Actif' : '● Non payé'}
                  </Text>
                </View>
              </View>

              {/* Dates */}
              <View style={styles.datesRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>Début</Text>
                  <Text style={styles.dateValue}>{format(new Date(sub.date_debut), 'd MMM yyyy', { locale: fr })}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateBox}>
                  <Text style={styles.dateLabel}>Fin</Text>
                  <Text style={[styles.dateValue, expired && { color: Colors.error }]}>
                    {format(new Date(sub.date_fin), 'd MMM yyyy', { locale: fr })}
                  </Text>
                </View>
              </View>

              {/* Days left */}
              {daysLeft !== null && (
                <View style={styles.daysLeftBox}>
                  {expired ? (
                    <Text style={[styles.daysLeftText, { color: Colors.error }]}>Abonnement expiré</Text>
                  ) : daysLeft <= 7 ? (
                    <Text style={[styles.daysLeftText, { color: Colors.warning }]}>⚠️ {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</Text>
                  ) : (
                    <Text style={styles.daysLeftText}>{daysLeft} jours restants</Text>
                  )}
                  {/* Progress bar */}
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, {
                      width: `${Math.max(0, Math.min(100, daysLeft / differenceInDays(new Date(sub.date_fin), new Date(sub.date_debut)) * 100))}%` as any,
                      backgroundColor: expired ? Colors.error : daysLeft <= 7 ? Colors.warning : subColor,
                    }]} />
                  </View>
                </View>
              )}

              {/* Perks */}
              <View style={styles.perksSection}>
                <Text style={styles.perksTitle}>Inclus dans votre abonnement</Text>
                {perks.map((p, i) => (
                  <View key={i} style={styles.perkRow}>
                    <Text style={[styles.perkDot, { color: subColor }]}>✓</Text>
                    <Text style={styles.perkText}>{p}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {(expired || !sub.is_paid) && (
              <View style={styles.renewBox}>
                <Text style={styles.renewText}>Contactez votre club pour renouveler ou activer votre abonnement.</Text>
                <Text style={styles.renewSub}>📞 Demandez à l'administration</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Card style={styles.noSubCard}>
              <Text style={styles.noSubIcon}>💳</Text>
              <Text style={styles.noSubTitle}>Aucun abonnement actif</Text>
              <Text style={styles.noSubText}>Contactez votre club pour souscrire à un abonnement.</Text>
            </Card>

            {/* Show tiers for reference */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>NOS OFFRES</Text>
            {Object.entries(TIER_PERKS).map(([tier, perks]) => {
              const color = TIER_COLOR[tier as keyof typeof TIER_COLOR]
              const icon  = TIER_ICON[tier as keyof typeof TIER_ICON]
              return (
                <Card key={tier} style={[styles.tierCard, { borderLeftColor: color, borderLeftWidth: 3 }]} elevated>
                  <View style={[styles.tierBadge, { backgroundColor: color + '22', borderColor: color, alignSelf: 'flex-start', marginBottom: 10 }]}>
                    <Text style={[styles.tierText, { color }]}>{icon} {tier.toUpperCase()}</Text>
                  </View>
                  {perks.map((p, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Text style={[styles.perkDot, { color }]}>✓</Text>
                      <Text style={styles.perkText}>{p}</Text>
                    </View>
                  ))}
                </Card>
              )
            })}
          </View>
        )}

        {/* Payment history */}
        {paiements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>HISTORIQUE PAIEMENTS</Text>
            {paiements.map((p: any) => {
              const sc = p.statut === 'paid' ? Colors.success : p.statut === 'failed' ? Colors.error : Colors.warning
              return (
                <Card key={p.id} style={styles.payCard} elevated>
                  <View style={styles.payRow}>
                    <View>
                      <Text style={styles.payAmount}>{p.montant.toFixed(2)} €</Text>
                      {p.description && <Text style={styles.payDesc}>{p.description}</Text>}
                      <Text style={styles.payDate}>{p.created_at?.slice(0, 10)}</Text>
                    </View>
                    <View style={[styles.tierBadge, { backgroundColor: sc + '22', borderColor: sc }]}>
                      <Text style={[styles.tierText, { color: sc }]}>{p.statut}</Text>
                    </View>
                  </View>
                </Card>
              )
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:        { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  title:         { color: Colors.textPrimary, fontSize: 28, fontWeight: '900' },
  section:       { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel:  { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  subCard:       { borderWidth: 1, gap: 16, overflow: 'hidden' },
  subHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierBadge:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierText:      { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  statusBadge:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusText:    { fontSize: 12, fontWeight: '700' },
  datesRow:      { flexDirection: 'row', alignItems: 'center' },
  dateBox:       { flex: 1, alignItems: 'center', gap: 4 },
  dateDivider:   { width: 1, height: 30, backgroundColor: Colors.border },
  dateLabel:     { color: Colors.textMuted, fontSize: 11 },
  dateValue:     { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  daysLeftBox:   { gap: 8 },
  daysLeftText:  { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  progressBg:    { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },
  perksSection:  { gap: 8 },
  perksTitle:    { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  perkRow:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  perkDot:       { fontSize: 13, fontWeight: '800', marginTop: 1 },
  perkText:      { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  renewBox:      { backgroundColor: Colors.warning + '15', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: Colors.warning + '40', gap: 6 },
  renewText:     { color: Colors.warning, fontSize: 13, fontWeight: '600' },
  renewSub:      { color: Colors.textMuted, fontSize: 12 },
  noSubCard:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
  noSubIcon:     { fontSize: 48 },
  noSubTitle:    { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  noSubText:     { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  tierCard:      { marginBottom: 12, gap: 8 },
  payCard:       { marginBottom: 8 },
  payRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  payAmount:     { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  payDesc:       { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  payDate:       { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
})
