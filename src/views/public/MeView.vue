<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { vacancies, resumes, upload } from '@/api/endpoints'
import { extractError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { tt } from '@/composables/useTt'
import { fmtPrice } from '@/composables/usePublicData'
import { useCategories, useRegions } from '@/composables/usePublicData'

const router = useRouter()
const { locale } = useI18n()
const auth = useAuthStore()
const toast = useToastStore()

const tab = ref('vacancies')
const items = ref([])
const loading = ref(false)
const cursor = ref('')
const hasMore = ref(false)

const apiFor = computed(() => tab.value === 'vacancies' ? vacancies : resumes)

const setTab = (v) => {
  if (tab.value === v) return
  tab.value = v
  load(false)
}

const load = async (append = false) => {
  loading.value = true
  if (!append) cursor.value = ''
  try {
    const params = { limit: 20 }
    if (cursor.value) params.cursor = cursor.value
    const { data } = await apiFor.value.list(params)
    const rows = data?.data || []
    items.value = append ? items.value.concat(rows) : rows
    hasMore.value = !!data?.meta?.has_more
    cursor.value = data?.meta?.next_cursor || ''
  } catch { if (!append) items.value = [] } finally { loading.value = false }
}

onMounted(load)

const remove = async (id) => {
  if (!confirm(tt('Удалить?'))) return
  try {
    await apiFor.value.remove(id)
    toast.success(tt('Удалено'))
    items.value = items.value.filter((x) => x.id !== id)
  } catch (e) { toast.error(extractError(e)) }
}

const detailLink = (it) => {
  const base = tab.value === 'vacancies' ? 'vacancies' : 'masters'
  return `/${locale.value}/${base}/${it.slug || it.id}`
}

/* ─── Form modal ─── */
const formOpen = ref(false)
const editing = ref(null)
const saving = ref(false)
const formErr = ref('')

const blankVacancy = () => ({
  name: '', title: '', text: '', contact: '', adress: '',
  region_id: null, district_id: null, mahalla_id: null,
  price: '', is_active: true, category_ids: [],
})
const blankResume = () => ({
  name: '', photo: '', title: '', text: '', contact: '', adress: '',
  region_id: null, district_id: null, mahalla_id: null,
  price: '', experience_year: '', skills: '',
  is_active: true, category_ids: [],
})

const form = reactive(blankVacancy())

const { cats, loadCategories } = useCategories()
const { regions, districts, mahallas, loadRegions, loadDistricts, loadMahallas } = useRegions()

onMounted(async () => {
  await Promise.all([loadCategories(), loadRegions()])
})

watch(() => form.region_id, async (v) => {
  form.district_id = null; form.mahalla_id = null
  await loadDistricts(v)
})
watch(() => form.district_id, async (v) => {
  form.mahalla_id = null
  await loadMahallas(v)
})

const openCreate = () => {
  editing.value = null
  Object.assign(form, tab.value === 'vacancies' ? blankVacancy() : blankResume())
  formErr.value = ''
  formOpen.value = true
}

const openEdit = async (row) => {
  editing.value = row
  const blank = tab.value === 'vacancies' ? blankVacancy() : blankResume()
  Object.assign(form, blank, {
    name: row.name || '',
    title: row.title || '',
    text: row.text || '',
    contact: row.contact || '',
    adress: row.adress || '',
    region_id: row.region_id || null,
    district_id: row.district_id || null,
    mahalla_id: row.mahalla_id || null,
    price: row.price ?? '',
    is_active: !!row.is_active,
    category_ids: (row.categories || []).map((c) => c.id),
  })
  if (tab.value === 'resumes') {
    form.photo = row.photo || ''
    form.experience_year = row.experience_year ?? ''
    form.skills = row.skills || ''
  }
  formErr.value = ''
  formOpen.value = true
  await nextTick()
  if (form.region_id)   await loadDistricts(form.region_id)
  if (form.district_id) await loadMahallas(form.district_id)
}

const closeForm = () => { formOpen.value = false }

const toggleCategory = (id) => {
  const i = form.category_ids.indexOf(id)
  if (i >= 0) form.category_ids.splice(i, 1)
  else form.category_ids.push(id)
}

const onPhotoSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 20 * 1024 * 1024) { toast.error(tt('Файл больше 20 МБ')); return }
  try {
    const { data } = await upload(file)
    form.photo = data?.url || data?.path || data?.photo || form.photo
    toast.success('✓')
  } catch (err) { toast.error(extractError(err)) }
}

