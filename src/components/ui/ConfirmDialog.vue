<script setup>
import AppModal from './AppModal.vue'
import { tt } from '@/composables/useTt'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'confirm'])
const close = () => emit('update:modelValue', false)
const ok = () => emit('confirm')
</script>

<template>
  <AppModal :model-value="modelValue" @update:modelValue="emit('update:modelValue', $event)" :title="title || tt('Подтвердить')">
    <p style="margin: 0 0 4px;">{{ message || tt('Вы действительно хотите удалить?') }}</p>
    <template #footer>
      <button class="btn btn-ghost" @click="close" :disabled="loading">{{ tt('Отмена') }}</button>
      <button class="btn btn-danger" @click="ok" :disabled="loading">
        <span v-if="loading" class="spinner" />
        <span>{{ tt('Удалить') }}</span>
      </button>
    </template>
  </AppModal>
</template>
