<!-- 智能审核规则管理 -->
<template>
  <div v-if="isShowPage" class="ai-audit-rule-manage">
    <RuleDashboard :role-params="roleParams" @filter-change="applyChartFilter" />
    <div class="list-card">
      <RangeVxeTable
        ref="tableRef"
        class="rule-range-table"
        row-key="ruleId"
        row-click-mode="exclusive"
        :border="true"
        :pagination="true"
        :request-auto="true"
        :request-api="getPageList"
        :data-callback="callBackHandle"
        :columns="tableColumns"
        :search-columns="searchColumns"
        :search-col="4"
        :search-default-visible="false"
        :tool-button="['setting', 'search', 'help']"
        :loading="loading"
        :init-param="roleParams"
      >
        <template #tableHeader="scope">
          <div class="rule-action-group rule-action-group--maintenance">
            <!-- v-permission="'ADD'" -->
            <el-button
              v-permission="'ADD'"
              class="rule-action rule-action--primary"
              size="small"
              type="primary"
              plain
              @click="handleBtn(scope.selectedList, 'ADD')"
            >
              <span>新 增</span>
            </el-button>
            <!-- v-permission="'EDIT'" -->
            <el-button
              v-permission="'EDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'EDIT')"
            >
              <span>编 辑</span>
            </el-button>
            <!-- v-permission="'DELETE'" -->
            <el-button
              v-permission="'DELETE'"
              class="rule-action"
              :disabled="scope.selectedList.length === 0"
              size="small"
              type="danger"
              plain
              @click="handleBtn(scope.selectedList, 'DELETE')"
            >
              <span>删 除</span>
            </el-button>
          </div>
          <div class="rule-action-group rule-action-group--configuration">
            <!-- <el-button
              v-permission="'RELATE'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'RELATE')"
            >
              <span>适用项目类型</span>
            </el-button>
            <el-button
              v-permission="'RELATEYJDW'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'RELATEYJDW')"
            >
              <span>适用一级单位</span>
            </el-button> -->
            <!-- v-permission="'PROMPTEDIT'" -->
            <el-button
              v-permission="'PROMPTEDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'PROMPTEDIT')"
            >
              <span>提示词配置</span>
            </el-button>
            <!-- <el-button
              v-permission="'PROMPTEDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'DETAIL')"
            >
              <span>明细管理</span>
            </el-button> -->
            <!-- <el-button
              v-permission="'RELATE'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'BUDGETITEM')"
            >
              <span>适用预算事项</span>
            </el-button> -->
            <!-- v-permission="'RELATE'" -->
            <el-button
              v-permission="'RELATE'"
              class="rule-action rule-action--secondary"
              size="small"
              type="primary"
              @click="handleBtn(scope.selectedList, 'AUDITPOINT')"
            >
              <span>审核要点</span>
            </el-button>
          </div>
          <div class="rule-action-group rule-action-group--configuration">
            <!-- v-permission="'IMPORT'" -->
            <el-button v-permission="'IMPORT'" class="rule-action rule-action--primary" size="small" type="primary" plain @click="importHandle">
              <span>导 入</span>
            </el-button>
            <!-- v-permission="'EXPORT'" -->
            <el-button v-permission="'EXPORT'" class="rule-action rule-action--primary" size="small" type="primary" plain @click="exportHandle">
              <span>导 出</span>
            </el-button>
          </div>
        </template>
        <template #ruleStatusHeader>规则状态</template>
        <template #ruleStatus="{ row }">
          <el-switch
            v-model="row.ruleStatus"
            :aria-label="`${row.ruleName || '当前规则'}状态`"
            inline-prompt
            active-text="启"
            inactive-text="停"
            active-value="1"
            inactive-value="0"
            @change="getSaveStatus(row)"
          />
        </template>
        <!-- 已分配审核要点数 / 已分配事项数：0 显示占位横线，不用药丸，避免用「0 个」占用列宽 -->
        <!-- 两列都可点开明细；明细接口由后端另给（见各自弹窗里的 getList 注释），
             接口到位前弹窗能开、列头正确、表体为空。
             图标用 heroicons 的 clipboard 路径，不用 Unicode/emoji（DESIGN.md 明确禁止）。 -->
        <template #ruleCnt="{ row }">
          <span
            v-if="Number(row.ruleCnt) > 0"
            class="rule-count-tag rule-count-tag--link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.ruleName || '当前规则'}」的审核要点清单`"
            @click="openPointList(row)"
            @keydown.enter="openPointList(row)"
            @keydown.space.prevent="openPointList(row)"
          >
            <svg class="rule-count-tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {{ row.ruleCnt }} 个
          </span>
          <span v-else class="rule-count-empty">-</span>
        </template>
        <template #yssxCnt="{ row }">
          <span
            v-if="Number(row.yssxCnt) > 0"
            class="rule-count-tag rule-count-tag--alt rule-count-tag--link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.ruleName || '当前规则'}」的已分配事项清单`"
            @click="openItemList(row)"
            @keydown.enter="openItemList(row)"
            @keydown.space.prevent="openItemList(row)"
          >
            <svg class="rule-count-tag__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {{ row.yssxCnt }} 个
          </span>
          <span v-else class="rule-count-empty">-</span>
        </template>
        <!-- 风险统计：数值本身即语义，用功能色；不铺行底色，避免和行 hover/选中态打架 -->
        <template #fxCategoryRuleCnt="{ row }">
          <span
            v-if="Number(row.fxCategoryRuleCnt) > 0"
            class="rule-risk-num tabular-nums rule-count-tag--link"
            role="button"
            tabindex="0"
            :aria-label="`查看「${row.ruleName || '当前规则'}」的未通过清单`"
            @click="openUnpassList(row)"
            @keydown.enter="openUnpassList(row)"
            @keydown.space.prevent="openUnpassList(row)"
          >
            {{ row.fxCategoryRuleCnt }}
          </span>
          <span v-else class="rule-count-empty">-</span>
        </template>
      </RangeVxeTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <rangeModal ref="rangeModalRef" @search-handle="searchHandle" />
  <promptModal ref="promptModalRef" @search-handle="searchHandle" />
  <relateProtType ref="relateProtTypeRef" />
  <budgetItemModal ref="budgetItemModalRef" />
  <!-- <auditPointModal ref="auditPointModalRef" /> -->
  <detailModal ref="detailModalRef" />
  <ImportExcel ref="importRef" />
  <!-- 后三列的穿透弹窗（点单元格数值打开） -->
  <auditPointListModal ref="auditPointListModalRef" @open-item-list="openItemListFromPoint" />
  <itemListModal ref="itemListModalRef" />
  <unpassListModal ref="unpassListModalRef" />
