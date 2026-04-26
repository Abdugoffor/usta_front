<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({ phone: '', password: '' })
const loading = ref(false)
const err = ref('')

const submit = async () => {
  err.value = ''
  loading.value = true
  const res = await auth.login(form)
  loading.value = false
  if (!res.ok) {
    err.value = res.error
    return
  }
  toast.success('✓')
  router.push(`/${route.params.lang || 'ru'}`)
}
</script>

<template>
  <form @submit.prevent="submit" class="auth-form">
    <div>
      <h1 class="h1 title-gradient" style="margin: 0 0 4px;">Вход в админ-панель</h1>
      <p class="muted" style="margin: 0;">Добро пожаловать 👋</p>
    </div>

    <div class="field">
      <label class="field-label">Телефон</label>
      <input class="input" v-model="form.phone" placeholder="+998 90 123 45 67" required />
    </div>

    <div class="field">
      <label class="field-label">Пароль</label>
      <input class="input" type="password" v-model="form.password" placeholder="••••••••" required />
    </div>

    <p v-if="err" class="field-error">{{ err }}</p>

    <button class="btn btn-primary" type="submit" :disabled="loading">
      <span v-if="loading" class="spinner" />
      <span>Войти</span>
    </button>

    <p class="muted" style="text-align: center; margin: 4px 0 0;">
      Нет аккаунта?
      <RouterLink :to="`/${route.params.lang || 'ru'}/auth/register`">Регистрация</RouterLink>
    </p>
  </form>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 16px; }
</style>
