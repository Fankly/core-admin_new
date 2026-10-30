<!-- 审核要点 - 右侧面板 -->
<template>
  <div class="point-right">
    <!-- 第一段：标题 -->
    <div class="point-right__header">
      <div class="point-right__title-area">
        <span class="point-right__title-icon-wrap">
          <Layers class="point-right__title-icon" />
        </span>
        <div class="point-right__title-group">
          <div class="point-right__meta">
            <span class="point-right__code">{{ item?.ruleCode }}</span>
            <!-- <span class="point-right__status" :class="item?.ruleStatus === '1' ? 'point-right__status--on' : 'point-right__status--off'">
              {{ item?.ruleStatus === '1' ? '已启用' : '未启用' }}
            </span> -->
          </div>
          <span class="point-right__title">{{ item?.ruleName || '审核要点配置' }}</span>
        </div>
      </div>
    </div>

    <!-- 第二段：搜索 -->
    <div class="point-right__search">
      <!-- <el-input
        v-model="pointKeyWord"
        class="point-right__search-input"
        size="small"
        clearable
        placeholder="按要点名称/编码搜索"
        @keyup.enter="fetchList"
        @input="fetchList"
      >
        <template #prefix>
          <Search class="point-right__search-icon" />
        </template>
      </el-input> -->
      <el-button v-permission="'ADD'" class="point-right__add" size="small" type="primary" @click="handleAdd">
        <span>+ 新增要点</span>
      </el-button>
      <el-button v-permission="'EDIT'" class="point-right__btn-icon-text" size="small" type="primary" plain @click="handleBatchFirstLevel">
        批量适用一级单位
      </el-button>
      <el-button v-permission="'EDIT'" class="point-right__btn-icon-text" size="small" type="primary" plain @click="handleBatchRelate">
        批量关联预算事项
      </el-button>
      <el-button v-permission="'EDIT'" class="point-right__btn-icon-text" size="small" type="primary" plain @click="handleBatchPrompt">
        批量提示词配置
      </el-button>
      <el-button v-permission="'IMPORT'" class="point-right__btn-icon-text" size="small" type="primary" plain @click="importHandle">
        <Upload class="point-right__btn-icon" /><span>导 入</span>
      </el-button>
      <el-button v-permission="'EXPORT'" class="point-right__btn-icon-text" size="small" type="primary" plain @click="exportHandle">
        <Download class="point-right__btn-icon" />
        <span>导 出</span>
      </el-button>
      <!-- <el-select v-model="ruleClassify" class="point-right__classify" size="small" filterable>
        <template #prefix>
          <Filter class="point-right__classify-icon" />
          <span class="point-right__classify-label">规则分类：</span>
        </template>
        <el-option v-for="item in ruleClassifyOptions" :key="item.code" :label="`${item.name}(${item.count})`" :value="item.code" />
      </el-select> -->
      <span class="point-right__search-tip">
        提示：选中复选框可进行
        <span class="point-right__search-tip-action">批量适用一级单位</span>、
        <span class="point-right__search-tip-action">批量关联预算事项</span>
        或
        <span class="point-right__search-tip-action">批量提示词配置</span>
      </span>
    </div>

    <!-- 第三段：表格 -->
    <div class="point-right__table">
      <div class="point-right__table-main">
        <div class="point-right__table-inner">
          <RangeVxeTable
            ref="tableRef"
            class="point-right__table-grid"
            row-key="pointId"
            row-click-mode="exclusive"
            :request-api="getPageList"
            :init-param="initParam"
            :border="true"
            :pagination="true"
            :request-auto="false"
            :columns="tableColumns"
            :search-columns="searchColumns"
            :search-col="4"
            :loading="loading"
          >
            <template #status="{ row }">
              <el-button size="small" type="text" @click.prevent.stop="toggleRuleStatus(row)">
                <span :style="{ color: row.ruleStatus === '0' ? 'red' : '#00706b' }">{{ row.ruleStatusName }}</span>
              </el-button>
            </template>
            <template #operate="{ row }">
              <div class="point-right__table-operate">
                <el-tooltip content="适用一级单位" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.prevent.stop="handleFirstLevel(row)">
                    <Building2 class="point-right__table-icon point-right__table-icon--action" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="明细管理" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.prevent.stop="handleDetail(row)">
                    <ListTree class="point-right__table-icon point-right__table-icon--action" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="关联预算事项" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.prevent.stop="handleRelate(row)">
                    <Link2 class="point-right__table-icon point-right__table-icon--action" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="提示词配置" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.prevent.stop="handlePrompt(row)">
                    <MessageSquareText class="point-right__table-icon point-right__table-icon--action" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-permission="'EDIT'" content="编辑" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.stop="handleEdit(row)">
                    <Edit class="point-right__table-icon point-right__table-icon--edit" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-permission="'EDIT'" content="删除" placement="top" :show-after="200">
                  <el-button class="point-right__table-icon-btn" text @click.stop="handleDelete(row)">
                    <Trash2 class="point-right__table-icon point-right__table-icon--delete" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
            <template #ruleCode="{ row }">{{ row.ruleCode }}</template>
            <template #ruleName="{ row }">{{ row.ruleName }}</template>
          </RangeVxeTable>
        </div>
        <!-- <div class="point-right__table-footer">
          <span class="point-right__table-footer-left">共展示 5 条审核要点</span>
          <span class="point-right__table-footer-right">数据表格展现要点核心指标</span>
        </div> -->
      </div>
    </div>
    <relateProtType ref="relateProtTypeRef" />
    <detailModal ref="detailModalRef" />
    <pointModel ref="pointModelRef" :item="props.item" @search-handle="searchHandle" />
    <promptModal ref="promptModalRef" @search-handle="searchHandle" />
    <budgetItemModal ref="budgetItemModalRef" />
    <ImportExcel ref="importRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Layers, Search, Filter, Edit, Trash2, Upload, Download, Building2, ListTree, Link2, MessageSquareText } from '@lucide/vue'
