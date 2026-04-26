<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <div class="toasts">
      <div v-for="t in toast.items" :key="t.id" class="toast" :class="`toast-${t.type}`">
        <span class="grow">{{ t.message }}</span>
        <button class="btn btn-icon" @click="toast.dismiss(t.id)" aria-label="close">×</button>
      </div>
    </div>
  </Teleport>
</template>
