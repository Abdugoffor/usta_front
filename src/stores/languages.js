import { defineStore } from 'pinia'
import { languages } from '@/api/endpoints'

const FALLBACK = [{ code: 'ru', label: 'Русский' }]

const labelOf = (code) => {
  const map = {
    uz: "O'zbekcha", ru: 'Русский', en: 'English',
    qq: 'Qaraqalpaq', kk: 'Qazaq', tg: 'Тоҷикӣ', tr: 'Türkçe',
  }
  return map[code] || code.toUpperCase()
}

export const useLanguagesStore = defineStore('languages', {
  state: () => ({
    active: [],
    loaded: false,
    loading: false,
  }),
  getters: {
    list: (s) => s.active.length ? s.active : FALLBACK,
    codes: (s) => (s.active.length ? s.active : FALLBACK).map((l) => l.code),
    has: (s) => (code) => (s.active.length ? s.active : FALLBACK).some((l) => l.code === code),
  },
  actions: {
    async fetch(force = false) {
      if (this.loading) return
      if (this.loaded && !force) return
      this.loading = true
      try {
        const { data } = await languages.active()
        const rows = data?.data || []
        this.active = rows
          .map((r) => String(r.name || '').trim().toLowerCase())
          .filter(Boolean)
          .map((code) => ({ code, label: labelOf(code) }))
        this.loaded = true
      } catch {
        this.active = []
      } finally {
        this.loading = false
      }
    },
    reset() { this.active = []; this.loaded = false },
  },
})
