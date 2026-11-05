<!-- 流程启用停用配置 -->
<template>
  <div class="pec-page" v-if="isShowPage">
    <!-- 顶部操作栏 -->
    <header class="pec-topbar">
      <div class="pec-topbar__left">
        <el-button type="primary" class="pec-save-btn" :disabled="!canSave" :loading="saving" v-debounce="[handleSave, 'click', 300]">
          保存
        </el-button>
        <transition name="pec-hint">
          <span v-if="!canSave" class="pec-topbar__hint">请先选择单位与项目类型</span>
        </transition>
      </div>
      <div class="pec-topbar__right" v-if="selectedUnit.yjdw || selectedProType.id">
        <transition-group name="pec-tag" tag="div" class="pec-topbar__tags">
          <span v-if="selectedUnit.yjdwName" key="unit" class="pec-crumb-tag pec-crumb-tag--primary">
            {{ selectedUnit.ejdwName || selectedUnit.yjdwName }}
            <i class="el-icon-close" @click.stop="clearUnitSelection" />
          </span>
          <span v-if="selectedProType.name" key="proType" class="pec-crumb-tag pec-crumb-tag--success">
            {{ selectedProType.name }}
            <i class="el-icon-close" @click.stop="clearProTypeSelection" />
          </span>
        </transition-group>
      </div>
    </header>

    <!-- 主体：两棵树并排 + 右侧配置 -->
    <main class="pec-body">
      <!-- 左侧树面板（并排） -->
      <aside class="pec-side">
        <!-- 单位树 -->
        <div class="pec-side__panel">
          <div class="pec-side__header">
            <span class="pec-side__title">单位</span>
            <el-input v-model="unitKeyword" size="small" clearable placeholder="请输入单位名称" class="pec-side__search" />
          </div>
          <div class="pec-side__tree scrollbar-thin">
            <div v-if="loadingUnit" class="pec-loading">
              <div v-for="i in 6" :key="i" class="pec-loading__item">
                <div class="pec-loading__icon" />
                <div class="pec-loading__bar" :style="{ width: `${50 + Math.random() * 40}%` }" />
              </div>
            </div>
            <el-tree
              v-else
              ref="unitTreeRef"
              :data="unitTreeData"
              :props="unitTreeProps"
              :filter-node-method="filterTreeNode"
              node-key="id"
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleUnitClick"
            >
              <template #default="{ node, data }">
                <div class="pec-tree-node">
                  <i class="pec-tree-node__icon" :class="data.children?.length ? 'el-icon-office-building' : 'el-icon-document'" />
                  <span class="pec-tree-node__label">{{ node.label }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <div class="pec-side__divider" />

        <!-- 项目类型树 -->
        <div class="pec-side__panel">
          <div class="pec-side__header">
            <span class="pec-side__title">项目类型</span>
            <el-input v-model="proTypeKeyword" size="small" clearable placeholder="请输入项目类型" class="pec-side__search" />
          </div>
          <div class="pec-side__tree scrollbar-thin">
            <div v-if="loadingProType" class="pec-loading">
              <div v-for="i in 6" :key="i" class="pec-loading__item">
                <div class="pec-loading__icon" />
                <div class="pec-loading__bar" :style="{ width: `${50 + Math.random() * 40}%` }" />
              </div>
            </div>
            <el-tree
              v-else
              ref="proTypeTreeRef"
              :data="projectTypeList"
              :props="proTypeProps"
              :filter-node-method="filterTreeNode"
              node-key="id"
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleProTypeClick"
            >
              <template #default="{ node, data }">
                <div class="pec-tree-node" :class="{ 'is-leaf': !data.children?.length }">
                  <i class="pec-tree-node__icon" :class="data.children?.length ? 'el-icon-folder' : 'el-icon-document'" />
                  <span class="pec-tree-node__label">{{ node.label }}</span>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
      </aside>

      <!-- 右侧配置面板 -->
      <section class="pec-config">
        <div v-if="loading" key="loading" class="pec-loading-config">
          <div class="pec-loading-config__header">
            <div class="pec-loading-config__title" />
            <div class="pec-loading-config__subtitle" />
          </div>
          <div class="pec-loading-config__body">
            <div v-for="i in 4" :key="i" class="pec-loading-config__row">
              <div class="pec-loading-config__label" />
              <div class="pec-loading-config__input" />
            </div>
            <div class="pec-loading-config__divider" />
            <div v-for="i in 2" :key="'b' + i" class="pec-loading-config__row">
              <div class="pec-loading-config__label" />
              <div class="pec-loading-config__input" />
            </div>
          </div>
        </div>
        <div v-else-if="canSave" key="form" class="pec-config__inner">
          <div class="pec-config__header">
            <h2 class="pec-config__title">流程配置</h2>
            <p class="pec-config__subtitle">请配置市级联合会审流程的启用状态及流程编码</p>
          </div>
          <el-form ref="ruleFormRef" :model="configForm" label-width="140px" label-suffix=":" class="pec-form">
            <el-form-item v-if="selectedUnit.yjdwName" label="一级单位">
              <el-input :model-value="selectedUnit.yjdwName" disabled />
            </el-form-item>
            <el-form-item label="二级单位" v-if="selectedUnit.ejdw">
              <el-input :model-value="selectedUnit.ejdwName" disabled />
            </el-form-item>
            <el-form-item label="项目类型">
              <el-input :model-value="selectedProType.name" disabled />
            </el-form-item>

            <el-divider content-position="left">
              <span class="pec-divider-text">流程参数</span>
            </el-divider>

            <el-form-item label="市级联合会审流程" prop="enableFlag" :rules="[{ required: true, message: '请选择启用状态' }]">
              <el-radio-group v-model="configForm.enableFlag" class="pec-enable-group">
                <el-radio-button label="1">启用</el-radio-button>
                <el-radio-button label="0">停用</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="流程编码" prop="wfCode" :rules="wfCodeRules">
              <el-input
                v-model.trim="configForm.wfCode"
                clearable
                :placeholder="configForm.enableFlag === '1' ? '请输入流程编码' : '停用状态无需填写'"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!canSave" key="empty" class="pec-empty">
          <h3>请选择配置项</h3>
          <p>请从左侧选择单位及项目类型后进行流程配置</p>
        </div>
      </section>
    </main>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/lyg/processEnableConfig/index">
import { computed, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getDwTree, getWfCode, updateWfCode } from '@/api/lyg/processEnableConfig'
import { getProtypeTree } from '@/api/common'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'

interface TreeNode {
  id: string
  name: string
  pid?: string
  children?: TreeNode[]
}

interface UnitTreeNode {
  data?: TreeNode
  parent?: UnitTreeNode
  level?: number
}

interface ProjectTypeNode {
  id: string
  code: string
  name: string
  hasChildren: boolean
  leaf: boolean
  leafString: string
  middleId: string
  nd: string
  parentId?: string
  protypeId?: string
  children?: ProjectTypeNode[]
}

const unitTreeRef = ref()
const proTypeTreeRef = ref()
const ruleFormRef = ref()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const isShowPage = ref(false)
const loading = ref(false)
const loadingUnit = ref(false)
const loadingProType = ref(false)
const saving = ref(false)
const unitKeyword = ref('')
const proTypeKeyword = ref('')
const unitTreeData = ref<TreeNode[]>([])
const projectTypeList = ref<ProjectTypeNode[]>([])
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

const selectedUnit = reactive({
  yjdw: '',
  yjdwName: '',
  ejdw: '',
  ejdwName: ''
})
const selectedProType = reactive({
  id: '',
  name: ''
})
const configForm = reactive({
  id: '',
  enableFlag: '1',
  wfCode: ''
})
// 缓存停用前的流程编码，切回启用时还原
const wfCodeCache = ref('')

const unitTreeProps = { children: 'children', label: 'name' }
const proTypeProps = { children: 'children', label: 'name' }

provide('currentUserRole', currentUserRole)

const canSave = computed(() => !!selectedUnit.yjdw && !!selectedProType.id)

// 后端不区分一二级单位，dwId 取实际选中的节点：末级则为二级单位，非末级则为一级单位
const selectedDwId = computed(() => selectedUnit.ejdw || selectedUnit.yjdw)

// 流程编码仅在启用时必填，停用时不校验
const wfCodeRules = computed(() => {
  return configForm.enableFlag === '1' ? [{ required: true, message: '请输入流程编码', trigger: 'blur' }] : []
})

const filterTreeNode = (value: string, data: TreeNode | ProjectTypeNode) => {
  if (!value) return true
  return data.name?.includes(value)
}

const clearUnitSelection = () => {
  selectedUnit.yjdw = ''
  selectedUnit.yjdwName = ''
  selectedUnit.ejdw = ''
  selectedUnit.ejdwName = ''
  unitTreeRef.value?.setCurrentKey(null)
  resetConfigForm()
}

const clearProTypeSelection = () => {
  selectedProType.id = ''
  selectedProType.name = ''
  proTypeTreeRef.value?.setCurrentKey(null)
  resetConfigForm()
}

const resetConfigForm = () => {
  configForm.id = ''
  configForm.enableFlag = '1'
  configForm.wfCode = ''
  wfCodeCache.value = ''
  nextTick(() => ruleFormRef.value?.clearValidate())
}

let loadSeq = 0
const loadConfig = async () => {
  resetConfigForm()
  if (!canSave.value) return
  const seq = ++loadSeq
  loading.value = true
  try {
    const res = await getWfCode(selectedDwId.value, selectedProType.id)
    // 快速切换时丢弃过期请求的结果，避免覆盖当前选中项的配置
    if (seq !== loadSeq) return
    if (res.success) {
      if (res.data) {
        configForm.id = res.data.id || ''
        configForm.enableFlag = res.data.sfqy || res.data.enableFlag || '1'
        configForm.wfCode = res.data.wfCode || ''
      }
    } else {
      ElMessage.error(res.msg || '配置加载失败')
    }
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

const loadUnitTree = async () => {
  loadingUnit.value = true
  try {
    const res = await getDwTree()
    if (res.success) {
      unitTreeData.value = res.data || []
    } else {
      ElMessage.error(res.msg || '单位数据加载失败')
    }
  } finally {
    loadingUnit.value = false
  }
}

const loadProjectTypeTree = async () => {
  loadingProType.value = true
  try {
    const res = await getProtypeTree()
    if (res.success) {
      projectTypeList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '项目类型数据加载失败')
    }
  } finally {
    loadingProType.value = false
  }
}

const initPageData = async () => {
  await Promise.all([loadUnitTree(), loadProjectTypeTree()])
}

const getRoleHandle = async () => {
  if (!userRoleSelectorRef.value) return
  isShowPage.value = Boolean(userRoleSelectorRef.value.canRender)
  if (!isShowPage.value) return
  await nextTick()
  await initPageData()
}

const findUnitNodeById = (id: string, nodes: TreeNode[] = unitTreeData.value): TreeNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node
    const matchedNode = findUnitNodeById(id, node.children || [])
    if (matchedNode) return matchedNode
  }
}

