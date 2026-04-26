<script setup>
defineProps({
  items: { type: Array, default: () => [] }, // [{ label, value, html?: bool, full?: bool }]
  title: { type: String, default: '' },
})
</script>

<template>
  <section class="info-block">
    <h3 v-if="title" class="info-title">{{ title }}</h3>
    <dl class="info-grid">
      <div
        v-for="(it, i) in items"
        :key="i"
        class="info-row"
        :class="{ 'span-full': it.full }"
      >
        <dt class="info-label">{{ it.label }}</dt>
        <dd class="info-value">
          <slot :name="`value-${it.key}`" :item="it">
            <template v-if="it.html"><span v-html="it.value" /></template>
            <template v-else>{{ it.value === '' || it.value === null || it.value === undefined ? '—' : it.value }}</template>
          </slot>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.info-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--c-border);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 18px;
  margin: 0;
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.info-row.span-full { grid-column: 1 / -1; }
.info-label {
  font-size: 11px;
  color: var(--c-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.info-value {
  margin: 0;
  font-size: 14px;
  color: var(--c-text);
  word-break: break-word;
}
</style>
