import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { categories as categoriesApi, countries as countriesApi } from '@/api/endpoints'

const TASHKENT_DEFAULT_PARENT = 196

const localizedName = (raw, lang) => {
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  return raw[lang] || raw.default || Object.values(raw)[0] || ''
}

export function pickCatIcon(name) {
  const n = String(name || '').toLowerCase()
  if (n.includes('электр') || n.includes('elektr')) return '⚡'
  if (n.includes('сантех') || n.includes('santex') || n.includes('suvoq')) return '🔧'
  if (n.includes('строит') || n.includes('quril')) return '🧱'
  if (n.includes('столяр') || n.includes('duradgor') || n.includes('yog')) return '🪚'
  if (n.includes('маляр') || n.includes("bo'yoq") || n.includes('boyoq')) return '🖌️'
  if (n.includes('кузнец') || n.includes('temir')) return '🛠️'
  if (n.includes('водит') || n.includes('hayd')) return '🚗'
  if (n.includes('конди') || n.includes('kondi')) return '❄️'
  if (n.includes('компью') || n.includes('kompy')) return '💻'
  if (n.includes('швея') || n.includes('tikuv')) return '🧵'
  if (n.includes('повар') || n.includes('oshpaz')) return '👨‍🍳'
  return '🛠️'
}

export function fmtPrice(n) {
  if (n == null || n === '') return ''
  try { return new Intl.NumberFormat('ru-RU').format(Number(n)) } catch { return String(n) }
}

export function useCategories() {
  const { locale } = useI18n()
  const cats = ref([])
  const loading = ref(false)
  const load = async () => {
    loading.value = true
    try {
      const { data } = await categoriesApi.active(locale.value)
      cats.value = (data?.data || []).map((c) => ({
        id: c.id,
        name: localizedName(c.name, locale.value),
        icon: pickCatIcon(c.name?.default || c.name),
        is_active: c.is_active,
      }))
    } catch { cats.value = [] } finally { loading.value = false }
  }
  watch(locale, load)
  return { cats, loadingCats: loading, loadCategories: load }
}

export function useRegions() {
  const { locale } = useI18n()
  const regions = ref([])
  const districts = ref([])
  const mahallas = ref([])

  let _regionId = null
  let _districtId = null

  const map = (rows) => (rows || []).map((r) => ({ id: r.id, name: localizedName(r.name, locale.value) }))

  const loadRegions = async () => {
    try {
      const { data } = await countriesApi.active(TASHKENT_DEFAULT_PARENT, locale.value)
      regions.value = map(data?.data)
    } catch { regions.value = [] }
  }
  const loadDistricts = async (regionId) => {
    _regionId = regionId ?? null
    if (!regionId) { districts.value = []; mahallas.value = []; _districtId = null; return }
    try {
      const { data } = await countriesApi.active(regionId, locale.value)
      districts.value = map(data?.data)
    } catch { districts.value = [] }
  }
  const loadMahallas = async (districtId) => {
    _districtId = districtId ?? null
    if (!districtId) { mahallas.value = []; return }
    try {
      const { data } = await countriesApi.active(districtId, locale.value)
      mahallas.value = map(data?.data)
    } catch { mahallas.value = [] }
  }

  // When locale changes, re-fetch everything using the currently selected IDs.
  watch(locale, async () => {
    await loadRegions()
    if (_regionId)   await loadDistricts(_regionId)
    if (_districtId) await loadMahallas(_districtId)
  })

  return { regions, districts, mahallas, loadRegions, loadDistricts, loadMahallas }
}

export { localizedName }