const handleUnitClick = (data: TreeNode, node?: UnitTreeNode) => {
  if (data.children?.length) {
    selectedUnit.yjdw = data.id
    selectedUnit.yjdwName = data.name
    selectedUnit.ejdw = ''
    selectedUnit.ejdwName = ''
  } else {
    const parentUnit = node?.level && node.level > 1 ? node.parent?.data : findUnitNodeById(data.pid || '')
    selectedUnit.yjdw = parentUnit?.id || data.id
    selectedUnit.yjdwName = parentUnit?.name || data.name
    selectedUnit.ejdw = parentUnit ? data.id : ''
    selectedUnit.ejdwName = parentUnit ? data.name : ''
  }
  loadConfig()
}

const handleProTypeClick = (data: ProjectTypeNode) => {
  // 项目类型只能选择末级节点，非末级节点点击仅展开不选中
  if (data.children?.length) {
    const node = proTypeTreeRef.value?.getNode(data.id)
    if (node) node.expanded = !node.expanded
    // 恢复末级节点的选中高亮，避免父节点抢占高亮
    nextTick(() => {
      proTypeTreeRef.value?.setCurrentKey(selectedProType.id || null)
    })
    return
  }
  selectedProType.id = data.id
  selectedProType.name = data.name
  loadConfig()
}