import type { VxeGridProps } from 'vxe-table'
import type { ColumnProps } from '@/components/ProTable/interface'
import { VXETable } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getRulePointPage, changeRuleStatus, removeRulePoint, importPoint, exportPoint } from '@/api/suzhou/aiAuditRulePoint'
import pointModel from './pointModel/index.vue'
import promptModal from './promptModal/index.vue'
import budgetItemModal from './budgetItemModal/index.vue'
import detailModal from './detailModal/index.vue'
import relateProtType from './relateProtType/index.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { apiExportHandle } from '@/utils/export'
import { getPublicData } from '@/api/common'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

interface PointItem {
  categoryRuleId: string
  ruleCode: string
  ruleName: string
  ruleStatus: '0' | '1'
  [key: string]: any
}

const importRef = ref()
const pointModelRef = ref()
const promptModalRef = ref()
const budgetItemModalRef = ref()
const relateProtTypeRef = ref()
const detailModalRef = ref()
const props = defineProps<{ item?: PointItem | null }>()
const pointKeyWord = ref('')
const ruleClassify = ref('')
const ruleClassifyOptions = ref<{ code: string; name: string; count: number }[]>([
  { code: '', name: '全部', count: 5 },
  { code: '1', name: '合规性', count: 2 },
  { code: '2', name: '一致性', count: 2 },
  { code: '3', name: '完整性', count: 1 }
])
ruleClassify.value = ruleClassifyOptions.value[0].code

const tableRef = ref<any>(null)
const loading = ref(false)
// 注入到每次分页/搜索请求的基础参数；未选中规则时 categoryRuleId 为空
const initParam = reactive<Record<string, any>>({ categoryRuleId: '', ruleStatus: '1' })

const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'auditPointCode',
    label: '要点编码',
    search: {
      order: 1,
      render: ReMultipleText as any,
      props: { class: 'pq-search-input', placeholder: '请输入要点编码，多个用逗号分隔' }
    }
  },
  { prop: 'auditPointName', label: '要点名称', search: { el: 'input', order: 2, props: { clearable: true, placeholder: '请输入要点名称' } } },
  // { prop: 'ruleDesc', label: '要点描述', search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入要点描述' } } },
  // { prop: 'dataSource', label: '数据来源', search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入数据来源' } } },
  // { prop: 'judgementRuleDesc', label: '判断规则', search: { el: 'input', order: 3, props: { clearable: true, placeholder: '请输入判断规则' } } },
  {
    prop: 'ruleStatus',
    label: '要点状态',
    enum: () => getPublicData('ZLYS_SFQY'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 6, props: { clearable: true, filterable: true, placeholder: '请选择要点状态' } }
  },
  {
    prop: 'pointSource',
    label: '要点来源',
    enum: () => getPublicData('AI_AUDIT_POINT_SOURCE_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 7, props: { clearable: true, filterable: true, placeholder: '请选择要点来源' } }
  },
  {
    prop: 'isImplemented',
    label: '是否实现',
    enum: () => getPublicData('AI_AUDIT_IS_IMPLEMENTED_COM'),
    fieldNames: { label: 'name', value: 'code' },
    search: { el: 'select', order: 7, props: { clearable: true, filterable: true, placeholder: '请选择是否实现' } }
  }
])

const tableColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'checkbox', width: 50 },
  { field: 'sort', title: '排序', width: 50 },
  { field: 'ruleCode', title: '规则编码', width: 130, slots: { default: 'ruleCode' } },
  { field: 'ruleName', title: '规则名称', minWidth: 100, slots: { default: 'ruleName' } },
  { field: 'auditPointCode', title: '要点编码', width: 140 },
  { field: 'auditPointName', title: '要点名称', minWidth: 100 },
  { field: 'pointSourceName', title: '要点来源', width: 100 },
  // 是否实现（需求 2026-10-14）：接口返 isImplemented(code) + isImplementedName(name)，列表展示名称
  { field: 'isImplementedName', title: '是否实现', width: 100 },
  // { field: 'ruleDesc', title: '审核要点描述', minWidth: 120 },
  // { field: 'dataSource', title: '数据来源', minWidth: 120 },
  // { field: 'judgementRuleDesc', title: '判断规则', minWidth: 120 },
  { field: 'status', title: '状态', width: 80, slots: { default: 'status' } },
  { field: 'operate', title: '操作', width: 200, fixed: 'right', slots: { default: 'operate' } }
])

const importHandle = () => {
  importRef.value?.acceptParams({
    title: '审核要点',
    importApi: (importParams: any) => importPoint(importParams),
    getTableList: () => tableRef.value?.getTableList()
  })
}
const exportHandle = async () => {
  try {
    loading.value = true
    initParam.pointKeyWord = pointKeyWord.value
    // 导出要带当前查询条件：与列表请求同源（initParam + 搜索表单），否则导出的永远是全量
    const searchParams: Record<string, any> = { ...(tableRef.value?.searchParam || {}) }
    // 要点编码是多值输入，兜底成后端 exportExcel 需要的字符串（逗号分隔），传数组会 500
    if (Array.isArray(searchParams.auditPointCode)) searchParams.auditPointCode = searchParams.auditPointCode.join(',')
    await apiExportHandle({ ...initParam, ...searchParams }, '审核要点', exportPoint)
  } catch (e) {
    ElMessage.error((e as Error).message || '导出失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  pointModelRef.value?.acceptParams({ searchParams: {}, type: 'ADD' })
}

const handleEdit = (row: any) => {
  pointModelRef.value?.acceptParams({ searchParams: { ...row }, type: 'EDIT' })
}

const handleDelete = (row: any) => {
  VXETable.modal
    .confirm('删除后无法恢复，请确定！', '提示', { status: 'warning' })
    .then(async (type) => {
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
      loading.value = true
      try {
        const res = await removeRulePoint([row.ruleId])
        if (res.success) {
          ElMessage.success('删除成功！')
          tableRef.value?.getTableList()
        } else {
          ElMessage.error(res.msg)
        }
      } catch (e) {
        ElMessage.error((e as Error).message)
      } finally {
        loading.value = false
      }
    })
    .catch(() => {})
}

const toggleRuleStatus = async (row: any) => {
  try {
    const res = await changeRuleStatus({
      ruleId: row.ruleId,
      ruleStatus: row.ruleStatus == '0' ? '1' : '0'
    })
    if (res.success) {
      tableRef.value?.getTableList()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleFirstLevel = (row: any) => {
  relateProtTypeRef.value?.acceptParams({ ruleId: row.ruleId, type: 'RELATEYJDW' })
}
const handleDetail = (row: any) => {
  detailModalRef.value?.acceptParams({ ruleId: row.ruleId })
}

const handleRelate = (row: any) => {
  budgetItemModalRef.value?.acceptParams({ ruleId: row.ruleId, type: 'BUDGETITEM' })
}

const handlePrompt = (row: any) => {
  promptModalRef.value?.acceptParams({ searchParams: { ...row }, ruleIdList: [row.ruleId], modalTitle: '提示词配置' })
}

const handleBatchRelate = () => {
  const selected = tableRef.value?.getCheckboxRecords?.() || []
  if (!selected.length) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  const ruleIdList = selected.map((item: any) => item.ruleId)
  budgetItemModalRef.value?.acceptParams({ ruleIdList, type: 'BUDGETALL' })
}

const handleBatchFirstLevel = () => {
  const selected = tableRef.value?.getCheckboxRecords?.() || []
  if (!selected.length) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  const ruleIdList = selected.map((item: any) => item.ruleId)
  relateProtTypeRef.value?.acceptParams({ ruleIdList, type: 'RELATEYJDW_BATCH' })
}

const handleBatchPrompt = () => {
  const selected = tableRef.value?.getCheckboxRecords?.() || []
  if (!selected.length) {
    ElMessage.warning('请至少选择一条数据')
    return
  }
  const ruleIdList = selected.map((item: any) => item.ruleId)
  promptModalRef.value?.acceptParams({ searchParams: {}, ruleIdList, modalTitle: '批量提示词配置' })
}

// 要点弹窗保存成功后刷新列表
const searchHandle = (val: any) => {
  if (val) tableRef.value?.getTableList()
}

const getPageList = async (params: any) => {
  loading.value = true
  try {
    return await getRulePointPage(params)
  } finally {
    loading.value = false
  }
}

const fetchList = () => {
  initParam.pointKeyWord = pointKeyWord.value
  tableRef.value?.getTableList()
}

// 左侧选中规则变化 → 更新 initParam 并重新拉取要点列表（取消选中时归一化为空）
watch(
  () => props.item?.categoryRuleId,
  (val) => {
    initParam.categoryRuleId = val || ''
    tableRef.value?.getTableList()
  }
)

// 挂载后默认加载一次（此时未选中规则，categoryRuleId 为空）
onMounted(() => {
  tableRef.value?.getTableList()
})

// 调试：挂载后默认打开提示词配置弹窗
// onMounted(() => {
//   promptModalRef.value?.acceptParams({ searchParams: {}, type: '提示词配置' })
// })
</script>

<style scoped lang="less">
@primary: #00706b;
@primary-hover: #2a9a92;
@primary-active: #005f5a;
@primary-soft: #f2f9f8;
@primary-hover-soft: #e6f4f3;
@primary-border: #b8ddd9;
@text-main: #1e293b;
@text-body: #475569;
@text-muted: #64748b;
@surface: #ffffff;
@border: #e2e8f0;
@border-light: #eef2f6;

.point-right {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
    padding: 14px 14px;
    border-bottom: 1px solid @border-light;
  }

  &__title-area {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  &__add {
    flex-shrink: 0;
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__code {
    color: @primary;
    font-size: 13px;
    font-weight: 600;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    font-size: 12px;
    border-radius: 10px;

    &--on {
      color: @primary;
      background-color: @primary-soft;
      border: 1px solid @primary-border;
    }

    &--off {
      color: #e07a12;
      background-color: fade(#e07a12, 8%);
      border: 1px solid #e07a12;
    }
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: @text-main;
    font-size: 17px;
    font-weight: 600;
  }

  &__title-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: @primary-hover-soft;
    border: 1px solid @primary-border;
    border-radius: 8px;
  }

  &__title-icon {
    width: 24px;
    height: 24px;
    color: @primary;
  }

  &__title-bar {
    display: inline-block;
    width: 10px;
    height: 1.5em;
    background: @primary;
    border-radius: 5px;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    padding: 16px 14px;
    border-bottom: 1px solid @border-light;
  }

  &__search-tip {
    margin-left: auto;
    color: @text-muted;
    font-size: 12px;
    white-space: nowrap;
  }

  &__search-tip-action {
    color: @primary;
    cursor: pointer;
    transition: color 0.12s ease;

    &:hover {
      color: @primary-hover;
    }
  }

  &__classify-label {
    color: @text-muted;
    font-size: 12px;
    white-space: nowrap;
  }

  &__classify {
    width: 200px;

    :deep(.el-input__inner) {
      height: 32px;
      line-height: 32px;
      color: @text-body;
      font-size: 12px;
      border-color: @border;
      border-radius: 6px;
      padding-left: 84px;

      &:hover {
        border-color: @primary-border;
      }

      &:focus {
        border-color: @primary;
      }
    }

    :deep(.el-input__prefix) {
      left: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  &__classify-icon {
    width: 14px;
    height: 14px;
    margin-right: 8px;
    color: @text-muted;
  }

  &__search-input {
    width: 240px;

    :deep(.el-input__inner) {
      height: 32px;
      line-height: 32px;
      color: @text-body;
      font-size: 12px;
      border-color: @border;
      border-radius: 6px;
      padding-left: 30px;

      &:hover {
        border-color: @primary-border;
      }

      &:focus {
        border-color: @primary;
      }
    }

    :deep(.el-input__prefix) {
      left: 8px;
      display: flex;
      align-items: center;
      color: @text-muted;
    }
  }

  &__search-icon {
    width: 14px;
    height: 14px;
    color: @text-muted;
  }

  &__table {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 14px;
  }

  &__table-main {
    flex: 1 1 0;
    min-height: 0;
    overflow: auto;
    border: 1px solid @border;
    border-radius: 10px;
  }

  &__table-inner {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  &__table-footer {
    flex-shrink: 0;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-top: 1px solid @border-light;
  }

  &__table-footer-left,
  &__table-footer-right {
    color: @text-muted;
    font-size: 12px;
  }

  &__table-grid {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    width: 100%;
    height: 100% !important;
    min-width: 0;
    min-height: 0;
    overflow: hidden;

    :deep(.table-search) {
      padding: 20px 20px 0 20px;
    }

    :deep(.vxe-grid),
    :deep(.vxe-table) {
      width: 100% !important;
      height: 100% !important;
      --vxe-table-header-font-color: @primary;
      --vxe-table-header-background-color: #dff3f0;
      --vxe-table-header-font-weight: 600;
      --vxe-table-border-color: @border;
      --vxe-table-row-hover-background-color: #e6f4f3;
      --vxe-table-row-striped-background-color: #f7fcfb;
      --vxe-table-row-current-background-color: #d8efec;
      --vxe-table-row-checkbox-checked-background-color: #d8efec;
    }

    :deep(.vxe-table--header-wrapper),
    :deep(.vxe-table--header),
    :deep(.vxe-header--column) {
      background-color: #dff3f0 !important;
    }

    :deep(.vxe-header--column) {
      height: 36px;
      color: @primary !important;
      font-size: 13px;
      font-weight: 600;

      .vxe-cell {
        color: inherit;
        font-size: 13px;
      }
    }

    :deep(.vxe-body--column) {
      height: 32px;
      color: @text-body;
      font-size: 13px;

      .vxe-cell {
        font-size: 13px;
      }
    }

    :deep(.vxe-body--row.row--stripe) {
      background-color: #f7fcfb !important;
    }

    :deep(.vxe-body--row.row--checked),
    :deep(.vxe-body--row.row--current) {
      background-color: #d8efec !important;
    }

    :deep(.vxe-body--row.row--hover),
    :deep(.vxe-body--row.row--hover.row--checked) {
      background-color: #e6f4f3 !important;
    }

    :deep(.vxe-body--row.row--stripe .vxe-body--column),
    :deep(.vxe-body--row.row--checked .vxe-body--column),
    :deep(.vxe-body--row.row--hover .vxe-body--column),
    :deep(.vxe-body--row.row--current .vxe-body--column) {
      background-color: transparent !important;
    }

    :deep(.vxe-checkbox--icon) {
      color: @primary !important;
    }
  }

  &__table-operate {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__table-icon-btn {
    padding: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    background: transparent !important;
    border: none !important;

    &:hover,
    &:focus {
      background: transparent !important;
      color: inherit !important;
    }
  }

  &__table-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    cursor: pointer;
    transition: color 0.12s ease, opacity 0.12s ease;

    &:hover {
      opacity: 0.8;
    }

    &--edit {
      color: @primary;
    }

    &--action {
      color: @text-body;
    }

    &--delete {
      color: #f56c6c;
    }
  }

  &__btn-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}

:deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  height: 32px;
  min-height: 32px;
  padding: 6px 12px;
  line-height: 1;
}

:deep(.el-button.point-right__btn-icon-text > span) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.point-right :deep(.el-button.point-right__add) {
  color: #ffffff !important;
  background-color: @primary !important;
  border-color: @primary !important;
  background-image: none !important;

  &:hover,
  &:focus {
    color: #ffffff !important;
    background-color: @primary-hover !important;
    border-color: @primary-hover !important;
  }

  &:active {
    color: #ffffff !important;
    background-color: @primary-active !important;
    border-color: @primary-active !important;
  }
}
</style>
