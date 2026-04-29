import { defineStore } from 'pinia'
import { languages } from '@/api/endpoints'

const FALLBACK = [{ code: 'ru', label: 'RU' }]

const labelOf = (code) => {
  const map = {
    uz: "O'zbekcha", ru: 'Русский', en: 'English',
    qq: 'Qaraqalpaq', kk: 'Qazaq', tg: 'Тоҷикӣ', tr: 'Türkçe',
  }
  return map[code] || code.toUpperCase()
}

// Shared promise so multiple simultaneous callers join the same request.
let _promise = null

export const useLanguagesStore = defineStore('languages', {
  state: () => ({
    active: [],
    loaded: false,
    loading: false,
  }),
  getters: {
    list:  (s) => s.active.length ? s.active : FALLBACK,
    codes: (s) => (s.active.length ? s.active : FALLBACK).map((l) => l.code),
    has:   (s) => (code) => (s.active.length ? s.active : FALLBACK).some((l) => l.code === code),
  },
  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return
      if (force) _promise = null
      if (_promise) return _promise

      this.loading = true
      _promise = languages.active()
        .then(({ data }) => {
          const rows = data?.data || []
          this.active = rows
            .map((r) => String(r.name || '').trim().toLowerCase())
            .filter(Boolean)
            .map((code) => ({ code, label: labelOf(code) }))
          this.loaded = true
        })
        .catch(() => {
          this.active = []
        })
        .finally(() => {
          this.loading = false
          _promise = null
        })

      return _promise
    },
    reset() { this.active = []; this.loaded = false; _promise = null },
  },
})
