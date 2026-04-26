import { useI18n } from 'vue-i18n'
import { useLanguagesStore } from '@/stores/languages'

export function useFormat() {
  const { locale } = useI18n()
  const langStore = useLanguagesStore()

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const fmtPrice = (n) => {
    if (n == null) return '—'
    return new Intl.NumberFormat('ru-RU').format(n)
  }

  // Multilang JSONB field: prefer URL/i18n active locale, then default,
  // then any active language, then any other key.
  const localized = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    const lang = locale.value
    if (obj[lang]) return obj[lang]
    if (obj.default) return obj.default
    for (const l of langStore.list) if (obj[l.code]) return obj[l.code]
    const v = Object.values(obj).find(Boolean)
    return v || ''
  }

  return { fmtDate, fmtPrice, localized }
}
