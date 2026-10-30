<!-- 未通过清单弹窗（看板「审核要点异动排名」穿透）
     契约：docs/项目规则监控中心接口协议.doc 七、规则风险项详细 getProTaskUnPassDetail -->
<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-rule-modal ai-audit-rule-detail-modal"
    resize
    show-zoom
    destroy-on-close
    :title="modalTitle"
    width="1400"
    height="720"
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
        :data-callback="callBackHandle"
        :columns="columns"
        :search-columns="searchColumns"
        :search-col="4"
        :tool-button="['search', 'setting']"
      >
        <template #tableHeader>
          <el-button class="detail-action" size="small" type="primary" plain @click="exportHandle">
            <span>导 出</span>
          </el-button>
        </template>
        <template #reviewResult="{ row }">
          <span v-if="reviewResultOf(row)" class="detail-tag" :class="reviewResultTagClass(row)">{{ reviewResultOf(row) }}</span>
          <span v-else class="detail-empty">-</span>
        </template>
        <!-- 人工审核结果：接口直接给名称（rgReviewOpinionName），没有 code 可判，配色按名称兜底 -->
        <template #rgReviewResult="{ row }">
          <span v-if="rgReviewResultOf(row)" class="detail-tag" :class="rgReviewTagClass(row)">{{ rgReviewResultOf(row) }}</span>
          <span v-else class="detail-empty">-</span>
        </template>
        <!-- AI运营复核：开启（1）打开复核弹窗，关闭（0）直接保存为未复核 -->
        <template #opsReviewStatus="{ row }">
          <el-switch
            :model-value="isOpsReviewed(row)"
            :loading="opsSavingRowId === row.rowId"
            :disabled="opsSavingRowId === row.rowId"
            active-text="已复核"
            inactive-text="未复核"
            active-color="#00706b"
            inactive-color="#cbd5e1"
            @change="(value) => handleOpsSwitch(row, Boolean(value))"
          />
        </template>
        <template #problemDirection="{ row }">
          <span v-if="problemDirectionOf(row)">{{ problemDirectionOf(row) }}</span>
          <span v-else class="detail-empty">-</span>
        </template>
        <template #solution="{ row }">
          <span v-if="row.solution">{{ row.solution }}</span>
          <span v-else class="detail-empty">-</span>
        </template>
        <template #reviewTime="{ row }">
          <span>{{ reviewTimeOf(row) }}</span>
        </template>
        <!-- 查看：打开智能审核详情（与「智能审核项目清单」「智能审核任务管理」同一个弹窗） -->
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

  <!-- AI运营复核：开关开启时录入问题方向/解决方案；append-to-body 保证盖在未通过清单弹窗之上 -->
  <el-dialog
    v-model="opsReviewDialog.visible"
    title="AI运营复核"
    width="520px"
    append-to-body
    :close-on-click-modal="false"
    :show-close="!opsReviewDialog.saving"
  >
    <div v-if="opsReviewDialog.row" class="ops-review-context">
      <div><span>项目：</span>{{ opsReviewDialog.row.xmmc || '—' }}</div>
      <div><span>规则：</span>{{ opsReviewDialog.row.ruleName || '—' }}</div>
    </div>
    <el-form label-width="90px" size="small" class="ops-review-form">
      <el-form-item label="问题方向" required>
        <el-select v-model="opsReviewForm.problemDirection" clearable filterable placeholder="请选择问题方向" style="width: 100%">
          <el-option v-for="item in problemDirectionOptions" :key="item.code" :label="item.name" :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="解决方案">
        <el-input v-model="opsReviewForm.solution" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入解决方案（选填）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button size="small" plain :disabled="opsReviewDialog.saving" @click="opsReviewDialog.visible = false">取消</el-button>
      <el-button size="small" type="primary" plain :loading="opsReviewDialog.saving" @click="submitOpsReview">保存</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
export default {
  name: 'unpassListModal'
}
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import type { ColumnProps } from '@/components/ProTable/interface'
import { getEjdw, getPublicData, getYearData, getYjdw } from '@/api/common'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { normalizeOptionList, normalizeYearList } from '@/views/ai/smartTaskAudit/utils'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import { useAuditDetailModal } from '../../hooks/useAuditDetailModal'
import { apiExportHandle } from '@/utils/export'
import { exportProTaskUnPassExcel, getProTaskUnPassDetail, saveOpsReviewInfo } from '@/api/suzhou/aiAuditRuleMonitoring'
import type { ProTaskUnPassDetailRow } from '@/api/suzhou/aiAuditRuleMonitoring'

