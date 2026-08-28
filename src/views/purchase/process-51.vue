<template>
  <div class="table-box" v-loading="loading" v-if="isShowPage">
    <ProTable
      :cell-style="cellStyle"
      :request-auto="true"
      helpMessage="背景色标灰的项目未完成采购信息确认;背景色标黄的项目未进行招标采购信息关联,请确认!"
      :data-callback="dataCallbackHandle"
      height="100%"
      @reset="resetParams"
      :pagination="true"
      :requestApi="getDataList"
      :search-col="4"
      ref="proTable"
      :columns="columns"
      :init-param="initParam"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'QUERYPURMSG'" size="mini" type="primary" :disabled="!scope.isSelected" plain @click="addMsg(scope.selectedList)"
          >确认采购信息记录
        </el-button>
        <el-button v-permission="'EXPORTPROMSG'" size="mini" type="primary" plain v-debounce="[exportProMsg]">导 出项目信息 </el-button>
        <el-button v-permission="'EXPORTPUR'" size="mini" type="primary" plain v-debounce="[exportPurchaseMsg]"> 导出采购信息记录 </el-button>
      </template>
    </ProTable>
    <FormDialog
      :selectedTableData="selectedTableData"
      :purchaseData="purchaseData"
      @closeDialog="closeDialog"
      :showDiaglog="showDiaglog"
    ></FormDialog>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: '/purchase/process-51'
}
</script>
<script setup lang="tsx">
import { ref, reactive, onMounted, computed } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import FormDialog from '@/views/purchase/components/FormDialog/index.vue'
import { ProTableInstance, ColumnProps } from '@/components/ProTable/interface'
import { exportWz, exportXm, getCglx, getDcl, getPage } from '@/api/purchase'
import { getProTypeTreeNode, getUnit } from '@/api/process'
import { PurchaseDatas, PurchaseData } from './types'
// 设置用户信息
const loading = ref<boolean>(true)
const isShowPage = ref<boolean>(false)
const specialOrgId = ref<string>('')
const roleCode = ref<string>('')
// userDialog 实例
const userDialogRef = ref<any>()
const unitRef = ref()
const proTypeRef = ref()
onMounted(() => {
  selectRolesHandle()
  getProjectData()
  getUnitData()
})

const selectRolesHandle = () => {
  loading.value = true
  userDialogRef.value.getUser()
}

const cellStyle = (data: any) => {
  if (data.row.sfqr === '0' && data.row.sfgl === '0') {
    return {
      background: 'rgba(128,128,128,.6)'
    }
  }
  if (data.row.sfqr === '1' && data.row.sfgl === '0') {
    return {
      background: 'rgba(255, 255, 0,.6)'
    }
  }
}

const showDiaglog = ref<boolean>(false)

const closeDialog = (val: boolean) => {
  showDiaglog.value = val
  proTable.value?.getTableList()
}

const getRoleHandle = () => {
  loading.value = false
  specialOrgId.value = userDialogRef.value.specialorgid
  roleCode.value = userDialogRef.value.roleCode
  initParam.specialorgid = specialOrgId.value
  initParam.roleCode = roleCode.value
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
  }
}

const selectedTableData = ref()

// 新增
const addMsg = async (selectedList: any[]) => {
  if (selectedList.length !== 1) {
    ElMessage.error('只能选择一条数据进行编辑')
    return
  }
  selectedTableData.value = { ...selectedList[0], specialorgid: specialOrgId.value }

  showDiaglog.value = true
}

// 导出项目信息
const exportProMsg = () => {
  loading.value = true
  exportXm({
    specialorgid: specialOrgId.value,
    ...proTable.value?.searchParam
  }).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}
// 导出采购信息
const exportPurchaseMsg = () => {
  loading.value = true
  exportWz({
    specialorgid: specialOrgId.value,
    ...proTable.value?.searchParam
  }).then((res: any) => {
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}

const resetParams = () => {
  unitRef.value.clearSelect()
  proTypeRef.value.clearSelect()
}
// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const getDataList = (params: any) => {
  loading.value = true
  proTable.value?.clearSelection()
  return getPage(params)
}

// 表格请求后回调函数
const dataCallbackHandle = (data: any) => {
  loading.value = false
  return data
}

// ProTable 实例
const proTable = ref<ProTableInstance>()

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 })

// 获取选择的数据
const selectedData = (value: any, flag: string) => {
  if (proTable.value) {
    proTable.value.searchParam[flag] = []
    if (flag === 'ssdw') {
      value.forEach((item: any) => {
        proTable.value && proTable.value.searchParam[flag].push(item.objCode)
      })
    } else {
      proTable.value.searchParam[flag] = value
    }
  }
}

