<!-- 已分配事项清单弹窗，两个入口共用：
     1) 主列表「已分配事项数」列的穿透 → 十二、按规则查（categoryRuleId）
     2) 审核要点清单里「已分配事项数」的二级穿透 → 十三、按要点查（ruleId）
     契约：docs/项目规则监控中心接口协议.doc 十二 / 十三 -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="1100"
    height="600"
    @close="handleClose"
  >
    <div class="detail-modal-body">
      <RangeVxeTable
        ref="tableRef"
        class="detail-range-table"
        row-key="rowId"
        :border="true"
        :stripe="true"
        :pagination="true"
        :page-size="20"
        :request-auto="true"
        :request-api="getList"
        :columns="columns"
      />
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'itemListModal'
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getXmyssxByCategoryRulePage, getXmyssxByRulePage } from '@/api/suzhou/aiAuditRulePoint'
import type { XmyssxByCategoryRuleRow } from '@/api/suzhou/aiAuditRulePoint'

interface ItemListTableRow extends XmyssxByCategoryRuleRow {
  rowId: string
}

interface ModalParams {
  /**
   * 规则名称：**只有主列表「已分配事项数」列的入口传**，用来做标题前缀。
   * 要点弹层里的二级穿透不传，标题就是「已分配事项清单」。
   */
  ruleName?: string
  /** 规则id：主列表入口走文档十二（按规则查） */
  categoryRuleId?: string
  /** 要点id：要点弹层的二级入口走文档十三（按要点查），两个 id 互斥 */
  ruleId?: string
}

const isShowModal = ref(false)
const categoryRuleId = ref('')
const ruleId = ref('')
const ruleName = ref('')

/**
 * 标题随入口而定（两个入口共用本组件）：
 * - 主列表「已分配事项数」列的穿透 → 带规则名前缀，便于知道看的是哪条规则；
 * - 要点弹层里「已分配事项数」的二级穿透 → 固定「已分配事项清单」（上层弹层标题已经带了规则名）。
 */
const modalTitle = computed(() => (ruleName.value ? `${ruleName.value} · 已分配事项清单` : '已分配事项清单'))

/**
 * 列按文档十二的返参给：zyssxbm 预算事项编码 / remark 预算事项名称（文档里这个字段名叫 remark，语义是事项名称）。
 * 接口虽同时下发 auditPointCode / auditPointName / ruleStatus（要点三件套），但这是「已分配事项清单」，
 * 按需求只保留事项两列，要点信息不再重复展示。
 */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 70, headerAlign: 'center' },
  { field: 'zyssxbm', title: '预算事项编码', width: 180, headerAlign: 'center' },
  { field: 'remark', title: '预算事项名称', minWidth: 280, align: 'left', headerAlign: 'center' }
]

/**
 * 分页由 RangeVxeTable 注入 page/limit，实体 id 由入口决定：
 * 给了 ruleId → 走文档十三（按要点查），否则走文档十二（按规则查）。
 */
const getList = async (params: Record<string, any>) => {
  const page = params.page ?? 1
  const limit = params.limit ?? 20
  const res = ruleId.value
    ? await getXmyssxByRulePage({ ruleId: ruleId.value, page, limit })
    : await getXmyssxByCategoryRulePage({ categoryRuleId: categoryRuleId.value, page, limit })
  if (!res.success) ElMessage.error(res.msg || '已分配事项清单获取失败')
  const records = Array.isArray(res?.data?.records) ? res.data.records : []
  const offset = (Number(page) - 1) * Number(limit)
  const keyPrefix = ruleId.value || categoryRuleId.value
  return {
    ...res,
    data: {
      ...res?.data,
      records: records.map((item, index) => ({ ...item, rowId: `${keyPrefix}-${offset + index}` }))
    }
  }
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = (params: ModalParams = {}) => {
  categoryRuleId.value = params.categoryRuleId || ''
  ruleId.value = params.ruleId || ''
  ruleName.value = params.ruleName || ''
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';
</style>
