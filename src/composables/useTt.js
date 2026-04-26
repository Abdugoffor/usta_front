import { i18n } from '@/i18n'
import { useTranslationStore } from '@/stores/translation'

const DEFAULT_LANG = 'ru'

/**
 * tt(key) — Translate a static UI string via backend /t endpoint.
 *
 * Keys are human-readable Russian strings. When current locale is Russian
 * (the platform default), the key is returned as-is with no network call.
 * Otherwise we look it up in the translations cache. On miss we trigger an
 * async fetch and return the key as fallback; once the cache fills, components
 * re-render through Pinia reactivity.
 *
 * Backend behaviour (/t?key=...&lang=...):
 *   - returns translation for `lang` if present
 *   - else returns `default` value
 *   - else returns the key itself
 */
export function tt(key) {
  if (key == null) return ''
  const k = String(key)
  const lang = i18n.global.locale.value || DEFAULT_LANG
  if (lang === DEFAULT_LANG) return k
  const store = useTranslationStore()
  const cached = store.get(k, lang)
  if (cached !== undefined) return cached
  store.fetch(k, lang)
  return k
}

export function installTt(app) {
  app.config.globalProperties.$tt = tt
}
