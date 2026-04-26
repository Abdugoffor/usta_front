<script setup>
import { RouterView } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
</script>

<template>
  <div class="auth-shell">
    <div class="auth-bg" />
    <div class="auth-card card">
      <header class="auth-header">
        <div class="row" style="gap: 10px;">
          <div class="brand-mark">U</div>
          <div>
            <div class="h2">Usta Admin</div>
            <div class="dim">Управление вакансиями, резюме и контентом платформы.</div>
          </div>
        </div>
        <div class="row" style="gap: 6px;">
          <button
            class="btn btn-icon"
            :title="theme.mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'"
            @click="theme.toggle()"
          >
            <span v-if="theme.mode === 'dark'">☀</span>
            <span v-else>☾</span>
          </button>
        </div>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100%;
  position: relative;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  overflow: hidden;
}
.auth-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at top left, rgba(108,124,255,0.25), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(155,108,255,0.22), transparent 55%),
    var(--c-bg);
  z-index: 0;
}
.auth-card {
  position: relative; z-index: 1;
  width: min(440px, 100%);
  padding: 28px;
  display: flex; flex-direction: column; gap: 20px;
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
}
.auth-header {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
}
.brand-mark {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: var(--gradient-brand);
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 20px;
  box-shadow: var(--shadow-md);
}
</style>
