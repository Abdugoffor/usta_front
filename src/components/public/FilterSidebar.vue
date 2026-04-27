<script setup>
import { ref, watch, onMounted } from 'vue'
import { tt } from '@/composables/useTt'
import { useCategories, useRegions } from '@/composables/usePublicData'

const props = defineProps({
  modelValue: { type: Object, required: true },
  showExperience: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'change', 'reset'])

const local = ref({ ...props.modelValue })

watch(() => props.modelValue, (v) => { local.value = { ...v } }, { deep: true })

const apply = () => {
  emit('update:modelValue', { ...local.value })
  emit('change')
}

const { cats, loadCategories } = useCategories()
const { regions, districts, mahallas, loadRegions, loadDistricts, loadMahallas } = useRegions()

onMounted(async () => {
  await Promise.all([loadCategories(), loadRegions()])
  if (local.value.region_id)   await loadDistricts(local.value.region_id)
  if (local.value.district_id) await loadMahallas(local.value.district_id)
})

watch(() => local.value.region_id, async (v) => {
  local.value.district_id = null
  local.value.mahalla_id = null
  await loadDistricts(v)
  apply()
})
watch(() => local.value.district_id, async (v) => {
  local.value.mahalla_id = null
  await loadMahallas(v)
  apply()
})
watch(() => local.value.mahalla_id, apply)
watch(() => local.value.is_active, apply)
watch(() => local.value.min_experience, apply)

const toggleCategory = (id) => {
  const list = Array.isArray(local.value.category_ids) ? [...local.value.category_ids] : []
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1); else list.push(id)
  local.value.category_ids = list
  apply()
}
const isCatSelected = (id) => (local.value.category_ids || []).includes(id)

const onPriceChange = () => apply()
const applyPrice = () => apply()

const open = ref(false)
const reset = () => {
  local.value.category_ids = []
  local.value.region_id = null
  local.value.district_id = null
  local.value.mahalla_id = null
  local.value.min_price = ''
  local.value.max_price = ''
  local.value.is_active = false
  local.value.min_experience = ''
  local.value.search = ''
  apply()
  emit('reset')
}
</script>

<template>
  <div>
    <button class="filter-toggle p-btn p-btn-ghost" @click="open = !open">
      <span>{{ tt('Фильтр') }}</span>
    </button>

    <aside class="sidebar" :class="{ open }">
      <div class="filter-card p-card">
        <div class="filter-head">
          <span class="filter-title">{{ tt('Фильтр') }}</span>
          <button class="link-btn" @click="reset">{{ tt('Сбросить') }}</button>
        </div>

        <div class="filter-section">
          <div class="p-label">{{ tt('Категория') }}</div>
          <div class="cat-chips">
            <button v-for="c in cats" :key="c.id"
              type="button"
              class="cat-chip"
              :class="{ on: isCatSelected(c.id) }"
              @click="toggleCategory(c.id)">
              <span class="cat-emoji">{{ c.icon }}</span>
              <span>{{ c.name }}</span>
            </button>
            <div v-if="!cats.length" class="p-dim">—</div>
          </div>
        </div>

        <div class="filter-section">
          <div class="p-label">{{ tt('Местоположение') }}</div>
          <select class="p-select" v-model="local.region_id">
            <option :value="null">{{ tt('Выберите регион') }}</option>
            <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <select class="p-select" v-model="local.district_id" :disabled="!local.region_id">
            <option :value="null">{{ tt('Район') }}</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select class="p-select" v-model="local.mahalla_id" :disabled="!local.district_id">
            <option :value="null">{{ tt('Махалля') }}</option>
            <option v-for="m in mahallas" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>

        <div class="filter-section">
          <div class="p-label">{{ tt('Цена (сум)') }}</div>
          <div class="price-row">
            <input v-model="local.min_price" @keyup.enter="applyPrice" class="p-input" type="number" min="0" :placeholder="tt('от')" />
            <input v-model="local.max_price" @keyup.enter="applyPrice" class="p-input" type="number" min="0" :placeholder="tt('до')" />
          </div>
          <button type="button" class="price-apply" @click="applyPrice">{{ tt('Применить цену') }}</button>
        </div>

        <div v-if="showExperience" class="filter-section">
          <div class="p-label">{{ tt('Опыт от (лет)') }}</div>
          <input v-model="local.min_experience" @change="onPriceChange" class="p-input" type="number" min="0" placeholder="0" />
        </div>

        <div class="filter-section">
          <label class="switch-row">
            <span class="switch" :class="{ on: local.is_active }"><span class="switch-dot" /></span>
            <input v-model="local.is_active" type="checkbox" hidden />
            <span class="switch-text">
              <span class="switch-title">{{ tt('Только активные') }}</span>
              <span class="switch-sub">{{ tt('Скрыть закрытые объявления') }}</span>
            </span>
          </label>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.filter-toggle { display: none; width: 100%; height: 44px; margin-bottom: 12px; justify-content: center; }
.sidebar {
  min-width: 0;
  position: sticky;
  top: 88px;
  align-self: start;
  height: calc(100vh - 100px);
}
.filter-card {
  display: flex; flex-direction: column; gap: 18px;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(15,23,42,.18) transparent;
}
.filter-card::-webkit-scrollbar { width: 6px; }
.filter-card::-webkit-scrollbar-thumb { background: rgba(15,23,42,.18); border-radius: 3px; }
.filter-card::-webkit-scrollbar-track { background: transparent; }
.filter-head { display: flex; align-items: center; justify-content: space-between; }
.filter-title { font-weight: 700; font-size: 15px; }
.link-btn { background: transparent; border: 0; color: var(--p-brand); font-size: 13px; cursor: pointer; padding: 0; font-weight: 600; }
.link-btn:hover { text-decoration: underline; }

.filter-section { display: flex; flex-direction: column; gap: 10px; }

.cat-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--p-bg-soft);
  border: 1px solid var(--p-border-soft);
  color: var(--p-text);
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
  font-family: inherit;
}
.cat-chip:hover { background: #e6ecf8; }
.cat-chip.on { background: rgba(37,83,255,.10); color: var(--p-brand); border-color: rgba(37,83,255,.25); }
.cat-emoji { font-size: 14px; line-height: 1; }

.price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.price-apply {
  height: 38px; border: 0; border-radius: 10px;
  background: var(--p-brand); color: #fff;
  font-family: inherit; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: background .15s;
}
.price-apply:hover { background: var(--p-brand-strong); }
.price-apply:active { transform: translateY(1px); }

.switch-row { display: grid; grid-template-columns: 38px 1fr; gap: 12px; align-items: center; cursor: pointer; user-select: none; }
.switch { width: 38px; height: 22px; background: #d6dceb; border-radius: 999px; position: relative; transition: background .2s; }
.switch-dot { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: left .2s; }
.switch.on { background: var(--p-brand); }
.switch.on .switch-dot { left: 19px; }
.switch-text { display: flex; flex-direction: column; line-height: 1.25; }
.switch-title { font-weight: 600; font-size: 13px; color: var(--p-text); }
.switch-sub   { font-size: 12px; color: var(--p-text-muted); }

@media (max-width: 1024px) {
  .filter-toggle { display: inline-flex; }
  .sidebar { display: none; position: static; height: auto; }
  .sidebar.open { display: block; }
  .filter-card { height: auto; overflow-y: visible; }
}
</style>
