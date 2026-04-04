import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SportColors, Colors } from '@/constants/colors'

export function SportBadge({ sport }: { sport: string }) {
  const color = SportColors[sport] ?? Colors.silver
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{sport}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
})
