<!-- 菜单管理：树形列表 + 本地筛选 -->
<template>
  <div class="mod-sys__menu">
    <div class="menu-toolbar">
      <div class="menu-toolbar__filters">
        <el-input
          v-model="keyword"
          class="menu-toolbar__search"
          size="small"
          clearable
          placeholder="搜索菜单名称或路由"
          prefix-icon="el-icon-search"
        />
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="loadMenus()">刷新</el-button>
      </div>
      <div class="menu-toolbar__actions">
        <el-button size="small" :disabled="parentRows.length === 0" @click="toggleExpandAll">{{ allExpanded ? '全部折叠' : '全部展开' }}</el-button>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate()">新增</el-button>
      </div>
    </div>

    <div class="menu-table-box">
      <vxe-table
        :loading="loading"
        :data="tableRows"
        :row-config="tableRowConfig"
        :scroll-y="tableScrollY"
        :resize-config="tableResizeConfig"
        auto-resize
        show-overflow
        show-header-overflow
        height="100%"
        border
        empty-text="暂无菜单数据"
      >
        <vxe-column field="menu.name" title="名称" min-width="220" header-align="center">
          <template #default="{ row }">
            <div class="menu-name" :style="{ paddingLeft: `${row.level * 16}px` }">
              <button
                v-if="row.menu.children?.length"
                type="button"
                class="menu-name__toggle"
                :aria-label="`${expandedKeys.has(row.id) ? '折叠' : '展开'}${row.menu.name}`"
                :aria-expanded="expandedKeys.has(row.id)"
                @click="toggleMenu(row.menu)"
              >
                <i class="el-icon-arrow-right" :class="{ 'is-expanded': expandedKeys.has(row.id) }" aria-hidden="true"></i>
              </button>
              <span v-else class="menu-name__spacer"></span>
              <span class="menu-name__text" :title="row.menu.name">{{ row.menu.name }}</span>
            </div>
          </template>
        </vxe-column>
        <vxe-column title="打开方式" width="110" header-align="center" align="center">
          <template #default="{ row }">
            <el-tag v-if="!isButton(row.menu)" size="small" :type="isExternalLink(row.menu) ? '' : 'info'">
              {{ isExternalLink(row.menu) ? '外部打开' : '内部打开' }}
            </el-tag>
            <span v-else class="menu-cell-empty">-</span>
          </template>
        </vxe-column>
        <vxe-column field="menu.sort" title="排序" width="80" header-align="center" align="center" />
        <vxe-column field="menu.url" title="路由" min-width="200" header-align="center" align="center" />
        <vxe-column title="显示菜单" width="100" header-align="center" align="center">
          <template #default="{ row }">{{ isFlagOn(row.menu.isShow) ? '是' : '否' }}</template>
        </vxe-column>
        <vxe-column title="内嵌" width="80" header-align="center" align="center">
          <template #default="{ row }">{{ isFlagOn(row.menu.isFrame) ? '是' : '否' }}</template>
        </vxe-column>
        <vxe-column field="menu.outsideMenu" title="菜单配置" width="150" header-align="center" align="center">
          <template #default="{ row }">
            <span v-if="row.menu.outsideMenu">{{ row.menu.outsideMenu }}</span>
            <span v-else class="menu-cell-empty">-</span>
          </template>
        </vxe-column>
        <vxe-column title="操作" width="190" fixed="right" header-align="center" align="center">
          <template #default="{ row }">
            <div class="menu-actions">
              <el-button v-if="!isButton(row.menu)" type="text" size="small" @click="openCreate(row.menu)">新增</el-button>
              <el-button type="text" size="small" @click="openEdit(row.menu)">修改</el-button>
              <el-button type="text" size="small" class="menu-actions__delete" :disabled="!!deletingId" @click="handleDelete(row.menu)">
                删除
              </el-button>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <!-- 弹窗, 新增 / 修改 -->
    <MenuEditor ref="editorRef" @saved="loadMenus" />
  </div>
</template>

<script setup lang="ts" name="/sys/menu">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import baseService from '@/service/baseService'
import { IServerMenus } from '@/types/interface'
import MenuEditor from './menu-add-or-update.vue'
import { flattenVisibleMenuRows } from './menu-table'

const MENU_LIST_URL = '/sys/menu/list'
/** 菜单类型：1-按钮，0-菜单 */
const TYPE_BUTTON = 1

const menus = shallowRef<IServerMenus[]>([])
const loading = ref(false)
const keyword = ref('')
const editorRef = ref<InstanceType<typeof MenuEditor> | null>(null)
const deletingId = ref<string | number>('')
/** 已展开的行 key，用于同步“全部展开/折叠”按钮文案 */
const expandedKeys = shallowRef(new Set<string>())
const tableRowConfig = { keyField: 'id', height: 40 }
const tableScrollY = { enabled: true, gt: 40 }
const tableResizeConfig = { refreshDelay: 80 }

