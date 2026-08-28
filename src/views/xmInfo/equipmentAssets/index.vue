<template>
  <!--
    THESIS: 设备资产管理把项目定位、三类资产账册和受控编辑放在同一工作区，拒绝把同一项目拆成三张孤立菜单页。
    OWN-WORLD: 白色单层业务框、薄荷表头、#00706b 青绿操作色与细网格，继承“电网管控台”基准。
    STORY: 用户先定位项目，再切换 PMS、运维或检修资产，完成筛选、核对与增删改。
    FIRST VIEWPORT: 操作工具栏与项目查询区置顶，资产页签位于查询区和主表之间，新增/编辑从顶部主操作进入弹窗。
    FORM: 三页签资产台账，继承 benchmark operate 结构；FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
  -->
  <div v-if="isShowPage" class="equipment-assets-page">
    <section class="asset-card">
      <div class="asset-table-wrap">
        <RangeVxeTable
          :key="activeKind"
          ref="tableRef"
          :columns="tableColumns"
          :request-api="requestApi"
          :request-auto="false"
          :pagination="false"
          :tool-button="['setting', 'search', 'help']"
          row-key="id"
        >
          <template #tableHeader="{ selectedList }">
            <div class="table-command-group">
              <el-button type="primary" size="mini" plain :disabled="!activeProjectKey" @click="openAdd"> 新 增 </el-button>
              <el-button type="primary" size="mini" plain :disabled="selectedList.length !== 1" @click="openEdit(selectedList)"> 编 辑 </el-button>
              <el-button type="danger" size="mini" plain :disabled="selectedList.length === 0" @click="removeSelected(selectedList)">
                删 除
              </el-button>
            </div>
          </template>
          <template #beforeSearch>
            <div class="asset-search-panel">
              <el-form class="asset-search-form" label-width="auto" label-position="right" @submit.prevent>
                <el-form-item :label="`${activeConfig.projectLabel}：`">
                  <el-input
                    v-model="projectKeys[activeKind]"
                    clearable
                    :placeholder="`请输入${activeConfig.projectLabel}`"
                    @keyup.enter="handleProjectSearch"
                  />
                </el-form-item>
                <el-form-item label="资产关键词：">
                  <el-input v-model="keywords[activeKind]" clearable placeholder="编码、名称或资产编号" @keyup.enter="handleProjectSearch" />
                </el-form-item>
                <el-form-item class="asset-search-actions">
                  <el-button size="mini" plain type="primary" @click="handleProjectSearch">查 询</el-button>
                  <el-button size="mini" plain @click="resetSearch">重 置</el-button>
                </el-form-item>
              </el-form>
            </div>
            <el-alert v-if="loadError" class="asset-alert" type="error" :closable="false" show-icon :title="loadError" />
          </template>
          <template #beforeTable>
            <el-tabs v-model="activeKind" class="asset-kind-tabs">
              <el-tab-pane v-for="kind in assetKinds" :key="kind" :name="kind">
                <template #label>
                  <span class="kind-tab-label">
                    <span>{{ assetKindConfigs[kind].label }}</span>
                    <span class="kind-count">{{ counts[kind] }}</span>
                  </span>
                </template>
              </el-tab-pane>
            </el-tabs>
          </template>
          <template #operation="{ row }">
            <el-button class="row-edit-btn" type="text" size="mini" title="编辑资产" @click="openEdit([row])"> 编 辑 </el-button>
          </template>
        </RangeVxeTable>
      </div>
    </section>
  </div>

  <AssetFormDialog
    v-if="isShowPage"
    v-model="formVisible"
    :kind="activeKind"
    :mode="formMode"
    :initial-data="editingData"
    :project-key="activeProjectKey"
    :submitting="formSubmitting"
    @submit="saveAsset"
  />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/xmInfo/equipmentAssets/index">
import { computed, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { addEquipmentAsset, editEquipmentAsset, getEquipmentAsset, listEquipmentAssets, removeEquipmentAssets } from '@/api/xmInfo/equipmentAssets'
import type { AssetId, AssetKind, AssetRecord } from '@/api/xmInfo/equipmentAssets'
import { assetKindConfigs, assetKinds } from './config'
import AssetFormDialog from './components/AssetFormDialog.vue'

const activeKind = ref<AssetKind>('pmsEquip')
const projectKeys = reactive<Record<AssetKind, string>>({ pmsEquip: '', gjsb: '', glsb: '' })
const keywords = reactive<Record<AssetKind, string>>({ pmsEquip: '', gjsb: '', glsb: '' })
const counts = reactive<Record<AssetKind, number>>({ pmsEquip: 0, gjsb: 0, glsb: 0 })
const tableRef = ref<InstanceType<typeof RangeVxeTable>>()
const loadError = ref('')
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const editingData = ref<AssetRecord>({})
const formSubmitting = ref(false)
const isShowPage = ref(false)
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

provide('currentUserRole', currentUserRole)

const activeConfig = computed(() => assetKindConfigs[activeKind.value])
const activeProjectKey = computed(() => projectKeys[activeKind.value].trim())
const activeKeyword = computed(() => keywords[activeKind.value].trim().toLowerCase())

const visibleFields = new Set([
  'prjcode',
  'prjid',
  'equipcode',
  'materialname',
  'equipname',
  'materialtype',
  'manufacturer',
  'astnum',
  'astname',
  'stationlinename',
  'originalequipvalue',
  'netastvalue',
  'equiptype',
  'voltagelevel',
  'oamorgname',
  'equipstatus',
  'defectquantity'
])

const formatCell = (value: any) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  return String(value)
}