const submit = async () => {
  formErr.value = ''
  saving.value = true
  try {
    const payload = {
      name: form.name?.trim(),
      title: form.title?.trim(),
      text: form.text?.trim(),
      contact: form.contact?.trim(),
      adress: form.adress?.trim(),
      region_id: form.region_id || null,
      district_id: form.district_id || null,
      mahalla_id: form.mahalla_id || null,
      price: form.price !== '' ? Number(form.price) : null,
      is_active: !!form.is_active,
      category_ids: form.category_ids,
    }
    if (tab.value === 'resumes') {
      payload.photo = form.photo || ''
      payload.experience_year = form.experience_year !== '' ? Number(form.experience_year) : null
      payload.skills = form.skills?.trim() || ''
    }
    if (editing.value) {
      const { data } = await apiFor.value.update(editing.value.id, payload)
      const i = items.value.findIndex((x) => x.id === editing.value.id)
      if (i >= 0) items.value.splice(i, 1, data)
      toast.success(tt('Сохранено'))
    } else {
      const { data } = await apiFor.value.create(payload)
      items.value.unshift(data)
      toast.success(tt('Создано'))
    }
    formOpen.value = false
  } catch (e) { formErr.value = extractError(e) } finally { saving.value = false }
}

const onLogout = () => {
  auth.logout()
  router.push(`/${locale.value}/`)
}

const initials = computed(() => {
  const n = auth.user?.full_name || ''
  return n.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
})
</script>

