<!-- 菜单新增/编辑：vxe-modal + 表单校验，仅维护菜单类型 -->
<template>
  <vxe-modal
    v-model="visible"
    :title="modalTitle"
    width="680"
    height="auto"
    show-footer
    destroy-on-close
    position="center"
    :transfer="true"
    :mask-closable="false"
    :esc-closable="false"
    :show-zoom="false"
    class-name="menu-editor-modal"
  >
    <el-form
      ref="formRef"
      v-loading="loading"
      element-loading-text="加载中..."
      :model="dataForm"
      :rules="rules"
      label-width="110px"
      class="menu-editor"
      @keyup.enter="submit"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="dataForm.name" maxlength="50" show-word-limit clearable placeholder="请输入菜单名称" />
      </el-form-item>

      <el-form-item label="简称" prop="shortName">
        <el-input v-model="dataForm.shortName" maxlength="50" show-word-limit clearable placeholder="请输入菜单简称" />
      </el-form-item>

      <el-form-item label="上级菜单" prop="parentName">
        <el-popover
          v-model:visible="parentVisible"
          placement="bottom-start"
          trigger="click"
          :width="480"
          popper-class="menu-editor__picker-popper menu-editor__parent-popper"
          @show="handleParentOpen"
        >
          <template #reference>
            <el-input v-model="dataForm.parentName" readonly placeholder="请选择上级菜单" class="menu-editor__readonly">
              <template #suffix>
                <i class="el-icon-arrow-down el-input__icon menu-editor__select-arrow" :class="{ 'is-open': parentVisible }" aria-hidden="true"></i>
              </template>
            </el-input>
          </template>
          <div class="menu-editor__picker-heading">
            <span>选择上级菜单</span>
            <span class="menu-editor__picker-hint">点击名称选择</span>
          </div>
          <el-input
            v-model="parentKeyword"
            class="menu-editor__parent-search"
            size="small"
            clearable
            prefix-icon="el-icon-search"
            placeholder="搜索菜单名称或路由"
            aria-label="搜索上级菜单"
            @keydown.enter.stop.prevent
          />
          <el-tree
            ref="parentTreeRef"
            class="menu-editor__parent-tree"
            :data="parentOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            :indent="18"
            :expand-on-click-node="false"
            :default-expanded-keys="expandedParentKeys"
            :current-node-key="dataForm.pid"
            :filter-node-method="filterParentNode"
            empty-text="暂无匹配的菜单"
            @node-click="handleParentChange"
          >
            <template #default="{ data }">
              <span class="menu-editor__tree-node">
                <i
                  :class="data.children?.length ? 'el-icon-folder-opened' : 'el-icon-document'"
                  class="menu-editor__node-icon"
                  aria-hidden="true"
                ></i>
                <span class="menu-editor__node-label" :title="data.name">{{ data.name }}</span>
                <i v-if="String(data.id) === dataForm.pid" class="el-icon-check menu-editor__node-check" aria-hidden="true"></i>
              </span>
            </template>
          </el-tree>
        </el-popover>
      </el-form-item>

      <el-form-item label="路由" prop="url">
        <el-input v-model="dataForm.url" clearable placeholder="如 sys/menu；外部打开时填写完整地址" />
      </el-form-item>

      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="dataForm.sort" controls-position="right" :min="0" />
      </el-form-item>

      <el-form-item label="打开方式" prop="openStyle">
        <el-radio-group v-model="dataForm.openStyle">
          <el-radio :label="0">内部打开</el-radio>
          <el-radio :label="1">外部打开</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否显示" prop="isShow">
        <el-radio-group v-model="dataForm.isShow">
          <el-radio :label="1">是</el-radio>
          <el-radio :label="0">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否主页" prop="isMainPage">
        <el-radio-group v-model="dataForm.isMainPage">
          <el-radio :label="1">是</el-radio>
          <el-radio :label="0">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否内嵌" prop="isFrame">
        <el-radio-group v-model="dataForm.isFrame">
          <el-radio :label="1">是</el-radio>
          <el-radio :label="0">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="dataForm.isFrame === 1" label="内嵌地址" prop="frameSrc">
        <el-input v-model="dataForm.frameSrc" clearable placeholder="请输入内嵌页面地址" />
      </el-form-item>

      <el-form-item label="菜单配置">
        <el-cascader
          v-model="dataForm.outsideMenu"
          clearable
          filterable
          :debounce="150"
          :options="configTree"
          :props="cascaderProps"
          :filter-method="filterConfigNode"
          :show-all-levels="false"
          placeholder="选择或搜索菜单配置"
          class="menu-editor__cascader"
          popper-class="menu-editor__picker-popper menu-editor__config-popper"
          @keydown.enter.stop
          @keyup.enter.stop
        >
          <template #default="{ node, data }">
            <span class="menu-editor__config-node">
              <i :class="node.isLeaf ? 'el-icon-document' : 'el-icon-folder-opened'" class="menu-editor__node-icon" aria-hidden="true"></i>
              <span class="menu-editor__config-text">
                <span class="menu-editor__node-label" :title="data.title">{{ data.title }}</span>
                <span v-if="data.label && data.label !== data.title" class="menu-editor__node-code" :title="String(data.label)">{{
                  data.label
                }}</span>
              </span>
            </span>
          </template>
        </el-cascader>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="menu-editor__footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="loading" @click="submit">确定</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="MenuAddOrUpdate">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import baseService from '@/service/baseService'
