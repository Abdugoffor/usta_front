<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterView, useRouter, useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useLanguagesStore } from '@/stores/languages'
import { tt } from '@/composables/useTt'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const langs = useLanguagesStore()
const { locale } = useI18n()

const menuOpen = ref(false)

onMounted(() => { langs.fetch() })

watch(() => route.fullPath, () => { menuOpen.value = false })

const link = (path = '') => `/${locale.value}${path}`

const switchLang = (code) => {
  const tail = route.fullPath.replace(/^\/[a-z]{2}/, '')
  router.push(`/${code}${tail || '/'}`)
}

const initials = computed(() => {
  const n = auth.user?.full_name || ''
  return n.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
})

const adminHome = computed(() => `/${locale.value}/admin`)

const onLogout = () => {
  auth.logout()
  router.push(link('/'))
}
</script>

<template>
  <div class="pub-shell">
    <header class="pub-header">
      <div class="pub-container pub-header-row">
        <RouterLink :to="link('/')" class="pub-brand">
          <span class="pub-brand-mark">UT</span>
          <span class="pub-brand-name">UstaTop</span>
        </RouterLink>

        <nav class="pub-nav">
          <RouterLink :to="link('/masters')" class="pub-nav-link">{{ tt('Мастера') }}</RouterLink>
          <RouterLink :to="link('/vacancies')" class="pub-nav-link">{{ tt('Вакансии') }}</RouterLink>
        </nav>

        <div class="pub-header-actions">
          <select class="pub-lang" :value="locale" @change="(e) => switchLang(e.target.value)">
            <option v-for="l in langs.list" :key="l.code" :value="l.code">{{ l.code.toUpperCase() }}</option>
          </select>

          <template v-if="auth.isAuthed">
            <RouterLink v-if="auth.isAdmin" :to="adminHome" class="pub-btn pub-btn-ghost">{{ tt('Админка') }}</RouterLink>
            <RouterLink :to="link('/me')" class="pub-user">
              <div class="pub-avatar">
                <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
                <span v-else>{{ initials }}</span>
              </div>
              <span class="pub-user-name">{{ auth.user?.full_name }}</span>
            </RouterLink>
            <button class="pub-btn pub-btn-ghost" @click="onLogout">{{ tt('Выйти') }}</button>
          </template>
          <template v-else>
            <RouterLink :to="link('/auth/login')" class="pub-btn pub-btn-ghost">{{ tt('Вход') }}</RouterLink>
            <RouterLink :to="link('/auth/register')" class="pub-btn pub-btn-primary">{{ tt('Регистрация') }}</RouterLink>
          </template>
        </div>

        <button class="pub-burger" :class="{ active: menuOpen }" aria-label="Menu" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>

      <transition name="pub-drawer">
        <div v-if="menuOpen" class="pub-drawer">
          <RouterLink :to="link('/masters')" class="pub-drawer-link">{{ tt('Мастера') }}</RouterLink>
          <RouterLink :to="link('/vacancies')" class="pub-drawer-link">{{ tt('Вакансии') }}</RouterLink>

          <div class="pub-drawer-row">
            <select class="pub-lang" :value="locale" @change="(e) => switchLang(e.target.value)">
              <option v-for="l in langs.list" :key="l.code" :value="l.code">{{ l.label }}</option>
            </select>
          </div>

          <div class="pub-drawer-actions">
            <template v-if="auth.isAuthed">
              <RouterLink v-if="auth.isAdmin" :to="adminHome" class="pub-btn pub-btn-ghost">{{ tt('Админка') }}</RouterLink>
              <RouterLink :to="link('/me')" class="pub-btn pub-btn-ghost">{{ tt('Мой кабинет') }}</RouterLink>
              <button class="pub-btn pub-btn-ghost" @click="onLogout">{{ tt('Выйти') }}</button>
            </template>
            <template v-else>
              <RouterLink :to="link('/auth/login')" class="pub-btn pub-btn-ghost">{{ tt('Вход') }}</RouterLink>
              <RouterLink :to="link('/auth/register')" class="pub-btn pub-btn-primary">{{ tt('Регистрация') }}</RouterLink>
            </template>
          </div>
        </div>
      </transition>
    </header>

    <main class="pub-main">
      <RouterView />
    </main>

    <footer class="pub-footer">
      <div class="pub-container pub-footer-grid">
        <div class="pub-footer-col">
          <div class="pub-brand pub-brand-light"><span class="pub-brand-name">UstaTop</span></div>
          <p class="pub-footer-text">{{ tt('Платформа для поиска лучших мастеров и услуг в Узбекистане.') }}</p>
        </div>
        <div class="pub-footer-col">
          <div class="pub-footer-title">{{ tt('Разделы') }}</div>
          <RouterLink :to="link('/masters')" class="pub-footer-link">{{ tt('Мастера') }}</RouterLink>
          <RouterLink :to="link('/vacancies')" class="pub-footer-link">{{ tt('Вакансии') }}</RouterLink>
          <RouterLink :to="link('/')" class="pub-footer-link">{{ tt('Главная') }}</RouterLink>
        </div>
        <div class="pub-footer-col">
          <div class="pub-footer-title">{{ tt('Полезное') }}</div>
          <a class="pub-footer-link" href="#">{{ tt('Помощь') }}</a>
          <a class="pub-footer-link" href="#">{{ tt('Политика конфиденциальности') }}</a>
          <a class="pub-footer-link" href="#">{{ tt('Условия использования') }}</a>
        </div>
        <div class="pub-footer-col">
          <div class="pub-footer-title">{{ tt('Контакты') }}</div>
          <div class="pub-footer-link">Email: abdugofforqodirov19@gmail.com</div>
          <div class="pub-footer-link">{{ tt('Тел') }}: +998 94 105 04 05</div>
          <div class="pub-footer-link">{{ tt('Ташкент, Узбекистан') }}</div>
        </div>
      </div>
      <div class="pub-footer-base">
        <div class="pub-container pub-footer-bottom">
          <span>© {{ new Date().getFullYear() }} UstaTop. {{ tt('Все права защищены.') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.pub-shell {
  --p-brand:        #2553ff;
  --p-brand-strong: #1e40ff;
  --p-brand-deep:   #1635c8;
  --p-bg:           #f4f6fb;
  --p-bg-soft:      #eef2f9;
  --p-surface:      #ffffff;
  --p-border:       #e3e8f1;
  --p-border-soft:  #eef1f7;
  --p-text:         #0f172a;
  --p-text-muted:   #5b6478;
  --p-text-dim:     #8893a8;
  --p-success:      #16a37a;
  --p-success-soft: #e6f7f0;
  --p-warn:         #c97000;
  --p-warn-soft:    #fdf1dd;
  --p-danger:       #b91c1c;
  --p-danger-soft:  #fee2e2;
  --p-shadow-sm:    0 1px 2px rgba(15,23,42,.06);
  --p-shadow-md:    0 8px 24px rgba(15,23,42,.08);
  background: var(--p-bg);
  color: var(--p-text);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

.pub-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 40px);
}

.pub-header { position: sticky; top: 0; z-index: 30; background: var(--p-surface); border-bottom: 1px solid var(--p-border); }
.pub-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(8px, 1.5vw, 16px);
  height: 72px;
}
.pub-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--p-text); font-weight: 700; }
.pub-brand:hover { text-decoration: none; }
.pub-brand-mark {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: var(--p-brand); color: #fff;
  font-size: 12px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  letter-spacing: .04em;
}
.pub-brand-name { font-size: 18px; letter-spacing: -.01em; }

