<!-- 项目需求审核流程处理（新） -->
<script setup lang="ts">
import { getAuditTaskIdByProId } from '@/api/ai/smartTaskAudit'
import { getPublicCodeList } from '@/api/common'
import { getDynamicTableByUser, getXmxqshListPage, checkWhenSubmitXm } from '@/api/service/requirement'
import { loadUserWfInfo } from '@/api/workflow'
import {
  saveOrUpdateTXmThxxb,
  finishActivity,
  finishZlActivity,
  getSearchData,
  rejectActivity,
  rejectZlActivity,
  uploadCswj,
  deleteCswj
} from '@/api/workflow/xm'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { checkSameProperty, formatValue } from '@/utils/utils'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import type { SmartTaskAuditRow } from '@/views/ai/smartTaskAudit/types'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import ProvinceModal from '@/views/workflow/xm/components/ProvinceModal.vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
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

type SearchCode = 'XQLR-VIEW' | 'ZLXQMXCX'

// 2026.02.06 增加下一步判断、修改项目信息、工作流判断 开始
const ISLDSHMODAL = ref('')
const ISCDSH = ref('')
const flag = ref('VIEW')
const isBhHandle = ref<boolean>(false)
// 2026.02.06 增加下一步判断、修改项目信息、工作流判断 结束

// 2026.02.27  修改提交领导审核为弹窗选择 开始
const isSubmitLeader = ref(false)
const submitTitle = ref('')
// 2026.02.27  修改提交领导审核为弹窗选择 结束

const provinceEditValue = ref<string[]>([])
const cityEditValue = ref<string[]>([])
const provinceModalRef = ref<InstanceType<typeof ProvinceModal>>()

const getPublicCode = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['ZLXM_MODIFY_GKBM_NODE', 'XQLR_EDITCSWJ_NODE']
    })
    if (res.success && res.data) {
      provinceEditValue.value = res.data['ZLXM_MODIFY_GKBM_NODE'].map((item: PublicCode) => item.code)
      cityEditValue.value = res.data['XQLR_EDITCSWJ_NODE'].map((item: PublicCode) => item.code)
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
    document.domain = 'sgcc.com.cn'
    const width = window.parent.innerWidth
    const height = window.parent.innerHeight
    window.parent.Appframe ? window.parent.Appframe.workflow.WorkList.setWidth(width, height) : ''
  })
}
onMounted(async () => {
  const res = await getPublicCode()
  if (res) {
    loadUserWfInfoMethod()
  }
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: []
})

const loading = ref(false)
const tableRef = ref()
const editPageRef = ref()
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