import { IServerMenus } from '@/types/interface'
import { useStore } from 'vuex'

type EditorMode = 'create' | 'edit'

interface EditorOpenOptions {
  mode: EditorMode
  /** 编辑时的数据源 */
  row?: IServerMenus
  /** 新增时的上级菜单，缺省为顶级 */
  parent?: IServerMenus
}

interface MenuForm {
  id: string
  name: string
  shortName: string
  pid: string
  parentName: string
  url: string
  sort: number
  openStyle: number
  isShow: number
  isMainPage: number
  isFrame: number
  frameSrc: string
  outsideMenu: string
}

const ROOT_ID = '0'
const ROOT_NAME = '项目过程管控平台'
/** 菜单类型固定为菜单，按钮类型不再在此维护 */
const MENU_TYPE = 0

const emit = defineEmits<{ (e: 'saved'): void }>()

const store = useStore()
const visible = ref(false)
const submitting = ref(false)
/** 弹窗内容（上级菜单树、菜单配置、详情）加载中；打开弹窗即置为 true，避免先停顿再出遮罩 */
const loading = ref(false)
const parentVisible = ref(false)
const parentKeyword = ref('')
const parentOptions = ref<IServerMenus[]>([])
const configTree = ref<unknown[]>([])
const formRef = ref<any>(null)
const parentTreeRef = ref<any>(null)
const mode = ref<EditorMode>('create')
const dataForm = ref<MenuForm>(createEmptyForm())
/** 连续打开时的请求序号，避免先发的响应覆盖后开的那次 */
let openSeq = 0

const cascaderProps = { label: 'title', value: 'label', children: 'children', emitPath: false }

const filterParentNode = (keyword: string, node: IServerMenus) => {
  const text = keyword.trim().toLowerCase()
  return (
    !text ||
    [node.name, node.url].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(text)
    )
  )
}

const filterConfigNode = (node: { pathLabels: string[]; pathValues: unknown[] }, keyword: string) => {
  const text = keyword.trim().toLowerCase()
  return [...node.pathLabels, ...node.pathValues].some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(text)
  )
}

watch(parentKeyword, (value) => parentTreeRef.value?.filter(value))

const handleParentOpen = async () => {
  parentKeyword.value = ''
  await nextTick()
  parentTreeRef.value?.filter('')
  parentTreeRef.value?.setCurrentKey(dataForm.value.pid)
  await nextTick()
  const tree = parentTreeRef.value?.$el as HTMLElement | undefined
  const current = tree?.querySelector<HTMLElement>('.is-current > .el-tree-node__content')
  if (tree && current) {
    tree.scrollTop += current.getBoundingClientRect().top - tree.getBoundingClientRect().top - (tree.clientHeight - current.offsetHeight) / 2
  }
}

const modalTitle = computed(() => (mode.value === 'edit' ? '编辑菜单' : '新增菜单'))

