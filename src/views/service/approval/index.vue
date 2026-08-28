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
            <p class="pec-config__subtitle">请配置当前单位与项目类型的市级联合会审流程及编码</p>
          </div>
          <el-form ref="ruleFormRef" :model="configForm" label-position="top" class="pec-form">
            <div class="pec-form-grid">
              <div class="pec-form-card" v-if="selectedUnit.yjdwName">
                <span class="pec-form-card__label">一级单位</span>
                <span class="pec-form-card__value">{{ selectedUnit.yjdwName }}</span>
              </div>
              <div class="pec-form-card" v-if="selectedUnit.ejdw">
                <span class="pec-form-card__label">二级单位</span>
                <span class="pec-form-card__value">{{ selectedUnit.ejdwName }}</span>
              </div>
              <div class="pec-form-card">
                <span class="pec-form-card__label">项目类型</span>
                <span class="pec-form-card__value">{{ selectedProType.name }}</span>
              </div>
            </div>

            <div class="pec-divider-wrapper">
              <span class="pec-divider-line"></span>
              <span class="pec-divider-text">流程参数配置</span>
              <span class="pec-divider-line"></span>
            </div>

            <el-form-item label="市级联合会审流程" prop="enableFlag" :rules="[{ required: true, message: '请选择启用状态' }]" class="pec-form-item--switch">
              <el-radio-group v-model="configForm.enableFlag" class="pec-modern-radio">
                <el-radio-button label="1">
                  <i class="el-icon-check" /> 启用
                </el-radio-button>
                <el-radio-button label="0">
                  <i class="el-icon-close" /> 停用
                </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="流程编码" prop="wfCode" :rules="wfCodeRules" class="pec-form-item--input">
              <el-input
                v-model.trim="configForm.wfCode"
                clearable
                :placeholder="configForm.enableFlag === '1' ? '请输入流程编码（如：process_code_001）' : '停用状态无需填写'"
                maxlength="100"
                show-word-limit
                class="pec-custom-input"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!canSave" key="empty" class="pec-empty">
          <div class="pec-empty__visual">
            <div class="pec-empty__circle-large"></div>
            <div class="pec-empty__circle-medium"></div>
            <div class="pec-empty__circle-small"></div>
            <i class="el-icon-setting pec-empty__icon" />
          </div>
          <h3 class="pec-empty__title">等待选择配置项</h3>
          <p class="pec-empty__desc">请从左侧选择关联的“单位”与“项目类型”以激活流程配置面板</p>
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

const unitTreeProps = { children: 'children', label: 'name' }
const proTypeProps = { children: 'children', label: 'name' }

provide('currentUserRole', currentUserRole)

const canSave = computed(() => !!selectedUnit.yjdw && !!selectedProType.id)

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
  nextTick(() => ruleFormRef.value?.clearValidate())
}

const loadConfig = async () => {
  resetConfigForm()
  if (!canSave.value) return
  loading.value = true
  try {
    const res = await getWfCode(selectedUnit.yjdw, selectedProType.id)
    if (res.success && res.data) {
      configForm.id = res.data.id || ''
      configForm.enableFlag = res.data.sfqy || res.data.enableFlag || '1'
      configForm.wfCode = res.data.wfCode || ''
    }
  } finally {
    loading.value = false
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
        dwId: selectedUnit.yjdw,
        id: selectedProType.id,
        wfCode: configForm.wfCode,
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

// 切换为停用时清除流程编码的必填校验提示
watch(
  () => configForm.enableFlag,
  (value) => {
    if (value === '0') {
      nextTick(() => ruleFormRef.value?.clearValidate('wfCode'))
    }
  }
)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
/* ==================== 变量（现代科技感 + 优雅翡翠绿体系） ==================== */
@primary: #059669; /* 更高级的祖母绿/翡翠绿 */
@primary-hover: #047857;
@primary-active: #065f46;
@primary-light-9: #ecfdf5;
@primary-light-8: #d1fae5;
@primary-light-7: #a7f3d0;
@primary-op-10: rgba(5, 150, 105, 0.08);
@success: #10b981;
@success-light: #f0fdf4;
@success-border: #bbf7d0;

@text-primary: #0f172a;    /* 极深蓝灰，比纯黑更具高级质感 */
@text-secondary: #334155;  /* 次要文本 */
@text-muted: #64748b;      /* 辅助提示 */
@border: #e2e8f0;          /* 描边 */
@border-light: #f1f5f9;    /* 浅描边/分割线 */
@bg-page: #f8fafc;         /* 页面背景 */
@bg-card: #ffffff;         /* 面板背景 */
@shadow-sm: 0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 8px -1px rgba(15, 23, 42, 0.02);
@shadow-md: 0 10px 25px -3px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
@radius-sm: 6px;
@radius: 10px;
@radius-lg: 16px;

/* ==================== 页面 ==================== */
.pec-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: @bg-page;
  color: @text-primary;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  gap: 16px;
  -webkit-font-smoothing: antialiased;
}

/* ==================== 顶部操作栏 ==================== */
.pec-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: @shadow-sm;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: @primary;
  }

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
    background: @border-light;
    padding: 6px 12px;
    border-radius: @radius-sm;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
  }

  &__tags {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}