</template>

<script setup lang="ts">
defineOptions({ name: "/suzhou/aiAuditRulePointManage/index" })
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import type { ColumnProps } from '@/components/ProTable/interface'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import RuleDashboard from './components/RuleDashboard/index.vue'
import rangeModal from './components/manageModal/index.vue'
import promptModal from './components/promptModal/index.vue'
import detailModal from './components/detailModal/index.vue'
import relateProtType from './components/relateProtType/index.vue'
import budgetItemModal from './components/budgetItemModal/index.vue'
// import auditPointModal from './components/auditPointModal/index.vue'
import auditPointListModal from './components/auditPointListModal/index.vue'
import itemListModal from './components/itemListModal/index.vue'
import unpassListModal from './components/unpassListModal/index.vue'
// import { changeStatus } from '@/api/suzhou/aiAuditRuleManage'
import { importRule, exportRule, exportRuleMonitoring, getRuleMonitoringPage, removeRule, changeStatus } from '@/api/suzhou/aiAuditRulePoint'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { apiExportHandle } from '@/utils/export'
import { getPublicData } from '@/api/common'

interface SelectedRow {
  ruleId: string
  proType: string
  [key: string]: any
}

type OperationType = 'ADD' | 'EDIT' | 'DELETE' | 'RELATE' | 'RELATEYJDW' | 'PROMPTEDIT' | 'DETAIL' | 'BUDGETITEM' | 'AUDITPOINT'

