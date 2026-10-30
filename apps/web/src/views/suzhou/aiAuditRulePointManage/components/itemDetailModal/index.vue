<!-- 事项明细弹窗（看板「应用项目分布」穿透）
     契约：docs/项目规则监控中心接口协议.doc 三、应用项目分布事项明细 getProTypeRelaSsyd -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="900"
    height="620"
    @close="handleClose"
  >
    <div class="detail-modal-body">
      <RangeVxeTable
        class="detail-range-table"
        row-key="rowId"
        :border="true"
        :stripe="true"
        :pagination="false"
        :request-auto="true"
        :request-api="getList"
        :columns="columns"
      >
        <template #proType="{ row }">
          <span class="detail-tag detail-tag--primary">{{ row.name }}</span>
        </template>
        <template #points="{ row }">
          <!-- 已分配审核要点数量：点开二级弹层（文档十四，入参是预算事项编码 zyssxbm） -->
          <span
            v-if="Number(row.ssydCnt) > 0"
            class="detail-tag detail-tag--primary detail-tag--link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.zyssxmc || '当前预算事项'}」的审核要点清单`"
            @click.stop="openPointList(row)"
            @keydown.enter.stop="openPointList(row)"
            @keydown.space.prevent.stop="openPointList(row)"
          >
            <svg class="detail-tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {{ row.ssydCnt }} 个
          </span>
          <span v-else class="detail-empty">-</span>
        </template>
        <template #pointList="{ row }">
          <div class="detail-tag-group">
            <span class="detail-tag" v-for="(point, index) in row.ssyds || []" :key="`${point}-${index}`">{{ point }}</span>
          </div>
        </template>
      </RangeVxeTable>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'itemDetailModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getProTypeRelaSsyd } from '@/api/suzhou/aiAuditRuleMonitoring'
import type { ProTypeSsydRow } from '@/api/suzhou/aiAuditRuleMonitoring'

/** 表格行：接口字段 + 表格要求的唯一 rowKey */
interface ItemDetailTableRow extends ProTypeSsydRow {
  rowId: string
}

interface ModalParams {
  /** 项目类型名称，仅用于标题 */
  proTypeName?: string
  /** 项目类型id，接口必传 */
  id?: string
}

const emit = defineEmits<{
  (event: 'open-yssx-point-list', payload: { zyssxbm: string; zyssxmc: string }): void
}>()

const isShowModal = ref(false)
const modalTitle = ref('事项明细')
const proTypeId = ref('')

/**
 * 二级穿透带的是**预算事项编码 zyssxbm**（文档十四 getYssxRelaRulePage 的入参）。
 *
 * ⚠️ 上一级接口（文档三）的返参表里并没有这个字段，而这一级非它不可 ——
 *    所以这里做了显式拦截：行上没有编码就明确提示，不拿名称之类的值去凑，
 *    免得发一个必然查不到东西的请求（后端补上该字段后自然就走通了）。
 */
const openPointList = (row: ItemDetailTableRow) => {
  const zyssxbm = String(row.zyssxbm || '').trim()
  if (!zyssxbm) return ElMessage.warning('当前预算事项缺少编码（zyssxbm），无法查看关联审核要点')
  emit('open-yssx-point-list', { zyssxbm, zyssxmc: String(row.zyssxmc || '') })
}

/**
 * 列按接口文档「三、应用项目分布事项明细」的返参对照：
 * 事项名称 zyssxmc / 项目类型 name / 审核要点数量 ssydCnt / 审核要点集合 ssyds。
 * 原型里的 item、points、pointList 三个名字后端都不用，已改回真实字段名。
 */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 70, headerAlign: 'center' },
  { field: 'name', title: '项目类型', width: 130, headerAlign: 'center', slots: { default: 'proType' } },
  { field: 'zyssxmc', title: '事项名称', minWidth: 180, align: 'left', headerAlign: 'center' },
  { field: 'ssydCnt', title: '已分配审核要点数量', width: 170, headerAlign: 'center', slots: { default: 'points' } },
  { field: 'ssyds', title: '已分配审核要点', minWidth: 380, align: 'left', headerAlign: 'center', slots: { default: 'pointList' } }
]

/**
 * 不分页（文档：是否分页 否）。
 *
 * ⚠️ 必须返回**接口响应对象**而不是裸数组：RangeVxeTable 取的是 `res?.data`
 * （useRangeVxeTable.ts:430/439），返回裸数组会让 res.data 变成 undefined，表格静默空白。
 */
const getList = async () => {
  const res = await getProTypeRelaSsyd({ id: proTypeId.value })
  if (!res.success) {
    ElMessage.error(res.msg || '事项明细获取失败')
    return { ...res, data: [] as ProTypeSsydRow[] }
  }
  const rows: ProTypeSsydRow[] = Array.isArray(res.data) ? res.data : []
  return { ...res, data: rows.map((item, index) => ({ ...item, rowId: `${proTypeId.value}-${index}` })) }
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = (params: ModalParams = {}) => {
  proTypeId.value = params.id || ''
  modalTitle.value = params.proTypeName ? `${params.proTypeName} · 事项明细` : '事项明细'
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';
</style>
