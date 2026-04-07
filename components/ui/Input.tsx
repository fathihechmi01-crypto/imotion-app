import React, { useState } from 'react'
import { View, TextInput, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'

interface Props {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (t: string) => void
  secureTextEntry?: boolean
  keyboardType?: any
  error?: string
  style?: StyleProp<ViewStyle>
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  editable?: boolean
}

export function Input({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, error, style, autoCapitalize = 'none', editable }: Props) {
  const [focused, setFocused] = useState(false)
  const [shown, setShown] = useState(false)

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, focused && styles.focused, !!error && styles.errored]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !shown}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable ?? true}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShown(!shown)} style={styles.eye}>
            <Text style={styles.eyeText}>{shown ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper:    { gap: 6 },
  label:      { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  container:  {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  focused:    { borderColor: Colors.blue },
  errored:    { borderColor: Colors.error },
  input:      { flex: 1, height: 50, color: Colors.textPrimary, fontSize: 15 },
  eye:        { padding: 8 },
  eyeText:    { fontSize: 16 },
  error:      { color: Colors.error, fontSize: 12 },
})