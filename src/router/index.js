import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLanguagesStore } from '@/stores/languages'
import { i18n, setLocale } from '@/i18n'

const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const AuthLayout  = () => import('@/layouts/AuthLayout.vue')

const DEFAULT_LANG = 'ru'
const KNOWN_LANGS = ['ru', 'uz', 'en', 'qq', 'kk', 'tg', 'tr']

const routes = [
  {
    path: '/:lang(\\w{2})/auth',
    component: AuthLayout,
    meta: { guest: true },
    children: [
      { path: '', redirect: (to) => `/${to.params.lang}/auth/login` },
      { path: 'login',    name: 'login',    component: () => import('@/views/auth/LoginView.vue') },
      { path: 'register', name: 'register', component: () => import('@/views/auth/RegisterView.vue') },
    ],
  },
  {
    path: '/:lang(\\w{2})',
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
  // legacy / un-prefixed routes redirect to current locale
  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      const cur = i18n.global.locale.value || localStorage.getItem('app_locale') || DEFAULT_LANG
      const tail = to.fullPath.replace(/^\/+/, '')
      return `/${cur}/${tail}`
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const langs = useLanguagesStore()

  let lang = String(to.params.lang || '').toLowerCase()
  const saved = (localStorage.getItem('app_locale') || DEFAULT_LANG).toLowerCase()

  // If URL lang is missing or junk, redirect to current saved lang
  if (!lang || !KNOWN_LANGS.includes(lang)) {
    const path = to.fullPath.replace(/^\/+/, '')
    return `/${saved}/${path}`
  }

  // Sync i18n locale with URL
  if (i18n.global.locale.value !== lang) setLocale(lang)

  // Auth gate
  if (to.meta.auth && !auth.isAuthed) return `/${lang}/auth/login`
  if (to.meta.guest && auth.isAuthed)  return `/${lang}`

  // After login, validate URL lang against active langs (public endpoint)
  if (auth.isAuthed) {
    if (!langs.loaded) await langs.fetch()
    if (langs.codes.length && !langs.has(lang)) {
      const fallback = langs.has(saved) ? saved : (langs.codes[0] || DEFAULT_LANG)
      const tail = to.fullPath.replace(/^\/[a-z]{2}/, '')
      return `/${fallback}${tail || '/'}`
    }
  }
})

export default router
