<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { clientResumes, clientVacancies } from '@/api/endpoints'
import { tt } from '@/composables/useTt'
import AdCard from '@/components/public/AdCard.vue'
import FilterSidebar from '@/components/public/FilterSidebar.vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()

const tab = ref(route.query.tab === 'vacancies' ? 'vacancies' : 'resumes')

const heroQuery = ref(String(route.query.search || ''))
const filter = reactive({
  category_ids: [],
  region_id: null,
  district_id: null,
  mahalla_id: null,
  min_price: '',
  max_price: '',
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

const resumesCount = ref(null)
const vacanciesCount = ref(null)
const countingResumes = ref(false)
const countingVacancies = ref(false)
let countSeq = 0

const apiFor = computed(() => tab.value === 'vacancies' ? clientVacancies : clientResumes)

const sortPair = computed(() => {
  switch (sortValue.value) {
    case 'price-asc':   return { sort_by: 'price', sort_order: 'asc' }
    case 'price-desc':  return { sort_by: 'price', sort_order: 'desc' }
    case 'experience':  return { sort_by: 'experience_year', sort_order: 'desc' }
    default:            return { sort_by: 'id', sort_order: 'desc' }
  }
})

const buildCommonFilter = () => {
  const p = {}
  if (filter.search) p.search = filter.search
  if (filter.region_id) p.region_id = filter.region_id
  if (filter.district_id) p.district_id = filter.district_id
  if (filter.mahalla_id) p.mahalla_id = filter.mahalla_id
  if (filter.min_price) p.min_price = Number(filter.min_price)
  if (filter.max_price) p.max_price = Number(filter.max_price)
  if (filter.is_active) p.is_active = true
  if ((filter.category_ids || []).length) p.category_ids = filter.category_ids.join(',')
  return p
}

const buildResumeFilter = () => {
  const p = buildCommonFilter()
  if (filter.min_experience) p.min_experience = Number(filter.min_experience)
  return p
}

const buildListParams = () => {
  const p = tab.value === 'resumes' ? buildResumeFilter() : buildCommonFilter()
  p.limit = limit
  Object.assign(p, sortPair.value)
  if (cursor.value) p.cursor = cursor.value
  return p
}

const load = async (append = false) => {
  loading.value = true
  try {
    const { data } = await apiFor.value.list(buildListParams())
    const rows = data?.data || []
    items.value = append ? items.value.concat(rows) : rows
    hasMore.value = !!data?.meta?.has_more
    cursor.value = data?.meta?.next_cursor || ''
  } catch { if (!append) items.value = [] } finally { loading.value = false }
}

const loadCounts = () => {
  const seq = ++countSeq
  countingResumes.value = true
  countingVacancies.value = true

  clientResumes.count(buildResumeFilter())
    .then(({ data }) => { if (seq === countSeq) resumesCount.value = Number(data?.total ?? 0) })
    .catch(() => { if (seq === countSeq) resumesCount.value = null })
    .finally(() => { if (seq === countSeq) countingResumes.value = false })

  clientVacancies.count(buildCommonFilter())
    .then(({ data }) => { if (seq === countSeq) vacanciesCount.value = Number(data?.total ?? 0) })
    .catch(() => { if (seq === countSeq) vacanciesCount.value = null })
    .finally(() => { if (seq === countSeq) countingVacancies.value = false })
}

const resetAndReload = () => {
  cursor.value = ''
  load(false)
  loadCounts()
}

const setTab = (v) => {
  if (tab.value === v) return
  tab.value = v
  router.replace({ query: { ...route.query, tab: v } })
  cursor.value = ''
  load(false)
}

const submitHero = () => {
  filter.search = heroQuery.value.trim()
  router.replace({ query: { ...route.query, search: filter.search || undefined } })
  resetAndReload()
}

const clearHero = () => {
  if (!heroQuery.value && !filter.search) return
  heroQuery.value = ''
  filter.search = ''
  router.replace({ query: { ...route.query, search: undefined } })
  resetAndReload()
}

watch(() => route.query.search, (v) => {
  const next = String(v || '')
  if (heroQuery.value !== next) heroQuery.value = next
  if (filter.search !== next) { filter.search = next; resetAndReload() }
})
watch(() => route.query.tab, (v) => {
  const next = v === 'vacancies' ? 'vacancies' : 'resumes'
  if (tab.value !== next) { tab.value = next; cursor.value = ''; load(false) }
})

onMounted(() => { load(false); loadCounts() })

const onFilterChange = () => resetAndReload()
const onFilterReset = () => {
  heroQuery.value = ''
  if (route.query.search) router.replace({ query: { ...route.query, search: undefined } })
}
const onSortChange = () => { cursor.value = ''; load(false) }

const itemsLabel = computed(() => tab.value === 'resumes' ? tt('мастеров найдено') : tt('вакансий найдено'))
const activeCount = computed(() => tab.value === 'resumes' ? resumesCount.value : vacanciesCount.value)
const fmtCount = (n) => (n == null ? '' : n.toLocaleString('ru-RU'))
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="p-container hero-inner">
        <h1 class="hero-title">{{ tt('Найдите лучших мастеров и работу в Узбекистане') }}</h1>
        <p class="hero-sub">{{ tt('Электрики, сантехники, строители и сотни специалистов в одном месте') }}</p>
        <form class="hero-search" @submit.prevent="submitHero">
          <div class="hero-input-wrap">
            <input v-model="heroQuery" type="text" class="hero-input" :placeholder="tt('Введите ключевое слово…')" />
            <button v-if="heroQuery" type="button" class="hero-clear" :aria-label="tt('Очистить')" @click="clearHero">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <button type="submit" class="hero-btn">
            <span class="hero-btn-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <span>{{ tt('Поиск') }}</span>
          </button>
        </form>
      </div>
    </section>

    <section class="p-container stats">
      <button class="stat-card" :class="{ active: tab === 'resumes' }" @click="setTab('resumes')">
        <span class="stat-icon">⚙</span>
        <div class="stat-text">
          <span class="stat-num">
            <span v-if="resumesCount === null && countingResumes" class="stat-num-skel" />
            <template v-else>{{ fmtCount(resumesCount) || '—' }}</template>
          </span>
          <span class="stat-label">{{ tt('Мастера / Специалисты') }}</span>
        </div>
        <span class="stat-arrow">›</span>
      </button>
      <button class="stat-card" :class="{ active: tab === 'vacancies' }" @click="setTab('vacancies')">
        <span class="stat-icon stat-icon-warm">💼</span>
        <div class="stat-text">
          <span class="stat-num">
            <span v-if="vacanciesCount === null && countingVacancies" class="stat-num-skel" />
            <template v-else>{{ fmtCount(vacanciesCount) || '—' }}</template>
          </span>
          <span class="stat-label">{{ tt('Вакансии') }}</span>
        </div>
        <span class="stat-arrow">›</span>
      </button>
    </section>

    <section class="p-container body-grid">
      <FilterSidebar v-model="filter" :show-experience="tab === 'resumes'" @change="onFilterChange" @reset="onFilterReset" />

      <div class="results">
        <div class="results-head">
          <span class="results-count">
            <strong v-if="activeCount != null">{{ fmtCount(activeCount) }}</strong>
            <strong v-else>{{ items.length }}</strong>
            <span class="p-muted">{{ ' ' }}{{ itemsLabel }}</span>
          </span>
          <select class="p-select sort-select" v-model="sortValue" @change="onSortChange">
            <option value="id-desc">{{ tt('По умолчанию') }}</option>
            <option value="price-asc">{{ tt('По цене: возрастание') }}</option>
            <option value="price-desc">{{ tt('По цене: убывание') }}</option>
            <option v-if="tab === 'resumes'" value="experience">{{ tt('По опыту') }}</option>
          </select>
        </div>

        <div v-if="loading && !items.length" class="p-empty">
          <div class="p-spinner" />
          <span>{{ tt('Загрузка…') }}</span>
        </div>
        <div v-else-if="!items.length" class="p-empty">
          <div class="p-empty-icon">∅</div>
          <span>{{ tt('Ничего не найдено') }}</span>
        </div>

        <div v-else class="p-cards">
          <AdCard v-for="it in items" :key="it.id" :item="it" :kind="tab === 'vacancies' ? 'vacancy' : 'resume'" />
        </div>

        <div v-if="hasMore" class="load-more-row">
          <button class="p-btn p-btn-ghost load-more-btn" @click="load(true)" :disabled="loading">
            <span v-if="loading" class="p-spinner p-spinner-sm" />
            <span>{{ tt('Показать ещё') }}</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  background: linear-gradient(135deg, var(--p-brand-strong) 0%, var(--p-brand-deep) 100%);
  color: #fff;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 90% 0%, rgba(255,255,255,.15), transparent 40%),
    radial-gradient(circle at 0% 100%, rgba(255,255,255,.10), transparent 40%);
  pointer-events: none;
}
.hero-inner { position: relative; padding: clamp(48px, 8vw, 96px) clamp(16px, 3vw, 40px) clamp(56px, 9vw, 110px); }
.hero-title {
  font-size: clamp(28px, 4.4vw, 56px); line-height: 1.1; font-weight: 800;
  letter-spacing: -.02em; margin: 0 0 14px; max-width: 920px;
}
.hero-sub { font-size: clamp(14px, 1.4vw, 18px); color: rgba(255,255,255,.85); margin: 0 0 32px; max-width: 760px; }
.hero-search {
  display: grid; grid-template-columns: 1fr auto; gap: 12px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.20);
  padding: 8px; border-radius: 16px; max-width: 720px;
  backdrop-filter: blur(6px);
}
.hero-input-wrap { position: relative; display: flex; align-items: center; }
.hero-input {
  width: 100%;
  height: 48px; padding: 0 44px 0 18px;
  border-radius: 10px; border: 0;
  background: rgba(255,255,255,.15); color: #fff;
  font-size: 15px; outline: none;
}
.hero-input::placeholder { color: rgba(255,255,255,.7); }
.hero-input:focus { background: rgba(255,255,255,.22); }
.hero-input::-webkit-search-cancel-button,
.hero-input::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
.hero-clear {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px; border: 0; border-radius: 50%;
  background: rgba(255,255,255,.18); color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0; transition: background .15s;
}
.hero-clear:hover { background: rgba(255,255,255,.32); }
.hero-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 22px; height: 48px; border-radius: 10px;
  background: var(--p-brand); color: #fff; border: 0;
  font-weight: 600; font-size: 15px; cursor: pointer;
  transition: background .15s, transform .05s;
}
.hero-btn:hover { background: var(--p-brand-strong); }
.hero-btn:active { transform: translateY(1px); }
.hero-btn-icon { display: inline-flex; }

.stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin: clamp(-40px, -6vw, -64px) auto 0;
  position: relative; z-index: 2;
}
.stat-card {
  display: flex; align-items: center; gap: 18px;
  padding: 22px 24px;
  background: var(--p-surface); border: 1px solid var(--p-border);
  border-radius: 16px; box-shadow: var(--p-shadow-md);
  cursor: pointer; transition: transform .15s, box-shadow .15s, background .15s, color .15s;
  text-align: left; width: 100%; font-family: inherit; color: var(--p-text);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(15,23,42,.10); }
.stat-card.active { background: var(--p-brand); border-color: var(--p-brand); color: #fff; }
.stat-card.active .stat-arrow { color: rgba(255,255,255,.85); }
.stat-card.active .stat-label { color: rgba(255,255,255,.85); }
.stat-card.active .stat-icon { background: rgba(255,255,255,.18); color: #fff; }

.stat-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: rgba(37,83,255,.10); color: var(--p-brand);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}
.stat-icon-warm { background: var(--p-warn-soft); color: var(--p-warn); }
.stat-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.stat-num { font-size: clamp(28px, 3vw, 36px); font-weight: 800; line-height: 1.1; min-height: 1.1em; display: inline-flex; align-items: center; }
.stat-num-skel {
  display: inline-block; width: 64px; height: .9em; border-radius: 6px;
  background: linear-gradient(90deg, rgba(15,23,42,.06), rgba(15,23,42,.12), rgba(15,23,42,.06));
  background-size: 200% 100%;
  animation: stat-skel 1.1s ease-in-out infinite;
}
.stat-card.active .stat-num-skel {
  background: linear-gradient(90deg, rgba(255,255,255,.18), rgba(255,255,255,.32), rgba(255,255,255,.18));
  background-size: 200% 100%;
}
@keyframes stat-skel {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.stat-label { font-size: 14px; color: var(--p-text-muted); }
.stat-arrow { font-size: 24px; color: var(--p-text-dim); }

.body-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; margin-top: 32px; padding-bottom: 24px; }

.results { min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.results-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.results-count { color: var(--p-text-muted); font-size: 14px; }
.results-count strong { color: var(--p-text); font-weight: 700; }
.sort-select { width: auto; min-width: 200px; }

.load-more-row { display: flex; justify-content: center; padding: 12px 0 0; }
.load-more-btn { min-width: 200px; }

@media (max-width: 1024px) {
  .body-grid { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr; }
}
@media (max-width: 540px) {
  .hero-search { grid-template-columns: 1fr; }
  .hero-btn { height: 44px; }
  .stat-card { padding: 16px; gap: 12px; }
  .stat-icon { width: 48px; height: 48px; font-size: 22px; }
  .sort-select { min-width: 0; width: 100%; }
}
@media (min-width: 1600px) {
  .body-grid { grid-template-columns: 300px 1fr; gap: 32px; }
}
</style>
