<!-- 省专业上报组件 -->
<template>
  <div>
    <vxe-modal
      ref="dialogFormRef"
      v-model="isShowModel"
      :destroy-on-close="true"
      resize
      show-zoom
      fullscreen
      :title="formData?.title"
      :width="1200"
      :close-on-press-escape="true"
      @close="closeHandle"
      :loading="tableInfo.loading"
    >
      <div class="content">
        <div class="toolButtoon">
          <div class="left">
            <el-button
              v-if="isShow"
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="hanldeNckUp"
            >
             省级统筹拟出库申报
            </el-button>
            <el-button
              v-if="isShow"
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="hanldeNck('edit', '拟出库项目维护')"
            >
              拟出库项目维护
            </el-button>
            <el-button
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="hanldeNck('view', '拟出库项目明细查看')"
            >
              拟出库项目明细查看
            </el-button>
            <el-button
              v-if="isShow"
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="unitDescImportHandle"
            >
              导 入
            </el-button>
            <el-button
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="exportHandle"
            >
              导 出
            </el-button>
            <el-button
              v-if="isShow"
              :disabled="tableInfo.tableData.length == 0"
              size="mini"
              type="primary"
              plain
              @click="flowTj"
            >
              提交至财务
            </el-button>
          </div>
          <div class="right">
            <div class="info">
              <span class="highlight">
                版本编号: <span>{{ formData?.versionNo }}</span>
              </span>
              <span class="highlight">
                版本名称: <span>{{ formData?.versionName }}</span>
              </span>
              <span class="highlight">
                年度:<span>{{ formData?.nd }}</span>
              </span>
            </div>
          </div>
        </div>
        <div class="formClass">
          <span>拟出库金额核定(万元)：</span>
          <input
            v-limit-input
            class="my-input"
            disabled
            v-model.trim="allAmount"
            placeholder="请输入拟出库金额核定(万元)"
            style="width: 200px"
          />
        </div>
        <div class="table">
          <vxe-table
            @cell-click="handleCellClick"
            :cell-style="tableInfo.cellStyle"
            :loading="tableInfo.loading"
            :row-config="{ keyField: 'id', height: 32 }"
            :column-config="{ resizable: true }"
            :border="true"
            align="center"
            show-overflow
            keep-source
            headerAlign="center"
            :treeConfig="tableInfo.treeConfig"
            :data="tableInfo.tableData"
            height="100%"
            ref="tableRef"
          >
            <template v-for="item in tableInfo.columns" :key="item.id">
              <vxe-column
                v-if="['四级分类', '预算控制类别'].includes(item.title)"
                border
                :title="item.title"
                :field="item.field"
                :width="item.width"
              />
              <vxe-column
                v-else
                :formatter="formatterData"
                border
                :title="item.title"
                :field="item.field"
                align="right"
                :width="item.width"
              />
            </template>
          </vxe-table>
        </div>
      </div>
    </vxe-modal>
  </div>
  <ImportExcel ref="importRef" />
  <ReViewModal ref="reviewRef" @get-close="getClose" :title="modalTitle" :isView="isView" :form-data="paramsData" />
</template>
<script lang="ts">
export default {
  name: '/lslxJsc/components/zyReporting'
}
</script>

<script setup lang="ts">
import { reactive, ref, defineProps, defineExpose, defineEmits } from 'vue'
import {
  getTableDataForZgkbmYs,
  getDynamicColumnForZgkbmYs,
  getZgkbmNckXmImportTemplate,
  importZgkbmNckXm,
  submitWf
} from '@/api/lslxJsc/szyBmApi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Decimal } from 'decimal.js'
import { formatValue } from '@/utils/utils'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { vxeExportHandle } from '@/utils/export'
import ReViewModal from '@/views/service/lslxJsc/ysysszytb/components/ReViewModal/index.vue'

const router = useRouter()
const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
  FQBM: ''
})
const store = useStore()
const emits = defineEmits(['pushPage'])
const reviewRef = ref()

//接收父组件传参
const props = defineProps({
  formData: {
    type: Object,
    require: true
  },
  isShow: {
    type: Boolean,
    default: false
  }
})
const tableRef = ref()
const dialogFormRef = ref()
const importRef = ref<any>()
const userInfo = ref()
const isView = ref<boolean>(false)
const modalTitle = ref<string>('拟出库项目维护')
const paramsData = ref<any>({})
const allAmount = ref<any>('')
const count = ref(0)
const isShowModel = ref(false)
const closeHandle = () => {
  emits('pushPage', true)
}

const tableInfo = reactive<any>({
  border: true,
  tableData: [],
  loading: false,
  columns: [],
  treeConfig: {
    rowField: 'id',
    parentField: 'parentId',
    childrenField: 'children',
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      count.value++
      tableInfo.loading = true
      let params = {
        nd: props.formData?.nd,
        versionId: props.formData?.versionId,
        zgkbmId: props.formData?.zgkbmId
      }
      return new Promise((resolve: any) => {
        let Api = getTableDataForZgkbmYs
        Api(params).then((res: any) => {
          if (res.success) {
            count.value--
            resolve(res.data)
          } else {
            count.value = 0
            ElMessage.error(res.msg)
            resolve([])
          }
          if (!count.value) tableInfo.loading = false
        })
      })
    }
  },
  cellStyle: ({ row, column }: any) => {
    if (column.title == '拟出库金额合计(万元)') {
      return {
        cursor: 'pointer',
        color: 'var(--color-primary, #00857c)',
        textDecoration: 'underline'
      }
    }
  }
})