.pub-nav { display: inline-flex; gap: 4px; margin-left: auto; }
.pub-nav-link {
  display: inline-flex; align-items: center;
  height: 38px; padding: 0 14px;
  border-radius: 8px;
  color: var(--p-text-muted); font-weight: 600; font-size: 14px; text-decoration: none;
  transition: background .15s, color .15s;
}
.pub-nav-link:hover, .pub-nav-link.router-link-active { color: var(--p-brand); background: rgba(37,83,255,.08); text-decoration: none; }

.pub-header-actions { display: inline-flex; align-items: center; gap: 8px; }

.pub-lang {
  height: 38px; padding: 0 10px;
  border: 1px solid var(--p-border); border-radius: 8px;
  background: var(--p-surface); color: var(--p-text);
  font-size: 13px; font-weight: 600;
  outline: none; cursor: pointer;
}
.pub-lang:focus { border-color: var(--p-brand); }

.pub-btn {
  display: inline-flex; align-items: center; justify-content: center;
  height: 38px; padding: 0 16px;
  border-radius: 10px; border: 1px solid transparent;
  font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap;
  transition: background .15s, color .15s, border-color .15s;
  cursor: pointer; background: transparent;
}
.pub-btn:hover { text-decoration: none; }
.pub-btn-ghost { border-color: var(--p-border); color: var(--p-text); }
.pub-btn-ghost:hover { background: var(--p-bg-soft); }
.pub-btn-primary { background: var(--p-brand); color: #fff; border-color: var(--p-brand); }
.pub-btn-primary:hover { background: var(--p-brand-strong); border-color: var(--p-brand-strong); }

.pub-user {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px; border-radius: 999px;
  background: var(--p-bg-soft); color: var(--p-text);
  text-decoration: none; max-width: 200px;
}
.pub-user:hover { text-decoration: none; }
.pub-user-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pub-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--p-surface);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--p-text-muted); font-weight: 700; font-size: 12px;
  overflow: hidden;
}
.pub-avatar img { width: 100%; height: 100%; object-fit: cover; }

