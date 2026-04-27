<script setup>
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { tt } from '@/composables/useTt'

const router = useRouter()
const { locale } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({ full_name: '', phone: '', password: '', role: 'user' })
const loading = ref(false)
const err = ref('')

const submit = async () => {
  err.value = ''
  loading.value = true
  const res = await auth.register(form)
  loading.value = false
  if (!res.ok) { err.value = res.error; return }
  toast.success('✓')
  router.push(`/${locale.value}/me`)
}
</script>

<template>
  <div class="auth-page">
    <div class="p-container auth-wrap">
      <div class="p-card auth-card">
        <h1 class="p-h1" style="text-align: center;">{{ tt('Регистрация') }}</h1>
        <p class="p-muted" style="text-align: center; margin: 6px 0 18px;">{{ tt('Создайте аккаунт, чтобы публиковать объявления') }}</p>

        <form @submit.prevent="submit" class="auth-form">
          <div class="p-field">
            <label class="p-label">{{ tt('Полное имя') }}</label>
            <input class="p-input" v-model="form.full_name" :placeholder="tt('Иван Иванов')" required />
          </div>

          <div class="p-field">
            <label class="p-label">{{ tt('Телефон') }}</label>
            <input class="p-input" v-model="form.phone" placeholder="+998 90 123 45 67" required />
          </div>

          <div class="p-field">
            <label class="p-label">{{ tt('Пароль') }}</label>
            <input class="p-input" type="password" v-model="form.password" placeholder="••••••••" required />
          </div>

          <div class="p-field">
            <label class="p-label">{{ tt('Кто вы') }}?</label>
            <select class="p-select" v-model="form.role">
              <option value="user">{{ tt('Мастер / специалист') }}</option>
              <option value="employer">{{ tt('Работодатель') }}</option>
            </select>
          </div>

          <p v-if="err" class="p-error">{{ err }}</p>

          <button class="p-btn p-btn-primary auth-submit" type="submit" :disabled="loading">
            <span v-if="loading" class="p-spinner p-spinner-sm" />
            <span>{{ tt('Зарегистрироваться') }}</span>
          </button>

          <p class="p-muted" style="text-align: center; margin: 4px 0 0;">
            {{ tt('Уже есть аккаунт') }}?
            <RouterLink :to="`/${locale}/auth/login`">{{ tt('Войти') }}</RouterLink>
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
</style>