const handleSave = () => {
  if (!canSave.value) return ElMessage.warning('请先选择单位与项目类型')
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    const confirmResult = await VXETable.modal.confirm('确认保存当前配置？', '提示', {
      status: 'warning'
    })
    if (confirmResult !== 'confirm') return ElMessage.info('已取消操作')

    saving.value = true
    loading.value = true
    try {
      const res = await updateWfCode({
        dwId: selectedDwId.value,
        id: selectedProType.id,
        // 停用时流程编码无意义，提交空值
        wfCode: configForm.enableFlag === '1' ? configForm.wfCode : '',
        sfqy: configForm.enableFlag
      })
      if (res.success) {
        ElMessage.success('保存成功')
        await loadConfig()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      saving.value = false
      loading.value = false
    }
  })
}

watch(unitKeyword, (value) => {
  unitTreeRef.value?.filter(value)
})

watch(proTypeKeyword, (value) => {
  proTypeTreeRef.value?.filter(value)
})

// 停用时缓存并清空流程编码，切回启用时还原
watch(
  () => configForm.enableFlag,
  (value) => {
    if (value === '0') {
      wfCodeCache.value = configForm.wfCode
      configForm.wfCode = ''
      nextTick(() => ruleFormRef.value?.clearValidate('wfCode'))
    } else {
      configForm.wfCode = wfCodeCache.value
    }
  }
)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
/* ==================== 变量（对齐 businessWorkbench） ==================== */
@primary: #008b53;
@primary-hover: #007b49;
@primary-active: #006a3f;
@primary-light-9: #e6f4ea;
@primary-light-8: #c2e7cc;
@primary-light-7: #99d9aa;
@primary-op-10: rgba(0, 139, 83, 0.1);
@success: #047a3d;
@success-light: #e9f8ed;
@success-border: #c8ecd2;