const tableColumns = computed<VxeGridProps['columns']>(() => {
  const columns: any[] = [
    { type: 'checkbox', width: 48, fixed: 'left' },
    { type: 'seq', title: '序号', width: 58, fixed: 'left' }
  ]
  activeConfig.value.fields.forEach((item) => {
    columns.push({
      field: item.prop,
      title: item.label,
      width: item.width || 160,
      visible: visibleFields.has(item.prop),
      formatter: ({ cellValue }: any) => formatCell(cellValue)
    })
  })
  columns.push({ field: 'operation', title: '操作', width: 82, fixed: 'right', slots: { default: 'operation' } })
  return columns
})

const requestApi = async () => {
  const projectKey = activeProjectKey.value
  loadError.value = ''
  if (!projectKey) return { success: true, data: [] }
  try {
    const result = await listEquipmentAssets(activeKind.value, projectKey)
    if (!result.success) throw new Error(result.msg || '资产列表加载失败')
    const records = Array.isArray(result.data) ? result.data : []
    counts[activeKind.value] = records.length
    const keyword = activeKeyword.value
    const data = keyword
      ? records.filter((row) =>
          Object.values(row || {}).some((value) =>
            String(value ?? '')
              .toLowerCase()
              .includes(keyword)
          )
        )
      : records
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : '资产列表加载失败'
    loadError.value = message
    throw error
  }
}

const handleProjectSearch = async () => {
  if (!activeProjectKey.value) {
    ElMessage.warning(`请输入${activeConfig.value.projectLabel}`)
    return
  }
  await nextTick()
  tableRef.value?.clearSelection()
  await tableRef.value?.getTableList()
}

const resetSearch = async () => {
  projectKeys[activeKind.value] = ''
  keywords[activeKind.value] = ''
  counts[activeKind.value] = 0
  loadError.value = ''
  await nextTick()
  tableRef.value?.clearSelection()
  await tableRef.value?.getTableList()
}

watch(activeKind, async () => {
  loadError.value = ''
  await nextTick()
  if (activeProjectKey.value) tableRef.value?.getTableList()
})

const openAdd = () => {
  if (!activeProjectKey.value) {
    ElMessage.warning(`请先定位${activeConfig.value.projectLabel}`)
    return
  }
  formMode.value = 'add'
  editingData.value = {}
  formVisible.value = true
}

const openEdit = async (selectedList: AssetRecord[]) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('请选择一条资产记录进行编辑')
    return
  }
  const selected = selectedList[0]
  if (selected.id === null || selected.id === undefined || selected.id === '') {
    ElMessage.warning('当前记录缺少主键，无法编辑')
    return
  }
  try {
    const result = await getEquipmentAsset(activeKind.value, selected.id as AssetId)
    if (!result.success) throw new Error(result.msg || '资产详情加载失败')
    formMode.value = 'edit'
    editingData.value = result.data || selected
    formVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '资产详情加载失败')
  }
}

const removeSelected = async (selectedList: AssetRecord[]) => {
  if (!selectedList.length) return
  const confirm = await VXETable.modal.confirm(`删除后无法恢复，确定删除 ${selectedList.length} 条资产记录吗？`, '删除确认', { status: 'warning' })
  if (confirm !== 'confirm') return
  const ids = selectedList.map((item) => item.id).filter((id): id is AssetId => id !== null && id !== undefined && id !== '')
  if (!ids.length) {
    ElMessage.warning('所选记录缺少有效主键')
    return
  }
  try {
    const result = await removeEquipmentAssets(activeKind.value, ids)
    if (!result.success) throw new Error(result.msg || '删除失败')
    ElMessage.success('删除成功')
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  }
}

const saveAsset = async (payload: AssetRecord) => {
  formSubmitting.value = true
  try {
    const result = formMode.value === 'add' ? await addEquipmentAsset(activeKind.value, payload) : await editEquipmentAsset(activeKind.value, payload)
    if (!result.success) throw new Error(result.msg || '保存失败')
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '保存成功')
    formVisible.value = false
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    formSubmitting.value = false
  }
}

