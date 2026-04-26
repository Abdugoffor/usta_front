<script setup>
import AppModal from './AppModal.vue'
import { tt } from '@/composables/useTt'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'lg' },
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
</script>

<template>
  <AppModal
    :model-value="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="title || tt('Просмотр')"
    :size="size"
  >
    <div class="detail-body">
      <slot />
    </div>
    <template #footer>
      <button class="btn btn-ghost" @click="close">{{ tt('Закрыть') }}</button>
      <slot name="actions" />
    </template>
  </AppModal>
</template>

<style scoped>
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
