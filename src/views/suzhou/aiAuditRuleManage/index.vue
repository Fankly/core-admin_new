<!-- 智能审核规则管理 -->
<template>
  <div v-if="isShowPage" class="ai-audit-rule-manage">
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
        :tool-button="['setting', 'search', 'help']"
        :loading="loading"
      >
        <template #tableHeader="scope">
          <div class="rule-action-group rule-action-group--maintenance">
            <el-button
              v-permission="'ADD'"
              class="rule-action rule-action--primary"
              size="mini"
              type="primary"
              plain
              @click="handleBtn(scope.selectedList, 'ADD')"
            >
              <span>新 增</span>
            </el-button>
            <el-button
              v-permission="'EDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'EDIT')"
            >
              <span>编 辑</span>
            </el-button>
            <el-button
              v-permission="'DELETE'"
              class="rule-action"
              :disabled="scope.selectedList.length === 0"
              size="mini"
              type="danger"
              plain
              @click="handleBtn(scope.selectedList, 'DELETE')"
            >
              <span>删 除</span>
            </el-button>
          </div>
          <div class="rule-action-group rule-action-group--configuration">
            <el-button
              v-permission="'RELATE'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'RELATE')"
            >
              <span>适用项目类型</span>
            </el-button>
            <el-button
              v-permission="'RELATEYJDW'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'RELATEYJDW')"
            >
              <span>适用一级单位</span>
            </el-button>
            <el-button
              v-permission="'PROMPTEDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'PROMPTEDIT')"
            >
              <span>提示词配置</span>
            </el-button>
            <el-button
              v-permission="'PROMPTEDIT'"
              class="rule-action rule-action--secondary"
              :disabled="scope.selectedList.length !== 1"
              size="mini"
              type="primary"
              @click="handleBtn(scope.selectedList, 'DETAIL')"
            >
              <span>明细管理</span>
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
      </RangeVxeTable>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <rangeModal ref="rangeModalRef" @search-handle="searchHandle" />
  <promptModal ref="promptModalRef" @search-handle="searchHandle" />
  <relateProtType ref="relateProtTypeRef" />
  <detailModal ref="detailModalRef" />
</template>

<script setup lang="ts" name="/suzhou/aiAuditRuleManage/index">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import type { ColumnProps } from '@/components/ProTable/interface'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import rangeModal from '@/views/suzhou/aiAuditRuleManage/components/manageModal/index.vue'
import promptModal from '@/views/suzhou/aiAuditRuleManage/components/promptModal/index.vue'
import detailModal from '@/views/suzhou/aiAuditRuleManage/components/detailModal/index.vue'
import relateProtType from '@/views/suzhou/aiAuditRuleManage/components/relateProtType/index.vue'
import { rulManageGeGetRulePage, rulManageRemoveRule, rulManageSaveRule } from '@/api/suzhou/aiAuditRuleManage'
import { getPublicData } from '@/api/common'

interface SelectedRow {
  ruleId: string
  proType: string
  [key: string]: any
}

type OperationType = 'ADD' | 'EDIT' | 'DELETE' | 'RELATE' | 'RELATEYJDW' | 'PROMPTEDIT' | 'DETAIL'

const rangeModalRef = ref()
const promptModalRef = ref()
const relateProtTypeRef = ref()
const detailModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const tableRef = ref<any>(null)
const loading = ref(true)

const tableColumns = reactive<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', title: '序号', width: 60 },
  { field: 'ruleMajorName', title: '规则类型', width: 110 },
  { field: 'ruleCode', title: '规则编码', width: 150 },
  { field: 'ruleName', title: '规则名称', minWidth: 200 },
  { field: 'ruleDesc', title: '规则描述', minWidth: 240 },
  { field: 'ruleClassifyName', title: '规则分类', width: 120 },
  { field: 'ruleLevelName', title: '规则级别', width: 120 },
  { field: 'execStageName', title: '执行阶段', width: 110 },
  { field: 'sort', title: '排序', width: 70 },
  { field: 'ruleStatus', title: '规则状态', width: 112, slots: { header: 'ruleStatusHeader', default: 'ruleStatus' } }
])

const searchColumns = reactive<ColumnProps[]>([
  { prop: 'ruleCode', label: '规则编码', search: { el: 'input', order: 1, props: { clearable: true, placeholder: '请输入规则编码' } } },
  { prop: 'ruleName', label: '规则名称', search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入规则名称' } } },
  { prop: 'ruleDesc', label: '规则描述', search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入规则描述' } } },
  {
    prop: 'ruleClassify',
    label: '规则分类',
    enum: () => getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 4, props: { clearable: true, filterable: true, placeholder: '请选择规则分类' } }
  },
  {
    prop: 'ruleLevel',
    label: '规则级别',
    enum: () => getPublicData('AI_AUDIT_RULE_LEVEL_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 5, props: { clearable: true, filterable: true, placeholder: '请选择规则级别' } }
  },
  {
    prop: 'ruleStatus',
    label: '规则状态',
    enum: () => getPublicData('ZLYS_SFQY'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 6, props: { clearable: true, filterable: true, placeholder: '请选择规则状态' } }
  }
])

const getSaveStatus = async (row: any) => {
  const res = await rulManageSaveRule({ ...row })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('保存成功！')
  resetTable()
}

const resetTable = () => {
  tableRef.value?.clearSelection()
  tableRef.value?.getTableList()
}

const callBackHandle = (data: any) => data

const getPageList = async (params: any) => {
  loading.value = true
  try {
    return await rulManageGeGetRulePage(params)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value?.isQuery) isShowPage.value = true
  } catch (e) {
    console.error(e)
  }
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
  const res = await rulManageRemoveRule(selectedList.map((item) => item.ruleId))
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功！')
  resetTable()
}

const searchHandle = (val: any) => {
  if (val) resetTable()
}

onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
