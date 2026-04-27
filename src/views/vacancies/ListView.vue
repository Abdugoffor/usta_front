<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { vacancies, categories, countries } from '@/api/endpoints'
import { useCrud } from '@/composables/useCrud'
import { useFormat } from '@/composables/useFormat'
import { tt } from '@/composables/useTt'

import PageHeader from '@/components/ui/PageHeader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import CursorPager from '@/components/ui/CursorPager.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import MultiSelect from '@/components/ui/MultiSelect.vue'
import AppToggle from '@/components/ui/AppToggle.vue'
import DetailModal from '@/components/ui/DetailModal.vue'
import InfoList from '@/components/ui/InfoList.vue'

const { fmtDate, fmtPrice, fmtCount } = useFormat()
const { locale } = useI18n()

const {
  items, loading, total, sortBy, sortOrder, filter,
  pageIndex, hasMore, canPrev,
  reload, prev, next, onSort, resetFilter, create, update, remove,
} = useCrud(
  vacancies,
  { name: '', title: '', search: '', region_id: '', is_active: '', category_ids: [], min_price: '', max_price: '' },
  { sortBy: 'created_at', sortOrder: 'desc' },
)

const allCategories = ref([])
const allRegions = ref([])
const allDistricts = ref([])
const allMahallas = ref([])

const loadRefs = async () => {
  try {
    const [c, r] = await Promise.all([
      categories.active(locale.value),
      countries.active(null, locale.value),
    ])
    allCategories.value = c.data?.data || []
    allRegions.value = r.data?.data || []
  } catch { /* ignore */ }
}
const loadDistricts = async (regionId) => {
  if (!regionId) { allDistricts.value = []; return }
  try {
    const { data } = await countries.active(regionId, locale.value)
    allDistricts.value = data?.data || []
  } catch { allDistricts.value = [] }
}
const loadMahallas = async (districtId) => {
  if (!districtId) { allMahallas.value = []; return }
  try {
    const { data } = await countries.active(districtId, locale.value)
    allMahallas.value = data?.data || []
  } catch { allMahallas.value = [] }
}

onMounted(async () => { await Promise.all([reload(), loadRefs()]) })

const cols = [
  { key: 'id',          label: 'ID', sortable: true, width: '70px' },
  { key: 'name',        label: 'Имя', sortable: true },
  { key: 'title',       label: 'Заголовок' },
  { key: 'price',       label: 'Цена', sortable: true, width: '120px', align: 'right' },
  { key: 'views_count', label: 'Просмотры', width: '110px', align: 'right' },
  { key: 'is_active',   label: 'Статус', sortable: true, width: '120px' },
  { key: 'created_at',  label: 'Дата создания', sortable: true, width: '170px' },
]

const catOptions = computed(() =>
  allCategories.value.map((c) => ({ value: c.id, label: c.name })),
)

const headerTitle = computed(() =>
  total.value !== null && total.value !== undefined
    ? `${tt('Вакансии')} (${fmtCount(total.value)})`
    : tt('Вакансии'),
)

const formOpen = ref(false)
const editing  = ref(null)
const form = reactive({
  name: '', title: '', text: '', contact: '', adress: '',
  price: '', is_active: true,
  region_id: '', district_id: '', mahalla_id: '',
  category_ids: [],
})
const saving = ref(false)

const reset = () => {
  form.name = ''; form.title = ''; form.text = ''; form.contact = ''; form.adress = ''
  form.price = ''; form.is_active = true
  form.region_id = ''; form.district_id = ''; form.mahalla_id = ''
  form.category_ids = []
}
const openCreate = () => {
  editing.value = null; reset()
  allDistricts.value = []; allMahallas.value = []
  formOpen.value = true
}
const openEdit = async (row) => {
  editing.value = row
  form.name = row.name || ''
  form.title = row.title || ''
  form.text = row.text || ''
  form.contact = row.contact || ''
  form.adress = row.adress || ''
  form.price = row.price ?? ''
  form.is_active = row.is_active !== false
  form.region_id = row.region_id ?? ''
  form.district_id = row.district_id ?? ''
  form.mahalla_id = row.mahalla_id ?? ''
  form.category_ids = (row.categories || []).map((c) => c.id)
  await Promise.all([
    form.region_id ? loadDistricts(form.region_id) : Promise.resolve(),
    form.district_id ? loadMahallas(form.district_id) : Promise.resolve(),
  ])
  formOpen.value = true
}