// 查看
const handleCellClick = ({ row, column }: any) => {
  if (column.title == '拟出库金额合计(万元)') {
    paramsData.value = {
      nd: props.formData?.nd,
      versionId: props.formData?.versionId,
      zgkbmId: props.formData?.zgkbmId,
      proType: row.id
    }
    isView.value = false
    modalTitle.value = '拟出库项目明细查看'
    reviewRef.value.acceptParams()
  }
}

const getExportData = (newArr: any[], data: any[], cj: number) => {
  const $table = tableRef.value
  data.forEach((item) => {
    let flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item.name,
      cj: cj,
      leaf: item.leaf
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1)
    }
  })
  return newArr
}
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (column.title.includes('%')) return formatValue(cellValue.toString(), 6)
  return formatValue(cellValue.toString(), 6)
}


// 自定义导出
const exportHandle = () => {
  const $table = tableRef.value
  vxeExportHandle($table, '省级统筹项目拟出库数据表', tableInfo.tableData)
}
// 导入  批量维护
const unitDescImportHandle = async () => {
  let newParmas = {
    nd: props.formData?.nd,
    versionId: props.formData?.versionId,
    zgkbmId: props.formData?.zgkbmId
  }
  importRef.value.fromData = newParmas
  let tempApi: any = getZgkbmNckXmImportTemplate
  let importApi: any = importZgkbmNckXm
  if (!importApi) return
  let params = {
    title: '一上预算编制',
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
    getTableList: newData,
    specialorgid: props.formData?.specialorgid
  }
  importRef.value.acceptParams(params)
}
const hanldeNckUp = () => {
  router.push({
      name: '/service/lslxJsc/sjtcxmncksbys',
    })
}
// 维护/查看
const hanldeNck = (type: any, val: any) => {
  paramsData.value = {
    nd: props.formData?.nd,
    versionId: props.formData?.versionId,
    zgkbmId: props.formData?.zgkbmId
  }
  isView.value = type == 'edit'
  modalTitle.value = val
  reviewRef.value.acceptParams()
}
const getClose = (val: any) =>{
  if(val && isView.value){
    newData()
  }
}
// 初始化表格数据
const newData = async () => {
  await getDataList()
}

const getDataList = async () => {
  tableInfo.loading = true
  const api: any = getTableDataForZgkbmYs
  tableInfo.tableData.length = 0
  let params = {
    nd: props.formData?.nd,
    specialorgid: props.formData?.specialorgid,
    versionId: props.formData?.versionId,
    zgkbmId: props.formData?.zgkbmId
  }
  let res = await api(params)
  if (res.success) {
    tableInfo.tableData = res.data
    tableInfo.loading = false
    allAmount.value = 0
    let gmSum = tableInfo.tableData.reduce(
      (gmSum: number, item: any) => gmSum + Number(item['hj_nckje']),
      0
    )
    allAmount.value = Number(gmSum).toFixed(6)
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}
//获取表头
const getHeaderData = async (params: any) => {
  const api: any = getDynamicColumnForZgkbmYs
  let res = await api(params)
  if (res.success) {
    tableInfo.columns = res.data.filter((item: any) => item.visible)
    tableInfo.loading = false
    newData()
    return true
  } else {
    ElMessage.error(res.msg)
    return false
  }
}
// 提交审核
const flowTj = () => {
  ElMessageBox.confirm('提交前请确认填写数据已保存。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      submitCbxqshWorkflowHandle()
    })
    .catch((error: any) => {
      console.log(error)
    })
}

// 提交工作流
const submitCbxqshWorkflowHandle = () => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || ''
  }
  wfParam.value.VERSION_ID = props.formData?.versionId
  wfParam.value.ZGKBM_ID = props.formData?.zgkbmId
  submitWorkflow(
    store.getters.getUserMsg.systemCode,
    'ZGKBM_YSSHLC',
    '',
    wfUserInfo,
    wfParam.value,
    {},
    submitWFCallback
  )
}

const submitWFCallback = async () => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || '',
    wfCode: 'ZGKBM_YSSHLC',
    wfData: wfParam.value,
  }
  const res = await submitWf({
    ...spfrom
  })
  if (res.success) {
    tableInfo.loading = false
    ElMessage.success('提交成功')
    closeHandle()
  } else {
    tableInfo.loading = false
    let msg = res.msg.split('|').join('<br/>')
    ElMessage.error({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

defineExpose({
  isShowModel,
  getHeaderData,
  closeHandle,
  userInfo
})
</script>

<style scoped lang="less">
.content {
  width: 100%;
  height: calc(100vh - 110px);
  padding: 10px;
}

.header-group-cell {
  background-color: #212529 !important;
  text-align: center !important;
  font-weight: bold !important;
}

.vxe-table--render-default .vxe-header--column {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
}

.vxe-table--render-default .vxe-header--column .vex-cell {
  white-space: normal !important;
  line-height: 1.5 !important;
}

.toolButtoon {
  height: 30px;
  align-items: center;
  display: flex;
  margin-bottom: 10px;

  .left {
    display: flex;
    justify-content: space-between;
    max-width: 700px;
  }

  .right {
    flex: 1;
    text-align: right;
    font-weight: bold;
    color: #212529;

    span {
      display: inline-block;
      font-size: 14px;
      color: #555;
      padding: 5px;
      background-color: #e9ecef;
      border-radius: 5px;
      min-height: 0;
      min-width: 0;
      margin-right: 5px;
    }
  }
}

.formClass{
  margin-bottom: 10px;
  font-size:14px;
  font-weight: bold;
}

.table {
  margin: 0 auto;
  height: calc(100% - 40px);
}
</style>