const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { max: 50, message: '名称最多 50 个字符', trigger: 'blur' }
  ],
  parentName: [{ required: true, message: '请选择上级菜单', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
}

function createEmptyForm(): MenuForm {
  return {
    id: '',
    name: '',
    shortName: '',
    pid: ROOT_ID,
    parentName: ROOT_NAME,
    url: '',
    sort: 0,
    openStyle: 0,
    isShow: 1,
    isMainPage: 0,
    isFrame: 0,
    frameSrc: '',
    outsideMenu: ''
  }
}

const createRootNode = (children: IServerMenus[] = []): IServerMenus => ({ id: ROOT_ID, name: ROOT_NAME, children } as IServerMenus)

/** 用列表行先回填表单，弹窗首帧就有数据；详情返回后再覆盖 */
const formFromRow = (row: IServerMenus): MenuForm => ({
  ...createEmptyForm(),
  id: String(row.id ?? ''),
  name: row.name ?? '',
  shortName: row.shortName ?? '',
  pid: String(row.pid ?? ROOT_ID),
  parentName: row.parentName || ROOT_NAME,
  url: row.url ?? '',
  sort: Number(row.sort ?? 0),
  openStyle: Number(row.openStyle ?? 0),
  isShow: Number(row.isShow ?? 1),
  isMainPage: Number(row.isMainPage ?? 0),
  isFrame: Number(row.isFrame ?? 0),
  frameSrc: row.frameSrc ?? '',
  outsideMenu: row.outsideMenu ?? ''
})

/** 当前节点及其祖先链，用于展开上级菜单树 */
const expandedParentKeys = computed(() => {
  const keys = [ROOT_ID]
  const walk = (rows: IServerMenus[], trail: string[]): boolean =>
    rows.some((row) => {
      const nextTrail = [...trail, String(row.id)]
      if (String(row.id) === String(dataForm.value.pid)) {
        keys.push(...nextTrail)
        return true
      }
      return row.children?.length ? walk(row.children, nextTrail) : false
    })
  walk(parentOptions.value, [])
  return [...new Set(keys)]
})

/** 上级菜单不能是自身及其子孙，否则会形成环 */
const pruneSubtree = (rows: IServerMenus[], excludeId: string): IServerMenus[] =>
  rows
    .filter((row) => String(row.id) !== excludeId)
    .map((row) => ({ ...row, children: row.children?.length ? pruneSubtree(row.children, excludeId) : [] }))

const loadParentOptions = async (excludeId: string, seq: number) => {
  try {
    const res = await baseService.get('/sys/menu/list?type=0')
    if (seq !== openSeq) return
    if (!(res?.success || res?.code === 0)) {
      parentOptions.value = [createRootNode()]
      ElMessage.error(res?.msg || '上级菜单加载失败')
      return
    }
    const rows: IServerMenus[] = Array.isArray(res.data) ? res.data : []
    parentOptions.value = [createRootNode(excludeId ? pruneSubtree(rows, excludeId) : rows)]
  } catch (error) {
    if (seq !== openSeq) return
    parentOptions.value = [createRootNode()]
    ElMessage.error(error instanceof Error ? error.message : '上级菜单加载失败')
  }
}

const loadConfigTree = async (seq: number) => {
  try {
    const userId = store.getters.getUserMsg?.id ?? ''
    const res = await baseService.get(`/sys/getUserMenuTree?userId=${userId}`)
    if (seq !== openSeq) return
    if (res?.success || res?.code === 0) {
      configTree.value = Array.isArray(res.data) ? res.data : []
    }
  } catch {
    if (seq !== openSeq) return
    configTree.value = []
  }
}

/** 编辑时拉取详情，列表行可能缺少内嵌地址等字段 */
const loadDetail = async (id: string, seq: number) => {
  try {
    const res = await baseService.get(`/sys/menu/${id}`)
    // 期间又打开了别的弹窗，丢弃过期响应，避免覆盖后开的那次
    if (seq !== openSeq) return
    if (!(res?.success || res?.code === 0) || !res.data) {
      ElMessage.error(res?.msg || '菜单详情加载失败')
      return
    }
    const detail = res.data
    dataForm.value = {
      ...dataForm.value,
      id: String(detail.id ?? id),
      name: detail.name ?? '',
      shortName: detail.shortName ?? '',
      pid: String(detail.pid ?? ROOT_ID),
      parentName: detail.parentName || dataForm.value.parentName,
      url: detail.url ?? '',
      sort: Number(detail.sort ?? 0),
      openStyle: Number(detail.openStyle ?? 0),
      isShow: Number(detail.isShow ?? 1),
      isMainPage: Number(detail.isMainPage ?? 0),
      isFrame: Number(detail.isFrame ?? 0),
      frameSrc: detail.frameSrc ?? '',
      outsideMenu: detail.outsideMenu ?? ''
    }
  } catch (error) {
    if (seq !== openSeq) return
    ElMessage.error(error instanceof Error ? error.message : '菜单详情加载失败')
  }
}

const handleParentChange = (node: IServerMenus) => {
  dataForm.value.pid = String(node.id)
  dataForm.value.parentName = node.name
  parentVisible.value = false
}

const open = async (options: EditorOpenOptions) => {
  const seq = ++openSeq
  mode.value = options.mode
  parentVisible.value = false
  parentKeyword.value = ''
  // 编辑时先用行数据回填，弹窗首帧就有内容，不必等详情
  dataForm.value =
    options.mode === 'edit' && options.row
      ? formFromRow(options.row)
      : {
          ...createEmptyForm(),
          pid: options.parent ? String(options.parent.id) : ROOT_ID,
          parentName: options.parent ? options.parent.name : ROOT_NAME
        }
  // 先置 loading 再显示弹窗：遮罩随弹窗首帧出现，而不是等请求发出后才加载
  loading.value = true
  visible.value = true
  // vxe-modal 使用 destroy-on-close，首次打开时表单在下一帧才渲染
  await nextTick()
  formRef.value?.clearValidate?.()
  try {
    const tasks = [loadParentOptions(options.row ? String(options.row.id) : '', seq), loadConfigTree(seq)]
    if (options.mode === 'edit' && options.row) tasks.push(loadDetail(String(options.row.id), seq))
    await Promise.all(tasks)
  } finally {
    // 期间又打开了新的弹窗时，交给新的那次收尾
    if (seq === openSeq) loading.value = false
  }
  if (seq !== openSeq) return
  await nextTick()
  formRef.value?.clearValidate?.()
  // 回显当前上级菜单，便于确认归属
  parentTreeRef.value?.setCurrentKey?.(dataForm.value.pid)
}

const close = () => {
  parentVisible.value = false
  visible.value = false
}

const submit = async () => {
  // 内容还在加载时表单校验会校验空值，直接拦截
  if (submitting.value || loading.value) return
  const form = formRef.value
  if (!form) return
  let valid = false
  try {
    valid = (await form.validate()) === true
  } catch {
    valid = false
  }
  if (!valid) return

  submitting.value = true
  try {
    const isEdit = Boolean(dataForm.value.id)
    // 显式构造 payload，避免把列表行的 children/icon 等字段回传给后端
    const payload = {
      name: dataForm.value.name.trim(),
      shortName: dataForm.value.shortName.trim(),
      pid: dataForm.value.pid,
      parentName: dataForm.value.parentName,
      url: dataForm.value.url.trim(),
      sort: Number(dataForm.value.sort) || 0,
      openStyle: dataForm.value.openStyle,
      isShow: dataForm.value.isShow,
      isMainPage: dataForm.value.isMainPage,
      isFrame: dataForm.value.isFrame,
      frameSrc: dataForm.value.isFrame === 1 ? dataForm.value.frameSrc.trim() : '',
      outsideMenu: dataForm.value.outsideMenu ?? '',
      type: MENU_TYPE
    }
    const res = await baseService.post(isEdit ? '/sys/menu/update' : '/sys/menu', isEdit ? { ...payload, id: dataForm.value.id } : payload)
    if (!(res?.success || res?.code === 0)) {
      ElMessage.error(res?.msg || '保存失败')
      return
    }
    ElMessage.success('保存成功')
    visible.value = false
    emit('saved')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open, close })
</script>

<style lang="less">
/* vxe-modal transfer 到 body，样式需为全局段落，统一以 .menu-editor-modal 命名空间 */
.menu-editor-modal {
  max-width: 94vw;

  .vxe-modal--box {
    max-height: calc(100vh - 32px);
    overflow: hidden;
    border-radius: 10px;
  }

  .vxe-modal--body {
    min-height: 0;
    overflow-y: auto;
    padding: 18px 20px 4px;
  }

  .vxe-modal--footer {
    padding: 12px 20px 16px;
    border-top: 1px solid #eef2f4;
  }
}

.menu-editor__picker-popper.el-popper {
  --menu-picker-accent: var(--color-primary, #00706b);
  max-width: calc(100vw - 32px);
  border: 1px solid #dfe7eb;
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(24, 48, 60, 0.14);
  color: #334155;
  font-size: 13px;
}

.menu-editor__parent-popper.el-popper {
  max-height: none;
  overflow: visible;
  padding: 12px;
  box-sizing: border-box;
}

.menu-editor__picker-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-weight: 600;
}

.menu-editor__picker-hint {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 400;
}

.menu-editor__parent-search {
  margin-bottom: 8px;

  .el-input__inner {
    border-radius: 6px;
    background: #f8fafb;
  }
}

.menu-editor {
  .el-form-item {
    margin-bottom: 18px;
  }

  .menu-editor__cascader {
    width: 100%;
  }
}

.menu-editor__readonly .el-input__inner {
  cursor: pointer;
}

.menu-editor__select-arrow {
  transition: transform 0.18s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.menu-editor__parent-tree {
  max-height: min(300px, 42vh);
  overflow-y: auto;
  color: #475569;

  .el-tree-node__content {
    height: 36px;
    margin: 2px 0;
    padding-right: 10px;
    border-radius: 6px;

    &:hover {
      background: #f3f7f8;
    }
  }

  // 全局 app.less 里 .el-tree--highlight-current ... 用 !important 把选中行刷成主色实心底，
  // 这里的浅色选中态必须同样带 !important 才生效；否则主色文字压在主色底上，文字和图标都看不见
  &.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
    color: var(--menu-picker-accent) !important;
    background-color: #eaf6f4 !important;
    font-weight: 600;

    &:hover {
      background-color: #e3f1ee !important;
    }

    .menu-editor__node-icon,
    .menu-editor__node-check {
      color: var(--menu-picker-accent);
    }
  }

  .el-tree-node__expand-icon:not(.is-leaf) {
    color: #8496a6;
  }

  .el-tree__empty-block {
    min-height: 100px;
  }
}

.menu-editor__tree-node,
.menu-editor__config-node {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.menu-editor__node-icon {
  flex: none;
  color: #8ba0ad;
  font-size: 15px;
}

.menu-editor__node-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-editor__node-check {
  flex: none;
  margin-left: auto;
  color: var(--menu-picker-accent);
}

.menu-editor__config-popper {
  .el-cascader-panel {
    max-width: calc(100vw - 34px);
    overflow-x: auto;
  }

  .el-cascader-menu {
    flex: 0 0 224px;
    min-width: 0;
    color: #475569;
    border-color: #eef2f4;
  }

  .el-cascader-menu__wrap {
    height: min(300px, 45vh);
  }

  .el-cascader-menu__list {
    padding: 6px;
  }

  .el-cascader-node {
    height: 48px;
    padding: 0 26px 0 10px;
    margin: 2px 0;
    border-radius: 6px;
    line-height: 20px;

    &:not(.is-disabled):hover,
    &:not(.is-disabled):focus {
      background: #f3f7f8;
    }

    &.in-active-path,
    &.is-active {
      color: var(--menu-picker-accent);
      background: #eaf6f4;
      font-weight: 600;
    }
  }

  .el-cascader-node__label {
    min-width: 0;
    padding: 0;
  }

  .el-cascader-node__prefix {
    right: 10px;
    left: auto;
  }

  .el-cascader__suggestion-panel {
    max-height: min(300px, 45vh);
  }

  .el-cascader__suggestion-item {
    min-height: 36px;
    line-height: 20px;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.menu-editor__config-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.menu-editor__node-code {
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 400;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-editor__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
