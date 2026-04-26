<script setup>
import { ref, computed, watch } from 'vue'
import { useLanguagesStore } from '@/stores/languages'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  label: { type: String, default: '' },
  type: { type: String, default: 'input' }, // input | textarea
  placeholder: { type: String, default: '' },
  mode: { type: String, default: 'create' }, // 'create' | 'update'
})
const emit = defineEmits(['update:modelValue'])

const langStore = useLanguagesStore()

const tabs = computed(() => {
  const active = langStore.list
  if (props.mode === 'update') return active
  return [{ code: 'default', label: 'По умолчанию' }, ...active]
})

const active = ref(tabs.value[0]?.code || 'default')

watch(tabs, (next) => {
  if (!next.find((t) => t.code === active.value)) {
    active.value = next[0]?.code || 'default'
  }
}, { deep: true })

const update = (code, value) => {
  const next = { ...(props.modelValue || {}), [code]: value }
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="field">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="tabs" style="margin-bottom: 6px;">
      <button
        v-for="l in tabs"
        :key="l.code"
        type="button"
        :class="{ active: active === l.code }"
        @click="active = l.code"
      >{{ l.label }}</button>
    </div>

    <input
      v-if="type === 'input'"
      class="input"
      :value="modelValue?.[active] || ''"
      :placeholder="placeholder"
      @input="(e) => update(active, e.target.value)"
    />
    <textarea
      v-else
      class="textarea"
      :value="modelValue?.[active] || ''"
      :placeholder="placeholder"
      @input="(e) => update(active, e.target.value)"
    />
  </div>
</template>
