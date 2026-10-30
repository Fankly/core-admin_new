<!-- 预算事项关联审核要点弹窗（看板「应用分布」穿透的二级明细）
     契约：docs/项目规则监控中心接口协议.doc 十四、应用分布-预算事项关联审核要点分页 getYssxRelaRulePage

     层级关系：看板卡片2「应用分布」→ 事项明细弹窗（itemDetailModal，文档三）
               → 本弹窗（点「已分配审核要点数量」那一格，文档十四，入参是预算事项编码 zyssxbm）

     尺寸刻意比上一级（900×620）小一圈（760×520）：两层叠着时一眼能看出是「弹窗里的弹窗」，
     而不是同一张明细被打开了两次（本弹窗只有 4 列，本来也不需要那么宽）。 -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="760"
    height="520"
    @close="handleClose"
  >
    <div class="detail-modal-body">
      <RangeVxeTable
        class="detail-range-table"
        row-key="rowId"
        :border="true"
        :stripe="true"
        :pagination="true"
        :page-size="20"
        :request-auto="true"
        :request-api="getList"
        :columns="columns"
      >
        <template #ruleStatus="{ row }">
          <span class="detail-tag" :class="row.ruleStatus === '1' ? 'detail-tag--success' : ''">{{ row.ruleStatusName }}</span>
        </template>
      </RangeVxeTable>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'yssxPointListModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getYssxRelaRulePage } from '@/api/suzhou/aiAuditRuleMonitoring'
import type { YssxRelaRuleRow } from '@/api/suzhou/aiAuditRuleMonitoring'

/** 表格行：接口字段 + 表格要求的唯一 rowKey */
interface YssxPointTableRow extends YssxRelaRuleRow {
  rowId: string
}

interface ModalParams {
  /** 预算事项编码，接口必传（上一级行的 zyssxbm） */
  zyssxbm?: string
  /** 预算事项名称，仅用于标题 */
  zyssxmc?: string
}

const isShowModal = ref(false)
const modalTitle = ref('审核要点清单')
const zyssxbm = ref('')

/**
 * 列按文档十四的返参给：要点编码 auditPointCode / 要点名称 auditPointName /
 * 要点状态 ruleStatus + ruleStatusName（标签渲染名称、配色按码值，与要点清单弹层同一做法）。
 */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 70, headerAlign: 'center' },
  { field: 'auditPointCode', title: '审核要点编码', width: 190, headerAlign: 'center' },
  { field: 'auditPointName', title: '审核要点名称', minWidth: 240, align: 'left', headerAlign: 'center' },
  { field: 'ruleStatus', title: '审核要点状态', width: 140, headerAlign: 'center', slots: { default: 'ruleStatus' } }
]

/**
 * 分页由 RangeVxeTable 注入 page/limit（文档：是否分页 是），这里补上预算事项编码。
 * 行需要唯一 rowKey，接口没给行主键，用「编码 + 页码偏移 + 下标」拼一个稳定值。
 *
 * ⚠️ 必须返回**接口响应对象**而不是裸数组：RangeVxeTable 取的是 `res?.data`，
 * 返回裸数组会让 res.data 变成 undefined，表格静默空白。
 */
const getList = async (params: Record<string, any>) => {
  const res = await getYssxRelaRulePage({
    zyssxbm: zyssxbm.value,
    page: params.page ?? 1,
    limit: params.limit ?? 20
  })
  if (!res.success) {
    ElMessage.error(res.msg || '审核要点清单获取失败')
    return { ...res, data: { records: [] as YssxPointTableRow[], total: '0' } }
  }
  const records = Array.isArray(res?.data?.records) ? res.data.records : []
  const offset = (Number(params.page ?? 1) - 1) * Number(params.limit ?? 20)
  return {
    ...res,
    data: {
      ...res?.data,
      records: records.map((item, index) => ({ ...item, rowId: `${zyssxbm.value}-${offset + index}` }))
    }
  }
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = (params: ModalParams = {}) => {
  zyssxbm.value = params.zyssxbm || ''
  modalTitle.value = params.zyssxmc ? `${params.zyssxmc} · 审核要点清单` : '审核要点清单'
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';
</style>
