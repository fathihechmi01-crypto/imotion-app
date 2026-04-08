import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants/colors'

interface Props {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, size = 'md' }: Props) {
  const sizeStyle = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.base, sizeStyle, style]}>
        <LinearGradient colors={[Colors.blueLight, Colors.blue, Colors.blueDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.textPrimary}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  if (variant === 'gold') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[styles.base, sizeStyle, style]}>
        <LinearGradient colors={[Colors.goldLight, Colors.gold]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          {loading
            ? <ActivityIndicator color="#0A0A0A" />
            : <Text style={[styles.textPrimary, { color: '#0A0A0A' }]}>{title}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const variantStyles = {
    secondary: { bg: Colors.surfaceHigh, text: Colors.textPrimary, border: Colors.border },
    ghost:     { bg: 'transparent',      text: Colors.blue,         border: Colors.blue },
    danger:    { bg: Colors.error + '20',text: Colors.error,        border: Colors.error },
  }[variant] ?? { bg: Colors.surfaceHigh, text: Colors.textPrimary, border: Colors.border }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, sizeStyle, {
        backgroundColor: variantStyles.bg,
        borderColor: variantStyles.border,
        borderWidth: 1,
        opacity: disabled ? 0.5 : 1,
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={variantStyles.text} />
        : <Text style={[styles.textPrimary, { color: variantStyles.text }]}>{title}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base:        { borderRadius: 12, overflow: 'hidden' },
  gradient:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  sm:          { height: 36 },
  md:          { height: 50 },
  lg:          { height: 58 },
  textPrimary: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
})
