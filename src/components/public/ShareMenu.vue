<script setup>
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { tt } from '@/composables/useTt'

const props = defineProps({
  url:     { type: String, default: '' },
  title:   { type: String, default: '' },
  contact: { type: String, default: '' },
  size:    { type: Number, default: 36 },
})

const { locale } = useI18n()

const open = ref(false)
const copied = ref(false)
const root = ref(null)
const placeUp = ref(false)
const alignLeft = ref(false)

const resolvedUrl = computed(() => {
  const u = (props.url || '').trim()
  if (!u) return typeof window !== 'undefined' ? window.location.href : ''
  if (typeof window === 'undefined') return u
  try { return new URL(u, window.location.origin).href } catch { return u }
})

const telLink = computed(() => {
  const c = (props.contact || '').replace(/[^\d+]/g, '')
  return c ? `tel:${c}` : ''
})

const tgShare = computed(() => {
  const u = encodeURIComponent(resolvedUrl.value)
  const t = encodeURIComponent(props.title || '')
  return `https://t.me/share/url?url=${u}&text=${t}`
})

const stop = (e) => { e.preventDefault(); e.stopPropagation() }

const updatePlacement = () => {
  if (!root.value) return
  const r = root.value.getBoundingClientRect()
  const vh = window.innerHeight || document.documentElement.clientHeight
  const vw = window.innerWidth || document.documentElement.clientWidth
  const menuH = 180
  const menuW = 220
  placeUp.value = (vh - r.bottom < menuH) && (r.top > menuH)
  alignLeft.value = (vw - r.right < menuW) ? false : (r.left < menuW ? true : false)
}

const toggle = (e) => {
  stop(e)
  const next = !open.value
  open.value = next
  if (next) nextTick(updatePlacement)
}
const close = () => { open.value = false }

const onDocClick = (e) => {
  if (!root.value) return
  if (!root.value.contains(e.target)) close()
}
const onKey = (e) => { if (e.key === 'Escape') close() }

const onWinChange = () => { if (open.value) updatePlacement() }

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', onWinChange)
  window.addEventListener('scroll', onWinChange, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onWinChange)
  window.removeEventListener('scroll', onWinChange, true)
})

const copyUrl = async (e) => {
  stop(e)
  const text = resolvedUrl.value
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    try { document.execCommand('copy'); copied.value = true } catch {}
    document.body.removeChild(el)
  }
  setTimeout(() => { copied.value = false }, 1500)
}

const onCallClick = (e) => { stop(e); if (telLink.value) window.location.href = telLink.value; close() }
const onTgClick = (e) => { stop(e); window.open(tgShare.value, '_blank', 'noopener'); close() }
</script>

<template>
  <div ref="root" class="share-wrap" :class="{ 'is-open': open }">
    <button
      type="button"
      class="share-toggle"
      :style="{ width: size + 'px', height: size + 'px' }"
      :title="tt('Поделиться')"
      :aria-label="tt('Поделиться')"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    </button>

    <div v-if="open" class="share-menu" :class="{ 'is-up': placeUp, 'is-left': alignLeft }" @click.stop>
      <button v-if="telLink" type="button" class="share-item" @click="onCallClick">
        <span class="share-item-ic">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72a2 2 0 0 1 1.72 2z"/>
          </svg>
        </span>
        <span>{{ tt('Позвонить') }}</span>
      </button>
      <button type="button" class="share-item share-tg" @click="onTgClick">
        <span class="share-item-ic">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M21.5 4.5 2.7 11.7c-.9.4-.9 1 .1 1.3l4.8 1.5 1.8 5.7c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.4-2.4 4.9 3.6c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.4-1.7-1.5-1.3zM9.6 14.7l11-7-9.1 8.2-.4 4.1-1.5-5.3z"/>
          </svg>
        </span>
        <span>Telegram</span>
      </button>
      <button type="button" class="share-item" @click="copyUrl">
        <span class="share-item-ic">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </span>
        <span>{{ copied ? tt('Скопировано') : tt('Скопировать ссылку') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.share-wrap { position: relative; display: inline-flex; }
.share-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--p-border);
  background: var(--p-surface);
  color: var(--p-text);
  cursor: pointer; padding: 0;
  transition: background .15s, border-color .15s, color .15s, transform .05s;
}
.share-toggle:hover { background: var(--p-bg-soft); color: var(--p-brand); border-color: rgba(37,83,255,.35); }
.share-toggle:active { transform: translateY(1px); }
.share-wrap.is-open .share-toggle { background: var(--p-brand); color: #fff; border-color: var(--p-brand); }

.share-menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  min-width: 200px; max-width: calc(100vw - 24px);
  background: var(--p-surface);
  border: 1px solid var(--p-border);
  border-radius: 12px;
  box-shadow: 0 14px 32px rgba(15,23,42,.12);
  padding: 6px; z-index: 30;
  display: flex; flex-direction: column; gap: 2px;
}
.share-menu.is-up { top: auto; bottom: calc(100% + 6px); }
.share-menu.is-left { right: auto; left: 0; }
.share-item {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  border: 0; background: transparent; cursor: pointer;
  font: inherit; font-size: 13px; font-weight: 600;
  color: var(--p-text); text-align: left; width: 100%;
}
.share-item:hover { background: var(--p-bg-soft); color: var(--p-brand); }
.share-item-ic { display: inline-flex; align-items: center; justify-content: center; width: 20px; }
.share-tg .share-item-ic { color: #229ED9; }
</style>