// 查询选择框数据
const selectData: any = reactive({
  projectType: [],
  unitData: []
})

const currentYear = ref(new Date().getFullYear().toString())

// 获取项目类型
const getProjectData = () => {
  loading.value = true
  const params = {
    parentId: '0',
    startDate: proTable.value ? proTable.value.searchParam.nd : currentYear.value
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      loading.value = false
      selectData.projectType = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// 获取单位
const getUnitData = async () => {
  loading.value = true
  const params = {
    parentCode: null,
    rootCode: 'childtree:DW_COM',
    objId: -1,
    level: 0
  }
  let res = await getUnit(params)
  if (res.success) {
    loading.value = false
    selectData.unitData = res.data
  } else {
    loading.value = false
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: 'children',
    label: 'text'
  },
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

const purchaseData = computed<PurchaseDatas>(() => {
  return {
    wzlb: proTable.value?.enumMap.get('wzlb') as PurchaseData[],
    fwlb: proTable.value?.enumMap.get('fwlb') as PurchaseData[]
  }
})

const clearDataHandle = () => {
  const $table = proTable.value
  if ($table) {
    if (Array.isArray($table.searchParam.xmlx)) {
      $table.searchParam.xmlx.length = 0
    } else {
      $table.searchParam.xmlx = ''
    }
  }
}

// 表格配置项
const columns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 80 },
  {
    prop: 'xmmc',
    label: '项目名称',
    search: {
      el: 'input',
      order: 2
    },
    width: 220
  },
  {
    prop: 'gwxmbm',
    label: '国网项目编码',
    width: 140,
    search: {
      el: 'input',
      order: 1
    }
  },
  {
    prop: 'xmlx',
    label: '项目类型',
    width: 140,
    search: {
      order: 3,
      render: () => {
        return (
          <TreeSelect
            onClearData={clearDataHandle}
            data={selectData.projectType}
            onSelectChange={(value: any) => selectedData(value, 'xmlx')}
            ref={proTypeRef}
            is-leaf={false}
            data-type="id"
            default-props={treeProps.projectTypeProps}
            node-key="id"
          ></TreeSelect>
        )
      }
    }
  },
  { prop: 'wzName', width: 140, label: '物资采购类别' },
  { prop: 'fwName', width: 140, label: '服务采购类别' },
  {
    prop: 'wzlb',
    label: '物资采购类别',
    search: {
      order: 6,
      el: 'select'
    },
    isShow: false,
    enum: () => getCglx('1'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'fwlb',
    label: '服务采购类别',
    search: {
      order: 7,
      el: 'select'
    },
    enum: () => getCglx('2'),
    isShow: false,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'xmbName', width: 240, label: '项目包名称' },
  {
    prop: 'nd',
    label: '年度',
    search: {
      order: 4,
      el: 'date-picker',
      props: {
        type: 'year',
        valueFormat: 'YYYY',
        clearable: false,
        onChange: getProjectData
      },
      defaultValue: currentYear.value
    }
  },
  {
    prop: 'ssdw',
    label: '所属单位',
    isShow: false,
    search: {
      order: 5,
      render: () => {
        return (
          <TreeSelect
            data-type="code"
            is-all={true}
            data={selectData.unitData}
            onSelectChange={(value: any) => selectedData(value, 'ssdw')}
            ref={unitRef}
            is-leaf={false}
            default-props={treeProps.defaultProps}
            node-key="objId"
          ></TreeSelect>
        )
      }
    }
  },
  { prop: 'yjdw', label: '一级单位', width: 140 },
  { prop: 'ejdw', label: '二级单位', width: 200 },
  { prop: 'gkbm', label: '归口部门', width: 200 },
  { prop: 'zys', label: '总预算(万元)', headerAlign: 'center', align: 'right', width: 140 },
  { prop: 'dnys', label: '当年预算(万元)', headerAlign: 'center', align: 'right', width: 140 },
  { prop: 'xmxz', label: '项目性质' },
  { prop: 'lxsj', label: '立项时间', width: 180 },
  { prop: 'yjfl', label: '一级分类', width: 300 },
  { prop: 'ejfl', label: '二级分类', width: 300 },
  { prop: 'sjfl', label: '三级分类', width: 300 },
  {
    prop: 'dcl',
    label: '待处理',
    search: {
      order: 8,
      el: 'select'
    },
    enum: getDcl,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  }
])
</script>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
