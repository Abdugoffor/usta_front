<script setup>
import { tt } from '@/composables/useTt'

defineProps({
  pageIndex: { type: Number, default: 0 },
  hasMore: { type: Boolean, default: false },
  canPrev: { type: Boolean, default: false },
  total: { type: [Number, null], default: null },
})
defineEmits(['prev', 'next'])
</script>

<template>
  <div class="pagination">
    <div>
      <span v-if="total !== null">{{ tt('Всего') }}: <b>{{ total }}</b></span>
    </div>
    <div class="row" style="gap: 8px;">
      <span class="dim">{{ tt('Страница') }} {{ pageIndex + 1 }}</span>
      <button class="btn btn-sm btn-ghost" :disabled="!canPrev" @click="$emit('prev')">‹ {{ tt('Назад') }}</button>
      <button class="btn btn-sm btn-ghost" :disabled="!hasMore" @click="$emit('next')">{{ tt('Дальше') }} ›</button>
    </div>
  </div>
</template>
