<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { languages } from '@/api/endpoints'
import { useCrud } from '@/composables/useCrud'
import { useFormat } from '@/composables/useFormat'
import { useLanguagesStore } from '@/stores/languages'
import { tt } from '@/composables/useTt'

import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import CursorPager from '@/components/ui/CursorPager.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import InfoList from '@/components/ui/InfoList.vue'

const { fmtDate } = useFormat()
const langStore = useLanguagesStore()

const {
  items, loading, total, sortBy, sortOrder, filter,
  pageIndex, hasMore, canPrev,
  reload, prev, next, onSort, resetFilter, create, update, remove,
} = useCrud(
  languages,
  { name: '', description: '', is_active: '' },
  { sortBy: 'created_at', sortOrder: 'desc' },
)
onMounted(reload)

const cols = [
  { key: 'id',          label: 'ID',                 sortable: true, width: '70px' },
  { key: 'name',        label: 'Код языка',          sortable: true },
  { key: 'description', label: 'Описание' },
  { key: 'is_active',   label: 'Статус',             sortable: true, width: '120px' },
  { key: 'created_at',  label: 'Дата создания',      sortable: true, width: '170px' },
]

const formOpen = ref(false)
const editing  = ref(null)
const form = reactive({ name: '', description: '', is_active: true })
const saving = ref(false)

const reset = () => { form.name = ''; form.description = ''; form.is_active = true }
const openCreate = () => { editing.value = null; reset(); formOpen.value = true }
const openEdit = (row) => {
  editing.value = row
  form.name = row.name || ''
  form.description = row.description || ''
  form.is_active = !!row.is_active
  formOpen.value = true
}

const submit = async () => {
  saving.value = true
  const payload = { name: form.name, description: form.description || null, is_active: form.is_active }
  const r = editing.value
    ? await update(editing.value.id, payload)
    : await create(payload)
  saving.value = false
  if (r.ok) { formOpen.value = false; langStore.fetch(true) }
}

const showOpen = ref(false)
const showRow = ref(null)
const openShow = (row) => { showRow.value = row; showOpen.value = true }

const showItems = computed(() => {
  const r = showRow.value || {}
  return [
    { key: 'id',          label: 'ID',                       value: r.id },
    { key: 'name',        label: tt('Код языка'),            value: r.name },
    { key: 'is_active',   label: tt('Статус'),               value: r.is_active ? tt('Активный') : tt('Неактивный') },
    { key: 'description', label: tt('Описание'),             value: r.description, full: true },
    { key: 'created_at',  label: tt('Дата создания'),        value: fmtDate(r.created_at) },
    { key: 'updated_at',  label: tt('Дата обновления'),      value: fmtDate(r.updated_at) },
  ]
})

const confirmOpen = ref(false)
const toRemove = ref(null)
const askRemove = (row) => { toRemove.value = row; confirmOpen.value = true }
const doRemove = async () => {
  if (!toRemove.value) return
  await remove(toRemove.value.id)
  confirmOpen.value = false
  toRemove.value = null
  langStore.fetch(true)
}
</script>

<template>
  <div class="page">
    <PageHeader :title="tt('Языки')" :subtitle="tt('Управление языками интерфейса')">
      <template #actions>
        <button class="btn btn-primary" @click="openCreate">+ {{ tt('Создать') }}</button>
      </template>
    </PageHeader>

    <div class="card">
      <div class="toolbar">
        <div class="field">
          <label class="field-label">{{ tt('Код языка') }}</label>
          <input class="input" v-model="filter.name" :placeholder="tt('Поиск') + '…'" @keyup.enter="reload()" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Описание') }}</label>
          <input class="input" v-model="filter.description" :placeholder="tt('Поиск') + '…'" @keyup.enter="reload()" />
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
        :columns="cols"
        :rows="items"
        :loading="loading"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @sort="onSort"
      >
        <template #cell-is_active="{ row }">
          <StatusBadge :active="!!row.is_active" />
        </template>
        <template #cell-created_at="{ row }">
          <span class="dim">{{ fmtDate(row.created_at) }}</span>
        </template>
        <template #cell-description="{ row }">
          <span class="ellipsis">{{ row.description || '—' }}</span>
        </template>
        <template #actions="{ row }">
          <button class="btn btn-icon" @click="openShow(row)" :title="tt('Просмотр')">👁</button>
          <button class="btn btn-icon" @click="openEdit(row)" :title="tt('Изменить')">✎</button>
          <button class="btn btn-icon" @click="askRemove(row)" :title="tt('Удалить')" style="color: var(--c-danger);">⌫</button>
        </template>
      </DataTable>

      <CursorPager
        :page-index="pageIndex"
        :has-more="hasMore"
        :can-prev="canPrev"
        :total="total"
        @prev="prev" @next="next"
      />
    </div>

    <AppModal v-model="formOpen" :title="editing ? tt('Изменить') : tt('Создать')">
      <form @submit.prevent="submit" class="form-grid">
        <div class="field full">
          <label class="field-label">{{ tt('Код языка') }} <span class="dim">(uz, ru, en…)</span></label>
          <input class="input" v-model="form.name" required />
        </div>
        <div class="field full">
          <label class="field-label">{{ tt('Описание') }}</label>
          <textarea class="textarea" v-model="form.description" />
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

    <DetailModal v-model="showOpen" :title="tt('Просмотр') + ' — ' + (showRow?.name || '')">
      <InfoList :items="showItems" />
      <template #actions>
        <button class="btn btn-primary" @click="showOpen = false; openEdit(showRow)">{{ tt('Изменить') }}</button>
      </template>
    </DetailModal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doRemove" />
  </div>
</template>
