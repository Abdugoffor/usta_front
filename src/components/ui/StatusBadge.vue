<script setup>
import { tt } from '@/composables/useTt'
defineProps({ active: { type: Boolean, default: true } })
</script>

<template>
  <span class="badge badge-dot" :class="active ? 'badge-success' : 'badge-danger'">
    {{ active ? tt('Активный') : tt('Неактивный') }}
  </span>
</template>
