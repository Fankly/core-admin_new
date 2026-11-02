<template>
  <el-dialog v-model="visible" :title="!dataForm.id ? '新增' : '修改'" :close-on-click-modal="false" :close-on-press-escape="false" class="dialogBox">
    <el-form :model="dataForm" :rules="dataRule" ref="dataFormRef" @keyup.enter="dataFormSubmitHandle()" label-width="120px">
      <el-form-item prop="type" label="类型" size="small">
        <el-radio-group v-model="dataForm.type" :disabled="!!dataForm.id">
          <el-radio :value="0">{{ '菜单' }}</el-radio>
          <el-radio :value="1">{{ '按钮' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="name" label="名称">
        <el-input v-model="dataForm.name" placeholder="名称"></el-input>
      </el-form-item>
      <el-form-item prop="parentName" label="上级菜单" class="menu-list">
        <el-popover v-model:visible="menuListVisible" ref="menuListPopover" placement="bottom-start" trigger="click" :width="'400px'">
          <template v-slot:reference>
            <el-input v-model="dataForm.parentName" :readonly="true" placeholder="请选择菜单">
              <template v-slot:suffix
                ><el-icon v-if="dataForm.pid !== '0'" @click.stop="deptListTreeSetDefaultHandle()" class="ep-icon-circle-close el-input__icon"><EpCircleClose /></el-icon></template>
            </el-input>
          </template>
          <el-tree
            :data="menuList"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            ref="menuListTree"
            :highlight-current="true"
            :expand-on-click-node="false"
            accordion
            @current-change="menuListTreeCurrentChangeHandle"
          ></el-tree>
        </el-popover>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="url" label="路由">
        <el-input v-model="dataForm.url" placeholder="路由"></el-input>
      </el-form-item>
      <el-form-item prop="sort" label="排序">
        <el-input-number v-model="dataForm.sort" controls-position="right" :min="0" label="排序"></el-input-number>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="openStyle" label="打开方式" size="small">
        <el-radio-group v-model="dataForm.openStyle">
          <el-radio :value="0">{{ '内部打开' }}</el-radio>
          <el-radio :value="1">{{ '外部打开' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="isShow" label="是否显示菜单" size="small">
        <el-radio-group v-model="dataForm.isShow">
          <el-radio :value="1">{{ '是' }}</el-radio>
          <el-radio :value="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="isMainPage" label="是否主页" size="small">
        <el-radio-group v-model="dataForm.isMainPage">
          <el-radio :value="1">{{ '是' }}</el-radio>
          <el-radio :value="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="dataForm.type === 0" prop="icon" label="图标" class="icon-list">
        <el-popover
          :width="'400px'"
          v-model:visible="iconListVisible"
          ref="iconListPopover"
          placement="top-start"
          trigger="click"
          popper-class="mod-sys__menu-icon-popover"
        >
          <template v-slot:reference>
            <el-input v-model="dataForm.icon" readonly placeholder="请选择图标" aria-label="菜单图标">
              <template #prefix>
                <svg v-if="dataForm.icon" class="icon-preview" aria-hidden="true">
                  <use :xlink:href="'#' + dataForm.icon"></use>
                </svg>
              </template>
              <template #suffix>
                <button
                  v-if="dataForm.icon"
                  type="button"
                  class="icon-clear-button"
                  aria-label="清除图标"
                  title="清除图标"
                  @click.stop="clearIconHandle"
                >
                  <el-icon class="ep-icon-circle-close" aria-hidden="true"><EpCircleClose /></el-icon>
                </button>
                <el-icon v-else class="ep-icon-arrow-down" aria-hidden="true"><EpArrowDown /></el-icon>
              </template>
            </el-input>
          </template>
          <div class="mod-sys__menu-icon-inner">
            <div class="mod-sys__menu-icon-list">
              <el-button
                v-for="(item, index) in iconList"
                :key="item || index"
                native-type="button"
                :aria-label="'选择图标 ' + item"
                :title="'选择图标 ' + item"
                @click="iconListCurrentChangeHandle(item)"
                :class="{ 'is-active': dataForm.icon === item }"
              >
                <svg class="icon-svg" aria-hidden="true">
                  <use :xlink:href="`#${item}`"></use>
                </svg>
              </el-button>
            </div>
          </div>
        </el-popover>
      </el-form-item>
      <el-form-item class="icon-list" label="菜单配置">
        <el-cascader clearable v-model="dataForm.outsideMenu" :options="treeList" :props="cascaderProps" :show-all-levels="false" @change="handle" />
      </el-form-item>
      <el-form-item prop="isFrame" label="是否内嵌" size="small">
        <el-radio-group v-model="dataForm.isFrame">
          <el-radio :value="1">{{ '是' }}</el-radio>
          <el-radio :value="0">{{ '否' }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="dataForm.isFrame" prop="frameSrc" label="内嵌地址" size="small">
        <el-input v-model="dataForm.frameSrc" placeholder="请输入内嵌地址"></el-input>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <el-button @click="visible = false">{{ '取消' }}</el-button>
      <el-button type="primary" :loading="submitLoading" @click="dataFormSubmitHandle()">{{ '确定' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ArrowDown as EpArrowDown, CircleClose as EpCircleClose } from '@element-plus/icons-vue'
import useView from '@/hooks/useView'
import { reactive, toRefs, watch, proxyRefs, toRef, nextTick, computed, useTemplateRef } from 'vue'
import baseService from '@/service/baseService'
import { getIconList, useDebounce } from '@/utils/utils'
import { IObject } from '@/types/interface'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
const emit = defineEmits()
const dataFormRefRef = useTemplateRef('dataFormRef')
const menuListTreeRef = useTemplateRef('menuListTree')
const store = useStore()
const state = reactive({
  visible: false,
  menuList: [],
  menuListVisible: false,
  iconList: [] as string[],
  iconListVisible: false,
  submitLoading: false,
  treeList: [],
  cascaderProps: {
    label: 'title',
    value: 'label',
    children: 'children'
  },
  dataForm: {
    id: '',
    isFrame: 0,
    frameSrc: '',
    type: 0,
    name: '',
    pid: '0',
    parentName: '',
    url: '',
    isShow: 1,
    isMainPage: 0,
    sort: 0,
    icon: '',
    openStyle: 0,
    outsideMenu: ''
  }
})
// 监听isFrame
watch(
  () => state.dataForm.isFrame,
  (newVal) => {
    if (newVal === 0) {
      state.dataForm.frameSrc = ''
    }
  }
)
const setupState = proxyRefs({
  EpArrowDown,
  EpCircleClose,
  ...useView(state),
  ...toRefs(state),
  store
})
const query = toRef(setupState, 'query')
const dataListSelectionChangeHandle = toRef(setupState, 'dataListSelectionChangeHandle')
const dataListSortChangeHandle = toRef(setupState, 'dataListSortChangeHandle')
const pageSizeChangeHandle = toRef(setupState, 'pageSizeChangeHandle')
const pageCurrentChangeHandle = toRef(setupState, 'pageCurrentChangeHandle')
const getDataList = toRef(setupState, 'getDataList')
const addHandle = toRef(setupState, 'addHandle')
const addOrUpdateHandle = toRef(setupState, 'addOrUpdateHandle')
const deleteHandle = toRef(setupState, 'deleteHandle')
const exportHandle = toRef(setupState, 'exportHandle')
const closeCurrentTab = toRef(setupState, 'closeCurrentTab')
const handleFlowRoute = toRef(setupState, 'handleFlowRoute')
const flowDetailRoute = toRef(setupState, 'flowDetailRoute')
const createdIsNeed = toRef(setupState, 'createdIsNeed')
const activatedIsNeed = toRef(setupState, 'activatedIsNeed')
const getDataListURL = toRef(setupState, 'getDataListURL')
const getDataListIsPage = toRef(setupState, 'getDataListIsPage')
const deleteURL = toRef(setupState, 'deleteURL')
const deleteIsBatch = toRef(setupState, 'deleteIsBatch')
const deleteIsBatchKey = toRef(setupState, 'deleteIsBatchKey')
const exportURL = toRef(setupState, 'exportURL')
const dataForm = toRef(setupState, 'dataForm')
const dataList = toRef(setupState, 'dataList')
const order = toRef(setupState, 'order')
const orderField = toRef(setupState, 'orderField')
const page = toRef(setupState, 'page')
const limit = toRef(setupState, 'limit')
const total = toRef(setupState, 'total')
const dataListLoading = toRef(setupState, 'dataListLoading')
const dataListSelections = toRef(setupState, 'dataListSelections')
const addOrUpdateVisible = toRef(setupState, 'addOrUpdateVisible')
const addOrUpdate = toRef(setupState, 'addOrUpdate')
const elTable = toRef(setupState, 'elTable')
const visible = toRef(setupState, 'visible')
const menuList = toRef(setupState, 'menuList')
const menuListVisible = toRef(setupState, 'menuListVisible')
const iconList = toRef(setupState, 'iconList')
const iconListVisible = toRef(setupState, 'iconListVisible')
const submitLoading = toRef(setupState, 'submitLoading')
const treeList = toRef(setupState, 'treeList')
const cascaderProps = toRef(setupState, 'cascaderProps')
function getUserList() {
  const id = setupState.store.getters.getUserMsg.id
  baseService.get(`/sys/getUserMenuTree?userId=${id}`).then((res) => {
    if (res.success) {
      setupState.treeList = res.data
    }
  })
}
function handle(value: any) {
  if (!value) setupState.dataForm.outsideMenu = ''
  else setupState.dataForm.outsideMenu = value[value.length - 1]
}
function init(patientRow?: IObject) {
  setupState.visible = true
  nextTick(() => {
    dataFormRefRef.value.resetFields()
    setupState.iconList = getIconList()
    if (patientRow) {
      setupState.dataForm.id = ''
      setupState.dataForm.pid = patientRow.id
      setupState.dataForm.parentName = patientRow.name
    } else {
      setupState.dataForm.parentName = '项目过程管控平台'
    }
    getMenuList().then(() => {
      if (setupState.dataForm.id) {
        getInfo()
      }
    })
  })
}
// 获取菜单列表
function getMenuList() {
  return baseService.get('/sys/menu/list?type=0').then((res) => {
    if (res.code !== 0) {
      return ElMessage.error(res.msg)
    }
    setupState.menuList = res.data
  })
}
// 获取信息
function getInfo() {
  baseService.get(`/sys/menu/${setupState.dataForm.id}`).then((res) => {
    if (res.code !== 0) {
      return ElMessage.error(res.msg)
    }
    setupState.dataForm = {
      ...setupState.dataForm,
      ...res.data
    }
    if (setupState.dataForm.pid === '0') {
      return deptListTreeSetDefaultHandle()
    }
    menuListTreeRef.value.setCurrentKey(setupState.dataForm.pid)
  })
}
// 上级菜单树, 设置默认值
function deptListTreeSetDefaultHandle() {
  setupState.dataForm.pid = '0'
  setupState.dataForm.parentName = '项目过程管控平台'
}
// 上级菜单树, 选中
function menuListTreeCurrentChangeHandle(data: IObject) {
  setupState.dataForm.pid = data.id
  setupState.dataForm.parentName = data.name
  setupState.menuListVisible = false
}
// 图标, 选中
function iconListCurrentChangeHandle(icon: string) {
  setupState.dataForm.icon = icon
  setupState.iconListVisible = false
}
function clearIconHandle() {
  setupState.dataForm.icon = ''
  setupState.iconListVisible = false
}
let dataFormSubmitHandle = function () {
  if (setupState.submitLoading) {
    return
  }
  dataFormRefRef.value.validate((valid: boolean) => {
    if (!valid) {
      return false
    }
    setupState.submitLoading = true
    const url = setupState.dataForm.id ? '/sys/menu/update' : '/sys/menu'
    baseService
      .post(url, setupState.dataForm)
      .then((res) => {
        if (res.code !== 0) {
          return ElMessage.error(res.msg)
        }
        ElMessage({
          message: '操作成功',
          type: 'success',
          duration: 500,
          onClose: () => {
            setupState.visible = false
            emit('refreshDataList')
          }
        })
      })
      .finally(() => {
        setupState.submitLoading = false
      })
  })
}
const dataRule = computed(() => {
  return {
    name: [
      {
        required: true,
        message: '必填项不能为空',
        trigger: 'blur'
      }
    ],
    parentName: [
      {
        required: true,
        message: '必填项不能为空',
        trigger: 'change'
      }
    ]
  }
})
;(() => {
  dataFormSubmitHandle = useDebounce(dataFormSubmitHandle)
  getUserList()
})()
defineExpose({
  EpArrowDown,
  EpCircleClose,
  query,
  dataListSelectionChangeHandle,
  dataListSortChangeHandle,
  pageSizeChangeHandle,
  pageCurrentChangeHandle,
  getDataList,
  addHandle,
  addOrUpdateHandle,
  deleteHandle,
  exportHandle,
  closeCurrentTab,
  handleFlowRoute,
  flowDetailRoute,
  createdIsNeed,
  activatedIsNeed,
  getDataListURL,
  getDataListIsPage,
  deleteURL,
  deleteIsBatch,
  deleteIsBatchKey,
  exportURL,
  dataForm,
  dataList,
  order,
  orderField,
  page,
  limit,
  total,
  dataListLoading,
  dataListSelections,
  addOrUpdateVisible,
  addOrUpdate,
  elTable,
  visible,
  menuList,
  menuListVisible,
  iconList,
  iconListVisible,
  submitLoading,
  treeList,
  cascaderProps,
  store,
  getUserList,
  handle,
  init,
  getMenuList,
  getInfo,
  deptListTreeSetDefaultHandle,
  menuListTreeCurrentChangeHandle,
  iconListCurrentChangeHandle,
  clearIconHandle,
  dataFormSubmitHandle,
  dataRule
})
</script>

<style lang="less" scoped>
.el-select--small {
  width: 100%;
}
.el-popover.el-popper {
  overflow-x: hidden;
}

.mod-sys__menu {
  .menu-list,
  .icon-list {
    .el-input__inner,
    .el-input__suffix {
      cursor: pointer;
    }
  }

  &-icon-popover {
    width: 458px !important;
    overflow-y: hidden !important;
  }

  &-icon-inner {
    width: 478px;
    max-height: 258px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  &-icon-list {
    width: 458px !important;
    padding: 0;
    margin: -8px 0 0 -8px;

    > .el-button {
      padding: 8px;
      margin: 8px 0 0 8px;

      > span {
        display: inline-block;
        vertical-align: middle;
        width: 18px;
        height: 18px;
        font-size: 15px;
      }
    }
  }
}

.icon-preview {
  width: 15px;
  height: 15px;
}

.icon-clear-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #909399;
  background: transparent;
  border: 0;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    color: #00706b;
    outline: none;
  }
}
</style>
