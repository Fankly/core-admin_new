<!-- 文件清单弹窗（看板「智能审核」穿透）
     契约：docs/项目规则监控中心接口协议.doc 五、智能审核项目文件明细 getAuditXmFileDetail -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="1100"
    height="620"
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
        :search-columns="searchColumns"
        :search-col="4"
        :tool-button="['search', 'setting']"
      >
        <template #fileType="{ row }">
          <span class="detail-tag detail-tag--primary">{{ row.fileType }}</span>
        </template>
        <!-- 查看：打开智能审核详情（与未通过清单、智能审核项目清单同一个弹窗；逻辑见 hooks/useAuditDetailModal） -->
        <template #viewDetail="{ row }">
          <a
            class="detail-link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.xmmc || '该项目'}」的智能审核详情`"
            @click="openAuditDetail(row)"
            @keydown.enter="openAuditDetail(row)"
            @keydown.space.prevent="openAuditDetail(row)"
          >
            查看
          </a>
        </template>
      </RangeVxeTable>
    </div>
  </vxe-modal>

  <!-- 智能审核详情：复用智能审核任务管理的弹窗（内部是 AuditDetailWorkbench） -->
  <DetailModal :modal="auditDetailModal" :detail-row="auditDetailRow" @close="closeAuditDetail" />
</template>

<script lang="ts">
export default {
  name: 'fileListModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { ColumnProps } from '@/components/ProTable/interface'
// 一级/二级单位与 stockOut 需求明细同口径，统一走 @/api/common 的 getYjdw/getEjdw（baseService.post('bizOrgTree/getYjdw')）
import { getEjdw, getYjdw } from '@/api/common'
import { normalizeOptionList } from '@/views/ai/smartTaskAudit/utils'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import { useAuditDetailModal } from '../../hooks/useAuditDetailModal'
import { getAuditXmFileDetail } from '@/api/suzhou/aiAuditRuleMonitoring'
import type { AuditXmFileDetailRow } from '@/api/suzhou/aiAuditRuleMonitoring'

/** 表格行：接口字段 + 表格要求的唯一 rowKey */
interface FileListTableRow extends AuditXmFileDetailRow {
  rowId: string
}

/** 页面里的角色上下文，用于换单位下拉；缺省时下拉为空，不阻塞查询 */
interface RoleParams {
  bmId?: string
  dwId?: string
}

interface ModalParams {
  /** 文件类型名称，仅用于标题 */
  fileType?: string
  /** 文件类型id，接口必传 */
  fjId?: string
  /** 一级/二级单位下拉要用（口径与「审核要点异动排名」的未通过清单、stockOut 需求明细一致：bizOrgTree/getYjdw） */
  roleParams?: RoleParams
}

const isShowModal = ref(false)
const modalTitle = ref('文件清单')
const fileTypeId = ref('')
const roleParams = ref<RoleParams>({})

const yjdwOptions = reactive<Record<string, any>[]>([])
const ejdwOptions = reactive<Record<string, any>[]>([])

/**
 * 列按接口文档「五、智能审核项目文件明细」的返参对照。
 * 两处与原型的差别：
 * - 一级单位/二级单位要用 yjdwName / ejdwName（接口里 yjdw/ejdw 是 code）；
 * - 文件名称是 attachName，原型写的是 fileName。
 */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 60, headerAlign: 'center' },
  { field: 'xmbm', title: '项目编码', width: 150, headerAlign: 'center' },
  { field: 'xmmc', title: '项目名称', minWidth: 190, align: 'left', headerAlign: 'center' },
  { field: 'yjdwName', title: '一级单位', width: 140, align: 'left', headerAlign: 'center' },
  { field: 'ejdwName', title: '二级单位', width: 140, align: 'left', headerAlign: 'center' },
  { field: 'jhssnd', title: '计划年度', width: 100, headerAlign: 'center' },
  { field: 'fileType', title: '文件类型', width: 120, headerAlign: 'center', slots: { default: 'fileType' } },
  { field: 'attachName', title: '文件名称', minWidth: 260, align: 'left', headerAlign: 'center' },
  // 操作列放最后：与「未通过清单」的「查看」同一个动作（打开智能审核详情弹窗）
  { title: '操作', width: 90, headerAlign: 'center', slots: { default: 'viewDetail' } }
]

/**
 * 查询条件（五个，字段名与 getAuditXmFileDetail 的返参同名：xmbm / xmmc / yjdw / ejdw / jhssnd）。
 *
 * 单位下拉的口径与「审核要点异动排名」的未通过清单一致：一级单位来源 bizOrgTree/getYjdw，
 * 二级单位按一级单位联动（bizOrgTree/getEjdw），下拉值用 code 回传。
 * 单位用 reactive 空数组当 enum：useRangeVxeTable 的 initSearchEnums 只在初始化时 set 一次，
 * 但它存的是数组本身，后续 splice 就地更新即可让下拉刷新，级联也就靠这个实现。
 */