<template>
  <div class="p-page">
    <div class="p-container">
      <div class="me-grid">
        <!-- Profile sidebar -->
        <aside class="me-side p-stack">
          <div class="p-card profile-card">
            <div class="profile-avatar">
              <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="profile-name">{{ auth.user?.full_name }}</div>
            <div class="profile-phone">{{ auth.user?.phone }}</div>
            <div class="profile-role">{{ auth.user?.role }}</div>
            <button class="p-btn p-btn-ghost" style="margin-top: 12px; width: 100%;" @click="onLogout">{{ tt('Выйти') }}</button>
          </div>

          <nav class="p-card me-nav">
            <button class="me-nav-item" :class="{ active: tab === 'vacancies' }" @click="setTab('vacancies')">
              <span>💼</span><span>{{ tt('Мои вакансии') }}</span>
            </button>
            <button class="me-nav-item" :class="{ active: tab === 'resumes' }" @click="setTab('resumes')">
              <span>⚙</span><span>{{ tt('Мои резюме') }}</span>
            </button>
          </nav>
        </aside>

        <!-- Main -->
        <section class="me-main p-stack">
          <div class="me-head">
            <h1 class="p-h1">{{ tab === 'vacancies' ? tt('Мои вакансии') : tt('Мои резюме') }}</h1>
            <button class="p-btn p-btn-primary" @click="openCreate">
              <span>+</span><span>{{ tab === 'vacancies' ? tt('Добавить вакансию') : tt('Добавить резюме') }}</span>
            </button>
          </div>

          <div v-if="loading && !items.length" class="p-empty"><div class="p-spinner" /><span>{{ tt('Загрузка…') }}</span></div>
          <div v-else-if="!items.length" class="p-empty">
            <div class="p-empty-icon">∅</div>
            <span>{{ tt('Пока нет объявлений') }}</span>
            <button class="p-btn p-btn-primary" style="margin-top: 12px;" @click="openCreate">{{ tt('Создать первое') }}</button>
          </div>

          <div v-else class="me-list">
            <article v-for="it in items" :key="it.id" class="p-card me-row">
              <div class="me-row-main">
                <div class="me-row-head">
                  <div class="me-row-name">{{ it.name || it.title }}</div>
                  <span class="p-status" :class="it.is_active ? 'p-status-on' : 'p-status-off'">
                    {{ it.is_active ? tt('Активен') : tt('Закрыт') }}
                  </span>
                </div>
                <div v-if="it.title && it.name" class="me-row-title">{{ it.title }}</div>
                <p v-if="it.text" class="me-row-text">{{ it.text }}</p>
                <div class="me-row-meta">
                  <span v-if="it.price" class="me-row-price">{{ fmtPrice(it.price) }} {{ tt('сум') }}</span>
                  <span v-if="(it.categories || []).length" class="me-row-cats">
                    <span v-for="c in it.categories.slice(0, 3)" :key="c.id" class="ad-tag">{{ c.name }}</span>
                  </span>
                </div>
              </div>
              <div class="me-row-actions">
                <a :href="detailLink(it)" class="p-btn p-btn-ghost p-btn-sm" target="_blank" rel="noopener">{{ tt('Открыть') }}</a>
                <button class="p-btn p-btn-ghost p-btn-sm" @click="openEdit(it)">{{ tt('Изменить') }}</button>
                <button class="p-btn p-btn-ghost p-btn-sm me-del" @click="remove(it.id)">{{ tt('Удалить') }}</button>
              </div>
            </article>

            <div v-if="hasMore" style="display: flex; justify-content: center;">
              <button class="p-btn p-btn-ghost" @click="load(true)" :disabled="loading">
                <span v-if="loading" class="p-spinner p-spinner-sm" />
                <span>{{ tt('Показать ещё') }}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Form modal -->
    <transition name="modal">
      <div v-if="formOpen" class="modal-backdrop" @click.self="closeForm">
        <div class="modal">
          <header class="modal-head">
            <div class="p-h2">{{ editing ? tt('Изменить') : (tab === 'vacancies' ? tt('Новая вакансия') : tt('Новое резюме')) }}</div>
            <button class="p-btn p-btn-ghost p-btn-sm" @click="closeForm">×</button>
          </header>

          <form class="modal-body" @submit.prevent="submit">
            <div class="form-grid">
              <div class="p-field">
                <label class="p-label">{{ tt('Имя') }}</label>
                <input class="p-input" v-model="form.name" maxlength="255" />
              </div>
              <div class="p-field">
                <label class="p-label">{{ tt('Заголовок') }}</label>
                <input class="p-input" v-model="form.title" maxlength="500" />
              </div>

              <div class="p-field full">
                <label class="p-label">{{ tt('Описание') }}</label>
                <textarea class="p-textarea" v-model="form.text" rows="5"></textarea>
              </div>

              <div class="p-field">
                <label class="p-label">{{ tt('Контакт') }}</label>
                <input class="p-input" v-model="form.contact" placeholder="+998 ..." maxlength="255" />
              </div>
              <div class="p-field">
                <label class="p-label">{{ tt('Цена (сум)') }}</label>
                <input class="p-input" type="number" min="0" v-model="form.price" />
              </div>

              <template v-if="tab === 'resumes'">
                <div class="p-field">
                  <label class="p-label">{{ tt('Опыт (лет)') }}</label>
                  <input class="p-input" type="number" min="0" v-model="form.experience_year" />
                </div>
                <div class="p-field">
                  <label class="p-label">{{ tt('Фото') }}</label>
                  <div class="p-row">
                    <input type="file" accept="image/*" @change="onPhotoSelect" />
                    <div v-if="form.photo" class="p-dim">{{ form.photo }}</div>
                  </div>
                </div>
                <div class="p-field full">
                  <label class="p-label">{{ tt('Навыки') }}</label>
                  <input class="p-input" v-model="form.skills" :placeholder="tt('Через запятую')" />
                </div>
              </template>

              <div class="p-field">
                <label class="p-label">{{ tt('Регион') }}</label>
                <select class="p-select" v-model="form.region_id">
                  <option :value="null">—</option>
                  <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
              </div>
              <div class="p-field">
                <label class="p-label">{{ tt('Район') }}</label>
                <select class="p-select" v-model="form.district_id" :disabled="!form.region_id">
                  <option :value="null">—</option>
                  <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </div>
              <div class="p-field">
                <label class="p-label">{{ tt('Махалля') }}</label>
                <select class="p-select" v-model="form.mahalla_id" :disabled="!form.district_id">
                  <option :value="null">—</option>
                  <option v-for="m in mahallas" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
              </div>

              <div class="p-field full">
                <label class="p-label">{{ tt('Адрес') }}</label>
                <input class="p-input" v-model="form.adress" maxlength="500" />
              </div>

              <div class="p-field full">
                <label class="p-label">{{ tt('Категории') }}</label>
                <div class="form-cats">
                  <button v-for="c in cats" :key="c.id"
                    type="button"
                    class="cat-chip"
                    :class="{ on: form.category_ids.includes(c.id) }"
                    @click="toggleCategory(c.id)">
                    <span>{{ c.icon }}</span><span>{{ c.name }}</span>
                  </button>
                </div>
              </div>

              <div class="p-field full">
                <label class="switch-row">
                  <span class="switch" :class="{ on: form.is_active }"><span class="switch-dot" /></span>
                  <input v-model="form.is_active" type="checkbox" hidden />
                  <span class="switch-text">
                    <span class="switch-title">{{ tt('Активно') }}</span>
                    <span class="switch-sub">{{ tt('Объявление видно всем') }}</span>
                  </span>
                </label>
              </div>
            </div>

            <p v-if="formErr" class="p-error">{{ formErr }}</p>

            <footer class="modal-foot">
              <button type="button" class="p-btn p-btn-ghost" @click="closeForm">{{ tt('Отмена') }}</button>
              <button type="submit" class="p-btn p-btn-primary" :disabled="saving">
                <span v-if="saving" class="p-spinner p-spinner-sm" />
                <span>{{ tt('Сохранить') }}</span>
              </button>
            </footer>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.me-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; padding-bottom: 60px; }