const onRegionChange = async () => {
  form.district_id = ''; form.mahalla_id = ''
  allDistricts.value = []; allMahallas.value = []
  if (form.region_id) await loadDistricts(form.region_id)
}
const onDistrictChange = async () => {
  form.mahalla_id = ''
  allMahallas.value = []
  if (form.district_id) await loadMahallas(form.district_id)
}

const submit = async () => {
  saving.value = true
  const payload = {
    name: form.name, title: form.title, text: form.text,
    contact: form.contact, adress: form.adress,
    price: form.price === '' ? null : Number(form.price),
    is_active: form.is_active,
    region_id:   form.region_id   ? Number(form.region_id)   : null,
    district_id: form.district_id ? Number(form.district_id) : null,
    mahalla_id:  form.mahalla_id  ? Number(form.mahalla_id)  : null,
    category_ids: form.category_ids.map(Number),
  }
  const r = editing.value
    ? await update(editing.value.id, payload)
    : await create(payload)
  saving.value = false
  if (r.ok) formOpen.value = false
}

const showOpen = ref(false)
const showRow = ref(null)
const openShow = (row) => { showRow.value = row; showOpen.value = true }

const showMain = computed(() => {
  const r = showRow.value || {}
  return [
    { key: 'id',          label: 'ID',                value: r.id },
    { key: 'slug',        label: tt('Ключ'),          value: r.slug || '—' },
    { key: 'name',        label: tt('Имя'),           value: r.name },
    { key: 'contact',     label: tt('Контакт'),       value: r.contact },
    { key: 'price',       label: tt('Цена'),          value: fmtPrice(r.price) },
    { key: 'views',       label: tt('Просмотры'),     value: r.views_count ?? 0 },
    { key: 'is_active',   label: tt('Статус'),        value: r.is_active !== false ? tt('Активный') : tt('Неактивный') },
    { key: 'title',       label: tt('Заголовок'),     value: r.title, full: true },
    { key: 'text',        label: tt('Описание'),      value: r.text, full: true },
  ]
})
const showAddress = computed(() => {
  const r = showRow.value || {}
  return [
    { key: 'adress',   label: tt('Адрес'),   value: r.adress, full: true },
    { key: 'region',   label: tt('Регион'),  value: r.region_name },
    { key: 'district', label: tt('Район'),   value: r.district_name },
    { key: 'mahalla',  label: tt('Махалля'), value: r.mahalla_name },
  ]
})
const showMeta = computed(() => {
  const r = showRow.value || {}
  return [
    { key: 'created_at', label: tt('Дата создания'),   value: fmtDate(r.created_at) },
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
    <PageHeader :title="headerTitle" :subtitle="tt('Объявления о работе')">
      <template #actions>
        <button class="btn btn-primary" @click="openCreate">+ {{ tt('Создать') }}</button>
      </template>
    </PageHeader>

    <div class="card">
      <div class="toolbar">
        <div class="field">
          <label class="field-label">{{ tt('Поиск') }}</label>
          <input class="input" v-model="filter.search" :placeholder="tt('Поиск') + '…'" @keyup.enter="reload()" />
        </div>
        <div class="field">
          <label class="field-label">{{ tt('Регион') }}</label>
          <select class="select" v-model="filter.region_id" @change="reload()">
            <option value="">{{ tt('Все') }}</option>
            <option v-for="r in allRegions" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <MultiSelect
          v-model="filter.category_ids"
          :options="catOptions"
          :label="tt('Категории')"
          :placeholder="tt('Все')"
          @update:modelValue="reload()"
        />
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
        <template #cell-title="{ row }">
          <span class="ellipsis">{{ row.title || '—' }}</span>
        </template>
        <template #cell-price="{ row }">{{ fmtPrice(row.price) }}</template>
        <template #cell-views_count="{ row }">{{ row.views_count ?? 0 }}</template>
        <template #cell-is_active="{ row }"><StatusBadge :active="row.is_active !== false" /></template>
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
      <form @submit.prevent="submit" class="form-sections">
        <!-- 1. Основное -->
        <section class="form-section">
          <header class="form-section-head">
            <span class="num">1</span>
            <span class="form-section-title">{{ tt('Основная информация') }}</span>
          </header>
          <div class="form-row">
            <div class="field">
              <label class="field-label">{{ tt('Имя') }} *</label>
              <input class="input" v-model="form.name" required minlength="2" />
            </div>
            <div class="field">
              <label class="field-label">{{ tt('Контакт') }} *</label>
              <input class="input" v-model="form.contact" required minlength="5" placeholder="+998 ..." />
            </div>
          </div>
          <div class="field">
            <label class="field-label">{{ tt('Заголовок') }} *</label>
            <input class="input" v-model="form.title" required minlength="2" />
          </div>
          <div class="field">
            <label class="field-label">{{ tt('Описание') }} *</label>
            <textarea class="textarea" v-model="form.text" required minlength="10" rows="4" />
          </div>
        </section>

        <!-- 2. Адрес и цена -->
        <section class="form-section">
          <header class="form-section-head">
            <span class="num">2</span>
            <span class="form-section-title">{{ tt('Адрес и цена') }}</span>
          </header>
          <div class="form-row">
            <div class="field" style="grid-column: span 2;">
              <label class="field-label">{{ tt('Адрес') }} *</label>
              <input class="input" v-model="form.adress" required minlength="3" />
            </div>
            <div class="field">
              <label class="field-label">{{ tt('Цена') }}</label>
              <input class="input" type="number" v-model="form.price" min="0" placeholder="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label class="field-label">{{ tt('Регион') }}</label>
              <select class="select" v-model="form.region_id" @change="onRegionChange">
                <option value="">—</option>
                <option v-for="r in allRegions" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">{{ tt('Район') }}</label>
              <select class="select" v-model="form.district_id" :disabled="!form.region_id" @change="onDistrictChange">
                <option value="">—</option>
                <option v-for="d in allDistricts" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">{{ tt('Махалля') }}</label>
              <select class="select" v-model="form.mahalla_id" :disabled="!form.district_id">
                <option value="">—</option>
                <option v-for="m in allMahallas" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 3. Категории + статус -->
        <section class="form-section">
          <header class="form-section-head">
            <span class="num">3</span>
            <span class="form-section-title">{{ tt('Категории и публикация') }}</span>
          </header>
          <MultiSelect
            v-model="form.category_ids"
            :options="catOptions"
            :label="tt('Категории')"
            :placeholder="tt('Выберите категории')"
          />
          <div class="status-row">
            <AppToggle
              v-model="form.is_active"
              :label="tt('Активный')"
              :hint="form.is_active ? tt('Объявление видно пользователям') : tt('Скрыто из списка')"
            />
          </div>
        </section>
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
      <InfoList :items="showMain" />
      <InfoList :items="showAddress" :title="tt('Адрес')" />
      <section v-if="showRow?.categories?.length" class="info-block">
        <h3 class="info-title">{{ tt('Категории') }}</h3>
        <div class="chips">
          <span v-for="c in showRow.categories" :key="c.id" class="chip">{{ c.name }}</span>
        </div>
      </section>
      <InfoList :items="showMeta" :title="tt('Системные')" />
      <template #actions>
        <button class="btn btn-primary" @click="showOpen = false; openEdit(showRow)">{{ tt('Изменить') }}</button>
      </template>
    </DetailModal>

    <ConfirmDialog v-model="confirmOpen" @confirm="doRemove" />
  </div>
</template>

<style scoped>
.info-block { display: flex; flex-direction: column; gap: 10px; }
.info-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--c-border);
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--c-border);
  background: var(--c-surface-2);
  border-radius: 10px;
}
</style>