.pec-save-btn {
  background: @primary !important;
  border-color: @primary !important;
  border-radius: @radius !important;
  font-weight: 600;
  padding: 10px 24px !important;
  font-size: 14px !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 10px -2px rgba(5, 150, 105, 0.3);

  &:hover:not(:disabled) {
    background: @primary-hover !important;
    border-color: @primary-hover !important;
    transform: translateY(-1.5px);
    box-shadow: 0 8px 16px -2px rgba(5, 150, 105, 0.4);
  }

  &:active:not(:disabled) {
    background: @primary-active !important;
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.pec-crumb-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: @radius;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;

  &--primary {
    color: @primary;
    background: @primary-light-9;
    border: 1px solid @primary-light-8;

    &:hover {
      background: @primary-light-8;
    }
  }

  &--success {
    color: @success;
    background: @success-light;
    border: 1px solid @success-border;

    &:hover {
      background: @success-border;
    }
  }

  .el-icon-close {
    font-size: 12px;
    cursor: pointer;
    opacity: 0.6;
    padding: 2px;
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      background: rgba(15, 23, 42, 0.08);
    }
  }
}

/* ==================== 主体布局 ==================== */
.pec-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

/* ==================== 左侧树面板 ==================== */
.pec-side {
  display: flex;
  flex-direction: row;
  gap: 0;
  flex: 1.6;
  min-width: 0;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: @shadow-sm;
  overflow: hidden;

  &__panel {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  &__header {
    padding: 18px 20px 10px;
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: @text-primary;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 14px;
      background: @primary;
      border-radius: 2px;
    }
  }

  &__search {
    display: block;
    width: 100%;
    margin-top: 10px;
    flex-shrink: 0;

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 0 0 1px @border inset;
      transition: all 0.2s ease;
      padding: 1px 12px;

      &.is-focus, &:hover {
        box-shadow: 0 0 0 1px @primary inset !important;
      }
    }

    :deep(.el-input__inner) {
      font-size: 13px;
      height: 34px;
      color: @text-primary;
    }
  }

  &__tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 12px 16px;
  }

  &__divider {
    width: 1px;
    background: @border-light;
    margin: 20px 0;
    flex-shrink: 0;
  }
}

/* ==================== 树节点 ==================== */
.pec-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13.5px;
  width: 100%;
  overflow: hidden;

  &__icon {
    font-size: 15px;
    color: @text-muted;
    flex-shrink: 0;
    transition: color 0.2s ease;
  }

  &__label {
    color: @text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: all 0.2s ease;
    font-weight: 500;
  }
}

:deep(.el-tree-node__content) {
  height: 38px;
  border-radius: 8px;
  margin: 2px 0;
  transition: all 0.2s ease;
  padding-right: 8px;

  &:hover {
    background: @primary-light-9;

    .pec-tree-node__icon {
      color: @primary;
    }

    .pec-tree-node__label {
      color: @primary;
    }
  }
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: @primary-op-10 !important;
  border: 1px solid @primary-light-7;

  &:hover {
    background: @primary-op-10 !important;
  }

  .pec-tree-node__icon {
    color: @primary;
    font-weight: 600;
  }

  .pec-tree-node__label {
    color: @primary;
    font-weight: 600;
  }

  .el-tree-node__expand-icon {
    color: @primary;
  }
}