const isButton = (row: IServerMenus): boolean => Number(row.type) === TYPE_BUTTON
const isExternalLink = (row: IServerMenus): boolean => Number(row.openStyle) === 1
/** 后端 0/1 标记兼容数字、字符串与布尔值 */
const isFlagOn = (value: unknown): boolean => value === true || String(value) === '1'
/** 兼容两套返回约定：code === 0 或 success === true 均视为成功 */
const isResponseOk = (res: any): boolean => !!res && (res.code === 0 || res.success === true)

const hasActiveFilter = computed(() => keyword.value.trim().length > 0)

/** 按条件裁剪菜单树，命中节点的祖先会被保留 */
const filterMenuTree = (rows: IServerMenus[], predicate: (row: IServerMenus) => boolean): IServerMenus[] =>
  rows.reduce<IServerMenus[]>((result, row) => {
    const children = row.children?.length ? filterMenuTree(row.children, predicate) : []
    if (predicate(row) || children.length) {
      result.push({ ...row, children })
    }
    return result
  }, [])

const visibleMenus = computed<IServerMenus[]>(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return menus.value
  return filterMenuTree(menus.value, (row) =>
    [row.name, row.url].some((field) =>
      String(field ?? '')
        .toLowerCase()
        .includes(text)
    )
  )
})

// 折叠分支不进入表格；全部展开时由虚拟滚动限制实际挂载的行数。
const tableRows = computed(() => flattenVisibleMenuRows(visibleMenus.value, expandedKeys.value))

/** 当前可见的、含有子节点的行 */
const parentRows = computed<IServerMenus[]>(() => {
  const result: IServerMenus[] = []
  const walk = (rows: IServerMenus[]) => {
    rows.forEach((row) => {
      if (row.children?.length) {
        result.push(row)
        walk(row.children)
      }
    })
  }
  walk(visibleMenus.value)
  return result
})

const allExpanded = computed(() => parentRows.value.length > 0 && parentRows.value.every((row) => expandedKeys.value.has(String(row.id))))

const toggleMenu = (row: IServerMenus) => {
  const key = String(row.id)
  const keys = new Set(expandedKeys.value)
  if (keys.has(key)) keys.delete(key)
  else keys.add(key)
  expandedKeys.value = keys
}

const setAllExpanded = (expanded: boolean) => {
  expandedKeys.value = new Set(expanded ? parentRows.value.map((row) => String(row.id)) : [])
}

const toggleExpandAll = () => setAllExpanded(!allExpanded.value)

const loadMenus = async () => {
  loading.value = true
  try {
    const res = await baseService.get(MENU_LIST_URL)
    if (!isResponseOk(res)) {
      menus.value = []
      ElMessage.error(res?.msg || '菜单加载失败')
      return
    }
    menus.value = Array.isArray(res.data) ? res.data : []
    if (hasActiveFilter.value) {
      setAllExpanded(true)
    } else {
      const parentKeys = new Set(parentRows.value.map((row) => String(row.id)))
      expandedKeys.value = new Set([...expandedKeys.value].filter((key) => parentKeys.has(key)))
    }
  } catch (error) {
    menus.value = []
    ElMessage.error(error instanceof Error ? error.message : '菜单加载失败')
  } finally {
    loading.value = false
  }
}

const openCreate = (parent?: IServerMenus) => {
  editorRef.value?.open({ mode: 'create', parent })
}

const openEdit = (row: IServerMenus) => {
  editorRef.value?.open({ mode: 'edit', row })
}

const countDescendants = (row: IServerMenus): number => (row.children ?? []).reduce((sum, child) => sum + 1 + countDescendants(child), 0)

const handleDelete = async (row: IServerMenus) => {
  const descendants = countDescendants(row)
  const message = descendants > 0 ? `确定删除菜单「${row.name}」吗？其下 ${descendants} 个子菜单也会一并删除。` : `确定删除菜单「${row.name}」吗？`
  try {
    await ElMessageBox.confirm(message, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  deletingId.value = row.id
  try {
    const res = await baseService.post(`/sys/menu/delete/${row.id}`)
    if (!isResponseOk(res)) {
      ElMessage.error(res?.msg || '删除失败')
      return
    }
    ElMessage.success('删除成功')
    await loadMenus()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败')
  } finally {
    deletingId.value = ''
  }
}

// 筛选后自动展开，避免命中的子节点被折叠的父级挡住
watch(keyword, () => {
  if (!hasActiveFilter.value) return
  setAllExpanded(true)
})

onMounted(() => {
  loadMenus()
})
</script>

<style lang="less" scoped>
.mod-sys__menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding: 10px;
  overflow: hidden;
  box-sizing: border-box;
}

.menu-toolbar {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  &__filters,
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  &__search {
    width: 240px;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.menu-table-box {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.menu-name {
  display: flex;
  align-items: center;
  min-width: 0;

  &__toggle,
  &__spacer {
    flex: 0 0 24px;
    width: 24px;
  }

  &__toggle {
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;

    .is-expanded {
      transform: rotate(90deg);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary, #409eff);
    }
  }

  &__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.menu-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  &__delete {
    color: #f56c6c;

    &:hover,
    &:focus {
      color: #f78989;
    }

    &.is-disabled {
      color: #c0c4cc;
    }
  }
}

.menu-cell-empty {
  color: #909399;
}
</style>
