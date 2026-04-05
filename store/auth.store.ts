import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import { removeToken } from '@/services/api'

interface User {
  id: number
  nom: string
  email: string
  telephone?: string
  is_admin: number
  photo_url?: string
  objectif?: string
  poids?: number
  taille?: number
  no_show_count: number
  is_flagged: boolean
  abonnement?: any
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      await authService.login({ email, mot_de_passe: password })
      const user = await authService.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: async () => {
    await removeToken()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  loadUser: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))