const page = {
  total: 0,
  limit: 100,
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

const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
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
    ['WF_NEWCBXQSHLC']: getDynamicTableByUser,
    ['WF_ZLXQSHLC']: getDynamicTableByUser
  }
  const actualFlag = func[flag] ? flag : 'WF_NEWCBXQSHLC'
  let res: any
  const searchCode: SearchCode = actualFlag === 'WF_NEWCBXQSHLC' ? 'XQLR-VIEW' : 'ZLXQMXCX'
  if (actualFlag === 'WF_NEWCBXQSHLC' || actualFlag === 'WF_ZLXQSHLC') {
    res = await func[actualFlag]({
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
    ['WF_NEWCBXQSHLC']: getXmxqshListPage,
    ['WF_ZLXQSHLC']: getSearchData
  }
  const actualFlag = func[flag] ? flag : 'WF_NEWCBXQSHLC'
  let parmas: Params = {
    id: wfDataString.value.XMIDS.split(','),
    xmIds: wfDataString.value.XMIDS,
    limit: page.limit,
    page: page.page
  }
  let res = await func[actualFlag]({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data.records
    ISLDSHMODAL.value = res.data.records[0]?.zt
    isBhHandle.value = ISLDSHMODAL.value == 'Q09'
    page.total = res.data.total
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

// 终止流程
const stopFlowHandle = async () => {
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
    wfCode: wfCodeString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH'
  }
  let res: any = await rejectActivity({ ...spfrom })

  if (res && res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('流程终止成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

// 提交
const submitHandle = async () => {
  if (nodeCode.value == 'SHSX_ZYBM_ZZ') {
    const submitListIds = tableInfo.tableData.map((item: any) => item.id)
    const isCheck: any = await checkWhenSubmitXm(submitListIds)
    if (!isCheck.success) return ElMessage.error(isCheck.msg)
    const isData = isCheck.data
    if (!isData.success) return ElMessage.error(isData.msg)
  }
  submitFlow()
}

const submitDecWorkflowHandle = async () => {
  /*判断是否提交下一步审核*/
  // 'Q20' 需求待基层财务专职审核
  // 'Q29' 需求待市级专业部门领导审核
  // 'Q40' 需求待市级财务专职审核
  if (['Q20', 'Q29', 'Q40'].includes(ISLDSHMODAL.value)) {
    const cwldshMsg = '提交至部门领导审批'
    const sgkshMsg = '提交至市业务归口审核人审批'
    submitTitle.value = ISLDSHMODAL.value == 'Q29' ? sgkshMsg : cwldshMsg
    isSubmitLeader.value = true
    // const comfirmModal = await VXETable.modal.confirm(modalMsg, '确认', {
    //   confirmButtonText: '是',
    //   cancelButtonText: '否',
    //   zIndex: 3000
    // })
    // if (comfirmModal === 'close') return
    // ISCDSH.value = comfirmModal === 'confirm' ? 'Y' : 'N'
    // if (comfirmModal) {
    //   submitFlow()
    // }
  } else {
    submitFlow()
  }
}
//
const detailLeader = () => {
  if (ISCDSH.value == '') return ElMessage.warning('请选择')
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
  const wFParam: WFParam = { ...wfDataString.value }
  if (ISLDSHMODAL.value == 'Q20') {
    wFParam.XCWLDSH = ISCDSH.value
  }
  if (ISLDSHMODAL.value == 'Q40') {
    wFParam.SCWLDSH = ISCDSH.value
  }
  if (ISLDSHMODAL.value == 'Q29') {
    wFParam.SGKSH = ISCDSH.value
  }

  if (ISLDSHMODAL.value == 'Q09') {
    const isAdd = tableInfo.tableData.some((item: any) => item.amount && item.thsbys && Number(item.amount) > Number(item.thsbys))
    wFParam.ISADD = isAdd ? '1' : '0'
  }
  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, wFParam, wfNodeParam, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  const params: WFParam = {}
  if (ISLDSHMODAL.value == 'Q20') {
    params.XCWLDSH = ISCDSH.value
  }
  if (ISLDSHMODAL.value == 'Q40') {
    params.SCWLDSH = ISCDSH.value
  }
  if (ISLDSHMODAL.value == 'Q29') {
    params.SGKSH = ISCDSH.value
  }
  if (ISLDSHMODAL.value == 'Q09') {
    const isAdd = tableInfo.tableData.some((item: any) => item.amount && item.thsbys && Number(item.amount) > Number(item.thsbys))
    console.log('isAdd', isAdd)
    params.ISADD = isAdd ? '1' : '0'
    params.PASS = 'Y'
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
    wfData: { ...wfDataString.value, ...params },
    nextPersonAndPath: nextPersonAndPath
  }

  let res: any
  if (wfCodeString.value === 'WF_ZLXQSHLC') {
    res = await finishZlActivity({
      ...spfrom
    })
  } else {
    res = await finishActivity({
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
    closeLeader()
  } else {
    loading.value = false
    closeLeader()
    ElMessage.error(res.msg)
  }
}
// 驳回
const rejectDecWorkflowHandle = async () => {
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
  loading.value = true

  // 驳回信息表
  let thList: any[] = tableInfo.tableData.map((element: any) => ({
    id: element.id,
    thyj: spyjForm.value.spyj,
    thsbys: element.amount
  }))

  let spfrom = {
    userId: store.getters.getUserMsg.id,
    dwId: wfDataString.value.DWID,
    yssxIds: wfDataString.value.XMIDS,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    wfNodeData: { IS_PASS: 'N' },
    wfCode: wfCodeString.value,
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_ZLXQSHLC') {
    res = await rejectZlActivity({
      ...spfrom
    })
  } else {
    await saveOrUpdateTXmThxxb({ list: thList })
    res = await finishActivity({
      ...spfrom,
      wfData: { ...wfDataString.value, PASS: 'N' }
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

const closeFlowHandle = () => {
  spyjDialog.value.showDialog = true
  spyjDialog.value.flag = '3'
}

const isShowDialogHandle = (flag: string) => {
  if (flag === '0' && wfCodeString.value === 'WF_ZLXQSHLC' && !checkSameProperty(tableInfo.tableData, 'sdkzybm_id')) {
    ElMessage.warning('省对口专业部门相同的记录才允许通过，请检查!')
    return
  }
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
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : spyjDialog.value.flag === '1' ? rejectDecWorkflowHandle() : stopFlowHandle()
}
const checkedData = ref<any[]>([])
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const searchDataHandle = () => {
  searchHandle()
}

// 修改
const editHandle = () => {
  flag.value = 'EDIT'
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行修改!')
      return
    }

    editPageRef.value.isShowModal = true
  }
}

// 查看详情
const viewHandle = () => {
  flag.value = 'VIEW'
  const $grid = tableRef.value
  if ($grid) {
    if (checkedData.value && checkedData.value.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }

    editPageRef.value.isShowModal = true
  }
}

/** 财务专职节点展示 AI 审核详情「查看」按钮 */
const AI_VIEW_NODE_CODES = ['SG_CWB_ZZ', 'XG_CWB_ZZ']
const isShowAiViewButton = computed(() => AI_VIEW_NODE_CODES.includes(nodeCode.value))

const detailModal = reactive({
  visible: false,
  loading: false
})
const detailRow = shallowRef<SmartTaskAuditRow>({})

const normalizeTaskId = (data: any) => {
  if (data && typeof data === 'object') return String(data.taskId ?? '').trim()
  return String(data ?? '').trim()
}

/** 校验当前行是否可查看 AI 审核详情 */
const checkAiViewStatus = (row: any): { pass: boolean; msg?: string } => {
  const sfaishxm = String(row?.sfaishxm ?? '')
  const docPreStatus = String(row?.doc_pre_status ?? '')
  const auditStatus = String(row?.audit_status ?? '')

  if (sfaishxm !== '1') {
    return { pass: false, msg: '当前项目未开启AI审核，无法查看AI审核意见!' }
  }

  if (auditStatus !== '3' && auditStatus !== '4') {
    if (docPreStatus === '1') {
      return { pass: false, msg: '文档处于等待处理中，请稍后查看!' }
    }
    if (docPreStatus === '2') {
      return { pass: false, msg: '文档正在处理中，请稍后查看!' }
    }
  }

  return { pass: true }
}

/** 打开 AI 智能审核详情弹窗 */
const openAiDetailModal = async () => {
  if (checkedData.value && checkedData.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行查看!')
    return
  }
  const row = checkedData.value[0] || {}
  const statusCheck = checkAiViewStatus(row)
  if (!statusCheck.pass) {
    if (statusCheck.msg) {
      ElMessage.warning(statusCheck.msg)
    }
    return
  }
  const proId = String(row.id ?? row.xmid ?? row.proId ?? '').trim()
  if (!proId) {
    ElMessage.warning('未获取到项目ID')
    return
  }
  try {
    loading.value = true
    const taskRes = await getAuditTaskIdByProId(proId)
    if (!taskRes.success) {
      ElMessage.error(taskRes.msg || 'AI审核任务获取失败')
      return
    }
    const taskId = normalizeTaskId(taskRes.data)
    if (!taskId) {
      ElMessage.info('暂无AI审核意见')
      return
    }
    detailRow.value = {
      ...row,
      proId,
      proType: String(row.xmlx ?? row.proType ?? row.pro_type_id ?? row.proTypeId ?? '').trim(),
      taskId
    }
    detailModal.visible = true
  } catch (e) {
    ElMessage.error((e as Error).message || '打开详情失败')
  } finally {
    loading.value = false
  }
}

const closeAiDetailModal = () => {
  detailModal.visible = false
}

const isShowProvinceEdit = computed(() => wfCodeString.value === 'WF_ZLXQSHLC' && provinceEditValue.value.includes(nodeCode.value))

const isShowUploadEdit = computed(() => wfCodeString.value === 'WF_NEWCBXQSHLC' && provinceEditValue.value.includes(nodeCode.value))

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
      <div class="left" v-if="!isBhHandle">
        <!-- 判断省归口部门按钮的隐藏和显示 -->
        <el-button v-if="isShowProvinceEdit" :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="provinceEdit"
          >省对口专业部门修改</el-button
        >
        <el-button v-if="isShowUploadEdit" :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="uploadFiles" :loading="loading"
          >批量上传初审文件</el-button
        >
        <el-button v-if="isShowUploadEdit" :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="deleteFiles" :loading="loading"
          >删除上传初审文件</el-button
        >
        <el-button
          v-if="isShowAiViewButton"
          :disabled="hasSelectedProjects"
          type="primary"
          size="mini"
          plain
          @click="openAiDetailModal"
          :loading="loading"
          >AI审核意见查看</el-button
        >
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle" :loading="loading">查看详情</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button :loading="loading" type="primary" size="mini" v-if="wfCodeString != 'WF_XQYWSH'" plain @click="isShowDialogHandle('1')"
          >驳 回</el-button
        >
        <el-button :loading="loading" type="primary" size="mini" v-if="wfCodeString == 'WF_XQYWSH'" plain @click="closeFlowHandle"
          >终止流程</el-button
        >
        <el-button :loading="loading" type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
      <div class="left" v-else>
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="editHandle">修 改</el-button>
        <el-button type="primary" size="mini" plain @click="submitHandle">提 交</el-button>
        <el-button
          v-if="isShowAiViewButton"
          :disabled="hasSelectedProjects"
          type="primary"
          size="mini"
          plain
          @click="openAiDetailModal"
          :loading="loading"
          >AI审核意见查看</el-button
        >
        <el-button :disabled="hasSelectedProjects" type="primary" size="mini" plain @click="viewHandle" :loading="loading">查看详情</el-button>
        <el-button :loading="loading" type="primary" size="mini" plain @click="closeFlowHandle">终止流程</el-button>
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
        <vxe-column type="checkbox" width="80" />
        <vxe-column
          v-for="item in tableInfo.columns"
          :key="item.code"
          :formatter="formatterData"
          header-align="center"
          align="center"
          width="200"
          :fixed="['sfaishxm_name', 'doc_pre_status_name', 'audit_status_name'].includes(item.columnKey) ? 'right' : ''"
          :field="item.columnKey"
          :title="item.columnValue"
        />
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        disabled
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
      <el-form-item label="是否需要提交审批：">
        <el-select style="width: 200px" v-model="ISCDSH" clearable placeholder="请选择">
          <el-option label="需要" value="Y"></el-option>
          <el-option label="不需要" value="N"></el-option>
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
    @saveAfter="searchDataHandle"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="checkedData[0]"
    :flag="flag"
  ></CentralizedModification>
  <DetailModal :modal="detailModal" :detail-row="detailRow" @close="closeAiDetailModal" />
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
