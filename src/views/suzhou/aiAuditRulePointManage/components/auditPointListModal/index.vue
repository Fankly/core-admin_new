<!-- 审核要点清单弹窗（主列表「已分配审核要点数」列的穿透）
     契约：docs/项目规则监控中心接口协议.doc 十一、审核规则关联审核要点分页 -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="820"
    height="560"
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
      >
        <template #ruleStatus="{ row }">
          <span class="detail-tag" :class="row.ruleStatus === '1' ? 'detail-tag--success' : ''">{{ row.ruleStatusName }}</span>
        </template>
        <!-- 已分配事项数：点开二级弹层，明细与主列表「已分配事项数」列的穿透同一份（十二） -->
        <template #yssxCnt="{ row }">
          <span
            v-if="Number(row.yssxCnt) > 0"
            class="detail-tag detail-tag--primary detail-tag--link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.auditPointName || '当前审核要点'}」的已分配事项清单`"
            @click.stop="openItemList(row)"
            @keydown.enter.stop="openItemList(row)"
            @keydown.space.prevent.stop="openItemList(row)"
          >
            <svg class="detail-tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {{ row.yssxCnt }} 个
          </span>
          <span v-else class="detail-empty">-</span>
        </template>
      </RangeVxeTable>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'auditPointListModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getRuleByCategoryRulePage } from '@/api/suzhou/aiAuditRulePoint'
import type { RuleByCategoryRuleRow } from '@/api/suzhou/aiAuditRulePoint'

interface AuditPointTableRow extends RuleByCategoryRuleRow {
  rowId: string
}

interface ModalParams {
  ruleName?: string
  /** 规则Id，接口必传 */
  categoryRuleId?: string
}

const isShowModal = ref(false)
const modalTitle = ref('审核要点清单')
const categoryRuleId = ref('')
/** 二级弹层的标题要带规则名，所以这里留住入参 */
const ruleName = ref('')

/** 列按文档十一的返参给：要点编码 auditPointCode / 要点名称 auditPointName / 要点状态 ruleStatusName */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 70, headerAlign: 'center' },
  { field: 'auditPointCode', title: '审核要点编码', width: 170, headerAlign: 'center' },
  { field: 'auditPointName', title: '审核要点名称', minWidth: 280, align: 'left', headerAlign: 'center' },
  { field: 'ruleStatus', title: '审核要点状态', width: 130, headerAlign: 'center', slots: { default: 'ruleStatus' } },
  // 已分配事项数：文档十一未列该字段，按需求补在末尾，点击开二级弹层（复用十二的已分配事项清单）
  { field: 'yssxCnt', title: '已分配事项数', width: 140, headerAlign: 'center', slots: { default: 'yssxCnt' } }
]

/** 二级弹层：交给宿主页面去开已分配事项清单 */
const emit = defineEmits<{
  (event: 'open-item-list', payload: { ruleId: string }): void
}>()

/**
 * 二级穿透带的是**要点id**（row.ruleId）——二级明细走文档十三（getXmyssxByRulePage，入参 ruleId），
 * 与主列表那条按规则查（十二）不是同一个接口。也不带规则名：标题固定「已分配事项清单」。
 */
const openItemList = (row: AuditPointTableRow) => {
  const pointRuleId = String(row.ruleId || '')
  if (!pointRuleId) return
  emit('open-item-list', { ruleId: pointRuleId })
}

/** 分页由 RangeVxeTable 注入 page/limit，这里补上规则Id */
const getList = async (params: Record<string, any>) => {
  const res = await getRuleByCategoryRulePage({
    categoryRuleId: categoryRuleId.value,
    page: params.page ?? 1,
    limit: params.limit ?? 20
  })
  if (!res.success) ElMessage.error(res.msg || '审核要点清单获取失败')
  const records = Array.isArray(res?.data?.records) ? res.data.records : []
  const offset = (Number(params.page ?? 1) - 1) * Number(params.limit ?? 20)
  return {
    ...res,
    data: {
      ...res?.data,
      records: records.map((item, index) => ({ ...item, rowId: `${categoryRuleId.value}-${offset + index}` }))
    }
  }
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = (params: ModalParams = {}) => {
  categoryRuleId.value = params.categoryRuleId || ''
  ruleName.value = params.ruleName || ''
  modalTitle.value = ruleName.value ? `${ruleName.value} · 审核要点清单` : '审核要点清单'
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';
</style>
