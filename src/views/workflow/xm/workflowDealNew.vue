<script setup lang="ts">
import { getPublicCodeList, getDataByParent } from '@/api/common'
import { getDynamicTableByUser, getXmxqshListPage } from '@/api/service/requirement'
import { loadUserWfInfo } from '@/api/workflow'
import {
  finishActivity,
  finishZlActivity,
  finishZlActivityNew,
  getSearchData,
  getSearchDataNew,
  rejectActivity,
  rejectZlActivityNew,
  rejectZlActivity,
  uploadCswj,
  deleteCswj
} from '@/api/workflow/xm'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { checkSameProperty, formatValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModificationNew.vue'
import ProvinceModal from '@/views/workflow/xm/components/ProvinceModal.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import VXETable from 'vxe-table'

interface Columns {
  columnKey: string
  columnValue: string
  eidt: boolean
  hidden: boolean
  fixed: boolean
  needSum: string
  visible: boolean
}

interface Params {
  [key: string]: any
}

interface PublicCode {
  code: string
  name: string
}

type SearchCode = 'XQLR-VIEW' | 'ZLXQSPMXCX'

const ISLDSHMODAL = ref('')
const ISCDSH = ref('')
const HQBM = ref('')
const hqbmData = ref<string[]>([])

// 2026.07.06  修改提交领导审核为弹窗选择 开始
const isSubmitLeader = ref(false)
const submitTitle = ref('')
// 2026.07.06  修改提交领导审核为弹窗选择 结束

const provinceEditValue = ref<string[]>([])
const cityEditValue = ref<string[]>([])
const provinceModalRef = ref<InstanceType<typeof ProvinceModal>>()
const lubmCodeData = ref<string[]>([])

const getHqbmData = async () => {
  try {
    const dataList = []
    const res = await getDataByParent('QMYS_ZZJG')
    if (res.success && res.data) {
      res.data.forEach((item) => {
        dataList.push({
          value: item.code,
          label: item.name
        })
      })
      hqbmData.value = dataList
      return true
    } else {
      throw new Error(res.msg)
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
    return false
  }
}

const getPublicCode = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['ZLXM_MODIFY_GKBM_NODE', 'XQLR_EDITCSWJ_NODE', 'ZRZCLB_COM']
    })
    if (res.success && res.data) {
      console.log('===========', res.data)
      provinceEditValue.value = res.data['ZLXM_MODIFY_GKBM_NODE'].map((item: PublicCode) => item.code)
      cityEditValue.value = res.data['XQLR_EDITCSWJ_NODE'].map((item: PublicCode) => item.code)
      lubmCodeData.value = res.data['ZRZCLB_COM'].map((item: PublicCode) => item.name)
      return true
    } else {
      throw new Error(res.msg)
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
    return false
  }
}

const loadUserWfInfoMethod = () => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      nodeCode.value = data.nodeCode
      orgFlag.value = data.orgFlag
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// watch(
//   () => editPageRef.value.isShowModal,
//   (val) => {
//     if (!val) {
//       customParam.value = {}
//     }
//   },
//   {deep: true, immediate: true}
// );

onMounted(async () => {
  await getHqbmData()
  const res = await getPublicCode()
  if (res) {
    loadUserWfInfoMethod()
  }

  watch(
    () => editPageRef.value.isShowModal,
    (val) => {
      if (!val) {
        customParam.value = {}
      }
    },
    { deep: true, immediate: true }
  )
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: []
})

const loading = ref(false)
const tableRef = ref()
const editPageRef = ref<any>({})
const spyjDialog = ref({
  flag: '',
  showDialog: false
})
const spyjForm = ref({
  spyj: ''
})
const store = useStore()
const specialOrgId = ref<string>('')
const spRoleId = ref<string>('')
const workItemIdString = ref<string>('')
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')
const nodeCode = ref<string>('')
const orgFlag = ref<string>('')
const customParam = ref<any>({})

const page = {
  total: 0,
  limit: 20,
  page: 1
}

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref({
  XMIDS: '',
  KMLX: '',
  ND: '',
  DWID: '',
  DWNAME: '',
  BUSITYPE: '',
  PAGETYPE: '',
  SM: '',
  ISZS: '',
  SPECIALORGID: ''
})

