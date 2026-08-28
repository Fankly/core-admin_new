<template>
  <div class="main" v-if="userMsg.isShowPage" v-loading="loading">
    <splitpane :splitSet="pageConfig">
      <template #paneL>
        <div class="panel-left">
          <div class="panel-left-main">
            <div class="panel-left-main__content">
              <el-tree :current-node-key="currentKey" lazy :load="loadTreeData" :expand-on-click-node="false" highlight-current ref="xmlxRef" :props="pageData.treeProps" node-key="middleId" @node-click="getClickxmlxDataHandle"></el-tree>
            </div>
          </div>
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <ProTable @row-click="rowClick" row-key="protypeId" :tool-button="['help', 'setting']" :data-callback="callBackHandle" :init-param="initParam" :request-api="getPageList" :request-auto="true" :search-col="4" :columns="tableColumns" ref="proTableRef">
            <!-- 表格 header 按钮 -->
            <template #tableHeader="scope">
              <div class="header-button">
                <div class="left">
                  <el-button v-permission="'EDIT'" size="mini" :disabled="!scope['isSelected']" type="primary" plain @click="() => handleEditData((scope['selectedList'] as RowVo[]))">编 辑 </el-button>
                  <el-button v-permission="'BATCHEDIT'" size="mini" :disabled="!scope['isSelected']" type="primary" plain @click="() => handleBatchEditData((scope['selectedList'] as RowVo[]))">批量编辑 </el-button>
                  <el-button v-permission="'DELETE'" size="mini" :disabled="!scope['isSelected']" type="primary" plain @click="() => handleDeleteData((scope['selectedList'] as RowVo[]))">删除 </el-button>
                </div>
              </div>
            </template>
          </ProTable>
        </div>
      </template>
    </splitpane>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <ContinueCarryoverModal @refresh="refreshData" ref="continueCarryoverModalRef" />
  <ContinueCarryoverBatchModal @refresh="refreshData" ref="continueCarryoverBatchModalRef" />
  <HelpModal ref="helpModalRef" />
</template>

<script setup lang="ts" name="/config/ContinueCarryover">
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import HelpModal from '@/components/HelpModal/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTable/index.vue'
import { ElMessage } from 'element-plus'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { getPageData, removeData } from '@/api/config/continueCarryover'
import { getProtypeTreeYear } from '@/api/service/requirement'
import ContinueCarryoverModal from '@/views/config/components/ContinueCarryoverModal.vue'
import ContinueCarryoverBatchModal from '@/views/config/components/ContinueCarryoverBatchModal.vue'
import { VXETable } from 'vxe-table'

interface PageConfig extends ContextProps {
  loading: boolean
}

export interface Tree {
  children: Tree[]
  code: string
  dispOrder: string
  hasChildren: boolean
  id: string
  leaf: boolean
  leafString: string
  middleId: string
  name: string
  nd: string
  parentId: string
  protypeId: string
}

export interface RowVo {
  protypeName: string
  nd: string
  startDate: string
  endDate: string
  protypeId: string
  id: string
}

interface InitParams {
  nd: string
  dataType: string
  protypeId: string
}
const currentKey = ref<string>(new Date().getFullYear().toString())
const continueCarryoverModalRef = ref<InstanceType<typeof ContinueCarryoverModal>>()
const continueCarryoverBatchModalRef = ref<InstanceType<typeof ContinueCarryoverBatchModal>>()
const proTableRef = ref<any>()
const userDialogRef = ref()
const helpModalRef = ref()
const xmlxRef = ref()
const loading = ref(false)

const rowClick = (row: any) => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.element.toggleRowSelection(row)
}

onMounted(() => {
  selectRolesHandle()
})

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive<InitParams>({
  nd: '-1',
  dataType: '1',
  protypeId: '-1'
})

const pageConfig = reactive<PageConfig>({
  loading: true,
  minPercent: 20,
  defaultPercent: 20,
  split: 'vertical'
})

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  {
    prop: 'protypeName',
    label: '类型名称',
    width: '220'
  },
  {
    prop: 'nd',
    label: '年度',
    width: '120'
  },
  {
    prop: 'startDate',
    label: '开始期间'
  },
  {
    prop: 'endDate',
    label: '结束期间'
  }
])

