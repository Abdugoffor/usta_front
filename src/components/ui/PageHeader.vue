<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>

<template>
  <div class="row-between" style="flex-wrap: wrap; gap: 14px;">
    <div>
      <h1 class="h1 title-gradient">{{ title }}</h1>
      <p v-if="subtitle" class="muted" style="margin: 4px 0 0;">{{ subtitle }}</p>
    </div>
    <div class="row" style="gap: 8px;">
      <slot name="actions" />
    </div>
  </div>
</template>
