import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '@/store/auth.store'
import { Colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const TIER_COLORS: Record<string, string> = {
  basic: Colors.silver,
  premium: Colors.blue,
  vip: Colors.gold,
}

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuthStore()

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: logout },
    ])
  }

  // ✅ FIX: no more white screen
  if (isLoading || !user) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: 'white' }}>Chargement...</Text>
      </View>
    )
  }

  const sub = user.abonnement
  const subColor = sub ? TIER_COLORS[sub.type] ?? Colors.blue : Colors.textMuted
  const daysLeft = sub ? differenceInDays(new Date(sub.date_fin), new Date()) : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HERO */}
        <LinearGradient
          colors={['rgba(41,171,226,0.15)', 'transparent']}
          style={styles.heroGlow}
          pointerEvents="none"
        />

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <LinearGradient
              colors={[Colors.blueLight, Colors.blue, Colors.blueDark]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.avatarText}>
              {user.nom?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{user.nom}</Text>
          <Text style={styles.email}>{user.email}</Text>

          {user.is_flagged && (
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>
                ⚠️ Compte signalé ({user.no_show_count} absences)
              </Text>
            </View>
          )}
        </View>

        {/* SUBSCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ABONNEMENT</Text>

          <Card
            style={[styles.subCard, { borderColor: subColor + '40' }]}
            glow={sub?.type === 'vip' ? 'gold' : sub ? 'blue' : 'none'}
          >
            {sub ? (
              <>
                <View style={styles.subHeader}>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: subColor + '22', borderColor: subColor },
                    ]}
                  >
                    <Text style={[styles.tierText, { color: subColor }]}>
                      {sub.type.toUpperCase()}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.subStatus,
                      { color: sub.is_paid ? Colors.success : Colors.warning },
                    ]}
                  >
                    {sub.is_paid ? '● Actif' : '● En attente'}
                  </Text>
                </View>

                <Text style={styles.subDates}>
                  {format(new Date(sub.date_debut), 'd MMM', { locale: fr })} →
                  {format(new Date(sub.date_fin), 'd MMM yyyy', { locale: fr })}
                </Text>

                {daysLeft !== null && (
                  <Text
                    style={[
                      styles.daysLeft,
                      daysLeft < 7 && { color: Colors.warning },
                    ]}
                  >
                    {daysLeft > 0
                      ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
                      : 'Expiré'}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.center}>
                <Text style={styles.noSubText}>Aucun abonnement actif</Text>
                <Text style={styles.noSubSub}>
                  Contactez votre club pour souscrire
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* FITNESS */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MON PROFIL FITNESS</Text>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard} elevated>
              <Text style={styles.statValue}>
                {user.poids ? `${user.poids} kg` : '—'}
              </Text>
              <Text style={styles.statLabel}>Poids</Text>
            </Card>

            <Card style={styles.statCard} elevated>
              <Text style={styles.statValue}>
                {user.taille ? `${user.taille} cm` : '—'}
              </Text>
              <Text style={styles.statLabel}>Taille</Text>
            </Card>

            <Card style={[styles.statCard, { flex: 1 }]} elevated>
              <Text style={styles.statValue} numberOfLines={1}>
                {user.objectif ?? '—'}
              </Text>
              <Text style={styles.statLabel}>Objectif</Text>
            </Card>
          </View>
        </View>

        {/* CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT</Text>

          <Card elevated>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>
                {user.telephone ?? '—'}
              </Text>
            </View>
          </Card>
        </View>

        {/* LOGOUT */}
        <View style={styles.section}>
          <Button title="Se déconnecter" onPress={handleLogout} variant="danger" />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 28, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  email: { color: Colors.textMuted, fontSize: 14 },

  flagBadge: {
    backgroundColor: Colors.warning + '22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.warning,
  },

  flagText: { color: Colors.warning, fontSize: 12, fontWeight: '700' },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

  subCard: { gap: 8 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tierText: { fontWeight: '800', fontSize: 12 },

  subStatus: { fontSize: 13, fontWeight: '700' },
  subDates: { color: Colors.textSecondary, fontSize: 13 },
  daysLeft: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },

  noSubText: { color: Colors.textSecondary },
  noSubSub: { color: Colors.textMuted },

  center: { alignItems: 'center', gap: 6, paddingVertical: 10 },

  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },

  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 11 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: Colors.textSecondary },
  infoValue: { color: Colors.textPrimary, fontWeight: '600' },
})