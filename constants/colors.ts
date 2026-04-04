export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────
  blue:       '#29ABE2',   // electric blue — "i" logo, primary action
  blueDark:   '#1A7FAD',   // pressed / darker blue
  blueLight:  '#5EC4EE',   // highlights, glows
  blueDim:    'rgba(41,171,226,0.15)',

  silver:     '#8A8A8A',   // "motion" text
  silverLight:'#B8B8B8',
  silverDim:  'rgba(138,138,138,0.2)',

  gold:       '#C9A96E',   // "club" accent
  goldLight:  '#E2C896',
  goldDim:    'rgba(201,169,110,0.15)',

  // ── Background ─────────────────────────────────────────────────────
  black:      '#0A0A0A',   // base background
  surface:    '#141414',   // cards, modals
  surfaceHigh:'#1E1E1E',   // elevated cards
  border:     '#2A2A2A',   // subtle borders
  borderLight:'#333333',

  // ── Text ───────────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted:     '#606060',

  // ── Sport tags ─────────────────────────────────────────────────────
  ems:       '#29ABE2',   // blue
  cardio:    '#E25A29',   // orange-red
  musculation:'#29E27A',  // green

  // ── State ──────────────────────────────────────────────────────────
  success:   '#29E27A',
  warning:   '#E2A829',
  error:     '#E22929',
  info:      '#29ABE2',
} as const

export const SportColors: Record<string, string> = {
  EMS:          Colors.ems,
  Cardio:       Colors.cardio,
  Musculation:  Colors.musculation,
}