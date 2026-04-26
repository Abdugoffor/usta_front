<script setup>
import { tt } from '@/composables/useTt'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  sortBy: { type: String, default: '' },
  sortOrder: { type: String, default: 'desc' },
  rowKey: { type: String, default: 'id' },
})
const emit = defineEmits(['sort', 'row-click'])

const handleSort = (col) => {
  if (!col.sortable) return
  const key = col.sortKey || col.key
  if (props.sortBy === key) {
    emit('sort', { sortBy: key, sortOrder: props.sortOrder === 'asc' ? 'desc' : 'asc' })
  } else {
    emit('sort', { sortBy: key, sortOrder: 'asc' })
  }
}

const arrow = (col) => {
  const key = col.sortKey || col.key
  if (props.sortBy !== key) return '↕'
  return props.sortOrder === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ sortable: col.sortable }"
            :style="{ width: col.width, textAlign: col.align || 'left' }"
            @click="handleSort(col)"
          >
            {{ tt(col.label) }}
            <span v-if="col.sortable" class="sort-ind" :class="{ active: sortBy === (col.sortKey || col.key) }">
              {{ arrow(col) }}
            </span>
          </th>
          <th v-if="$slots.actions" style="width: 1%; text-align: right;">{{ tt('Действия') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
            <div class="center-pad"><span class="spinner spinner-lg" /></div>
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
            <div class="empty">
              <div class="empty-icon">∅</div>
              <div>{{ tt('Нет данных') }}</div>
            </div>
          </td>
        </tr>
        <tr v-else v-for="row in rows" :key="row[rowKey]" @click="emit('row-click', row)">
          <td v-for="col in columns" :key="col.key" :style="{ textAlign: col.align || 'left' }">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" @click.stop>
            <div class="row-actions">
              <slot name="actions" :row="row" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