/** 审核结论/意见的公共代码：0 不通过 / 1 通过 / 2 待审核 / 3 不执行 */
const REVIEW_OPINION_CODE = 'AI_AUDIT_REVIEW_OPINION_COM'
/** AI运营复核的问题方向字典 */
const PROBLEM_DIRECTION_CODE = 'AI_AUDIT_PROBLEM_DIRECTION_COM'

interface UnpassTableRow extends ProTaskUnPassDetailRow {
  rowId: string
}

/** 页面里的角色上下文，用于换单位下拉；缺省时下拉为空，不阻塞查询 */
interface RoleParams {
  bmId?: string
  dwId?: string
}

interface ModalParams {
  /** 规则Id（接口必传） */
  categoryRuleId?: string
  /** 规则名称，用于弹窗标题 */
  ruleName?: string
  roleParams?: RoleParams
}

const isShowModal = ref(false)
const modalTitle = ref('未通过清单')
const categoryRuleId = ref('')
const roleParams = ref<RoleParams>({})
const tableRef = ref<RangeVxeTableExpose>()

const yjdwOptions = reactive<Record<string, any>[]>([])
const ejdwOptions = reactive<Record<string, any>[]>([])
const yearOptions = reactive<Record<string, any>[]>([])
const reviewOpinionOptions = reactive<Record<string, any>[]>([])
const problemDirectionOptions = reactive<Record<string, any>[]>([])

/** 正在保存运营复核状态的行（rowId），用于单个开关的 loading/禁用 */
const opsSavingRowId = ref('')

/** AI运营复核弹窗：开关开启时打开，保存后刷新列表 */
const opsReviewDialog = reactive({
  visible: false,
  saving: false,
  row: null as UnpassTableRow | null
})
const opsReviewForm = reactive({
  problemDirection: '',
  solution: ''
})

/**
 * 列定义按接口文档「七、规则风险项详细」的返参逐字段对照。
 *
 * 与原型（审核规则0.3 弹窗3）的区别，都是被接口契约逼出来的：
 * - 一级单位/二级单位：接口给的是 code（yjdw/ejdw）+ 名称（yjdwName/ejdwName），
 *   列表展示名称，code 只用于回传给后端。
 * - 审核规则/审核要点：原型叫 rule/point，接口实际字段是 ruleName/auditPointName。
 * - 「审核结论简述」原型叫 conclusion，接口是 reviewConclude。
 * - 「审核结果」接口字段表里没有，但示例里有 reviewOpinion（公共代码 AI_AUDIT_REVIEW_OPINION_COM）。
 * - 「人工审核结果 / 人工审核结论」是后端 2026-09-28 新加的返参（`rgReviewOpinionName` / `rgReviewConclude`），
 *   紧挨在各自的 AI 对照列后面。
 *
 * 四个列头按需求方 2026-10-14 定稿（AI 侧「结论」= 判定词、「意见」= 结论文本；人工侧同构，
 * 判定词叫「复核结论」、人工写的描述叫「复核意见」—— 与 2026-10-13 的命名不同）：
 *   reviewOpinion → AI审核结论 | rgReviewOpinionName → 人工复核结论
 *   reviewConclude → AI审核意见 | rgReviewConclude → 人工复核意见
 *
 * 左侧「序号 ~ 计划年度」六列 **固定**（需求 2026-09-29）：列多、横向滚动时这几列一直留在视野里，
 * 分不清行的时候还能靠它们对位；其余列（审核规则往后）左右滑动。
 */