const userMsg = reactive({
  specialOrgId: '',
  isShowPage: false
})

const pageData = reactive<any>({
  filterXmlxData: '',
  treeProps: {
    children: 'children',
    label: 'name',
    isLeaf: 'leaf',
    id: 'id'
  },
  xmlxData: [],
  defaultExpandedKeys: []
})

const getPageList = (params: any) => {
  loading.value = true
  params.current = params.page
  params.size = params.limit
  return getPageData(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const selectRolesHandle = () => {
  pageConfig.loading = true
  userDialogRef.value.getUser()
}

const setDefaultValue = () => {
  const year = new Date().getFullYear().toString()
  initParam.nd = year
  initParam.protypeId = year
}
setDefaultValue()

const getRoleHandle = async () => {
  pageConfig.loading = false
  userMsg.specialOrgId = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userMsg.isShowPage = true
    if (xmlxRef.value) {
      await nextTick(() => {
        xmlxRef.value.setCurrentKey(initParam.nd)
      })
    }
  }
}

const loadTreeData = async (node: any, resolve: (data: Tree[]) => void) => {
  loading.value = true
  try {
    let parentId = '-1'
    let nd = ''
    if (node.level === 0) {
      nd = '-1'
      parentId = '-1'
    } else {
      parentId = node.data.id
      nd = node.data.nd
    }
    const res = await getProtypeTreeYear({
      nd: nd,
      parentId: parentId
    })

    if (!res.success || !res.data) {
      throw new Error(res.msg || '请求的数据为空!')
    }
    resolve(res.data)
  } catch (e) {
    handleError(e as Error, '加载项目数据失败')
  } finally {
    loading.value = false
  }
}

const handleError = (error: Error, message = '操作失败'): void => {
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}

const handleEditData = (selectedData: RowVo[]) => {
  if (selectedData.length !== 1) {
    ElMessage.warning('请选择一条数据进行编辑!')
    return
  }
  if (continueCarryoverModalRef.value) continueCarryoverModalRef.value.acceptParams(selectedData[0])
}

const handleBatchEditData = (selectedData: RowVo[]) => {
  if (continueCarryoverBatchModalRef.value) continueCarryoverBatchModalRef.value.acceptParams(selectedData)
}

const handleDeleteData = async (selectedData: RowVo[]) => {
  if (selectedData.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除!')
    return
  }
  try {
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      loading.value = true
      const ids = selectedData.map((item) => item.id)
      const res = await removeData(ids)
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      if (proTableRef.value) {
        proTableRef.value?.clearSelection()
        proTableRef.value?.getTableList()
      }
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const getClickxmlxDataHandle = async (data: any) => {
  initParam.protypeId = data.middleId
  initParam.nd = data.nd
  currentKey.value = data.id
  if (proTableRef.value) {
    proTableRef.value?.clearSelection()
    proTableRef.value?.getTableList()
  }
}

const refreshData = () => {
  if (proTableRef.value) {
    proTableRef.value?.clearSelection()
    proTableRef.value.getTableList()
  }
}
</script>

<style scoped lang="less">
.main {
  padding: 0 10px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .panel-left,
  .panel-right {
    height: 100%;
    padding: 10px 0 10px 10px;
  }

  .panel-right {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;

    .header-button {
      display: flex;
      min-height: 0;
      min-width: 0;

      .left {
        flex: 1;
        min-height: 0;
        min-width: 0;
      }

      .right {
        text-align: right;
        width: 200px;
      }
    }
  }

  .panel-left {
    &-main {
      height: calc(100% - 32px);
      display: flex;
      flex-direction: column;

      &__search {
        padding: 0 10px 10px 0;
      }

      &__content {
        flex: 1;
        min-width: 0;
        min-height: 0;
        overflow: auto;
      }
    }
  }
}
</style>
