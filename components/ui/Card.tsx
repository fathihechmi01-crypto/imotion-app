import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  elevated?: boolean
  glow?: 'blue' | 'gold' | 'none'
}

export function Card({ children, style, elevated, glow = 'none' }: Props) {
  const glowStyle =
    glow === 'blue'
      ? { shadowColor: Colors.blue, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
      : glow === 'gold'
        ? { shadowColor: Colors.gold, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
        : {}

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        glowStyle,
        style, // ✅ now supports array
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.surfaceHigh,
  },
})