/* ==================== 右侧配置面板 ==================== */
.pec-config {
  flex: 1.2;
  min-width: 0;
  background: @bg-card;
  border-radius: @radius-lg;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: @shadow-sm;
  overflow: hidden;
  position: relative;

  &__inner {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  &__header {
    width: 100%;
    max-width: 580px;
    margin: 0 auto;
    padding: 28px 24px 0;
    flex-shrink: 0;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
    color: @text-primary;
    letter-spacing: 0.5px;
  }

  &__subtitle {
    margin: 0;
    font-size: 13px;
    color: @text-muted;
    line-height: 1.5;
  }
}

.pec-form {
  width: 100%;
  max-width: 580px;
  margin: 0 auto;
  padding: 20px 24px 32px;

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: @text-secondary;
    font-size: 13.5px;
    margin-bottom: 8px !important;
    padding: 0 !important;
    display: inline-flex;
    align-items: center;
  }
}

/* ==================== 只读网格信息卡片 ==================== */
.pec-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.pec-form-card {
  background: @border-light;
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: @bg-page;
    border-color: @border;
  }

  &__label {
    font-size: 11px;
    font-weight: 700;
    color: @text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__value {
    font-size: 13.5px;
    font-weight: 600;
    color: @text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* ==================== 分割线 ==================== */
.pec-divider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
  width: 100%;
}

.pec-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, @border, transparent);

  &:first-child {
    background: linear-gradient(to left, @border, transparent);
  }
  &:last-child {
    background: linear-gradient(to right, @border, transparent);
  }
}

.pec-divider-text {
  font-size: 12px;
  font-weight: 700;
  color: @text-muted;
  letter-spacing: 1.5px;
  white-space: nowrap;
}

/* ==================== 现代单选按钮组 ==================== */
.pec-modern-radio {
  display: inline-flex;
  background: @border-light;
  padding: 4px;
  border-radius: @radius;
  border: 1px solid rgba(226, 232, 240, 0.8);
  width: 100%;
  max-width: 280px;

  :deep(.el-radio-button) {
    flex: 1;
    display: inline-flex;

    .el-radio-button__inner {
      border: none !important;
      background: transparent !important;
      color: @text-muted !important;
      font-weight: 600;
      border-radius: 6px !important;
      width: 100%;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      box-shadow: none !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      i {
        font-size: 14px;
      }
    }

    &.is-active .el-radio-button__inner {
      background: @bg-card !important;
      color: @primary !important;
      box-shadow: 0 4px 10px -2px rgba(15, 23, 42, 0.08) !important;
    }
  }

  /* 针对启用和停用的特定色彩映射 */
  :deep(.el-radio-button:first-child.is-active .el-radio-button__inner) {
    color: @primary !important;
  }
  :deep(.el-radio-button:last-child.is-active .el-radio-button__inner) {
    color: #ef4444 !important; /* 停用为醒目红 */
  }
}

/* ==================== 输入框样式定制 ==================== */
.pec-custom-input {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px @border inset;
    transition: all 0.2s ease;
    padding: 4px 14px;

    &.is-focus, &:hover {
      box-shadow: 0 0 0 1px @primary inset !important;
    }
  }

  :deep(.el-input__inner) {
    font-size: 13.5px;
    color: @text-primary;
    height: 38px;

    &::placeholder {
      color: #94a3b8;
    }
  }
}

/* ==================== 空状态现代设计 ==================== */
.pec-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 24px;
  text-align: center;

  &__visual {
    position: relative;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  &__circle-large {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: @primary-light-9;
    border: 1px dashed @primary-light-7;
    animation: rotateEmpty 40s linear infinite;
  }

  &__circle-medium {
    position: absolute;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: @bg-page;
    box-shadow: inset 0 2px 6px rgba(15, 23, 42, 0.03);
  }

  &__circle-small {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: @shadow-sm;
  }

  &__icon {
    font-size: 24px;
    color: @primary;
    position: relative;
    z-index: 2;
    animation: floatEmpty 4s ease-in-out infinite;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 700;
    color: @text-primary;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: @text-muted;
    max-width: 280px;
    line-height: 1.5;
  }
}

@keyframes rotateEmpty {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes floatEmpty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* ==================== 滚动条 ==================== */
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;

  &:hover {
    background: #94a3b8;
  }
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
    padding: 24px 24px 0;
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
    padding: 24px;
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
