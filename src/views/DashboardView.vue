<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as api from '@/api/endpoints'
import { useFormat } from '@/composables/useFormat'
import PageHeader from '@/components/ui/PageHeader.vue'

const { fmtCount } = useFormat()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const go = (path) => router.push(`/${route.params.lang || 'ru'}/${path}`)

const cards = ref([
  { key: 'users',        title: 'Пользователи', path: 'users',        endpoint: api.users,        icon: '☻', accent: 'a' },
  { key: 'vacancies',    title: 'Вакансии',     path: 'vacancies',    endpoint: api.vacancies,    icon: '✦', accent: 'b' },
  { key: 'resumes',      title: 'Резюме',       path: 'resumes',      endpoint: api.resumes,      icon: '☰', accent: 'c' },
  { key: 'categories',   title: 'Категории',    path: 'categories',   endpoint: api.categories,   icon: '▤', accent: 'd' },
  { key: 'countries',    title: 'Страны',       path: 'countries',    endpoint: api.countries,    icon: '◉', accent: 'a' },
  { key: 'languages',    title: 'Языки',        path: 'languages',    endpoint: api.languages,    icon: '⌘', accent: 'b' },
  { key: 'translations', title: 'Переводы',     path: 'translations', endpoint: api.translations, icon: '↹', accent: 'c' },
])
const counts = ref({})
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await Promise.all(
    cards.value.map(async (c) => {
      try {
        const { data } = await c.endpoint.count()
        counts.value[c.key] = data?.total ?? 0
      } catch {
        counts.value[c.key] = '—'
      }
    }),
  )
  loading.value = false
})
</script>

<template>
  <div class="page">
    <PageHeader title="Главная" subtitle="Обзор основных показателей">
      <template #actions>
        <button class="btn btn-ghost" @click="$router.go(0)">{{ $tt('Обновить') }}</button>
      </template>
    </PageHeader>

    <div class="card">
      <div class="row" style="gap: 12px; align-items: center;">
        <div class="avatar avatar-lg">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
          <span v-else>{{ (auth.user?.full_name || '?').slice(0,1) }}</span>
        </div>
        <div>
          <div class="dim">{{ $tt('Добро пожаловать') }},</div>
          <div class="h2">{{ auth.user?.full_name || '—' }}</div>
          <div class="muted" style="font-size: 13px;">{{ auth.user?.phone }} · {{ auth.user?.role }}</div>
        </div>
      </div>
    </div>

    <div class="kpi-grid">
      <button
        v-for="c in cards"
        :key="c.key"
        class="kpi"
        :class="`kpi-${c.accent}`"
        @click="go(c.path)"
      >
        <div class="row-between" style="width: 100%;">
          <div>
            <div class="kpi-label">{{ $tt(c.title) }}</div>
            <div class="kpi-value">
              <span v-if="loading">…</span>
              <span v-else>{{ fmtCount(counts[c.key]) }}</span>
            </div>
          </div>
          <div class="kpi-icon">{{ c.icon }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.kpi {
  text-align: left;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 18px;
  display: flex; align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease;
  color: inherit;
  position: relative;
  overflow: hidden;
}
.kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--c-border-strong); }
.kpi-label { color: var(--c-text-muted); font-size: 13px; font-weight: 500; }
.kpi-value { font-size: 28px; font-weight: 700; margin-top: 2px; color: var(--c-text); }
.kpi-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.kpi-a .kpi-icon { background: var(--c-accent-soft); color: var(--c-accent); }
.kpi-b .kpi-icon { background: var(--c-success-soft); color: var(--c-success); }
.kpi-c .kpi-icon { background: var(--c-warn-soft); color: var(--c-warn); }
.kpi-d .kpi-icon { background: var(--c-info-soft); color: var(--c-info); }
</style>
