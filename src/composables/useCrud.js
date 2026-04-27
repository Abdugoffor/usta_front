import { ref, reactive, computed } from 'vue'
import { extractError } from '@/api/client'
import { useToastStore } from '@/stores/toast'

/**
 * api: { list, create, update, remove, count? }
 * Backend list response: { data: [...], meta: { limit, has_more, next_cursor } }
 * Pagination: send `cursor=<next_cursor>` exactly as received.
 */
export function useCrud(api, defaultFilter = {}, defaultSort = { sortBy: 'id', sortOrder: 'desc' }) {
  const toast = useToastStore()

  const items = ref([])
  const loading = ref(false)
  const total = ref(null)
  const sortBy = ref(defaultSort.sortBy)
  const sortOrder = ref(defaultSort.sortOrder)
  const limit = ref(10)
  const filter = reactive({ ...defaultFilter })

  // Stack of cursor strings used to load each page. Index 0 = first page = null.
  const cursorStack = ref([null])
  const pageIndex = ref(0)
  const hasMore = ref(false)
  const nextCursor = ref('')

  const buildParams = (cursor) => {
    const p = {
      limit: limit.value,
      sort_by: sortBy.value,
      sort_order: sortOrder.value,
    }
    if (cursor) p.cursor = cursor
    for (const k of Object.keys(filter)) {
      const v = filter[k]
      if (v === '' || v === null || v === undefined) continue
      if (Array.isArray(v)) {
        if (v.length === 0) continue
        p[k] = v.join(',')
        continue
      }
      p[k] = v
    }
    return p
  }

  const load = async () => {
    loading.value = true
    try {
      const params = buildParams(cursorStack.value[pageIndex.value])
      const { data } = await api.list(params)
      items.value = Array.isArray(data) ? data : data.data || []
      const meta = data.meta || {}
      hasMore.value = !!meta.has_more
      nextCursor.value = meta.next_cursor || ''
    } catch (err) {
      toast.error(extractError(err))
      items.value = []
      hasMore.value = false
      nextCursor.value = ''
    } finally {
      loading.value = false
    }

    if (api.count) {
      const countParams = {}
      for (const k of Object.keys(filter)) {
        const v = filter[k]
        if (v === '' || v === null || v === undefined) continue
        if (Array.isArray(v)) {
          if (v.length === 0) continue
          countParams[k] = v.join(',')
          continue
        }
        countParams[k] = v
      }
      api.count(countParams)
        .then((r) => { total.value = r.data?.total ?? null })
        .catch(() => { /* ignore */ })
    }
  }

  const reload = async () => {
    cursorStack.value = [null]
    pageIndex.value = 0
    await load()
  }

  const next = async () => {
    if (!hasMore.value || !nextCursor.value) return
    cursorStack.value = cursorStack.value.slice(0, pageIndex.value + 1)
    cursorStack.value.push(nextCursor.value)
    pageIndex.value++
    await load()
  }

  const prev = async () => {
    if (pageIndex.value === 0) return
    pageIndex.value--
    await load()
  }

  const onSort = async ({ sortBy: sb, sortOrder: so }) => {
    sortBy.value = sb
    sortOrder.value = so
    await reload()
  }

  const applyFilter = async (changes = {}) => {
    Object.assign(filter, changes)
    await reload()
  }

  const resetFilter = async () => {
    for (const k of Object.keys(filter)) {
      const def = defaultFilter[k]
      filter[k] = Array.isArray(def) ? [...def] : (def ?? '')
    }
    await reload()
  }

  const create = async (payload) => {
    try { await api.create(payload); toast.success('✓'); await reload(); return { ok: true } }
    catch (err) { toast.error(extractError(err)); return { ok: false, error: extractError(err) } }
  }
  const update = async (id, payload) => {
    try { await api.update(id, payload); toast.success('✓'); await load(); return { ok: true } }
    catch (err) { toast.error(extractError(err)); return { ok: false, error: extractError(err) } }
  }
  const remove = async (id) => {
    try { await api.remove(id); toast.success('✓'); await load(); return { ok: true } }
    catch (err) { toast.error(extractError(err)); return { ok: false } }
  }

  const canPrev = computed(() => pageIndex.value > 0)

  return {
    items, loading, total, sortBy, sortOrder, limit, filter,
    pageIndex, hasMore, canPrev,
    load, reload, next, prev, onSort, applyFilter, resetFilter,
    create, update, remove,
  }
}
