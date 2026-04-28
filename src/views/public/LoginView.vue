<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { tt } from '@/composables/useTt'

const router = useRouter()
const route = useRoute()
const { locale } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({ phone: '', password: '' })
const loading = ref(false)
const tgLoading = ref(false)
const err = ref('')

const goNext = () => {
  const redirect = String(route.query.redirect || '')
  if (redirect.startsWith('/')) { router.push(redirect); return }
  router.push(auth.isAdmin ? `/${locale.value}/admin` : `/${locale.value}/me`)
}

const submit = async () => {
  err.value = ''
  loading.value = true
  const res = await auth.login(form)
  loading.value = false
  if (!res.ok) { err.value = res.error; return }
  toast.success('✓')
  goNext()
}

const loginTg = async () => {
  err.value = ''
  tgLoading.value = true
  const res = await auth.loginViaTelegram((deepLink) => {
    window.open(deepLink, '_blank', 'noopener')
  })
  tgLoading.value = false
  if (!res.ok) { err.value = res.error; return }
  toast.success('✓')
  goNext()
}
</script>

<template>
  <div class="auth-page">
    <div class="p-container auth-wrap">
      <div class="p-card auth-card">
        <h1 class="p-h1" style="text-align: center;">{{ tt('Вход в кабинет') }}</h1>
        <p class="p-muted" style="text-align: center; margin: 6px 0 18px;">{{ tt('Войдите, чтобы добавить вакансию или резюме') }}</p>

        <form @submit.prevent="submit" class="auth-form">
          <div class="p-field">
            <label class="p-label">{{ tt('Телефон') }}</label>
            <input class="p-input" v-model="form.phone" placeholder="+998 90 123 45 67" required />
          </div>

          <div class="p-field">
            <label class="p-label">{{ tt('Пароль') }}</label>
            <input class="p-input" type="password" v-model="form.password" placeholder="••••••••" required />
          </div>

          <p v-if="err" class="p-error">{{ err }}</p>

          <button class="p-btn p-btn-primary auth-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="p-spinner p-spinner-sm" />
            <span>{{ tt('Войти') }}</span>
          </button>

          <div class="auth-divider"><span>{{ tt('или') }}</span></div>

          <button class="p-btn auth-submit auth-tg" type="button" :disabled="tgLoading" @click="loginTg">
            <span v-if="tgLoading" class="p-spinner p-spinner-sm" />
            <span>{{ tt('Войти через Telegram') }}</span>
          </button>

          <p v-if="tgLoading" class="p-muted" style="text-align: center; margin: 0;">
            {{ tt('Откройте Telegram и нажмите Start') }}
          </p>

          <p class="p-muted" style="text-align: center; margin: 4px 0 0;">
            {{ tt('Нет аккаунта') }}?
            <RouterLink :to="`/${locale}/auth/register`">{{ tt('Регистрация') }}</RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { padding: clamp(24px, 6vw, 80px) 0 60px; min-height: 60vh; }
.auth-wrap { display: flex; align-items: center; justify-content: center; }
.auth-card { width: 100%; max-width: 440px; padding: clamp(24px, 4vw, 36px); }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.auth-submit { height: 46px; margin-top: 4px; }
.auth-tg { background: #229ED9; color: #fff; border-color: #229ED9; }
.auth-tg:hover:not(:disabled) { background: #1e8bc0; border-color: #1e8bc0; }
.auth-divider { display: flex; align-items: center; gap: 10px; color: var(--p-muted, #888); margin: 6px 0; }
.auth-divider::before,
.auth-divider::after { content: ''; flex: 1; height: 1px; background: currentColor; opacity: .25; }
</style>
