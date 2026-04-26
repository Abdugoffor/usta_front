<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { users } from '@/api/endpoints'
import { useCrud } from '@/composables/useCrud'
import { useFormat } from '@/composables/useFormat'
import { tt } from '@/composables/useTt'

import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import CursorPager from '@/components/ui/CursorPager.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PhotoUpload from '@/components/ui/PhotoUpload.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import InfoList from '@/components/ui/InfoList.vue'

const { fmtDate } = useFormat()

const {
  items, loading, total, sortBy, sortOrder, filter,
  pageIndex, hasMore, canPrev,
  reload, prev, next, onSort, resetFilter, create, update, remove,
} = useCrud(
  users,
  { full_name: '', phone: '', role: '', is_active: '' },
  { sortBy: 'created_at', sortOrder: 'desc' },
)
onMounted(reload)

const cols = [
  { key: 'id',         label: 'ID', sortable: true, width: '70px' },
  { key: 'full_name',  label: 'ФИО', sortable: true },
  { key: 'phone',      label: 'Телефон', sortable: true, width: '170px' },
  { key: 'role',       label: 'Роль', sortable: true, width: '160px' },
  { key: 'is_active',  label: 'Статус', sortable: true, width: '120px' },
  { key: 'created_at', label: 'Дата создания', sortable: true, width: '170px' },
]

const roleLabel = (r) => ({
  user: 'Пользователь',
  employer: 'Работодатель',
  admin: 'Администратор',
}[r] || r)

const roleClass = (r) => ({
  admin: 'badge-info',
  employer: 'badge-warn',
  user: 'badge',
}[r] || 'badge')

const formOpen = ref(false)
const editing  = ref(null)
const form = reactive({
  full_name: '', phone: '', password: '', photo: '',
  role: 'user', is_active: true,
})
const saving = ref(false)

const reset = () => {
  form.full_name = ''; form.phone = ''; form.password = ''
  form.photo = ''; form.role = 'user'; form.is_active = true
}
const openCreate = () => { editing.value = null; reset(); formOpen.value = true }
const openEdit = (row) => {
  editing.value = row
  form.full_name = row.full_name || ''
  form.phone = row.phone || ''
  form.password = ''
  form.photo = row.photo || ''
  form.role = row.role || 'user'
  form.is_active = !!row.is_active
  formOpen.value = true
}

const submit = async () => {
  saving.value = true
  const payload = {
    full_name: form.full_name,
    phone: form.phone,
    photo: form.photo || null,
    role: form.role,
    is_active: form.is_active,
  }
  if (form.password) payload.password = form.password
  let r
  if (editing.value) {
    r = await update(editing.value.id, payload)
  } else {
    if (!form.password) { saving.value = false; return }
    r = await create({ ...payload, password: form.password })
  }
  saving.value = false
  if (r.ok) formOpen.value = false
}

const showOpen = ref(false)
const showRow = ref(null)
const openShow = (row) => { showRow.value = row; showOpen.value = true }

const showItems = computed(() => {
  const r = showRow.value || {}
  return [
    { key: 'id',         label: 'ID',                value: r.id },
    { key: 'full_name',  label: tt('ФИО'),           value: r.full_name },
    { key: 'phone',      label: tt('Телефон'),       value: r.phone },
    { key: 'role',       label: tt('Роль'),          value: tt(roleLabel(r.role)) },
    { key: 'is_active',  label: tt('Статус'),        value: r.is_active ? tt('Активный') : tt('Неактивный') },
    { key: 'created_at', label: tt('Дата создания'), value: fmtDate(r.created_at) },
    { key: 'updated_at', label: tt('Дата обновления'), value: fmtDate(r.updated_at) },
  ]
})

const confirmOpen = ref(false)
const toRemove = ref(null)
const askRemove = (row) => { toRemove.value = row; confirmOpen.value = true }
const doRemove = async () => {
  if (!toRemove.value) return
  await remove(toRemove.value.id)
  confirmOpen.value = false; toRemove.value = null
}
</script>

