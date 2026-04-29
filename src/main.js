import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import { useLanguagesStore } from './stores/languages'
import { useTranslationStore } from './stores/translation'
import { setOnUnauthorized } from './api/client'
import { installTt } from './composables/useTt'

import './style.css'
import './assets/public.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
installTt(app)

useThemeStore().apply()

const langs = useLanguagesStore()
const trStore = useTranslationStore()

setOnUnauthorized(() => {
  const auth = useAuthStore()
  auth.clear()
  langs.reset()
  trStore.clearAll()
  const lang = i18n.global.locale.value || langs.codes[0] || 'ru'
  const onAdmin = (router.currentRoute.value?.fullPath || '').startsWith(`/${lang}/admin`)
  router.push(onAdmin ? `/${lang}/admin/auth/login` : `/${lang}/auth/login`)
})

// Fetch languages before mounting so the router guard has data on first navigation.
langs.fetch().catch(() => {}).finally(() => app.mount('#app'))
