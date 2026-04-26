<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { tt } from '@/composables/useTt'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const wrap = ref(null)

const selected = computed(() => props.options.filter((o) => props.modelValue.includes(o.value)))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => String(o.label).toLowerCase().includes(q))
})

const toggle = (val) => {
  const set = new Set(props.modelValue)
  if (set.has(val)) set.delete(val)
  else set.add(val)
  emit('update:modelValue', Array.from(set))
}

const remove = (val) => {
  emit('update:modelValue', props.modelValue.filter((v) => v !== val))
}

const close = (e) => {
  if (wrap.value && !wrap.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', close))
onBeforeUnmount(() => document.removeEventListener('mousedown', close))
</script>

<template>
  <div class="field" ref="wrap" style="position: relative;">
    <label v-if="label" class="field-label">{{ label }}</label>

    <div class="input multiselect" @click="open = true" tabindex="0">
      <div v-if="selected.length" class="chips">
        <span class="chip" v-for="s in selected" :key="s.value">
          {{ s.label }}
          <button type="button" @click.stop="remove(s.value)">×</button>
        </span>
      </div>
      <span v-else class="muted">{{ placeholder }}</span>
    </div>

    <div v-if="open" class="dropdown">
      <input class="input" v-model="search" :placeholder="tt('Поиск')" />
      <div class="opt-list">
        <div
          v-for="o in filtered"
          :key="o.value"
          class="opt"
          :class="{ selected: modelValue.includes(o.value) }"
          @click="toggle(o.value)"
        >
          <span class="check">{{ modelValue.includes(o.value) ? '✓' : '' }}</span>
          <span>{{ o.label }}</span>
        </div>
        <div v-if="!filtered.length" class="muted" style="padding: 8px 12px;">{{ tt('Нет данных') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multiselect {
  min-height: 42px;
  cursor: text;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
}
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  padding: 8px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.opt-list { max-height: 220px; overflow-y: auto; }
.opt {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  cursor: pointer; user-select: none;
}
.opt:hover { background: var(--c-surface-2); }
.opt.selected { color: var(--c-accent); }
.check { width: 18px; text-align: center; color: var(--c-accent); }
</style>