const getQueryString = (name: string) => {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  let queryString = window.location.search
  if (queryString == '' && window.location.href.lastIndexOf('?') != -1) {
    queryString = window.location.href.substring(window.location.href.lastIndexOf('?'))
  }
  const r = queryString.substr(1).match(reg)
  if (r !== null) {
    return unescape(r[2])
  }
  return ''
}

// 查询
const searchHandle = async () => {
  await getTableHeader(wfCodeString.value)
  await getDataList(wfCodeString.value)
}

const getTableHeader = async (flag: string) => {
  loading.value = true
  let params: Params = {
    nd: wfDataString.value.ND,
    kmlx: wfDataString.value.KMLX,
    busiType: wfDataString.value.BUSITYPE,
    dwId: wfDataString.value.DWID
  }

  let func: any = {
    ['WF_CBXQSHLC']: getDynamicTableByUser,
    ['WF_ZLXQSHLC']: getDynamicTableByUser
  }
  let res: any
  const searchCode: SearchCode = flag === 'WF_CBXQSHLC' ? 'XQLR-VIEW' : 'ZLXQSPMXCX'
  if (flag === 'WF_CBXQSHLC' || flag === 'WF_ZLXQSHLC') {
    res = await func[flag]({
      searchCode: searchCode,
      searchType: '2',
      ...params
    })
  }
  if (lubmCodeData.value.includes(flag)) {
    res = await getDynamicTableByUser({
      searchCode: searchCode,
      searchType: '2',
      ...params
    })
  }
  if (res.success) {
    loading.value = false
    tableInfo.columns = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getDataList = async (flag: string) => {
  loading.value = true
  let func: any = {
    ['WF_CBXQSHLC']: getXmxqshListPage,
    ['WF_ZLXQSHLC']: getSearchData
  }
  let parmas: Params = {
    id: wfDataString.value.XMIDS.split(','),
    xmIds: wfDataString.value.XMIDS,
    limit: page.limit,
    page: page.page
  }
  let res: any
  if (flag === 'WF_CBXQSHLC' || flag === 'WF_ZLXQSHLC') {
    res = await func[flag]({ ...parmas })
  }
  if (lubmCodeData.value.includes(flag)) {
    res = await getSearchDataNew({ ...parmas })
  }
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitDecWorkflowHandle = () => {
  /*判断是否提交下一步审核*/
  // 'Q20' 需求待基层财务专职审核
  // 'Q29' 需求待市级专业部门领导审核
  // 'Q40' 需求待市级财务专职审核
  if (['WF_ZLXQSHLC_BGYF'].includes(wfCodeString.value) && ['ZY_PROVINCE_YW', 'ZY_PROVINCE_GK'].includes(nodeCode.value)) {
    const cwldshMsg = '提交至省对口会签'
    const sgkshMsg = '提交至省归口会签'
    submitTitle.value = nodeCode.value == 'ZY_PROVINCE_YW' ? cwldshMsg : sgkshMsg
    isSubmitLeader.value = true
  } else {
    submitFlow()
  }
}

// 是否需要提交审批-弹框-确定按钮
const detailLeader = () => {
  if (ISCDSH.value == '') return ElMessage.warning('请选择是否需要会签！')
  if (ISCDSH.value == 'Y' && HQBM.value == '') return ElMessage.warning('请选择会签部门！')
  submitFlow()
}

// 是否领导审核弹窗关闭
const closeLeader = () => {
  ISCDSH.value = ''
  submitTitle.value = ''
  isSubmitLeader.value = false
}

const submitFlow = () => {
  loading.value = true
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  specialOrgId.value = userInfo.value.spOrgId
  spRoleId.value = userInfo.value.spRoleId
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, {}, wfNodeParam, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  const params: WFParam = {}
  if (nodeCode.value == 'ZY_PROVINCE_YW') {
    params.SDK_HQ = ISCDSH.value
    params.SDK_HQ_BM = HQBM.value
  }
  if (nodeCode.value == 'ZY_PROVINCE_GK') {
    params.SGK_HQ = ISCDSH.value
    params.SGK_HQ_BM = HQBM.value
  }
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value,
    spyj: spyjForm.value.spyj,
    spjg: wfNodeParam.IS_PASS,
    wfCode: wfCodeString.value,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    // wfNodeData: wfNodeParam,
    wfData: { ...wfDataString.value, ...params },
    nextPersonAndPath: nextPersonAndPath
  }
  let res: any
  if (wfCodeString.value === 'WF_CBXQSHLC') {
    res = await finishActivity({
      ...spfrom
    })
  } else if (['WF_ZLXQSHLC'].includes(wfCodeString.value)) {
    res = await finishZlActivity({
      ...spfrom
    })
  } else if (lubmCodeData.value.includes(wfCodeString.value)) {
    res = await finishZlActivityNew({
      ...spfrom
    })
  }
  if (res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('提交成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}
const rejectDecWorkflowHandle = async () => {
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    dwId: wfDataString.value.DWID,
    yssxIds: wfDataString.value.XMIDS,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_CBXQSHLC') {
    res = await rejectActivity({
      ...spfrom
    })
  } else if (['WF_ZLXQSHLC'].includes(wfCodeString.value)) {
    res = await rejectZlActivity({
      ...spfrom
    })
  } else if (lubmCodeData.value.includes(wfCodeString.value)) {
    res = await rejectZlActivityNew({
      ...spfrom
    })
  }
  if (res && res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('驳回成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const isNeedNum = (columns: Columns[], field: string) => {
  let findIndex = columns.findIndex((item: Columns) => item.needSum && item.columnKey === field)
  return findIndex > -1
}

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableInfo.columns) {
    const isNum = isNeedNum(tableInfo.columns, column.field)
    if (isNum) {
      return formatValue(cellValue)
    }
  }
  return cellValue
}

const closeHandle = () => {
  spyjForm.value.spyj = ''
  spyjDialog.value.showDialog = false
  loading.value = false
}

const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

const isShowDialogHandle = (flag: string) => {
  if (flag === '0' && ['WF_ZLXQSHLC'].includes(wfCodeString.value) && !checkSameProperty(tableInfo.tableData, 'sdkzybm_id')) {
    ElMessage.warning('省对口专业部门相同的记录才允许通过，请检查!')
    return
  }
  // if (flag === '0' && lubmCodeData.value.includes(wfCodeString.value) && !checkSameProperty(tableInfo.tableData, 'sdkzybm_id')) {
  //   ElMessage.warning('省对口专业部门相同的记录才允许通过，请检查!')
  //   return
  // }
  if (flag === '0' && isShowUploadEdit.value) {
    // 校验是否上传文件
    // const isUpload =
    const $grid = tableRef.value
    if ($grid) {
      const { tableData } = $grid.getTableData()
      const isUpload = tableData.some((row: any) => row.hasCswj === '0')
      if (isUpload) {
        ElMessage.warning('所有记录必须上传初审文件才允许通过提交，请检查!')
        return
      }
    }
  }
  spyjDialog.value.showDialog = true
  spyjDialog.value.flag = flag
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}
const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row }: any) => {
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const viewHandle = () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }
    customParam.value.bmId = checkedData.value[0].create_dep_id || ''
    customParam.value.dwId = checkedData.value[0].dw_id || ''
    editPageRef.value.isShowModal = true
  }
}