@text-primary: #0f172a;
@text-secondary: #334155;
@text-muted: #64748b;
@border: #e2e8f0;
@border-light: #f1f5f9;
@bg-page: #f8fafc;
@bg-card: #ffffff;
@shadow-sm: 0 1px 4px rgba(15, 23, 42, 0.05);
@radius: 8px;
@radius-lg: 12px;

/* ==================== 页面 ==================== */
.pec-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: @bg-page;
  color: @text-primary;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  gap: 14px;
  -webkit-font-smoothing: antialiased;
}

/* ==================== 顶部操作栏 ==================== */
.pec-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid @border;
  box-shadow: @shadow-sm;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__right {
    display: flex;
    align-items: center;
  }

  &__hint {
    font-size: 13px;
    color: @text-muted;
  }

  &__tags {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.pec-save-btn {
  background: @primary !important;
  border-color: @primary !important;
  border-radius: @radius !important;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover:not(:disabled) {
    background: @primary-hover !important;
    border-color: @primary-hover !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 139, 83, 0.25);
  }

  &:active:not(:disabled) {
    background: @primary-active !important;
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pec-crumb-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;

  &--primary {
    color: @primary;
    background: @primary-light-9;
    border: 1px solid @primary-light-8;
  }

  &--success {
    color: @success;
    background: @success-light;
    border: 1px solid @success-border;
  }

  .el-icon-close {
    font-size: 12px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }
}

/* ==================== 主体布局 ==================== */
.pec-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
}

/* ==================== 左侧树面板 ==================== */
.pec-side {
  display: flex;
  flex-direction: row;
  gap: 0;
  flex: 1;
  min-width: 0;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid @border;
  box-shadow: @shadow-sm;
  overflow: hidden;

  &__panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__header {
    padding: 12px 14px 0;
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: @text-primary;
  }

  &__search {
    display: block;
    width: 100%;
    margin-top: 8px;
    flex-shrink: 0;

    :deep(.el-input__inner) {
      border-radius: 6px;
      border-color: @border;
      font-size: 13px;

      &:focus {
        border-color: @primary;
      }
    }

    :deep(.el-input__suffix) {
      right: 8px;
      top: 0;
      height: 100%;
      display: flex;
      align-items: center;
    }

    :deep(.el-input__suffix-inner),
    :deep(.el-input__icon) {
      height: 100%;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  &__tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 8px 10px;
  }

  &__divider {
    width: 1px;
    background: @border-light;
    margin: 12px 0;
    flex-shrink: 0;
  }
}

/* ==================== 树节点 ==================== */
.pec-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 13px;

  &__icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  &__label {
    color: @text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s ease;
  }
}