const columns: VxeGridProps['columns'] = [
  { type: 'seq', title: '序号', width: 60, headerAlign: 'center', fixed: 'left' },
  { field: 'xmbm', title: '项目编码', width: 150, headerAlign: 'center', fixed: 'left' },
  { field: 'xmmc', title: '项目名称', minWidth: 190, align: 'left', headerAlign: 'center', fixed: 'left' },
  { field: 'yjdwName', title: '一级单位', width: 140, align: 'left', headerAlign: 'center', fixed: 'left' },
  { field: 'ejdwName', title: '二级单位', width: 140, align: 'left', headerAlign: 'center', fixed: 'left' },
  { field: 'jhssnd', title: '计划年度', width: 100, headerAlign: 'center', fixed: 'left' },
  { field: 'ruleName', title: '审核规则', minWidth: 190, align: 'left', headerAlign: 'center' },
  { field: 'auditPointName', title: '审核要点', minWidth: 150, align: 'left', headerAlign: 'center' },
  { field: 'reviewOpinion', title: 'AI审核结论', width: 110, headerAlign: 'center', slots: { default: 'reviewResult' } },
  { field: 'rgReviewOpinionName', title: '人工复核结论', width: 120, headerAlign: 'center', slots: { default: 'rgReviewResult' } },
  { field: 'reviewConclude', title: 'AI审核意见', minWidth: 300, align: 'left', headerAlign: 'center' },
  { field: 'rgReviewConclude', title: '人工复核意见', minWidth: 300, align: 'left', headerAlign: 'center' },
  // AI运营复核：问题方向 / 解决方案 / 复核时间由接口带回；状态开关紧挨操作列
  { field: 'problemDirectionName', title: '问题方向', width: 140, headerAlign: 'center', slots: { default: 'problemDirection' } },
  { field: 'solution', title: '解决方案', minWidth: 240, align: 'left', headerAlign: 'center', slots: { default: 'solution' } },
  { field: 'reviewTime', title: '复核时间', width: 170, headerAlign: 'center', slots: { default: 'reviewTime' } },
  { field: 'opsReviewStatus', title: 'AI运营复核状态', width: 170, headerAlign: 'center', slots: { default: 'opsReviewStatus' } },
  // 操作列放最后：与「智能审核项目清单」列表的「查看」同一个动作（打开智能审核详情弹窗）
  { title: '操作', width: 90, headerAlign: 'center', slots: { default: 'viewDetail' } }
]

/**
 * 查询条件（需求要求补的一级单位、二级单位、计划年度、审核规则）。
 *
 * 「审核规则」的值来自**穿透来源**：点主列表的风险统计数字、或点看板「审核要点异动排名」的柱子进来时，
 * 把那一行/那一根的规则名写成该查询条件的 defaultValue —— RangeVxeTable 在 onMounted 时会把
 * defaultValue 填进 searchParam，所以首次请求（requestAuto）就带上它，不用等设置完再补一次请求。
 * 用 defaultValue 而不是随手赋一次值，还顺带让「重置」回到这条规则的视图：
 * categoryRuleId 是弹窗级入参、重置清不掉，若重置后名称被清空，界面看着是全部、实际仍只有这条规则的数据。
 *
 * 单位/年度用 reactive 空数组当 enum：useRangeVxeTable 的 initSearchEnums 只在初始化时 set 一次，
 * 但它存的是数组本身（unref 后同一引用），所以后续 splice 就地更新即可让下拉刷新，
 * 二级单位的级联也就靠这个实现。
 */
const fillOptions = (target: Record<string, any>[], list: Record<string, any>[]) => {
  target.splice(0, target.length, ...list)
}

/** 年度接口返回的是树（comPz/getNdTreeNode），拍平后再归一化，避免树形被当成单层 */
const flattenYears = (list: any[]): any[] =>
  (list || []).flatMap((item) => [item, ...(Array.isArray(item.children) ? flattenYears(item.children) : [])])

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
 * 审核规则清空时把弹窗级的 categoryRuleId 也置空：
 * 穿透带入的 categoryRuleId 只在该规则名还在时才有意义，清空后请求应查全部规则。
 */
const handleRuleNameChange = (value: string) => {
  if (!value) categoryRuleId.value = ''
}

/**
 * 「审核规则」那一项单独拿出来引用：穿透带入规则名时改它的 search.defaultValue
 * （对象引用与 searchColumns 里的是同一个，reactively 生效在表格 onMounted 读到即可）。
 */
const ruleNameColumn: ColumnProps = {
  prop: 'ruleName',
  label: '审核规则',
  search: { el: 'input', order: 6, props: { clearable: true, placeholder: '请输入审核规则', onChange: handleRuleNameChange } }
}