const isShowProvinceEdit = computed(() => ['WF_ZLXQSHLC'].includes(wfCodeString.value) && provinceEditValue.value.includes(nodeCode.value))

const isShowUploadEdit = computed(() => wfCodeString.value === 'WF_CBXQSHLC' && provinceEditValue.value.includes(nodeCode.value))

const provinceEdit = () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    // 选择归口部门
    let params = {
      xmIds: checkedData.value.map((item: any) => item.id),
      workItemId: workItemIdString.value
    }
    if (provinceModalRef.value) {
      provinceModalRef.value.acceptParams(params)
    }
  }
}

const uploadFiles = async () => {
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length === 0) {
      ElMessage.warning('请至少选择一条数据进行上传操作!')
      return
    }
    const types = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf', 'zip', 'tar']
    const { file } = await $grid.readFile({ types: types })
    try {
      const ns = file.name.split('.')
      const type = ns[ns.length - 1].toLowerCase()
      if (!types.includes(type)) throw new Error('文件只支持' + types.join(',') + '格式！')
      if (file.size / 1024 / 1024 > 50) throw new Error('上传文件大小不能超过 200MB!')
      const comfirmModal = await VXETable.modal.confirm('确认是否上传?', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (comfirmModal === 'confirm') {
        loading.value = true
        const xmIds = checkedData.value.map((item: any) => item.id).join(',')
        const fileName = file.name
        const data = new FormData()
        data.append('file', file)
        const res = await uploadCswj({
          fileName: fileName,
          xmIds: xmIds,
          file: data
        })
        if (res.success) {
          ElMessage.success('上传初审文件成功!')
          refershData()
        }
      }
    } catch (error: any) {
      ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }
}