.pub-burger {
  display: none;
  width: 40px; height: 40px;
  background: transparent; border: 1px solid var(--p-border);
  border-radius: 10px; padding: 9px 10px;
  flex-direction: column; justify-content: space-between;
}
.pub-burger span { display: block; height: 2px; background: var(--p-text); border-radius: 2px; transition: transform .2s, opacity .2s; }
.pub-burger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.pub-burger.active span:nth-child(2) { opacity: 0; }
.pub-burger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.pub-drawer {
  border-top: 1px solid var(--p-border);
  background: var(--p-surface);
  padding: 14px clamp(16px, 3vw, 24px) 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.pub-drawer-link {
  display: block; padding: 10px 12px;
  border-radius: 10px; color: var(--p-text);
  font-weight: 600; font-size: 14px; text-decoration: none;
}
.pub-drawer-link:hover { background: var(--p-bg-soft); text-decoration: none; }
.pub-drawer-row { display: flex; gap: 8px; }
.pub-drawer-actions { display: grid; grid-auto-flow: column; gap: 8px; }
.pub-drawer-actions .pub-btn { width: 100%; }

.pub-drawer-enter-active, .pub-drawer-leave-active { transition: max-height .25s ease, opacity .15s ease; overflow: hidden; }
.pub-drawer-enter-from, .pub-drawer-leave-to { max-height: 0; opacity: 0; }
.pub-drawer-enter-to, .pub-drawer-leave-from { max-height: 420px; opacity: 1; }

.pub-main { flex: 1; min-width: 0; }

.pub-footer { margin-top: 24px; background: linear-gradient(135deg, var(--p-brand-strong) 0%, var(--p-brand-deep) 100%); color: #e8edff; }
.pub-footer-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; padding: 56px 0 40px; }
.pub-footer-col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.pub-brand-light .pub-brand-name { color: #fff; font-size: 22px; }
.pub-footer-text { color: #cdd6f7; font-size: 14px; line-height: 1.6; margin: 0; }
.pub-footer-title { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.pub-footer-link { color: #cdd6f7; text-decoration: none; font-size: 14px; transition: color .15s; }
.pub-footer-link:hover { color: #fff; text-decoration: none; }

.pub-footer-base { border-top: 1px solid rgba(255,255,255,.12); background: rgba(0,0,0,.08); }
.pub-footer-bottom { padding: 16px 0; font-size: 13px; color: #b8c2ee; }

@media (max-width: 980px) {
  .pub-header-row { height: 64px; }
  .pub-nav, .pub-header-actions { display: none; }
  .pub-burger { display: inline-flex; }
  .pub-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; padding: 40px 0 32px; }
}
@media (max-width: 540px) {
  .pub-header-row { height: 60px; }
  .pub-brand-name { font-size: 16px; }
  .pub-brand-mark { width: 32px; height: 32px; }
  .pub-footer-grid { grid-template-columns: 1fr; gap: 24px; }
}
@media (min-width: 1600px) {
  .pub-container { max-width: 1480px; }
}
</style>
