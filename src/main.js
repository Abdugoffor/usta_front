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

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
installTt(app)

useThemeStore().apply()

const langs = useLanguagesStore()
const trStore = useTranslationStore()

// Pre-warm active languages even before auth so URL guard has data on first paint.
langs.fetch().catch(() => {})

setOnUnauthorized(() => {
  const auth = useAuthStore()
  auth.clear()
  langs.reset()
  trStore.clearAll()
  const lang = i18n.global.locale.value || 'ru'
  router.push(`/${lang}/auth/login`)
})

app.mount('#app')
