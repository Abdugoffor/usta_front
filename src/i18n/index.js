import { createI18n } from 'vue-i18n'

const saved = localStorage.getItem('app_locale') || 'ru'

export const i18n = createI18n({
  legacy: false,
  locale: saved,
  fallbackLocale: 'ru',
  messages: { ru: {} },
})

export const setLocale = (code) => {
  i18n.global.locale.value = code
  localStorage.setItem('app_locale', code)
  document.documentElement.setAttribute('lang', code)
}

document.documentElement.setAttribute('lang', saved)
