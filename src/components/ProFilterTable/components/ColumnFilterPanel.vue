<template>
  <el-popover v-model:visible="popoverVisible" placement="bottom" :width="260" trigger="click" popper-class="pro-filter-popover" :show-arrow="true">
    <template #reference>
      <span class="filter-trigger" @click.stop>
        <!-- 漏斗图标：激活态主色，否则弱色 -->
        <svg class="funnel-icon" :class="{ active: isActive }" viewBox="0 0 1024 1024" width="14" height="14">
          <path
            d="M832 128H192c-19.2 0-32 12.8-32 32v32c0 6.4 6.4 16 12.8 22.4l288 288V800c0 12.8 6.4 22.4 19.2 28.8 6.4 6.4 12.8 6.4 19.2 6.4 6.4 0 12.8 0 19.2-6.4l128-96c12.8-6.4 19.2-19.2 19.2-32V502.4l288-288c6.4-6.4 12.8-16 12.8-22.4v-32c0-19.2-12.8-32-32-32z"
            fill="currentColor"
          />
        </svg>
      </span>
    </template>

    <div class="filter-panel">
      <!-- 排序：默认 / 升序 / 降序，icon + 文字，无边框 -->
      <div class="sort-bar">
        <div
          class="sort-item"
          :class="{ 'is-active': sortState.prop === column.prop && sortState.order === '' }"
          title="默认"
          @click="handleSort('default')"
        >
          <i class="el-icon-sort"></i><span>默认</span>
        </div>
        <div
          class="sort-item"
          :class="{ 'is-active': sortState.prop === column.prop && sortState.order === 'asc' }"
          title="升序"
          @click="handleSort('asc')"
        >
          <i class="el-icon-top"></i><span>升序</span>
        </div>
        <div
          class="sort-item"
          :class="{ 'is-active': sortState.prop === column.prop && sortState.order === 'desc' }"
          title="降序"
          @click="handleSort('desc')"
        >
          <i class="el-icon-bottom"></i><span>降序</span>
        </div>
      </div>

      <!-- 文本列：搜索 + 多选 -->
      <template v-if="filterType === 'text'">
        <el-input v-model="searchText" size="mini" placeholder="搜索" clearable class="text-search" />
        <div class="text-actions">
          <div class="action-link" @click="selectAll">全选</div>
          <div class="action-link" @click="invertSelect">反选</div>
          <div class="action-link" @click="clearText">清空</div>
        </div>
        <el-checkbox-group v-model="draftSelected" class="text-list">
          <el-checkbox v-for="opt in filteredOptions" :key="opt.value + ''" :label="opt.value">
            <span :title="opt.label">{{ opt.label || '(空)' }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </template>

      <!-- 数值列：区间 -->
      <template v-else-if="filterType === 'number'">
        <div class="range-tip">设置数值区间（留空表示不限）</div>
        <div class="number-range">
          <el-input-number
            v-model="draftRange[0]"
            size="mini"
            :controls="false"
            :precision="filterConf?.precision"
            placeholder="最小"
            class="range-input"
          />
          <span class="range-sep">~</span>
          <el-input-number
            v-model="draftRange[1]"
            size="mini"
            :controls="false"
            :precision="filterConf?.precision"
            placeholder="最大"
            class="range-input"
          />
        </div>
      </template>

      <!-- 日期列：区间 / 之前 / 之后 -->
      <template v-else-if="filterType === 'date'">
        <div class="date-mode-bar">
          <div class="date-mode-item" :class="{ 'is-active': draftDateMode === 'between' }" title="区间" @click="draftDateMode = 'between'">
            区间
          </div>
          <div class="date-mode-item" :class="{ 'is-active': draftDateMode === 'before' }" title="之前" @click="draftDateMode = 'before'"> 之前 </div>
          <div class="date-mode-item" :class="{ 'is-active': draftDateMode === 'after' }" title="之后" @click="draftDateMode = 'after'"> 之后 </div>
        </div>
        <!-- 区间：两个日期 -->
        <el-date-picker
          v-if="draftDateMode === 'between'"
          v-model="draftDateRange"
          size="mini"
          type="daterange"
          range-separator="~"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          unlink-panels
          clearable
          style="width: 100%"
        />
        <!-- 之前 / 之后：单日期 -->
        <el-date-picker
          v-else
          v-model="draftDateValue"
          size="mini"
          type="date"
          :placeholder="draftDateMode === 'before' ? '该日期之前' : '该日期之后'"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 100%"
        />
      </template>

      <!-- 底部操作：重置 / 确定，均为无边框 div -->
      <div class="panel-footer">
        <div class="footer-btn footer-btn--reset" @click="resetColumn">重置</div>
        <div class="footer-btn footer-btn--ok" @click="confirmFilter">确定</div>
      </div>
    </div>
  </el-popover>
</template>

<script lang="ts">
export default {
  name: 'ColumnFilterPanel'
}
</script>

<script setup lang="ts" name="ColumnFilterPanel">
import { ref, computed, watch, inject } from 'vue'
import { ColumnProps, FilterCondition, ProFilterContext, EnumProps, FieldNamesProps } from '../interface'
import { handleRowAccordingToProp } from '@/utils'

const props = defineProps<{ column: ColumnProps }>()

// 由 index.vue provide 的筛选上下文
const ctx = inject<ProFilterContext>('proFilterContext')!

// ---------- 筛选类型推断 ----------
const filterConf = computed(() => {
  if (!props.column.filter) return null
  if (props.column.filter === true) {
    // true 表示默认推断：暂按 text 处理，由列实际数据决定
    return { type: 'text' as const }
  }
  return props.column.filter
})
const filterType = computed(() => filterConf.value?.type ?? 'text')

// ---------- 候选项（text 列） ----------
// 取行原始值
const rowValue = (row: any) => handleRowAccordingToProp(row, props.column.prop!)

// 把行原始值映射成显示 label（用于候选项展示），若有 enum + fieldNames 则按字典翻译
const enumList = computed(() => ctx.enumMap.value.get(props.column.prop!))
const fieldNames = computed<FieldNamesProps | undefined>(() => props.column.fieldNames)

// 行值翻译为显示文本
const toDisplay = (val: any): string => {
  if (enumList.value && fieldNames.value) {
    const item = enumList.value.find((o: any) => o[fieldNames.value!.value] === val)
    if (item) return item[fieldNames.value!.label]
  }
  if (val === null || val === undefined || val === '' || val === '-') return '(空)'
  return String(val)
}

// 候选选项：优先用 filterConf.options，否则从当前页数据取唯一值
const options = computed<EnumProps[]>(() => {
  if (filterConf.value && (filterConf.value as any).options) {
    const raw = (filterConf.value as any).options
    const arr = Array.isArray(raw) ? raw : (raw as any).value ?? []
    if (fieldNames.value) {
      return arr.map((o: any) => ({
        label: o[fieldNames.value!.label],
        value: o[fieldNames.value!.value]
      }))
    }
    return arr.map((o: any) => ({ label: o.label ?? o.value, value: o.value }))
  }
  // 从当前页数据取唯一值
  const seen = new Map<string, any>()
  ctx.rawData.value.forEach((row: any) => {
    const v = rowValue(row)
    const key = v === null || v === undefined ? '' : String(v)
    if (!seen.has(key)) seen.set(key, v)
  })
  return Array.from(seen.entries()).map(([key, v]) => ({ label: toDisplay(v), value: key === '' ? '' : v }))
})

// ---------- 草稿（确定前不生效） ----------
const popoverVisible = ref(false)
const draftSelected = ref<any[]>([])
const draftRange = ref<[number | undefined, number | undefined]>([undefined, undefined])
const draftDateMode = ref<'between' | 'before' | 'after'>('between')
const draftDateRange = ref<[string, string] | null>(null)
const draftDateValue = ref<string | null>(null)
const searchText = ref('')

// 搜索过滤候选
const filteredOptions = computed(() => {
  if (!searchText.value) return options.value
  const kw = searchText.value.toLowerCase()
  return options.value.filter((o) => (o.label ?? '').toLowerCase().includes(kw))
})

// ---------- 打开时把已生效条件回显到草稿 ----------
watch(popoverVisible, (v) => {
  if (v) {
    const cond = ctx.filterState[props.column.prop!] || {}
    if (filterType.value === 'text') {
      draftSelected.value = [...(cond.selected || [])]
    } else if (filterType.value === 'number') {
      draftRange.value = [cond.range?.[0], cond.range?.[1]]
    } else if (filterType.value === 'date') {
      draftDateMode.value = cond.dateMode || 'between'
      draftDateRange.value = cond.dateRange ? [...cond.dateRange] : null
      draftDateValue.value = cond.dateValue ?? null
    }
    searchText.value = ''
  }
})

// ---------- 是否激活（已生效筛选条件） ----------
const isActive = computed(() => {
  const cond = ctx.filterState[props.column.prop!]
  if (!cond) return false
  if (filterType.value === 'text') return !!(cond.selected && cond.selected.length)
  if (filterType.value === 'number') return !!(cond.range && (cond.range[0] != null || cond.range[1] != null))
  if (filterType.value === 'date') {
    const mode = cond.dateMode || 'between'
    if (mode === 'between') return !!(cond.dateRange && cond.dateRange.length)
    return !!cond.dateValue
  }
  return false
})

// ---------- 操作 ----------
const selectAll = () => {
  draftSelected.value = options.value.map((o) => o.value)
}
const invertSelect = () => {
  const set = new Set(draftSelected.value.map((v) => String(v)))
  draftSelected.value = options.value.filter((o) => !set.has(String(o.value))).map((o) => o.value)
}
const clearText = () => {
  draftSelected.value = []
}

const sortState = computed(() => ctx.sortState)
// 排序：点击升/降直接应用；点击默认 = 清空排序
const handleSort = (order: 'asc' | 'desc' | 'default') => {
  if (order === 'default') {
    ctx.clearSort()
  } else {
    ctx.applySort(props.column.prop!, order)
  }
  popoverVisible.value = false
}

const confirmFilter = () => {
  let cond: FilterCondition = {}
  if (filterType.value === 'text') {
    cond.selected = [...draftSelected.value]
  } else if (filterType.value === 'number') {
    cond.range = [draftRange.value[0], draftRange.value[1]]
  } else if (filterType.value === 'date') {
    cond.dateMode = draftDateMode.value
    cond.dateRange = draftDateMode.value === 'between' ? draftDateRange.value : null
    cond.dateValue = draftDateMode.value === 'before' || draftDateMode.value === 'after' ? draftDateValue.value : null
  }
  ctx.applyFilter(props.column.prop!, cond)
  popoverVisible.value = false
}

const resetColumn = () => {
  ctx.clearFilter(props.column.prop!)
  if (filterType.value === 'text') draftSelected.value = []
  if (filterType.value === 'number') draftRange.value = [undefined, undefined]
  if (filterType.value === 'date') {
    draftDateMode.value = 'between'
    draftDateRange.value = null
    draftDateValue.value = null
  }
  popoverVisible.value = false
}
</script>

<style scoped lang="scss">
.filter-trigger {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  cursor: pointer;
  vertical-align: middle;
}
.funnel-icon {
  color: #94a3b8;
  transition: color 0.2s;
}
.funnel-icon.active {
  color: #00706b;
}
.filter-trigger:hover .funnel-icon {
  color: #00706b;
}
</style>

<style lang="scss">
/* popover 内容样式（非 scoped，作用于 popper） */
.pro-filter-popover.el-popover.el-popper {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  /* 弹窗本身不滚动，只让内部 .text-list 滚动 */
  overflow: hidden;
  max-height: 60vh;
  .filter-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: #1e293b;
    max-height: 60vh;
    overflow: hidden;
  }
  /* 排序区：三个无边框 div（icon + 文字） */
  .sort-bar {
    display: flex;
    gap: 4px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
    .sort-item {
      display: inline-flex;
      align-items: center;
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      cursor: pointer;
      color: #64748b;
      font-size: 12px;
      user-select: none;
      transition: background 0.2s, color 0.2s;
      i {
        margin-right: 4px;
        font-size: 14px;
      }
      &:hover {
        color: #00706b;
        background: #f2f9f8;
      }
      &.is-active {
        color: #00706b;
        background: #e6f4f3;
      }
    }
  }
  .text-search {
    margin-bottom: 4px;
  }
  /* 文本全选/反选/清空：无边框链接样式 div */
  .text-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
    .action-link {
      cursor: pointer;
      color: #00706b;
      font-size: 12px;
      user-select: none;
      &:hover {
        color: #005f5a;
      }
    }
  }
  .text-list {
    /* flex 子项：撑满剩余空间并内部滚动，弹窗与面板本身不滚动 */
    flex: 1 1 auto;
    min-height: 60px;
    max-height: 200px;
    overflow: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    .el-checkbox {
      margin-right: 0;
      height: auto;
      line-height: 1.6;
    }
    .el-checkbox__label {
      font-size: 12px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
  }
  .range-tip {
    font-size: 12px;
    color: #64748b;
  }
  /* 日期模式切换：区间 / 之前 / 之后，无边框 div */
  .date-mode-bar {
    display: flex;
    gap: 4px;
    .date-mode-item {
      display: inline-flex;
      align-items: center;
      height: 26px;
      padding: 0 12px;
      border-radius: 6px;
      cursor: pointer;
      color: #64748b;
      font-size: 12px;
      user-select: none;
      transition: background 0.2s, color 0.2s;
      &:hover {
        color: #00706b;
        background: #f2f9f8;
      }
      &.is-active {
        color: #00706b;
        background: #e6f4f3;
      }
    }
  }
  .number-range {
    display: flex;
    align-items: center;
    gap: 6px;
    .range-input {
      flex: 1;
      min-width: 0;
    }
    .range-sep {
      color: #64748b;
    }
  }
  /* 底部按钮：均为无边框 div */
  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
    margin-top: 4px;
    .footer-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      padding: 0 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s, color 0.2s;
    }
    .footer-btn--reset {
      color: #475569;
      &:hover {
        color: #00706b;
        background: #f2f9f8;
      }
    }
    .footer-btn--ok {
      color: #ffffff;
      background: #00706b;
      &:hover {
        background: #005f5a;
      }
    }
  }
}
</style>
