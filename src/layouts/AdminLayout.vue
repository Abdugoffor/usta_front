<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLanguagesStore } from '@/stores/languages'
import { tt } from '@/composables/useTt'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const langs = useLanguagesStore()
const { locale } = useI18n()

const sidebarOpen = ref(false)

onMounted(() => { langs.fetch() })

const nav = computed(() => [
  { name: 'dashboard',    path: '',             label: 'Главная',          icon: '◧' },
  { name: 'users',        path: 'users',        label: 'Пользователи',     icon: '☻' },
  { name: 'languages',    path: 'languages',    label: 'Языки',            icon: '⌘' },
  { name: 'categories',   path: 'categories',   label: 'Категории',        icon: '▤' },
  { name: 'countries',    path: 'countries',    label: 'Страны',           icon: '◉' },
  { name: 'translations', path: 'translations', label: 'Переводы',         icon: '↹' },
  { name: 'vacancies',    path: 'vacancies',    label: 'Вакансии',         icon: '✦' },
  { name: 'resumes',      path: 'resumes',      label: 'Резюме',           icon: '☰' },
])

const linkFor = (item) => `/${locale.value}${item.path ? '/' + item.path : ''}`

const initials = computed(() => {
  const n = auth.user?.full_name || ''
  return n.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
})

const onLogout = () => {
  auth.logout()
  router.push(`/${locale.value}/auth/login`)
}

const change = (code) => {
  // Push the same path under a new locale prefix so URL becomes the source of truth.
  const tail = route.fullPath.replace(/^\/[a-z]{2}/, '')
  router.push(`/${code}${tail || '/'}`)
}

const isActive = (name) => route.name === name

const close = () => { sidebarOpen.value = false }

const navLabelByName = computed(() => {
  const m = {}
  for (const n of nav.value) m[n.name] = n.label
  return m
})

const themeTitle = computed(() => theme.mode === 'dark' ? 'Светлая тема' : 'Тёмная тема')
</script>

<template>
  <div class="shell" :class="{ 'sidebar-open': sidebarOpen }">
    <aside class="sidebar">
      <div class="sidebar-head">
        <div class="brand">
          <div class="brand-mark">U</div>
          <div>
            <div class="brand-title">Usta Admin</div>
            <div class="brand-sub">v1.0</div>
          </div>
        </div>
        <button class="btn btn-icon mobile-only" @click="close">×</button>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="n in nav"
          :key="n.name"
          :to="linkFor(n)"
          class="nav-item"
          :class="{ active: isActive(n.name) }"
          @click="close"
        >
          <span class="nav-icon">{{ n.icon }}</span>
          <span>{{ tt(n.label) }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-foot">
        <button class="btn btn-ghost" style="width: 100%;" @click="onLogout">
          <span>⤴</span>
          <span>{{ tt('Выйти') }}</span>
        </button>
      </div>
    </aside>

    <div class="backdrop" v-if="sidebarOpen" @click="close"></div>

    <div class="main">
      <header class="topbar">
        <div class="row" style="gap: 8px;">
          <button class="btn btn-icon mobile-only" @click="sidebarOpen = !sidebarOpen">≡</button>
          <div class="topbar-title">
            {{ tt(navLabelByName[route.name] || 'Главная') }}
          </div>
        </div>

        <div class="row" style="gap: 6px;">
          <select class="select" style="width: auto;" :value="locale" @change="(e) => change(e.target.value)">
            <option v-for="l in langs.list" :key="l.code" :value="l.code">{{ l.label }}</option>
          </select>
          <button class="btn btn-icon" :title="themeTitle" @click="theme.toggle()">
            <span v-if="theme.mode === 'dark'">☀</span>
            <span v-else>☾</span>
          </button>
          <div class="user-pill">
            <div class="avatar">
              <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="hidden-mobile">
              <div class="user-name">{{ auth.user?.full_name }}</div>
              <div class="user-role">{{ auth.user?.role }}</div>
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100%; }

.sidebar {
  background: var(--c-bg-2);
  border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column;
  padding: 18px 14px;
  position: sticky; top: 0; height: 100vh;
  z-index: 30;
}
.sidebar-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding: 0 6px; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--gradient-brand);
  color: #fff; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-md);
}
.brand-title { font-weight: 700; color: var(--c-text); font-size: 15px; }
.brand-sub { font-size: 11px; color: var(--c-text-muted); }

.nav { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; padding: 4px 0; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--c-text-muted);
  text-decoration: none;
  font-size: 14px; font-weight: 500;
  transition: all 0.15s ease;
}
.nav-item:hover { background: var(--c-surface); color: var(--c-text); text-decoration: none; }
.nav-item.active {
  background: var(--c-accent-soft);
  color: var(--c-accent);
}
.nav-icon { width: 18px; text-align: center; }

.sidebar-foot { margin-top: 12px; }

.main { display: flex; flex-direction: column; min-width: 0; }

.topbar {
  position: sticky; top: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 24px;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-border);
  z-index: 5;
  gap: 8px;
}
.topbar-title { font-weight: 600; color: var(--c-text); font-size: 15px; }

.user-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
}
.user-name { font-size: 13px; font-weight: 600; line-height: 1.1; }
.user-role { font-size: 11px; color: var(--c-text-muted); text-transform: capitalize; }

.content { flex: 1; min-width: 0; }

.backdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 20;
}

.mobile-only { display: none; }

@media (max-width: 980px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar {
    position: fixed; top: 0; left: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    width: 280px;
  }
  .shell.sidebar-open .sidebar { transform: translateX(0); }
  .shell.sidebar-open .backdrop { display: block; }
  .mobile-only { display: inline-flex; }
  .topbar { padding: 10px 16px; }
}

@media (max-width: 600px) {
  .hidden-mobile { display: none; }
}
</style>
