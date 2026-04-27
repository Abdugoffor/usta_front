<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clientResumes } from '@/api/endpoints'
import { tt } from '@/composables/useTt'
import AdCard from '@/components/public/AdCard.vue'
import FilterSidebar from '@/components/public/FilterSidebar.vue'

const route = useRoute()
const router = useRouter()

const search = ref(String(route.query.search || ''))
const filter = reactive({
  category_ids: [],
  region_id: null, district_id: null, mahalla_id: null,
  min_price: '', max_price: '',
  min_experience: '',
  is_active: false,
  search: String(route.query.search || ''),
})
const sortValue = ref('id-desc')

const items = ref([])
const loading = ref(false)
const cursor = ref('')
const hasMore = ref(false)
const limit = 12

const sortPair = computed(() => {
  switch (sortValue.value) {
    case 'price-asc':  return { sort_by: 'price', sort_order: 'asc' }
    case 'price-desc': return { sort_by: 'price', sort_order: 'desc' }
    case 'experience': return { sort_by: 'experience_year', sort_order: 'desc' }
    default:           return { sort_by: 'id', sort_order: 'desc' }
  }
})

const buildParams = () => {
  const p = { limit, ...sortPair.value }
  if (cursor.value) p.cursor = cursor.value
  if (filter.search) p.search = filter.search
  if (filter.region_id) p.region_id = filter.region_id
  if (filter.district_id) p.district_id = filter.district_id
  if (filter.mahalla_id) p.mahalla_id = filter.mahalla_id
  if (filter.min_price) p.min_price = Number(filter.min_price)
  if (filter.max_price) p.max_price = Number(filter.max_price)
  if (filter.min_experience) p.min_experience = Number(filter.min_experience)
  if (filter.is_active) p.is_active = true
  if ((filter.category_ids || []).length) p.category_ids = filter.category_ids.join(',')
  return p
}

const load = async (append = false) => {
  loading.value = true
  try {
    const { data } = await clientResumes.list(buildParams())
    const rows = data?.data || []
    items.value = append ? items.value.concat(rows) : rows
    hasMore.value = !!data?.meta?.has_more
    cursor.value = data?.meta?.next_cursor || ''
  } catch { if (!append) items.value = [] } finally { loading.value = false }
}

const resetAndLoad = () => { cursor.value = ''; load(false) }

const submitSearch = () => {
  filter.search = search.value.trim()
  router.replace({ query: filter.search ? { search: filter.search } : {} })
  resetAndLoad()
}

watch(() => route.query.search, (v) => {
  const next = String(v || '')
  if (search.value !== next) search.value = next
  if (filter.search !== next) { filter.search = next; resetAndLoad() }
})

onMounted(load)
</script>

<template>
  <div class="p-page">
    <div class="p-container">
      <div class="page-head">
        <div>
          <h1 class="p-h1">{{ tt('Мастера') }}</h1>
          <p class="p-muted" style="margin: 4px 0 0;">{{ tt('Опытные специалисты в вашем регионе') }}</p>
        </div>
        <form class="page-search" @submit.prevent="submitSearch">
          <input v-model="search" type="search" class="p-input" :placeholder="tt('Поиск по мастерам…')" />
          <button type="submit" class="p-btn p-btn-primary">{{ tt('Поиск') }}</button>
        </form>
      </div>

      <div class="body-grid">
        <FilterSidebar v-model="filter" :show-experience="true" @change="resetAndLoad" />

        <div class="results">
          <div class="results-head">
            <span class="results-count">
              <strong>{{ items.length }}</strong>
              <span class="p-muted">{{ ' ' }}{{ tt('мастеров найдено') }}</span>
            </span>
            <select class="p-select sort-select" v-model="sortValue" @change="resetAndLoad">
              <option value="id-desc">{{ tt('По умолчанию') }}</option>
              <option value="price-asc">{{ tt('По цене: возрастание') }}</option>
              <option value="price-desc">{{ tt('По цене: убывание') }}</option>
              <option value="experience">{{ tt('По опыту') }}</option>
            </select>
          </div>

          <div v-if="loading && !items.length" class="p-empty"><div class="p-spinner" /><span>{{ tt('Загрузка…') }}</span></div>
          <div v-else-if="!items.length" class="p-empty"><div class="p-empty-icon">∅</div><span>{{ tt('Ничего не найдено') }}</span></div>

          <div v-else class="p-cards">
            <AdCard v-for="it in items" :key="it.id" :item="it" kind="resume" />
          </div>

          <div v-if="hasMore" class="load-more-row">
            <button class="p-btn p-btn-ghost" style="min-width: 200px;" @click="load(true)" :disabled="loading">
              <span v-if="loading" class="p-spinner p-spinner-sm" />
              <span>{{ tt('Показать ещё') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
.page-search { display: grid; grid-template-columns: minmax(200px, 360px) auto; gap: 8px; }

.body-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding-bottom: 60px; }
.results { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.results-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.results-count { color: var(--p-text-muted); font-size: 14px; }
.results-count strong { color: var(--p-text); font-weight: 700; }
.sort-select { width: auto; min-width: 200px; }
.load-more-row { display: flex; justify-content: center; padding: 20px 0 0; }

@media (max-width: 1024px) {
  .body-grid { grid-template-columns: 1fr; }
  .page-search { grid-template-columns: 1fr auto; }
}
@media (max-width: 540px) {
  .page-search { grid-template-columns: 1fr; }
  .sort-select { width: 100%; min-width: 0; }
}
@media (min-width: 1600px) {
  .body-grid { grid-template-columns: 300px 1fr; gap: 32px; }
}
</style>
