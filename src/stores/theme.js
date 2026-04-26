import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({ mode: localStorage.getItem('app_theme') || 'dark' }),
  actions: {
    apply() {
      document.documentElement.setAttribute('data-theme', this.mode)
    },
    toggle() {
      this.mode = this.mode === 'dark' ? 'light' : 'dark'
      localStorage.setItem('app_theme', this.mode)
      this.apply()
    },
    set(mode) {
      this.mode = mode
      localStorage.setItem('app_theme', this.mode)
      this.apply()
    },
  },
})
