import { defineStore } from 'pinia'
import { translate } from '@/api/endpoints'

export const useTranslationStore = defineStore('translation', {
  state: () => ({
    cache: {},   // { [lang]: { [key]: value } }
    pending: {}, // { [lang::key]: Promise }
  }),
  actions: {
    ensureBucket(lang) {
      if (!this.cache[lang]) this.cache[lang] = {}
    },
    set(lang, key, value) {
      this.ensureBucket(lang)
      this.cache[lang][key] = value
    },
    get(key, lang) {
      return this.cache[lang]?.[key]
    },
    async fetch(key, lang) {
      const id = `${lang}::${key}`
      if (this.pending[id]) return this.pending[id]
      this.ensureBucket(lang)
      const p = (async () => {
        try {
          const { data } = await translate(key, lang)
          const value = (data && typeof data.value === 'string' && data.value) || key
          this.set(lang, key, value)
          return value
        } catch {
          this.set(lang, key, key)
          return key
        } finally {
          delete this.pending[id]
        }
      })()
      this.pending[id] = p
      return p
    },
    clearLang(lang) { delete this.cache[lang] },
    clearAll() { this.cache = {} },
  },
})
