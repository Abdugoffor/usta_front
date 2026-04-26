<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label class="toggle-row" :class="{ disabled }" @click.prevent="toggle">
    <span class="toggle" :class="{ on: modelValue }">
      <span class="dot" />
    </span>
    <span class="toggle-text">
      <span v-if="label" class="toggle-label">{{ label }}</span>
      <span v-if="hint" class="toggle-hint">{{ hint }}</span>
    </span>
  </label>
</template>

<style scoped>
.toggle-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.toggle-row.disabled { opacity: 0.55; cursor: not-allowed; }

.toggle {
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  position: relative;
  transition: background 0.15s ease, border 0.15s ease;
  flex-shrink: 0;
}
.toggle .dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--c-text-muted);
  transition: transform 0.18s ease, background 0.15s ease;
}
.toggle.on {
  background: var(--c-accent-soft);
  border-color: var(--c-accent);
}
.toggle.on .dot {
  transform: translateX(18px);
  background: var(--c-accent);
}

.toggle-text { display: flex; flex-direction: column; line-height: 1.25; }
.toggle-label { font-size: 13px; font-weight: 500; color: var(--c-text); }
.toggle-hint  { font-size: 12px; color: var(--c-text-muted); }
</style>
