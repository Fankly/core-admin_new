<template>
  <div class="wide-table" :aria-busy="loading">
    <div v-if="loading" class="wide-table-state" role="status">
      <LoaderCircle :size="18" class="overview-spinner" aria-hidden="true" /><span>明细数据加载中…</span>
    </div>
    <div v-else-if="error" class="wide-table-state is-error" role="alert">
      <TriangleAlert :size="18" aria-hidden="true" /><span>{{ error }}</span
      ><button type="button" @click="reload">重新加载</button>
    </div>
    <p v-else-if="!rows.length" class="wide-table-state" role="status">暂无{{ title }}明细数据</p>
    <div v-else class="wide-table-wrap">
      <table class="wide-table-grid" :class="{ 'is-amount': isAmount }" :aria-label="`${title}明细表`">
        <caption v-if="!isAmount">数量单位：{{ unit }}</caption>
        <thead>
          <tr>
            <th scope="col" class="index-cell">序号</th>
            <th scope="col">预算类型</th>
            <th scope="col">项目类型</th>
            <th scope="col">{{ dimensionHeader }}</th>
            <th scope="col" class="value-cell">{{ valueHeader }}</th>
            <th scope="col" class="ratio-cell">占比</th>
          </tr>
        </thead>
        <tbody>
          <!-- 合计首行取整阶段汇总（非当前页相加），占比以该合计为分母。 -->
          <tr class="is-total-row">
            <th scope="row" colspan="4">合计</th>
            <td class="value-cell">{{ formatValue(summaryValue) }}</td>
            <td class="ratio-cell">{{ totalRatio }}</td>
          </tr>
          <!-- 一行一条接口记录：按「预算类型 + 项目类型 + 单位/专业」展示，不做透视。 -->
          <tr v-for="(row, index) in rows" :key="row.key">
            <td class="index-cell">{{ rowNumber(index) }}</td>
            <td
              ><OverviewTooltip :content="row.budget"
                ><span class="cell-text">{{ row.budget }}</span></OverviewTooltip
              ></td
            >
            <td
              ><OverviewTooltip :content="row.category"
                ><span class="cell-text">{{ row.category }}</span></OverviewTooltip
              ></td
            >
            <th scope="row"
              ><OverviewTooltip :content="row.name"
                ><span class="cell-text">{{ row.name }}</span></OverviewTooltip
              ></th
            >
            <td class="value-cell">{{ formatValue(row.value) }}</td>
            <td class="ratio-cell">{{ formatRatio(row.value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && !error && rows.length" class="wide-table-foot">
      <span class="wide-table-count">{{ countLabel }}</span>
      <label class="wide-table-page-size"
        >每页
        <select :value="pageSize" aria-label="每页条数" @change="changePageSize">
          <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} 条</option>
        </select>
      </label>
      <nav class="wide-table-pager" :aria-label="`${title}明细表分页`">
        <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <template v-for="(item, index) in pageItems" :key="`${item}-${index}`">
          <span v-if="item === '...'" class="wide-table-page-ellipsis" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            :class="{ active: item === page }"
            :aria-current="item === page ? 'page' : undefined"
            :aria-label="`第 ${item} 页`"
            @click="goPage(item)"
            >{{ item }}</button
          >
        </template>
        <button type="button" :disabled="page >= pageCount" @click="goPage(page + 1)">下一页</button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { LoaderCircle, TriangleAlert } from '@lucide/vue'
import { ElMessage } from 'element-plus'
import { PAGE_SIZES, buildPageItems } from '../data/pagination'
import { useStageWideTable } from '../composables/useStageWideTable'
import { formatOverviewRatio, formatOverviewValue, getOverviewUnit } from '../data/format'
import { calculateStatisticRatio } from '../data/totals'
import OverviewTooltip from './OverviewTooltip.vue'
import type { AmountUnit, Dimension, OrgType, RoleContext, StageId, StatMode } from '../types'

const props = withDefaults(
  defineProps<{
    stageId: StageId
    title: string
    year: string
    month: string
    /** 项目单位筛选（chooseYjdws）：所选一级单位编码，空数组表示全部。 */
    yjdws: string[]
    /** 省专业归口筛选（chooseZybms）：所选省归口部门编码，空数组表示全部。 */
    zybms: string[]
    statMode: StatMode
    amountUnit: AmountUnit
    orgType: OrgType
    dimension: Dimension
    roleContext: RoleContext
  }>(),
  { yjdws: () => [], zybms: () => [] }
)
const emit = defineEmits<{ (event: 'download-availability', available: boolean): void }>()

const {
  rows,
  summaryValue,
  loading,
  error,
  total,
  page,
  pageSize,
  pageCount,
  goPage,
  changePageSize: setPageSize,
  exportTable,
  reload
} = useStageWideTable(() => ({
  stageId: props.stageId,
  year: props.year,
  month: props.month,
  yjdws: props.yjdws,
  zybms: props.zybms,
  dimension: props.dimension,
  orgType: props.orgType,
  roleContext: props.roleContext,
  statMode: props.statMode
}))

// 每页条数来自原生 select 的 change 事件，这里取出数值再交给组合式函数。
const changePageSize = (event: Event) => {
  const size = Number((event.target as HTMLSelectElement).value)
  if (Number.isFinite(size)) setPageSize(size)
}

const isAmount = computed(() => props.statMode === 'amount')
const unit = computed(() => getOverviewUnit(props.statMode, props.amountUnit))
const dimensionLabel = computed(() => (props.dimension === 'specialty' ? '专业' : '单位'))
// 按单位口径的表头用业务口径「一级单位」；导出文件名沿用「单位/专业」，不随表头变化。
const dimensionHeader = computed(() => (props.dimension === 'specialty' ? '专业' : '一级单位'))
const valueHeader = computed(() => `${isAmount.value ? '金额' : '数量'}（${unit.value}）`)
const formatValue = (value: unknown) => formatOverviewValue(value, props.statMode, props.amountUnit)
// 每行占比与合计占比都以整阶段合计为分母现算，缺失或分母为零时显示 `--`。
const formatRatio = (value: unknown) => formatOverviewRatio(calculateStatisticRatio(value, summaryValue.value))
const totalRatio = computed(() => formatOverviewRatio(calculateStatisticRatio(summaryValue.value, summaryValue.value)))
const countLabel = computed(() => `共 ${total.value} 条记录`)
// 序号随页码与每页条数连续计算。
const rowNumber = (index: number) => (page.value - 1) * pageSize.value + index + 1

// 翻页由组合式函数直接请求接口，这里只负责把页码渲染成「首尾 + 省略号」的分页条。
const pageItems = computed(() => buildPageItems(page.value, pageCount.value))

// 下载按钮跟随表格可用性：加载中、失败或无数据时禁用。
const downloadAvailable = computed(() => !loading.value && !error.value && rows.value.length > 0)
watch(downloadAvailable, (available) => emit('download-availability', available), { immediate: true })

// 导出整张明细表（不受当前页影响）：前端只带当前筛选条件，由后端接口导出全部匹配记录。
const downloadTable = async () => {
  if (!downloadAvailable.value) return
  try {
    await exportTable(`${props.title}-${props.year}-${dimensionLabel.value}明细表`)
  } catch (error) {
    ElMessage.error((error as Error).message || '概览宽表导出失败，请重试')
  }
}
defineExpose({ downloadTable })
</script>

<style scoped lang="less">
.wide-table {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  font-variant-numeric: tabular-nums;
}
.wide-table-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
  min-height: 160px;
  padding: 24px;
  overflow: auto;
  overflow-wrap: anywhere;
  color: #64748b;
  font-size: 14px;
}
.wide-table-state.is-error button {
  padding: 4px 12px;
  border: 1px solid var(--overview-border);
  border-radius: 6px;
  color: #007d77;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}
.wide-table-wrap {
  flex: 1;
  min-width: 0;
  min-height: 0;
  // 表格直接平铺，左右各留 12px 视觉留白；内容超宽时整个表格横向滚动。
  padding: 0 12px 12px;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-color: #b8ddd9 transparent;
  scrollbar-width: thin;
}
.wide-table-grid {
  width: 100%;
  // 独立边框随吸顶表头绘制，避免合并边框在滚动时露出表体。
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
.wide-table-grid caption {
  padding-bottom: 10px;
  color: #64748b;
  text-align: center;
}
.wide-table-grid th,
.wide-table-grid td {
  padding: 10px 12px;
  line-height: 20px;
  border-right: 1px solid #e3ecee;
  border-bottom: 1px solid #e3ecee;
  text-align: center;
  white-space: nowrap;
}
.wide-table-grid th {
  border-top: 1px solid #e3ecee;
}
// 单级表头吸顶：平铺表只有一行表头，直接贴住滚动容器顶部。
.wide-table-grid thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #e6f5f3;
  color: #00766e;
  font-weight: 600;
}
.wide-table-grid tbody th {
  background: #fff;
  font-weight: 500;
}
.wide-table-grid tbody tr:nth-child(even) td,
.wide-table-grid tbody tr:nth-child(even) th {
  background: #f8fcfc;
}
// 合计行固定在表体首行并吸顶在表头下方，沿用总览表格的浅青底与加粗。
.wide-table-grid tbody tr.is-total-row > * {
  position: sticky;
  // 表头高 42px（上下 padding 20px + 行高 20px + 上下边框 2px）。
  top: 42px;
  z-index: 1;
  background: #eef8f7;
  color: #00766e;
  font-weight: 600;
}
.wide-table-grid .index-cell {
  width: 64px;
  color: #64748b;
}
// 表头与维度内容全部居中：金额列表头与其它列一致居中，只有金额数值右对齐。
.wide-table-grid .value-cell {
  min-width: 110px;
}
.wide-table-grid .ratio-cell {
  min-width: 90px;
}
.wide-table-grid.is-amount tbody .value-cell {
  text-align: right;
}
.cell-text {
  display: block;
  max-width: 200px;
  // 块级省略容器限宽后靠 margin 居中，保证表头与内容居中位置一致。
  margin: 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wide-table-foot {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid var(--overview-border);
}
.wide-table-count {
  flex: 1;
  color: #64748b;
  font-size: 12px;
  text-align: left;
}
.wide-table-page-size {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.wide-table-page-size select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  color: #475569;
  font: inherit;
  cursor: pointer;
}
.wide-table-pager {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wide-table-pager button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  color: #475569;
  background: #fff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.wide-table-pager button:not(:disabled):hover {
  border-color: #b8ddd9;
  color: #007d77;
  background: #e6f4f3;
}
.wide-table-pager button.active {
  border-color: var(--overview-teal);
  color: #fff;
  background: var(--overview-teal);
  cursor: default;
}
.wide-table-pager button:disabled {
  color: #94a3b8;
  background: #f7f9f9;
  cursor: not-allowed;
}
.wide-table-pager button:focus-visible {
  outline: 2px solid #007d77;
  outline-offset: 2px;
}
.wide-table-page-ellipsis {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
</style>
