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

  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // 🔥 LOGIN
  login: async (email, password) => {
    set({ isLoading: true })

    try {
      await authService.login({ email, mot_de_passe: password })

      const user = await authService.me()

      if (!user) throw new Error('User not found')

      set({
        user,
        isAuthenticated: true,
      })

      return user
    } catch (e) {
      set({
        user: null,
        isAuthenticated: false,
      })
      throw e
    } finally {
      set({ isLoading: false })
    }
  },

  // 🔥 LOGOUT
  logout: async () => {
    await removeToken()
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  // 🔥 LOAD USER (APP START)
  loadUser: async () => {
    set({ isLoading: true })

    try {
      const user = await authService.me()

      set({
        user,
        isAuthenticated: !!user,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      })
    } finally {
      set({ isLoading: false })
    }
  },
}))