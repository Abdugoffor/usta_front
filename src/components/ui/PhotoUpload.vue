<script setup>
import { ref } from 'vue'
import { upload } from '@/api/endpoints'
import { extractError } from '@/api/client'
import { useToastStore } from '@/stores/toast'
import { tt } from '@/composables/useTt'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const toast = useToastStore()
const inputRef = ref(null)
const loading = ref(false)

const onPick = () => inputRef.value?.click()

const onChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  loading.value = true
  try {
    const { data } = await upload(file)
    emit('update:modelValue', data.url)
    toast.success(tt('Файл загружен'))
  } catch (err) {
    toast.error(extractError(err))
  } finally {
    loading.value = false
    e.target.value = ''
  }
}

const clear = () => emit('update:modelValue', '')
</script>

<template>
  <div class="field">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="row" style="gap: 12px;">
      <div class="avatar avatar-lg">
        <img v-if="modelValue" :src="modelValue" alt="preview" />
        <span v-else>—</span>
      </div>
      <div class="row" style="gap: 6px;">
        <button type="button" class="btn btn-sm btn-ghost" @click="onPick" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span>{{ loading ? tt('Загрузка…') : tt('Выбрать файл') }}</span>
        </button>
        <button v-if="modelValue" type="button" class="btn btn-sm btn-ghost" @click="clear">×</button>
      </div>
      <input ref="inputRef" type="file" accept="image/*" hidden @change="onChange" />
    </div>
  </div>
</template>
