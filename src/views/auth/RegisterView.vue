<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const route = useRoute()
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
  const lang = route.params.lang || 'ru'
  router.push(auth.isAdmin ? `/${lang}/admin` : `/${lang}`)
}
</script>

<template>
  <form @submit.prevent="submit" class="auth-form">
    <div>
      <h1 class="h1 title-gradient" style="margin: 0 0 4px;">Регистрация</h1>
      <p class="muted" style="margin: 0;">Управление вакансиями, резюме и контентом платформы.</p>
    </div>

    <div class="field">
      <label class="field-label">Полное имя</label>
      <input class="input" v-model="form.full_name" placeholder="Иван Иванов" required />
    </div>

    <div class="field">
      <label class="field-label">Телефон</label>
      <input class="input" v-model="form.phone" placeholder="+998 90 123 45 67" required />
    </div>

    <div class="field">
      <label class="field-label">Пароль</label>
      <input class="input" type="password" v-model="form.password" placeholder="••••••••" required />
    </div>

    <div class="field">
      <label class="field-label">Роль</label>
      <select class="select" v-model="form.role">
        <option value="user">Пользователь</option>
        <option value="employer">Работодатель</option>
      </select>
    </div>

    <p v-if="err" class="field-error">{{ err }}</p>

    <button class="btn btn-primary" type="submit" :disabled="loading">
      <span v-if="loading" class="spinner" />
      <span>Создать аккаунт</span>
    </button>

    <p class="muted" style="text-align: center; margin: 4px 0 0;">
      Уже есть аккаунт?
      <RouterLink :to="`/${route.params.lang || 'ru'}/auth/login`">Войти</RouterLink>
    </p>
  </form>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 16px; }
</style>