const getRoleHandle = () => {
  isShowPage.value = Boolean(userRoleSelectorRef.value?.canRender)
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
@primary: #00706b;
@primary-hover: #2a9a92;
@primary-soft: #f2f9f8;
@primary-hover-soft: #e6f4f3;
@primary-border: #b8ddd9;
@surface: #ffffff;
@body: #475569;
@muted: #64748b;
@border: #e2e8f0;
@divider: #eef2f6;
@danger: #f56c6c;

.equipment-assets-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
  background: transparent;
  color: @body;
}

.asset-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

.table-command-group,
.kind-tab-label {
  display: flex;
  align-items: center;
}

.asset-alert {
  flex: 0 0 auto;
  margin: 0 0 10px;
  border-radius: 6px;
}

.asset-kind-tabs {
  flex: 0 0 40px;
  min-height: 40px;
  margin-bottom: 10px;
  background: @surface;

  :deep(.el-tabs__header) {
    flex: 0 0 40px;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid @divider;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background: transparent;
  }

  :deep(.el-tabs__item) {
    height: 40px;
    padding: 0 14px;
    color: @body;
    font-size: 13px;
    font-weight: 500;

    &:hover,
    &.is-active {
      color: @primary;
    }

    &.is-active {
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 6px 6px 0 0;
    background: @primary;
  }

  :deep(.el-tabs__content) {
    display: none;
  }
}

.kind-tab-label {
  gap: 8px;
}

.kind-count {
  color: @muted;
  font-size: 12px;
  line-height: 1;
}

.asset-table-wrap {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.table-command-group {
  gap: 10px;

  :deep(.el-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    margin: 0;
    border-radius: 6px;
    font-size: 12px;
  }

  :deep(.el-button--primary.is-plain) {
    color: @primary;
    border-color: @primary-border;
    background: @primary-soft;

    &:hover,
    &:focus {
      color: @primary;
      border-color: @primary;
      background: @primary-hover-soft;
    }
  }

  :deep(.el-button--danger.is-plain) {
    color: @danger;
    border-color: @danger;
    background: @surface;

    &:hover,
    &:focus {
      color: @surface;
      border-color: @danger;
      background: @danger;
    }
  }
}

.row-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 28px;
  margin: 0;
  padding: 0 8px;
  color: @primary !important;
  border: 1px solid transparent !important;
  border-radius: 6px;
  font-size: 12px;

  &:hover,
  &:focus {
    color: #ffffff !important;
    border-color: @primary-hover !important;
    background: @primary-hover !important;
  }
}

:deep(.range-vxe-table) {
  width: 100%;
}

:deep(.operate) {
  height: 28px;
  min-height: 28px;
  margin-bottom: 10px;
  padding: 0;
  box-sizing: border-box;
  border: none;
}

.asset-search-panel {
  margin-bottom: 10px;
}

.asset-search-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(260px, 1fr) minmax(120px, 1fr);
  gap: 0 20px;
  min-width: 0;

  :deep(.el-form-item) {
    min-width: 0;
    margin: 0;
  }

  :deep(.el-form-item__content) {
    min-width: 0;
  }

  :deep(.el-input) {
    width: 100%;
  }

  :deep(.el-input__inner) {
    height: 32px;
    border-color: @border;
    border-radius: 6px;
    color: @body;

    &:hover {
      border-color: @primary-border;
    }

    &:focus {
      border-color: @primary;
    }

    &::placeholder {
      color: @muted;
      opacity: 1;
    }
  }
}

.asset-search-actions {
  justify-self: end;

  :deep(.el-form-item__content) {
    justify-content: flex-end;
  }

  :deep(.el-button) {
    height: 28px;
    margin: 0 0 0 10px;
    border-radius: 6px;
    font-size: 12px;
  }

  :deep(.el-button--primary.is-plain) {
    color: @primary;
    border-color: @primary-border;
    background: @primary-soft;

    &:hover,
    &:focus {
      color: @primary;
      border-color: @primary;
      background: @primary-hover-soft;
    }
  }

  :deep(.el-button:first-child) {
    margin-left: 0;
  }
}

:deep(.table-main) {
  border: none;
}

:deep(.vxe-grid),
:deep(.vxe-table) {
  --vxe-table-border-color: @border;
  --vxe-table-header-background-color: #dff3f0;
  --vxe-table-header-font-color: @primary;
  --vxe-table-row-hover-background-color: @primary-hover-soft;
  --vxe-table-row-striped-background-color: #f7fcfb;
}

:deep(.vxe-header--column) {
  background-color: #dff3f0 !important;
  color: @primary !important;
  font-weight: 600;
}

:deep(.vxe-body--column) {
  color: @body;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.el-button),
  :deep(.el-tabs__item),
  :deep(.el-input__inner) {
    transition: none !important;
  }
}
</style>