/**
 * 查询条件（需求定的顺序：一级单位 / 二级单位 / 计划年度 / 项目编码 / 项目名称 / 审核规则）。
 * 「文件解析」的穿透明细是同一顺序、少了末尾这条「审核规则」。
 *
 * 顺序就是**数组顺序**：RangeVxeTable 的搜索区走 SearchForm，它按 columns 数组顺序渲染，
 * `search.order` 在 SearchForm 里并不参与排序（那是 ProTable 的用法），所以两者一起改、保持读数一致。
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
    enum: yearOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 3, props: { clearable: true, filterable: true } }
  },
  {
    prop: 'xmbm',
    label: '项目编码',
    search: {
      order: 4,
      render: ReMultipleText as any,
      props: { class: 'project-code-input', dialogTitle: '项目编码', tooltipText: '项目编码', placeholder: '请输入项目编码' }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    search: { el: 'input', order: 5, props: { clearable: true, placeholder: '请输入项目名称' } }
  },
  {
    /**
     * 人工复核结论（需求 2026-10-13 加的查询条件，2026-10-14 随列表列头统一改名）：
     * 字段 `rgReviewOpinion`，与列表里「人工复核结论」列同一个字段；
     * 选项与「AI审核结论」列的名称兜底共用同一个字典（AI_AUDIT_REVIEW_OPINION_COM），
     * 所以直接复用 loadOptions 里灌好的那组选项（reactive 就地更新，下拉自动刷新）。
     */
    prop: 'rgReviewOpinion',
    label: '人工复核结论',
    enum: reviewOpinionOptions,
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 7, props: { clearable: true, filterable: true } }
  },
  ruleNameColumn
])

/** 打开弹窗时加载下拉字典；单个失败只提示，不阻断 */
const loadOptions = async () => {
  fillOptions(yjdwOptions, [])
  fillOptions(ejdwOptions, [])
  fillOptions(yearOptions, [])
  fillOptions(reviewOpinionOptions, [])
  fillOptions(problemDirectionOptions, [])

  const [yjdwRes, yearRes, opinionRes, problemDirectionRes] = await Promise.allSettled([
    getYjdw(buildRoleParams()),
    getYearData(),
    getPublicData(REVIEW_OPINION_CODE),
    getPublicData(PROBLEM_DIRECTION_CODE)
  ])

  if (yjdwRes.status === 'fulfilled' && yjdwRes.value.success) {
    fillOptions(yjdwOptions, normalizeOptionList(yjdwRes.value.data || []))
  } else {
    ElMessage.error(yjdwRes.status === 'fulfilled' ? yjdwRes.value.msg || '一级单位获取失败' : '一级单位获取失败')
  }

  if (yearRes.status === 'fulfilled' && yearRes.value.success) {
    fillOptions(yearOptions, normalizeYearList(flattenYears(yearRes.value.data || [])))
  } else {
    ElMessage.error(yearRes.status === 'fulfilled' ? yearRes.value.msg || '计划年度获取失败' : '计划年度获取失败')
  }

  if (opinionRes.status === 'fulfilled' && opinionRes.value.success) {
    // 本页面只展示「通过」与「不通过」，过滤掉字典里的其它选项（如待审核、不执行）
    const rgFilterCodes = ['0', '1']
    fillOptions(
      reviewOpinionOptions,
      normalizeOptionList(opinionRes.value.data || []).filter((item: any) => rgFilterCodes.includes(String(item.code)))
    )
  }

  if (problemDirectionRes.status === 'fulfilled' && problemDirectionRes.value.success) {
    fillOptions(problemDirectionOptions, normalizeOptionList(problemDirectionRes.value.data || []))
  }
}

/**
 * 审核结果。
 * 文档更新后返参多了 reviewOpinionName（直接是名称），优先用它；
 * 老接口只回 reviewOpinion（code，字典 AI_AUDIT_REVIEW_OPINION_COM）时才去查字典兜底，
 * 字典也没命中就原样显示 code，避免出现空白单元格。
 */
