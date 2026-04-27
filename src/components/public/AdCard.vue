<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { tt } from '@/composables/useTt'
import { fmtPrice, pickCatIcon } from '@/composables/usePublicData'

const props = defineProps({
  item: { type: Object, required: true },
  kind: { type: String, required: true }, // 'resume' | 'vacancy'
})

const { locale } = useI18n()

const detailRoute = computed(() => {
  const base = props.kind === 'vacancy' ? 'vacancies' : 'masters'
  return `/${locale.value}/${base}/${props.item.slug || props.item.id}`
})

const location = computed(() => [props.item.region_name, props.item.district_name].filter(Boolean).join(', '))
const firstCategoryName = computed(() => (props.item.categories?.[0]?.name) || '')
const fallbackEmoji = computed(() => pickCatIcon(firstCategoryName.value || props.item.title))
</script>

<template>
  <RouterLink :to="detailRoute" class="ad-card">
    <header class="ad-head">
      <div v-if="kind === 'resume' && item.photo" class="ad-avatar">
        <img :src="item.photo" :alt="item.name" />
      </div>
      <div v-else class="ad-avatar ad-avatar-emoji">
        <span>{{ fallbackEmoji }}</span>
      </div>

      <div class="ad-head-text">
        <div class="ad-name">{{ item.name || item.title }}</div>
        <div class="ad-title" v-if="item.title && item.name">{{ item.title }}</div>
      </div>

      <span class="p-status" :class="item.is_active ? 'p-status-on' : 'p-status-off'">
        {{ item.is_active ? tt('Активен') : tt('Закрыт') }}
      </span>
    </header>

    <p v-if="item.text" class="ad-text">{{ item.text }}</p>

    <div v-if="(item.categories || []).length" class="ad-tags">
      <span v-for="c in item.categories.slice(0, 3)" :key="c.id" class="ad-tag">{{ c.name }}</span>
    </div>

    <div v-if="location" class="ad-loc">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span>{{ location }}</span>
    </div>

    <footer class="ad-foot">
      <div v-if="item.price" class="ad-price">
        <span class="ad-price-num">{{ fmtPrice(item.price) }}</span>
        <span class="ad-price-cur">{{ tt('сум') }}</span>
      </div>
      <div v-else class="ad-price ad-price-empty">—</div>

      <div v-if="item.experience_year" class="ad-exp">
        {{ item.experience_year }} {{ tt('лет опыта') }}
      </div>
    </footer>
  </RouterLink>
</template>

<style scoped>
.ad-card {
  background: var(--p-surface);
  border: 1px solid var(--p-border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-decoration: none;
  color: var(--p-text);
  transition: transform .15s, box-shadow .15s, border-color .15s;
}
.ad-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37,83,255,.25);
  box-shadow: 0 14px 32px rgba(15,23,42,.06);
  text-decoration: none;
}
.ad-head { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: start; }
.ad-avatar {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: var(--p-bg-soft);
  display: inline-flex; align-items: center; justify-content: center;
  overflow: hidden; font-size: 22px;
}
.ad-avatar img { width: 100%; height: 100%; object-fit: cover; }
.ad-avatar-emoji { color: var(--p-brand); }

.ad-head-text { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.ad-name { font-weight: 700; font-size: 16px; line-height: 1.25; color: var(--p-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-title { font-size: 13px; color: var(--p-text-muted); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ad-text { margin: 0; font-size: 14px; color: var(--p-text-muted); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.ad-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ad-tag {
  padding: 4px 10px; border-radius: 999px;
  background: rgba(37,83,255,.10); color: var(--p-brand);
  font-size: 12px; font-weight: 600;
}

.ad-loc { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--p-text-muted); }

.ad-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--p-border-soft);
  gap: 8px;
}
.ad-price { display: inline-flex; align-items: baseline; gap: 6px; }
.ad-price-num { font-size: 20px; font-weight: 800; color: var(--p-brand); }
.ad-price-cur { font-size: 12px; color: var(--p-text-muted); }
.ad-price-empty { color: var(--p-text-dim); }
.ad-exp { font-size: 13px; color: var(--p-text-muted); }

@media (max-width: 540px) {
  .ad-card { padding: 14px; }
  .ad-head { grid-template-columns: 40px 1fr auto; }
  .ad-avatar { width: 40px; height: 40px; }
}
</style>