.me-side { min-width: 0; }
.profile-card { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.profile-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--p-bg-soft);
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 22px; color: var(--p-text-muted);
  overflow: hidden; margin-bottom: 6px;
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-name { font-weight: 700; font-size: 16px; }
.profile-phone { color: var(--p-text-muted); font-size: 13px; }
.profile-role { font-size: 11px; text-transform: uppercase; color: var(--p-brand); font-weight: 700; letter-spacing: .06em; }

.me-nav { display: flex; flex-direction: column; gap: 4px; padding: 8px; }
.me-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  background: transparent; border: 0; border-radius: 10px;
  color: var(--p-text-muted); font-weight: 600; font-size: 14px;
  cursor: pointer; text-align: left; font-family: inherit;
  transition: background .15s, color .15s;
}
.me-nav-item:hover { background: var(--p-bg-soft); color: var(--p-text); }
.me-nav-item.active { background: rgba(37,83,255,.10); color: var(--p-brand); }

.me-main { min-width: 0; }
.me-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

.me-list { display: flex; flex-direction: column; gap: 14px; }

.me-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
}
.me-row-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.me-row-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.me-row-name { font-weight: 700; font-size: 16px; }
.me-row-title { color: var(--p-text-muted); font-size: 14px; }
.me-row-text { margin: 4px 0 0; color: var(--p-text-muted); font-size: 14px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.me-row-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 6px; }
.me-row-price { font-weight: 800; color: var(--p-brand); font-size: 16px; }
.me-row-cats { display: inline-flex; flex-wrap: wrap; gap: 4px; }
.ad-tag { padding: 4px 10px; border-radius: 999px; background: rgba(37,83,255,.10); color: var(--p-brand); font-size: 12px; font-weight: 600; }

.me-row-actions { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.me-del { color: var(--p-danger); }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(8,12,22,.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px; overflow-y: auto;
}
.modal {
  background: var(--p-surface);
  border-radius: 16px;
  width: min(720px, 100%);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: var(--p-shadow-md);
}
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid var(--p-border); }
.modal-body { padding: 18px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.modal-foot { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 22px; border-top: 1px solid var(--p-border); background: var(--p-bg-soft); margin-top: 8px; margin: 8px -22px -18px; padding: 14px 22px; }

.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.form-grid .full { grid-column: 1 / -1; }

.form-cats { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--p-bg-soft);
  border: 1px solid var(--p-border-soft);
  color: var(--p-text);
  font-size: 13px; font-weight: 500;
  cursor: pointer; font-family: inherit;
  transition: background .15s, border-color .15s, color .15s;
}
.cat-chip.on { background: rgba(37,83,255,.10); color: var(--p-brand); border-color: rgba(37,83,255,.25); }

.switch-row { display: grid; grid-template-columns: 38px 1fr; gap: 12px; align-items: center; cursor: pointer; user-select: none; }
.switch { width: 38px; height: 22px; background: #d6dceb; border-radius: 999px; position: relative; transition: background .2s; }
.switch-dot { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: left .2s; }
.switch.on { background: var(--p-brand); }
.switch.on .switch-dot { left: 19px; }
.switch-text { display: flex; flex-direction: column; line-height: 1.25; }
.switch-title { font-weight: 600; font-size: 13px; color: var(--p-text); }
.switch-sub   { font-size: 12px; color: var(--p-text-muted); }

.modal-enter-active, .modal-leave-active { transition: opacity .15s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 980px) {
  .me-grid { grid-template-columns: 1fr; }
  .me-row { grid-template-columns: 1fr; }
  .me-row-actions { justify-content: flex-start; }
}
</style>