const deleteFiles = async () => {
  if (checkedData.value && checkedData.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除操作!')
    return
  }
  try {
    const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      const xmIds = checkedData.value.map((item: any) => item.id)
      const res = await deleteCswj(xmIds)
      if (res.success) {
        ElMessage.success('删除成功!')
        refershData()
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

const refershData = () => {
  // 清空选择框
  checkedData.value = []
  loadUserWfInfoMethod()
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <!-- 判断省归口部门按钮的隐藏和显示 -->
        <!-- <el-button
          v-if="isShowProvinceEdit"
          :disabled="hasSelectedProjects"
          type="primary"
          size="mini"
          plain
          @click="provinceEdit"
        >省对口专业部门修改</el-button> -->
        <el-button v-if="isShowUploadEdit" :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="uploadFiles" :loading="loading"
          >批量上传初审文件</el-button
        >
        <el-button v-if="isShowUploadEdit" :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="deleteFiles" :loading="loading"
          >删除上传初审文件</el-button
        >
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle" :loading="loading">查看详情</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
    </div>
    <div class="table">
      <vxe-table
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
        @checkbox-change="checkChangeHandle"
        @checkbox-all="checkChangeAllHandle"
        :row-config="{ height: 32 }"
        show-overflow
        :loading="loading"
        align="center"
        height="100%"
        ref="tableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableInfo.tableData"
      >
        <vxe-column type="checkbox" width="80"></vxe-column>
        <vxe-column
          v-for="item in tableInfo.columns"
          :key="item.code"
          :formatter="formatterData"
          header-align="center"
          align="center"
          width="200"
          :field="item.columnKey"
          :title="item.columnValue"
        >
        </vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <el-dialog
    @close="closeHandle"
    v-loading="loading"
    v-model="spyjDialog.showDialog"
    title="审批意见"
    :destroy-on-close="true"
    :show-close="true"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form :disabled="loading" :model="spyjForm">
      <el-form-item label="审批意见：">
        <el-input maxlength="128" v-model="spyjForm.spyj" type="textarea" :rows="6" resize="none" />
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button :loading="loading" @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
      <el-button :loading="loading" @click="closeHandle" type="primary" plain size="mini">关 闭</el-button>
    </div>
  </el-dialog>
  <el-dialog
    @close="closeLeader"
    v-model="isSubmitLeader"
    :title="submitTitle"
    :destroy-on-close="true"
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    width="22%"
  >
    <el-form>
      <el-form-item label="是否需要会签：" label-width="140px">
        <el-select style="width: 200px" v-model="ISCDSH" clearable placeholder="请选择">
          <el-option label="需要" value="Y"></el-option>
          <el-option label="不需要" value="N"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="会签部门：" label-width="140px">
        <el-select style="width: 200px" v-model="HQBM" clearable placeholder="请选择">
          <el-option v-for="item in hqbmData" :key="item.value" :label="item.label" :value="item.value"> </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div style="text-align: center">
      <el-button :loading="loading" @click="detailLeader" type="primary" plain size="mini">确 定</el-button>
      <el-button :loading="loading" @click="closeLeader" type="primary" plain size="mini">关 闭</el-button>
    </div>
  </el-dialog>
  <ProvinceModal @detail="refershData" ref="provinceModalRef" />
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="checkedData[0]"
    :customParam="customParam"
    flag="VIEW"
  ></CentralizedModification>
</template>

<style scoped lang="less">
.table-container {
  box-sizing: border-box;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .pager {
    background-color: #fff;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    background-color: #fff;

    .left,
    .right {
      width: 50%;
    }

    .right {
      text-align: right;
    }
  }
}
</style>