const importRef = ref()
const router = useRouter()
const rangeModalRef = ref()
const promptModalRef = ref()
const relateProtTypeRef = ref()
const budgetItemModalRef = ref()
// const auditPointModalRef = ref()
const auditPointListModalRef = ref()
const itemListModalRef = ref()
const unpassListModalRef = ref()
const detailModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const tableRef = ref<any>(null)
const loading = ref(true)

/**
 * 风险统计（fxCategoryRuleCnt）：列定义见下方 tableColumns
 *
 * 左侧冻结到「规则级别」为止（需求 2026-10-14）：勾选框 ~ 规则级别 这 7 列固定，
 * 横向滚动时行身份（规则编码/名称）与它的几个归类字段一直留在视野里，其余列（执行阶段往后）左右滑动。
 * ⚠️ 固定列必须是**定宽**：规则名称原来是 minWidth（弹性列），固定后弹性失效，
 *    所以这里给它一个明确的 width，免得冻结列宽度算不准。
 */
const tableColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'checkbox', width: 50, fixed: 'left' },
  { type: 'seq', title: '序号', width: 60, fixed: 'left' },
  { field: 'ruleCode', title: '规则编码', width: 150, fixed: 'left' },
  { field: 'ruleName', title: '规则名称', width: 220, fixed: 'left' },
  // { field: 'ruleDesc', title: '规则描述', minWidth: 240 },
  { field: 'ruleMajorName', title: '适用专业', width: 110, fixed: 'left' },
  { field: 'ruleClassifyName', title: '规则分类', width: 120, fixed: 'left' },
  { field: 'ruleLevelName', title: '规则级别', width: 120, fixed: 'left' },
  { field: 'execStageName', title: '执行阶段', width: 110 },
  { field: 'subobjectName', title: '应用阶段', width: 110 },
  { field: 'sort', title: '排序', width: 70 },
  // 以下三列取自接口文档「八、审核规则分页」返参（field 名按文档逐个对齐，别再改回原型的 points/itemsCount/risk）：
  //   ruleCnt 要点数量 / yssxCnt 预算事项数量 / fxCategoryRuleCnt 风险规则数量
  // 三列都可点：风险统计复用 getProTaskUnPassDetail；要点/事项两列的明细接口由后端另给，
  // 接口到位前弹窗能开、列头正确、表体为空（见各自弹窗的 getList）。
  // 宽度按「表头 8 个汉字 + 单元格内边距」够用即可：这三列只是徽标/数字，
  // 给宽了会把整表推得更宽（本表列多，本来就横向滚动）。
  { field: 'ruleCnt', title: '已分配审核要点数', width: 140, align: 'center', headerAlign: 'center', slots: { default: 'ruleCnt' } },
  { field: 'yssxCnt', title: '已分配事项数', width: 124, align: 'center', headerAlign: 'center', slots: { default: 'yssxCnt' } },
  { field: 'fxCategoryRuleCnt', title: '风险统计', width: 88, align: 'center', headerAlign: 'center', slots: { default: 'fxCategoryRuleCnt' } },
  /*
   末列用 `minWidth`（弹性列）而不是定宽：整表其余列都是定宽（合计 1584px），
   少了这一列弹性列，容器比 1584 宽时右侧就会露出一条留白（生产上大屏尤其明显）。
   VXE 会把「容器宽 − 其余列宽」的余量分给带 minWidth 的列，所以末列会一直顶到最右边。
   ⚠️ 弹性列**不能同时是固定列**（固定列必须是定宽），所以前面那 7 列的固定与这里的弹性要分开看。
  */
  { field: 'ruleStatus', title: '规则状态', minWidth: 130, slots: { header: 'ruleStatusHeader', default: 'ruleStatus' } }
])