const reviewResultOf = (row: UnpassTableRow): string => {
  const name = String(row.reviewOpinionName ?? '').trim()
  if (name) return name
  const code = String(row.reviewOpinion ?? '').trim()
  if (!code) return ''
  const hit = reviewOpinionOptions.find((item) => String(item.code) === code)
  return String(hit?.name || code)
}

/** 标签配色按 code 判定（名称可能随词表变），没有 code 时按名称兜底 */
const reviewResultTagClass = (row: UnpassTableRow): string => {
  const code = String(row.reviewOpinion ?? '').trim()
  const byCode: Record<string, string> = {
    '0': 'detail-tag--danger',
    '1': 'detail-tag--success',
    '2': 'detail-tag--warning'
  }
  if (byCode[code]) return byCode[code]
  const name = reviewResultOf(row)
  if (name.includes('不通过')) return 'detail-tag--danger'
  if (name === '通过') return 'detail-tag--success'
  if (name.includes('待') || name.includes('复核')) return 'detail-tag--warning'
  return ''
}

const callBackHandle = (data: any) => data

// 「查看」→ 智能审核详情（先按 proId 换 taskId 再开弹窗，逻辑与文件清单共用，见 hooks/useAuditDetailModal）
const { auditDetailModal, auditDetailRow, openAuditDetail, closeAuditDetail } = useAuditDetailModal()

/**
 * 人工审核结果：接口新加的 `rgReviewOpinionName` 直接就是名称（没有配套 code），
 * 所以只做去空格，空值交给模板显示「-」。
 */
const rgReviewResultOf = (row: UnpassTableRow): string => String(row.rgReviewOpinionName ?? '').trim()

/**
 * 人工审核结果的标签配色：没有 code，只能按**名称**判（与 reviewResultTagClass 的兜底分支同一套词）。
 * 命中不了的返回空串 —— 标签就没有底色，不会给一个语义不对的颜色。
 */
const rgReviewTagClass = (row: UnpassTableRow): string => {
  const name = rgReviewResultOf(row)
  if (!name) return ''
  if (name.includes('不通过')) return 'detail-tag--danger'
  if (name.includes('通过')) return 'detail-tag--success'
  if (name.includes('待') || name.includes('复核')) return 'detail-tag--warning'
  return ''
}

/** AI运营复核状态：1 已复核 / 0 未复核 */
const isOpsReviewed = (row: UnpassTableRow): boolean => String(row.opsReviewStatus ?? '').trim() === '1'

/** 问题方向优先显示名称，旧数据只有编码时回退编码 */
const problemDirectionOf = (row: UnpassTableRow): string => String(row.problemDirectionName || row.problemDirection || '').trim()

/** 复核时间：去掉 T，截到秒；空值显示 - */
const reviewTimeOf = (row: UnpassTableRow): string => {
  const value = String(row.reviewTime ?? '').trim()
  return value ? value.replace('T', ' ').slice(0, 19) : '-'
}

/** 开关开启：打开复核弹窗；关闭：直接把运营复核状态保存为未复核 */
const handleOpsSwitch = (row: UnpassTableRow, value: boolean): void => {
  if (value) {
    const detailId = String(row.detailId || '').trim()
    if (!detailId) {
      ElMessage.warning('当前行缺少任务明细ID，无法复核')
      return
    }
    opsReviewDialog.row = row
    opsReviewForm.problemDirection = String(row.problemDirection || '')
    opsReviewForm.solution = String(row.solution || '')
    opsReviewDialog.visible = true
    return
  }
  void saveOpsStatus(row, '0')
}

/** 保存运营复核状态；开启时由弹窗补问题方向/解决方案，关闭时沿用行上已有值 */
const saveOpsStatus = async (row: UnpassTableRow, status: '0' | '1', values?: { problemDirection: string; solution: string }): Promise<boolean> => {
  const detailId = String(row.detailId || '').trim()
  if (!detailId) {
    ElMessage.warning('当前行缺少任务明细ID，无法保存复核状态')
    return false
  }
  opsSavingRowId.value = String(row.rowId || '')
  try {
    const res = await saveOpsReviewInfo({
      detailId,
      problemDirection: values?.problemDirection ?? String(row.problemDirection || ''),
      solution: values?.solution ?? String(row.solution || ''),
      opsReviewStatus: status
    })
    if (!res.success) {
      ElMessage.error(res.msg || '复核信息保存失败')
      return false
    }
    ElMessage.success(status === '1' ? 'AI运营复核已保存' : '已取消复核')
    // 列表刷新拿到后端写入的复核时间/状态名称；不阻塞弹窗关闭
    void tableRef.value?.getTableList()
    return true
  } catch (e: any) {
    ElMessage.error(e?.message || '复核信息保存失败')
    return false
  } finally {
    opsSavingRowId.value = ''
  }
}

