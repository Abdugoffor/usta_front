import { defineStore } from 'pinia'
import { auth } from '@/api/endpoints'
import { extractError } from '@/api/client'

const loadUser = () => {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null') } catch { return null }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || '',
    user: loadUser(),
  }),
  getters: {
    isAuthed: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    clear() {
      this.token = ''
      this.user = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
    async login(payload) {
      try {
        const { data } = await auth.login(payload)
        this.setSession(data.token, data.user)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: extractError(e) }
      }
    },
    async register(payload) {
      try {
        const { data } = await auth.register(payload)
        this.setSession(data.token, data.user)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: extractError(e) }
      }
    },
    async loginViaTelegram(onDeepLink) {
      try {
        const { data } = await auth.telegramStart()
        if (typeof onDeepLink === 'function') onDeepLink(data.deep_link)
        const token = data.token

        for (let i = 0; i < 150; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          const { data: s } = await auth.telegramStatus(token)
          if (s.status === 'done') {
            this.setSession(s.jwt, s.user)
            return { ok: true }
          }
          if (s.status === 'expired') {
            return { ok: false, error: 'Telegram sessiyasi muddati tugadi' }
          }
        }
        return { ok: false, error: 'Vaqt tugadi, qaytadan urinib ko’ring' }
      } catch (e) {
        return { ok: false, error: extractError(e) }
      }
    },
    logout() { this.clear() },
  },
})
