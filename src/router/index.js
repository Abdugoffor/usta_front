import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLanguagesStore } from '@/stores/languages'
import { i18n, setLocale } from '@/i18n'

const AdminLayout  = () => import('@/layouts/AdminLayout.vue')
const AuthLayout   = () => import('@/layouts/AuthLayout.vue')
const PublicLayout = () => import('@/layouts/PublicLayout.vue')

// Absolute fallback used only when the backend is unreachable.
const DEFAULT_LANG = 'ru'

// Lang segment: 2 or more lowercase letters (supports 2-letter and 3-letter codes).
const LANG = '[a-z]{2,}'

const routes = [
  // ─── Admin auth (must come before /:lang admin parent) ───
  {
    path: `/:lang(${LANG})/admin/auth`,
    component: AuthLayout,
    meta: { guest: true, admin: true },
    children: [
      { path: '', redirect: (to) => `/${to.params.lang}/admin/auth/login` },
      { path: 'login',    name: 'login',    component: () => import('@/views/auth/LoginView.vue') },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },
    ],
  },

  // ─── Admin panel ───
  {
    path: `/:lang(${LANG})/admin`,
    component: AdminLayout,
    meta: { auth: true },
    children: [
      { path: '',             name: 'dashboard',    component: () => import('@/views/DashboardView.vue') },
      { path: 'languages',    name: 'languages',    component: () => import('@/views/languages/ListView.vue') },
      { path: 'categories',   name: 'categories',   component: () => import('@/views/categories/ListView.vue') },
      { path: 'countries',    name: 'countries',    component: () => import('@/views/countries/ListView.vue') },
      { path: 'translations', name: 'translations', component: () => import('@/views/translations/ListView.vue') },
      { path: 'users',        name: 'users',        component: () => import('@/views/users/ListView.vue') },
      { path: 'vacancies',    name: 'vacancies',    component: () => import('@/views/vacancies/ListView.vue') },
      { path: 'resumes',      name: 'resumes',      component: () => import('@/views/resumes/ListView.vue') },
    ],
  },

  // ─── Public client site (root /:lang) ───
  {
    path: `/:lang(${LANG})`,
    component: PublicLayout,
    children: [
      { path: '',                  name: 'home',           component: () => import('@/views/public/HomeView.vue') },
      { path: 'vacancies',         name: 'vacancies-list', component: () => import('@/views/public/VacanciesView.vue') },
      { path: 'vacancies/:slug',   name: 'vacancy-detail', component: () => import('@/views/public/VacancyDetailView.vue') },
      { path: 'masters',           name: 'masters-list',   component: () => import('@/views/public/MastersView.vue') },
      { path: 'masters/:slug',     name: 'master-detail',  component: () => import('@/views/public/MasterDetailView.vue') },
      { path: 'auth/login',        name: 'c-login',        component: () => import('@/views/public/LoginView.vue'),    meta: { guest: true } },
      { path: 'auth/register',     name: 'c-register',     component: () => import('@/views/public/RegisterView.vue'), meta: { guest: true } },
      { path: 'me',                name: 'me',             component: () => import('@/views/public/MeView.vue'),       meta: { authClient: true } },
    ],
  },

  // ─── Catch-all: prepend current locale ───
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      const langs = useLanguagesStore()
      const saved = (localStorage.getItem('app_locale') || DEFAULT_LANG).toLowerCase()
      const cur   = (i18n.global.locale.value || saved).toLowerCase()
      const tail  = to.fullPath.replace(/^\/+/, '')
      const first = tail.split('/')[0] || ''
      if (first && langs.has(first)) return '/' + tail
      const lang = langs.has(cur) ? cur : (langs.has(saved) ? saved : (langs.codes[0] || DEFAULT_LANG))
      return `/${lang}/${tail}`
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth  = useAuthStore()
  const langs = useLanguagesStore()

  // Guarantee languages are loaded before any routing decision.
  await langs.fetch()

  const saved = (localStorage.getItem('app_locale') || DEFAULT_LANG).toLowerCase()
  const lang  = String(to.params.lang || '').toLowerCase()

  // Redirect to a valid lang if the URL segment is missing or unknown.
  if (!lang || !langs.has(lang)) {
    const fallback = langs.has(saved) ? saved : (langs.codes[0] || DEFAULT_LANG)
    const tail = to.fullPath.replace(/^\/[^/]*/, '')
    return `/${fallback}${tail || '/'}`
  }

  if (i18n.global.locale.value !== lang) setLocale(lang)

  if (to.meta.auth && !auth.isAuthed) return `/${lang}/admin/auth/login`
  if (to.meta.guest && to.meta.admin && auth.isAuthed) return `/${lang}/admin`
  if (to.meta.guest && !to.meta.admin && auth.isAuthed) {
    return auth.isAdmin ? `/${lang}/admin` : `/${lang}/me`
  }
  if (to.meta.authClient && !auth.isAuthed) return `/${lang}/auth/login`
})

export default router