/** 复核弹窗提交：问题方向 + 解决方案必填 */
const submitOpsReview = async (): Promise<void> => {
  if (!opsReviewDialog.row) return
  if (!opsReviewForm.problemDirection) {
    ElMessage.warning('请选择问题方向')
    return
  }
  // 解决方案选填，允许为空；问题方向仍为必填
  const solution = opsReviewForm.solution.trim()
  opsReviewDialog.saving = true
  const saved = await saveOpsStatus(opsReviewDialog.row, '1', { problemDirection: opsReviewForm.problemDirection, solution })
  opsReviewDialog.saving = false
  if (saved) opsReviewDialog.visible = false
}

/**
 * 分页由 RangeVxeTable 负责（它会注入 page/limit），这里补上规则Id与查询条件。
 * 行需要唯一 rowKey，接口没给行主键，用「页码偏移 + 下标」拼一个稳定值。
 *
 * bmId / dwId 走角色上下文（与一级/二级单位下拉同源），由看板 RuleDashboard 通过
 * acceptParams({ roleParams }) 透传进来；不传则后端按无权限收口。
 */
const getList = async (params: Record<string, any>) => {
  const res = await getProTaskUnPassDetail({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    ...buildRoleParams(),
    // 不传 categoryRuleId 即「查看全部」——文档把该字段标为可选正是为此
    categoryRuleId: categoryRuleId.value || undefined,
    yjdw: params.yjdw || undefined,
    ejdw: params.ejdw || undefined,
    jhssnd: params.jhssnd || undefined,
    xmbmList: params.xmbm
      ? String(params.xmbm)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined,
    xmmc: params.xmmc || undefined,
    rgReviewOpinion: params.rgReviewOpinion || undefined,
    ruleName: params.ruleName || undefined
  })

  const records = Array.isArray(res?.data?.records) ? res.data.records : []
  const offset = (Number(params.page ?? 1) - 1) * Number(params.limit ?? 20)
  const data = {
    ...res?.data,
    records: records.map((item, index) => ({ ...item, rowId: `${categoryRuleId.value || 'all'}-${offset + index}` }))
  }
  return { ...res, data }
}

const exportHandle = async () => {
  try {
    const searchParam = tableRef.value?.searchParam || {}
    const { xmbm, ...rest } = searchParam
    const xmbmList = xmbm
      ? String(xmbm)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : undefined
    // 文件名只在响应没有 content-disposition 时兜底，去掉标题里的空格避免落盘名字带 " · "
    const fileName = (modalTitle.value || '未通过清单').replace(/\s+/g, '')
    await apiExportHandle(
      {
        ...buildRoleParams(),
        ...rest,
        xmbmList,
        categoryRuleId: categoryRuleId.value || undefined
      },
      fileName,
      exportProTaskUnPassExcel
    )
  } catch (e) {
    ElMessage.error((e as Error)?.message || '导出失败')
  }
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = (params: ModalParams = {}) => {
  // 不传 categoryRuleId 即「查看全部」，标题也相应不挂规则名
  categoryRuleId.value = params.categoryRuleId || ''
  roleParams.value = params.roleParams || {}
  // 穿透来源的规则名写进「审核规则」查询条件（表格 onMounted 会取它当首屏条件），
  // 「查看全部」不传规则名时清空，避免上一次打开的值残留
  if (ruleNameColumn.search) ruleNameColumn.search.defaultValue = params.ruleName || ''
  modalTitle.value = params.ruleName ? `${params.ruleName} · 未通过清单` : '未通过清单（全部规则）'
  isShowModal.value = true
  loadOptions()
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
@import '../../css/dashboardModal.less';

.ops-review-context {
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  line-height: 20px;

  > div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: #64748b;
  }
}

.ops-review-form {
  margin-top: 12px;
}
</style>