const searchColumns = reactive<ColumnProps[]>([
  { prop: 'ruleCode', label: '规则编码', search: { el: 'input', order: 1, props: { clearable: true, placeholder: '请输入规则编码' } } },
  { prop: 'ruleName', label: '规则名称', search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入规则名称' } } },
  // { prop: 'ruleDesc', label: '规则描述', search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入规则描述' } } },
  {
    prop: 'ruleMajor',
    label: '适用专业',
    enum: () => getPublicData('AI_AUDIT_RULE_MAJOR_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 4, props: { clearable: true, filterable: true, placeholder: '请选择适用专业' } }
  },
  {
    prop: 'ruleClassify',
    label: '规则分类',
    enum: () => getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 5, props: { clearable: true, filterable: true, placeholder: '请选择规则分类' } }
  },
  {
    prop: 'ruleLevel',
    label: '规则级别',
    enum: () => getPublicData('AI_AUDIT_RULE_LEVEL_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 6, props: { clearable: true, filterable: true, placeholder: '请选择规则级别' } }
  },
  {
    prop: 'ruleStatus',
    label: '规则状态',
    enum: () => getPublicData('ZLYS_SFQY'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 7, props: { clearable: true, filterable: true, placeholder: '请选择规则状态' } }
  }
])

const getSaveStatus = async (row: any) => {
  const res = await changeStatus({ ...row })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('保存成功！')
  resetTable()
}

const resetTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

/**
 * 看板点击联动主表：写 RangeVxeTable 的 searchParam 后刷新。
 *
 * searchParam 就是搜索表单双向绑定的那个 reactive 对象（SearchFormItem 的 v-model），
 * 所以写进去后条件会立刻回显在搜索框里，用户也能手动改、点「重置」能清掉。
 *
 * 两个必须注意的点：
 * 1. RangeVxeTable 没有 search()/handleSearch() 对外方法，getTableList() 是唯一刷新入口；
 * 2. getTableList() 不会重置页码，必须自己写 pageable.current = 1，否则停在第 3 页就还是请求第 3 页。
 *
 * value 传空串表示清除该条件（不能用 undefined，会显示成 "undefined"）。
 * field 必须是 searchColumns 里注册过的 prop，否则搜索框看不到、且会被 reset() 静默删掉。
 */
const applyChartFilter = async ({ field, value }: { field: string; value: string }) => {
  const table = tableRef.value
  if (!table) return
  table.searchParam[field] = value
  table.pageable.current = 1
  table.clearSelection()
  await table.getTableList()
}

const callBackHandle = (data: any) => data

const getPageList = async (params: any) => {
  loading.value = true
  try {
    return await getRuleMonitoringPage(params)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value?.isQuery) {
      isShowPage.value = true
      /*
       * 页面渲染后让 VXE 重算一次列宽。
       * 原因：本表只有「规则状态」一列是弹性列（minWidth），其余全是定宽 ——
       * 首次布局时容器宽度还没定下来（页面刚渲染 / 侧栏与页签还在收口），VXE 会按
       * 「没有余量」把列宽算死，于是容器更宽时右侧空出一条（生产大屏上尤其明显）。
       * VXE 自己只在 resize 时才重算，所以这里补一次（两次 nextTick 等网格挂完）。
       */
      await nextTick()
      await nextTick()
      tableRef.value?.gridRef?.recalculate?.(true)
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * 角色上下文：看板穿透弹窗里的「一级单位/二级单位」下拉要靠它调 getYjdwList / getEjdwList
 * （这两个接口必传 bmId/dwId）。字段名沿用同模块 aiAuditInuseRange 的取法：
 * userDialog 选中的角色对象里 specialorgid 即部门、org_id 即单位。
 */
const roleParams = computed(() => {
  const userMsg = userDialogRef.value?.userMsg || {}
  return {
    bmId: userMsg.specialorgid || userDialogRef.value?.specialorgid || '',
    dwId: userMsg.org_id || ''
  }
})

/* ---------------- 后三列的穿透 ---------------- */

/**
 * 已分配审核要点数 → 审核要点清单。
 * 明细接口由后端另给（弹窗里的 getList 目前回空数组，接上接口即生效），
 * 这里只负责把规则名与 categoryRuleId 传下去。
 */
const openPointList = (row: any) => {
  auditPointListModalRef.value?.acceptParams({
    ruleName: row.ruleName || '',
    categoryRuleId: row.categoryRuleId || ''
  })
}

/** 已分配事项数 → 已分配事项清单（同上，明细接口待后端提供） */
const openItemList = (row: any) => {
  itemListModalRef.value?.acceptParams({
    ruleName: row.ruleName || '',
    categoryRuleId: row.categoryRuleId || ''
  })
}

/**
 * 审核要点清单里的「已分配事项数」→ 二级弹层：已分配事项清单。
 * 走的是**文档十三**（getXmyssxByRulePage，入参是**要点id** ruleId），
 * 与主列表该列的穿透（文档十二，按规则 id 查）不是同一个接口；参数只带要点 id，
 * 标题因此固定为「已分配事项清单」。
 */
const openItemListFromPoint = (payload: { ruleId: string }) => {
  itemListModalRef.value?.acceptParams({ ruleId: payload.ruleId })
}

/** 风险统计 → 该规则的未通过清单（复用 getProTaskUnPassDetail） */
const openUnpassList = (row: any) => {
  unpassListModalRef.value?.acceptParams({
    categoryRuleId: row.categoryRuleId || '',
    ruleName: row.ruleName || '',
    roleParams: roleParams.value
  })
}

const handleBtn = async (selectedList: SelectedRow[], type: OperationType) => {
  if (type === 'ADD' || type === 'EDIT') {
    rangeModalRef.value?.acceptParams({
      searchParams: type === 'EDIT' ? { ...selectedList[0] } : {},
      type: type === 'ADD' ? '新增' : '编辑'
    })
    return
  }
  if (type === 'RELATE' || type === 'RELATEYJDW') {
    relateProtTypeRef.value?.acceptParams({ ruleId: selectedList[0].ruleId, type })
    return
  }
  if (type === 'BUDGETITEM') {
    budgetItemModalRef.value?.acceptParams({ ruleId: selectedList[0].ruleId, type })
    return
  }
  if (type === 'AUDITPOINT') {
    router.push({ name: '/suzhou/aiAuditRulePoint/index' })
    return
  }
  if (type === 'PROMPTEDIT') {
    promptModalRef.value?.acceptParams({ searchParams: { ...selectedList[0] }, type: '提示词配置' })
    return
  }
  if (type === 'DETAIL') {
    detailModalRef.value?.acceptParams({ ruleId: selectedList[0].ruleId })
    return
  }
  const confirmResult = await VXETable.modal.confirm('删除后无法恢复，请确定！', '提示', { status: 'warning' })
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')
  console.log('delete', selectedList)
  console.log(
    'delete',
    selectedList.map((item) => item.ruleId)
  )
  const res = await removeRule(selectedList.map((item) => item.categoryRuleId))
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  resetTable()
}

const searchHandle = (val: any) => {
  if (val) resetTable()
}

const importHandle = () => {
  importRef.value?.acceptParams({
    title: '审核规则',
    importApi: (importParams: any) => importRule(importParams),
    getTableList: () => tableRef.value?.getTableList()
  })
}
const exportHandle = async () => {
  try {
    loading.value = true
    const searchParam = tableRef.value?.searchParam || {}
    await apiExportHandle({ ...searchParam, ...roleParams.value }, '审核规则', exportRuleMonitoring)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