const fillOptions = (target: Record<string, any>[], list: Record<string, any>[]) => {
  target.splice(0, target.length, ...list)
}

const buildRoleParams = () => ({
  bmId: roleParams.value.bmId || '',
  dwId: roleParams.value.dwId || ''
})

/**
 * 一级单位切换：清空并重新拉二级单位。
 * 必须声明在下面的 searchColumns 之前 —— searchColumns 里 onChange 是**立即求值**的引用，
 * 放到后面会撞上 const 的 TDZ（ReferenceError），整个组件 setup 直接抛错。
 */
const handleYjdwChange = async (value: string) => {
  fillOptions(ejdwOptions, [])
  if (!value) return
  try {
    const res = await getEjdw({ ...buildRoleParams(), YJDW: value, parentCode: value })
    fillOptions(ejdwOptions, res.success ? normalizeOptionList(res.data || []) : [])
  } catch (e) {
    ElMessage.error((e as Error)?.message || '二级单位获取失败')
  }
}

/**
 * 查询条件（需求定的顺序：一级单位 / 二级单位 / 计划年度 / 项目编码 / 项目名称）。
 *
 * 顺序就是**数组顺序**：RangeVxeTable 的搜索区走 SearchForm，它按 columns 数组顺序渲染，
 * 这里的 `search.order` 在 SearchForm 里并不参与排序（那是 ProTable 的用法），
 * 所以两者要一起改、保持读数一致。
 *
 * 「审核规则」只有审核要点异动排名的穿透明细才有（那张表多一个弹窗级入参 ruleName），本弹窗不加。
 *
 * 单位用 reactive 空数组当 enum：useRangeVxeTable 的 initSearchEnums 只在初始化时 set 一次，
 * 但它存的是数组本身（unref 后同一引用），所以后续 splice 就地更新即可让下拉刷新，
 * 二级单位的级联也就靠这个实现。
 */
const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'yjdw',
    label: '一级单位',
    enum: yjdwOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 1, props: { clearable: true, filterable: true, onChange: handleYjdwChange } }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    enum: ejdwOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 2, props: { clearable: true, filterable: true } }
  },
  {
    prop: 'jhssnd',
    label: '计划年度',
    search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入计划年度' } }
  },
  {
    prop: 'xmbm',
    label: '项目编码',
    search: { el: 'input', order: 4, props: { clearable: true, placeholder: '请输入项目编码' } }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    search: { el: 'input', order: 5, props: { clearable: true, placeholder: '请输入项目名称' } }
  }
])

/** 打开弹窗时加载一级单位；失败只提示，不阻断明细查询 */
const loadOptions = async () => {
  fillOptions(yjdwOptions, [])
  fillOptions(ejdwOptions, [])
  try {
    const res = await getYjdw(buildRoleParams())
    if (!res.success) {
      ElMessage.error(res.msg || '一级单位获取失败')
      return
    }
    fillOptions(yjdwOptions, normalizeOptionList(res.data || []))
  } catch (e) {
    ElMessage.error((e as Error)?.message || '一级单位获取失败')
  }
}

/**
 * 分页由 RangeVxeTable 注入 page/limit，这里补上文件类型 id 与五个查询条件。
 * 行需要唯一 rowKey，接口没给行主键，用「文件类型 + 页码偏移 + 下标」拼一个稳定值。
 *
 * bmId / dwId 走角色上下文（与一级/二级单位下拉同源），由看板 RuleDashboard 通过
 * acceptParams({ roleParams }) 透传进来；不传则后端按无权限收口。
 */
const getList = async (params: Record<string, any>) => {
  const res = await getAuditXmFileDetail({
    fjId: fileTypeId.value,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    ...buildRoleParams(),
    xmbm: params.xmbm || undefined,
    xmmc: params.xmmc || undefined,
    yjdw: params.yjdw || undefined,
    ejdw: params.ejdw || undefined,
    jhssnd: params.jhssnd || undefined
  })
  const records = Array.isArray(res?.data?.records) ? res.data.records : []
  const offset = (Number(params.page ?? 1) - 1) * Number(params.limit ?? 20)
  return {
    ...res,
    data: {
      ...res?.data,
      records: records.map((item, index) => ({ ...item, rowId: `${fileTypeId.value}-${offset + index}` }))
    }
  }
}

const handleClose = () => {
  isShowModal.value = false
}

// 「查看」→ 智能审核详情（先按 proId 换 taskId 再开弹窗，逻辑与未通过清单共用，见 hooks/useAuditDetailModal）
const { auditDetailModal, auditDetailRow, openAuditDetail, closeAuditDetail } = useAuditDetailModal()

const acceptParams = (params: ModalParams = {}) => {
  fileTypeId.value = params.fjId || ''
  roleParams.value = params.roleParams || {}
  modalTitle.value = params.fileType ? `${params.fileType} · 文件清单` : '文件清单'
  isShowModal.value = true
  loadOptions()
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';
</style>
