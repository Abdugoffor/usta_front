import { defineStore } from 'pinia'

let id = 0

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    push(message, type = 'info', timeout = 3500) {
      const t = { id: ++id, message, type }
      this.items.push(t)
      setTimeout(() => this.dismiss(t.id), timeout)
    },
    dismiss(id) { this.items = this.items.filter((t) => t.id !== id) },
    success(m) { this.push(m, 'success') },
    error(m)   { this.push(m, 'error', 5000) },
    info(m)    { this.push(m, 'info') },
  },
})