:deep(.el-tree-node__content) {
  height: 34px;
  border-radius: @radius;
  transition: all 0.2s ease;
  padding-right: 8px;

  &:hover {
    background: @primary-light-9;
  }
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: @primary-light-7;

  .pec-tree-node__label {
    color: #fff;
    font-weight: 600;
  }
}

/* ==================== 右侧配置面板 ==================== */
.pec-config {
  flex: 1;
  min-width: 0;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid @border;
  box-shadow: @shadow-sm;
  overflow: hidden;

  &__inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  &__header {
    padding: 20px 24px 0;
    flex-shrink: 0;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
    color: @text-primary;
  }

  &__subtitle {
    margin: 0;
    font-size: 13px;
    color: @text-muted;
  }
}

.pec-form {
  padding: 16px 24px 24px;
  max-width: 560px;

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: @text-secondary;
    font-size: 13px;
  }

  :deep(.el-input__inner) {
    border-radius: 6px;

    &:focus {
      border-color: @primary;
    }
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: @border-light;
    box-shadow: 0 0 0 1px @border inset;
  }
}

.pec-divider-text {
  font-size: 12px;
  font-weight: 700;
  color: @text-muted;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pec-enable-group {
  :deep(.el-radio-button__inner) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 6px 0 0 6px !important;
  }

  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 6px 6px 0 !important;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: @primary;
    border-color: @primary;
    box-shadow: -1px 0 0 0 @primary;
    color: #fff;
  }
}

/* ==================== 空状态 ==================== */
.pec-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;

  h3 {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: @text-primary;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: @text-muted;
  }
}

/* ==================== 滚动条 ==================== */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: @border-light;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* ==================== 骨架屏加载动画 ==================== */
.pec-loading {
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: pecLoadingFadeIn 0.4s ease-out;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding-right: 8px;
  }

  &__icon {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  &__bar {
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
    animation-delay: 0.1s;
  }
}

@keyframes pecShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes pecLoadingFadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 配置面板骨架屏 ==================== */
.pec-loading-config {
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: pecLoadingFadeIn 0.4s ease-out;

  &__header {
    padding: 20px 24px 0;
    flex-shrink: 0;
  }

  &__title {
    width: 120px;
    height: 20px;
    border-radius: 4px;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
    margin-bottom: 8px;
  }

  &__subtitle {
    width: 200px;
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
    animation-delay: 0.1s;
  }

  &__body {
    padding: 20px 24px;
    flex: 1;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }

  &__label {
    width: 80px;
    height: 14px;
    border-radius: 4px;
    flex-shrink: 0;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
  }

  &__input {
    flex: 1;
    height: 36px;
    border-radius: 6px;
    background: linear-gradient(110deg, @border-light 30%, #e8edf3 50%, @border-light 70%);
    background-size: 200% 100%;
    animation: pecShimmer 1.8s ease-in-out infinite;
    animation-delay: 0.15s;
    max-width: 360px;
  }

  &__divider {
    height: 1px;
    background: @border;
    margin: 24px 0;
    opacity: 0.5;
  }
}

/* ==================== 动画 ==================== */
.pec-hint-enter-active,
.pec-hint-leave-active {
  transition: all 0.25s ease;
}

.pec-hint-enter-from,
.pec-hint-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.pec-tag-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pec-tag-leave-active {
  transition: all 0.2s ease;
}

.pec-tag-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.pec-tag-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

/* ==================== 响应式 ==================== */
@media (max-width: 960px) {
  .pec-body {
    flex-direction: column;
  }

  .pec-side {
    max-height: 360px;
  }

  .pec-topbar {
    flex-wrap: wrap;
    gap: 10px;

    &__right {
      width: 100%;
    }
  }
}
</style>
