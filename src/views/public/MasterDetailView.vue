<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { clientResumes } from '@/api/endpoints'
import { tt } from '@/composables/useTt'
import AdDetail from '@/components/public/AdDetail.vue'

const route = useRoute()
const { locale } = useI18n()

const item = ref(null)
const loading = ref(false)
const notFound = ref(false)

const load = async () => {
  loading.value = true
  notFound.value = false
  try {
    const { data } = await clientResumes.getBySlug(route.params.slug)
    item.value = data
  } catch (e) {
    if (e?.response?.status === 404) notFound.value = true
    item.value = null
  } finally { loading.value = false }
}

onMounted(load)
watch(() => route.params.slug, load)
</script>

<template>
  <div v-if="loading" class="p-page">
    <div class="p-container"><div class="p-empty"><div class="p-spinner" /><span>{{ tt('Загрузка…') }}</span></div></div>
  </div>
  <div v-else-if="notFound || !item" class="p-page">
    <div class="p-container">
      <div class="p-empty">
        <div class="p-empty-icon">∅</div>
        <span>{{ tt('Мастер не найден') }}</span>
        <RouterLink :to="`/${locale}/masters`" class="p-btn p-btn-ghost" style="margin-top: 12px;">{{ tt('К мастерам') }}</RouterLink>
      </div>
    </div>
  </div>
  <AdDetail v-else :item="item" kind="resume" />
</template>
