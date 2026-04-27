<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { tt } from '@/composables/useTt'
import { fmtPrice, pickCatIcon } from '@/composables/usePublicData'

const props = defineProps({
  item: { type: Object, required: true },
  kind: { type: String, required: true }, // 'vacancy' | 'resume'
})

const route = useRoute()
const { locale } = useI18n()

const backTo = computed(() => {
  const base = props.kind === 'vacancy' ? 'vacancies' : 'masters'
  return `/${locale.value}/${base}`
})

const location = computed(() => [props.item.region_name, props.item.district_name, props.item.mahalla_name].filter(Boolean).join(', '))
const fallbackEmoji = computed(() => pickCatIcon(props.item.categories?.[0]?.name || props.item.title))

const fmtDate = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-GB') } catch { return '' }
}
</script>

<template>
  <div class="p-page">
    <div class="p-container">
      <div class="back-row">
        <RouterLink :to="backTo" class="back-link">
          <span>‹</span>
          <span>{{ kind === 'vacancy' ? tt('К вакансиям') : tt('К мастерам') }}</span>
        </RouterLink>
      </div>

      <div class="detail-grid">
        <article class="detail-main p-card">
          <header class="detail-head">
            <div v-if="kind === 'resume' && item.photo" class="detail-avatar">
              <img :src="item.photo" :alt="item.name" />
            </div>
            <div v-else class="detail-avatar detail-avatar-emoji"><span>{{ fallbackEmoji }}</span></div>

            <div class="detail-head-text">
              <h1 class="p-h1 detail-name">{{ item.name || item.title }}</h1>
              <div v-if="item.title && item.name" class="detail-title">{{ item.title }}</div>
              <div class="detail-status-row">
                <span class="p-status" :class="item.is_active ? 'p-status-on' : 'p-status-off'">
                  {{ item.is_active ? tt('Активен') : tt('Закрыт') }}
                </span>
                <span v-if="item.experience_year" class="p-status p-status-warn">
                  {{ item.experience_year }} {{ tt('лет опыта') }}
                </span>
              </div>
            </div>
          </header>

          <div v-if="(item.categories || []).length" class="detail-tags">
            <span v-for="c in item.categories" :key="c.id" class="ad-tag">{{ c.name }}</span>
          </div>

          <section v-if="item.text" class="detail-section">
            <h2 class="p-h2">{{ tt('Описание') }}</h2>
            <p class="detail-text">{{ item.text }}</p>
          </section>

          <section v-if="item.skills" class="detail-section">
            <h2 class="p-h2">{{ tt('Навыки') }}</h2>
            <p class="detail-text">{{ item.skills }}</p>
          </section>
        </article>

        <aside class="detail-side p-stack">
          <div class="p-card price-card">
            <div class="p-dim">{{ tt('Цена') }}</div>
            <div v-if="item.price" class="price-big">
              <span>{{ fmtPrice(item.price) }}</span>
              <span class="price-cur">{{ tt('сум') }}</span>
            </div>
            <div v-else class="price-empty">{{ tt('Договорная') }}</div>
          </div>

          <div v-if="item.contact" class="p-card">
            <div class="p-label" style="margin-bottom: 6px;">{{ tt('Контакт') }}</div>
            <a :href="`tel:${item.contact}`" class="contact-link">
              <span class="contact-icon">📞</span>
              <span>{{ item.contact }}</span>
            </a>
          </div>

          <div v-if="location || item.adress" class="p-card">
            <div class="p-label" style="margin-bottom: 6px;">{{ tt('Местоположение') }}</div>
            <div v-if="location" class="info-line">
              <span class="info-icon">📍</span><span>{{ location }}</span>
            </div>
            <div v-if="item.adress" class="info-line">
              <span class="info-icon">🏠</span><span>{{ item.adress }}</span>
            </div>
          </div>

          <div class="p-card">
            <div class="p-label" style="margin-bottom: 6px;">{{ tt('Опубликовано') }}</div>
            <div class="p-dim">{{ fmtDate(item.created_at) }}</div>
            <div v-if="item.views_count != null" class="p-dim" style="margin-top: 4px;">
              {{ tt('Просмотров') }}: {{ item.views_count }}
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-row { margin-bottom: 16px; }
.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--p-text-muted); font-size: 14px; font-weight: 600;
  text-decoration: none;
}
.back-link:hover { color: var(--p-brand); text-decoration: none; }

.detail-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; padding-bottom: 60px; }

.detail-main { display: flex; flex-direction: column; gap: 22px; }
.detail-head { display: grid; grid-template-columns: 88px 1fr; gap: 16px; align-items: start; }
.detail-avatar {
  width: 88px; height: 88px; border-radius: 18px;
  background: var(--p-bg-soft);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 38px; overflow: hidden; flex-shrink: 0;
}
.detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
.detail-avatar-emoji { color: var(--p-brand); }
.detail-head-text { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.detail-name { word-break: break-word; }
.detail-title { color: var(--p-text-muted); font-size: 15px; }
.detail-status-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }

.detail-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.ad-tag { padding: 4px 10px; border-radius: 999px; background: rgba(37,83,255,.10); color: var(--p-brand); font-size: 12px; font-weight: 600; }

.detail-section { display: flex; flex-direction: column; gap: 8px; }
.detail-text { margin: 0; line-height: 1.7; color: var(--p-text); white-space: pre-line; }

.detail-side { min-width: 0; }
.price-card { display: flex; flex-direction: column; gap: 4px; }
.price-big { font-size: clamp(24px, 2.6vw, 32px); font-weight: 800; color: var(--p-brand); display: inline-flex; align-items: baseline; gap: 8px; }
.price-cur { font-size: 14px; color: var(--p-text-muted); font-weight: 600; }
.price-empty { font-size: 18px; color: var(--p-text-muted); font-weight: 600; }

.contact-link {
  display: inline-flex; align-items: center; gap: 8px;
  color: var(--p-brand); font-weight: 700; font-size: 16px;
  text-decoration: none;
}
.contact-link:hover { text-decoration: none; }
.contact-icon { font-size: 18px; }

.info-line { display: flex; align-items: start; gap: 8px; padding: 4px 0; color: var(--p-text); font-size: 14px; }
.info-icon { font-size: 14px; }

@media (max-width: 980px) {
  .detail-grid { grid-template-columns: 1fr; }
  .detail-head { grid-template-columns: 64px 1fr; }
  .detail-avatar { width: 64px; height: 64px; font-size: 28px; }
}
</style>
