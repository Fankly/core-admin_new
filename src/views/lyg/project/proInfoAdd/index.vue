<!-- 项目信息补充 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button
          v-permission="'EDIT'"
          :disabled="scope.selectedList.length == 0"
          size="mini"
          @click="handleBtn(scope.selectedList, 'EDIT')"
          type="primary"
        >
          项目信息补充
        </el-button>
        <el-button @click="handleImport" v-permission="'IMPORT'" size="mini" type="primary">导 入</el-button>
        <!-- <el-button @click="handleExport" v-permission="'EXPORT'" size="mini" type="primary">导 出</el-button> -->
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <maintModal ref="rangeModalRef" @search-handle="searchHandle" />
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script setup lang="tsx" name="/lyg/project/proInfoAdd/index">
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, reactive, nextTick, h } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTablePage/index.vue'
import maintModal from '@/views/lyg/project/proInfoAdd/components/maintModal/index.vue'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import { xmqgcInfoPage, batchUpdate, xmqgcInfoExport, getXmxxbcImportTemplate, importXmxxbc } from '@/api/lyg/index'
import { useStore } from 'vuex'
import { apiExportHandle } from '@/utils/export'
import ImportExcel from '@/components/ImportExcel/indexNew.vue' //导入组件
import { formatNumValue } from '@/utils/utils'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'

// ========== 类型定义 ==========

interface SelectedRow {
  rangeId: string
  proType: string
  [key: string]: any
}

type OperationType = 'EDIT'

// ========== 响应式状态 ==========
const rangeModalRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const store = useStore()
const importRef = ref()
const xmIdList = ref<string[]>([])
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const infoParams = ref<any>({})
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  proTableRef.value?.clearSelection()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    // proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  infoParams.value = {
    ...param,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code
  }
  infoParams.value.pspidList = param.pspid ? param.pspid.split(',') : []
  return xmqgcInfoPage(infoParams.value)
}

// 导入
const handleImport = (type: any) => {
  let newParmas = { ...infoParams.value }
  importRef.value.fromData = { ...newParmas }
  let tempApi: any = getXmxxbcImportTemplate
  let importApi: any = importXmxxbc
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '项目信息补充',
    specialorgid: userInfo.value.deptId,
    getTableList: proTableRef.value?.getTableList
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

// 导出
const handleExport = () => {
  const params = { ...infoParams.value }
  const fileName = '项目信息补充'
  apiExportHandle(params, fileName, xmqgcInfoExport)
}
// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 操作按钮 ==========
const handleBtn = async (selectedList: SelectedRow[], type: OperationType) => {
  if (type === 'EDIT' && selectedList.length === 0) return ElMessage.warning('请选择数据！')
  if (type === 'EDIT') {
    const params = {
      type: '编辑'
    }
    xmIdList.value = selectedList.map(({ id }: any) => id)
    rangeModalRef.value.acceptParams(params)
    return
  }
}

const searchHandle = async (val: any) => {
  loading.value = true
  if (!val) return
  const params = {
    ...val,
    xmIdList: xmIdList.value
  }
  let res = await batchUpdate(params)
  if (!res.success) ElMessage.error(res.msg)
  ElMessage.success('保存成功！')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
  loading.value = false
}

const initParamLists = async () => {
  yjdwList.value.length = 0
  projectTypeList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }

  let xmlx = await getSubProtypeTree()
  if (xmlx.success && xmlx.data.length !== 0) {
    projectTypeList.value.push(...xmlx.data)
  }
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.qkjejdw = ''
  params.qkjgkbm = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  const param = {
    YJDW: val,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    parentCode: val
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
  let gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'pspid',
    label: '项目编码',
    width: 150,
    search: {
      order: 7,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    }
  },
  { prop: 'post1', label: '项目名称', width: 180, search: { el: 'input', order: 8 } },
  { prop: 'projectProgress', label: '当前状态', width: 120 },
  {
    prop: 'qkjyjdw',
    label: '一级单位',
    width: 150,
    search: { el: 'select', props: { onChange: selectChange }, order: 1 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjyjdwName
    }
  },
  {
    prop: 'qkjejdwList',
    label: '二级单位',
    width: 150,
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true } },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjejdwName
    }
  },
  {
    prop: 'qkjxmlxbmList',
    label: '项目类型',
    width: 150,
    search: {
      order: 3,
      render: (scope: any) => {
        return (
          <ElTreeSelect
            showCheckbox
            collapseTags
            clearable
            data={projectTypeList.value}
            props={proTypeProps}
            nodeKey={'middleId'}
            modelValue={scope.modelValue}
          />
        )
      }
    },
    render: ({ row }: any) => {
      return row.qkjxmlxmc
    }
  },
  {
    prop: 'qkjgkbmList',
    label: '项目归口部门',
    width: 150,
    search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true } },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjgkbmName
    }
  },
  {
    prop: 'zyear',
    label: '年度',
    width: 80,
    search: { el: 'select', order: 5 },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'erpjdys',
    label: '总预算',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => {
      if (typeof row.erpjdys === 'undefined' || row.erpjdys === null || row.erpjdys === '') return '-'
      return formatNumValue(row.erpjdys.toString(), 2)
    }
  },
  {
    prop: 'erpztys',
    label: '年度预算',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => {
      if (typeof row.erpztys === 'undefined' || row.erpztys === null || row.erpztys === '') return '-'
      return formatNumValue(row.erpztys.toString(), 2)
    }
  },
  { prop: 'projectManagerId', label: '责任人账号', width: 150 },
  { prop: 'projectManagerName', label: '责任人名称', width: 150 },
  { prop: 'directorId', label: '项目负责主任账号', width: 150 },
  { prop: 'directorName', label: '项目负责主任名称', width: 150, search: { el: 'input', order: 6 } },
  { prop: 'serviceBidType', label: '服务招标-类型', width: 150 },
  { prop: 'materialBidType', label: '物资招标-类型', width: 150 },
  { prop: 'jsfs', label: '结算方式', width: 100 },
  { prop: 'wzzbpcName', label: '物资招标批次', width: 150 },
  { prop: 'fwzbpcName', label: '服务招标批次', width: 150 }
])
</script>

<style scoped lang="less">
@import 'css/index.less';
</style>