<template>
  <div class="page">
    <PageHeader :title="tt('Пользователи')" :subtitle="tt('Управление пользователями системы')">
      <template #actions>
        <button class="btn btn-primary" @click="openCreate">+ {{ tt('Создать') }}</button>
      </template>
    </PageHeader>

    <div class="card">
      <div class="toolbar">
        <div class="field">
          <label class="field-label">{{ tt('ФИО') }}</label>
          <input class="input" v-model="filter.full_name" :placeholder="tt('Поиск') + '…'" @keyup.enter="reload()" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Телефон') }}</label>
          <input class="input" v-model="filter.phone" :placeholder="tt('Поиск') + '…'" @keyup.enter="reload()" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Роль') }}</label>
          <select class="select" v-model="filter.role" @change="reload()">
            <option value="">{{ tt('Все') }}</option>
            <option value="user">{{ tt('Пользователь') }}</option>
            <option value="employer">{{ tt('Работодатель') }}</option>
            <option value="admin">{{ tt('Администратор') }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Статус') }}</label>
          <select class="select" v-model="filter.is_active" @change="reload()">
            <option value="">{{ tt('Все') }}</option>
            <option value="true">{{ tt('Активный') }}</option>
            <option value="false">{{ tt('Неактивный') }}</option>
          </select>
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-ghost" @click="resetFilter()">{{ tt('Сбросить') }}</button>
          <button class="btn btn-primary" @click="reload()">{{ tt('Поиск') }}</button>
        </div>
      </div>
    </div>

    <div class="card">
      <DataTable
        :columns="cols" :rows="items" :loading="loading"
        :sort-by="sortBy" :sort-order="sortOrder" @sort="onSort"
      >
        <template #cell-full_name="{ row }">
          <div class="row" style="gap: 10px;">
            <div class="avatar">
              <img v-if="row.photo" :src="row.photo" alt="" />
              <span v-else>{{ (row.full_name || '?').slice(0, 1) }}</span>
            </div>
            <span>{{ row.full_name }}</span>
          </div>
        </template>
        <template #cell-role="{ row }">
          <span class="badge" :class="roleClass(row.role)">{{ tt(roleLabel(row.role)) }}</span>
        </template>
        <template #cell-is_active="{ row }"><StatusBadge :active="!!row.is_active" /></template>
        <template #cell-created_at="{ row }"><span class="dim">{{ fmtDate(row.created_at) }}</span></template>
        <template #actions="{ row }">
          <button class="btn btn-icon" @click="openShow(row)" :title="tt('Просмотр')">👁</button>
          <button class="btn btn-icon" @click="openEdit(row)" :title="tt('Изменить')">✎</button>
          <button class="btn btn-icon" @click="askRemove(row)" :title="tt('Удалить')" style="color: var(--c-danger);">⌫</button>
        </template>
      </DataTable>

      <CursorPager :page-index="pageIndex" :has-more="hasMore" :can-prev="canPrev" :total="total" @prev="prev" @next="next" />
    </div>

    <AppModal v-model="formOpen" :title="editing ? tt('Изменить') : tt('Создать')" size="lg">
      <form @submit.prevent="submit" class="form-grid">
        <div class="full">
          <PhotoUpload v-model="form.photo" :label="tt('Фото')" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('ФИО') }}</label>
          <input class="input" v-model="form.full_name" required minlength="2" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Телефон') }}</label>
          <input class="input" v-model="form.phone" required />
        </div>
        <div class="field">
          <label class="field-label">
            {{ tt('Пароль') }}
            <span v-if="editing" class="dim"> ({{ tt('необязательно') }})</span>
          </label>
          <input class="input" type="password" v-model="form.password" :required="!editing" minlength="6" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Роль') }}</label>
          <select class="select" v-model="form.role">
            <option value="user">{{ tt('Пользователь') }}</option>
            <option value="employer">{{ tt('Работодатель') }}</option>
            <option value="admin">{{ tt('Администратор') }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Статус') }}</label>
          <select class="select" v-model="form.is_active">
            <option :value="true">{{ tt('Активный') }}</option>
            <option :value="false">{{ tt('Неактивный') }}</option>
          </select>
        </div>
      </form>
      <template #footer>
        <button class="btn btn-ghost" @click="formOpen = false">{{ tt('Отмена') }}</button>
        <button class="btn btn-primary" @click="submit" :disabled="saving">
          <span v-if="saving" class="spinner" />
          <span>{{ tt('Сохранить') }}</span>
        </button>
      </template>
    </AppModal>

    <DetailModal v-model="showOpen" :title="tt('Просмотр') + ' — ' + (showRow?.full_name || '')">
      <div class="user-show-head">
        <div class="avatar avatar-lg">
          <img v-if="showRow?.photo" :src="showRow.photo" alt="" />
          <span v-else>{{ (showRow?.full_name || '?').slice(0, 1) }}</span>
        </div>
        <div>
          <div class="h2">{{ showRow?.full_name }}</div>
          <div class="muted">{{ showRow?.phone }}</div>
        </div>
      </div>
      <InfoList :items="showItems" />
      <template #actions>
        <button class="btn btn-primary" @click="showOpen = false; openEdit(showRow)">{{ tt('Изменить') }}</button>
      </template>
    </DetailModal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doRemove" />
  </div>
</template>

<style scoped>
.user-show-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
</style>
