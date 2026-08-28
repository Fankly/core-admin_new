<template>
  <div class="table-box" v-if="isShowPage" v-loading="loading">
    <proTable
      @row-click="handerClickTable"
      @search="searchHandle"
      @reset="resetHandle"
      :data-callback="callBackHandle"
      :init-param="initParam"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'ADD'" size="mini" type="primary" plain @click="addMsgHandle"
          >新 增</el-button
        >
        <el-button
          v-permission="'EDIT'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="editMsgHandle(scope.selectedList)"
          >编 辑
        </el-button>
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="viewMsgHandle(scope.selectedList)"
          >查 看
        </el-button>
        <el-button
          v-permission="'DELETE'"
          size="mini"
          :disabled="!scope.isSelected"
          type="danger"
          plain
          @click="delMsgHandle(scope.selectedList)"
          >删 除
        </el-button>
        <el-button
          v-permission="'SUBMIT'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="submitWorkflowHandle(scope.selectedList)"
          >提 交
        </el-button>
        <el-button
          v-permission="'PROCESS'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="useProcess(scope.selectedList, processData)"
          >流程履历</el-button
        >
        <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="importMsgHandle"
          >导 入</el-button
        >
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportMsgHandle"
          >导 出</el-button
        >
      </template>
    </proTable>
    <component
      @closeDialog="closeDialogMsg"
      :isShowDialog="processData.isShowDialog"
      :id="processData.id"
      :is="processData.compName"
    ></component>
    <formMatterDecl
      v-if="diaLogData.isShowPage"
      @updateTable="searchTableHandle"
      :baseMsgData="baseMsgData"
      @closeDialog="closeDialogHandle"
      :diaLogData="diaLogData"
    ></formMatterDecl>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="tsx">
export default {
  name: '/matter/matterDecl'
}
</script>

<script setup lang="tsx">
import userDialog from '@/components/select/userDialog.vue'
import proTable from '@/components/ProTable/index.vue'
import formMatterDecl from '@/views/matter/components/formMatterDecl.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { onMounted, reactive, ref, nextTick } from 'vue'
import { BaseMsgData, DialogData, InitParams, List } from './types/matterDecl'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEjdwList, getYjdwList } from '@/api/matter'
import {
  exportMsg,
  getGkbmByEjdw,
  getPage,
  getYslxct,
  delMsg,
  submit,
  submitDec,
  getImportTemplate,
  importData
} from '@/api/matter/yssxMatter'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { submitWorkflow, WFUserInfo, WFParam, WFData } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { useProcess } from '@/hooks/useProcess'
import baseService from '@/service/baseService'
import ImportExcel from '@/components/ImportExcel/indexSy.vue' //导入组件

const userDialogRef = ref()
const proTableRef = ref()
const proTypeRef = ref()
const importRef = ref()
const store = useStore()

const isShowPage = ref<boolean>(false)
const specialOrgId = ref<string>('')
const spRoleId = ref<string>('')
const roleCode = ref<string>('')

const loading = ref<boolean>(false)
const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})

let idsList = ref<any>()

// 查询选择框数据
const selectData: any = reactive({
  projectType: []
})

// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: 'children',
    label: 'text',
    id: 'id'
  },
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

// 获取选择的数据
const selectedData = (value: any, flag: string) => {
  proTableRef.value.searchParam[flag] = value
}

// 获取项目类型
const getProjectData = () => {
  loading.value = true
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      loading.value = false
      selectData.projectType = res.data
      baseMsgData.projectTypeData.projectType = getAllProTypeList(res.data)
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const getAllProTypeList: any = (list: any[]) => {
  return list.map((item: any) => {
    // 如果没有children属性
    if (!item.children || item.children.length === 0) {
      return {
        value: item.middleId,
        name: item.name,
        id: item.id
      }
    }
    return {
      value: item.middleId,
      name: item.name,
      id: item.id,
      children: item.children ? getAllProTypeList(item.children) : []
    }
  })
}

const diaLogData = reactive<DialogData>({
  title: '',
  isShowPage: false
})

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive<InitParams>({
  specialorgid: '',
  roleCode: ''
})

const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const gkbmListData: any = ref([])

const getYjdwEnum = async () => {
  let res: any = await getYjdwList(specialOrgId.value)
  if (res.success) {
    yjdwListData.value.push(...res.data)
    baseMsgData.yjdwListData = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}
const changeEjdwEnum = async (val: string) => {
  // loading.value = true;
  ejdwListData.value.length = 0
  proTableRef.value.searchParam.ejdw = ''
  gkbmListData.value.length = 0
  proTableRef.value.searchParam.gkbmId = ''
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: specialOrgId.value
    })
    if (res.success) {
      ejdwListData.value.push(...res.data)
      loading.value = false
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
      loading.value = false
    }
  } else {
    loading.value = false
  }
}

const changeGkbmEnum = async (val: string) => {
  loading.value = true
  gkbmListData.value.length = 0
  proTableRef.value.searchParam.gkbmId = ''
  if (val) {
    let res = await getGkbmByEjdw(val)
    if (res.success) {
      gkbmListData.value.push(...res.data)
      loading.value = false
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
      loading.value = false
    }
  } else {
    loading.value = false
  }
}

const isListEnum = reactive([
  {
    label: '是',
    value: '1'
  },
  {
    label: '否',
    value: '0'
  }
])

const getPageList = (params: any) => {
  loading.value = true
  return getPage(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const resetHandle = () => {
  ejdwListData.value.length = 0
  proTypeRef.value.clearSelect()
  proTableRef.value?.clearSelection()
}

const searchHandle = () => {
  proTableRef.value?.clearSelection()
}

const baseMsgData = reactive<BaseMsgData>({
  yjdwListData: [],
  isYapListData: isListEnum,
  projectTypeData: {
    projectType: [],
    defaultProps: treeProps.projectTypeProps
  },
  specialOrgId: '',
  operationFlag: '',
  yssxbm: '',
  selectedData: {},
  jd: '1'
})

const resetProTypeData = () => {
  const $table = proTableRef.value
  if (Array.isArray($table.searchParam.xmlx)) {
    $table.searchParam.xmlx.length = 0
  } else {
    $table.searchParam.xmlx = ''
  }
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  { type: 'index', width: 80, label: '序号' },
  {
    prop: 'yssxbm',
    label: '事项编码',
    search: {
      el: 'input',
      order: 2
    },
    width: '180'
  },
  {
    prop: 'yssxmc',
    label: '事项名称',
    search: {
      el: 'input',
      order: 1
    },
    width: '200'
  },
  {
    prop: 'yslxctId',
    label: '重点投向',
    search: {
      el: 'select',
      order: 4,
      props: {
        filterable: true
      }
    },
    enum: getYslxct,
    isShow: false,
    fieldNames: { label: 'ctmc', value: 'id' },
    width: '140'
  },
  {
    prop: 'yslxctName',
    label: '重点投向',
    width: '180'
  },
  {
    prop: 'xmlx',
    label: '项目类型',
    search: {
      order: 3,
      render: () => {
        return (
          <TreeSelect
            onClearData={resetProTypeData}
            is-child-node={false}
            data={selectData.projectType}
            onSelectChange={(value: any) => selectedData(value, 'xmlx')}
            ref={proTypeRef}
            is-leaf={false}
            data-type="middleId"
            default-props={treeProps.projectTypeProps}
            node-key="middleId"
          />
        )
      }
    },
    isShow: false,
    width: '140'
  },
  {
    prop: 'xmlxName',
    label: '项目类型',
    width: '180'
  },
  {
    prop: 'zjlyName',
    label: '资金来源',
    width: '180'
  },
  {
    prop: 'sfyap',
    label: '是否预安排',
    search: {
      el: 'select',
      order: 9
    },
    isShow: false,
    enum: isListEnum,
    width: '180'
  },
  {
    prop: 'isYapName',
    label: '是否预安排',
    width: '180'
  },
  {
    prop: 'sfbmd',
    label: '是否规模化',
    search: {
      el: 'select',
      order: 8
    },
    isShow: false,
    enum: isListEnum,
    width: '180'
  },
  {
    prop: 'sfbmdName',
    label: '是否规模化',
    width: '180'
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    isShow: false,
    search: { el: 'select', props: { onChange: changeEjdwEnum }, order: 5 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'yjdwName',
    label: '一级单位',
    width: '180'
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    search: { el: 'select', order: 6, props: { onChange: changeGkbmEnum } },
    enum: ejdwListData.value,
    isShow: false,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ejdwName',
    label: '二级单位',
    width: '180'
  },
  {
    prop: 'gkbmmc',
    label: '归口部门',
    width: '180'
  },
  {
    prop: 'gkbmId',
    label: '归口部门',
    isShow: false,
    search: {
      el: 'select',
      order: 7,
      props: {
        multiple: true,
        collapseTags: true
      }
    },
    fieldNames: { label: 'name', value: 'code' },
    enum: gkbmListData.value,
    width: '180'
  },
  {
    prop: 'csmc',
    label: '处室',
    width: '180'
  },
  {
    prop: 'nd',
    label: '年度',
    search: {
      el: 'date-picker',
      order: 10,
      props: {
        type: 'year',
        valueFormat: 'YYYY',
        clearable: true
      }
    }
  },
  {
    prop: 'sxys',
    label: '事项预算（万元）',
    headerAlign: 'center',
    align: 'right',
    width: '140'
  },
  {
    prop: 'remark',
    label: '备注',
    width: '180'
  },
  {
    prop: 'sxxz',
    label: '事项性质',
    width: '140',
    enum: () => getPublicData('ZLYS_YSSX_SXXZ'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'zdtx',
    label: '重点投向',
    isShow: false,
    width: '140',
    enum: () => getPublicData('ZLYS_YSSX_ZDTX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'zt',
    label: '状态',
    width: '140',
    isShow: false,
    search: {
      el: 'select',
      order: 11,
      props: {
        multiple: true,
        collapseTags: true
      },
      defaultValue: ['00', '01', '03', '04']
    },
    enum: () => getPublicData('ZLYS_YSSXZT'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ztName',
    label: '状态',
    width: '140'
  },
  { prop: 'zscflag', label: '删除标识', width: '140' },
  { prop: 'ztimestamp', label: '创建时间', width: '180' },
  { prop: 'cjrName', label: '创建人', width: '140' },
  { prop: 'zhggrq', label: '最后更改日期', width: '180' },
  { prop: 'zhggrName', label: '最后更改人', width: '140' },
  { prop: 'xjjzbs', label: '续建结转标识', width: '140' },
  { prop: 'middleId', label: '子类型', isShow: false }
])

const selectRolesHandle = () => {
  userDialogRef.value.getUser()
}

const randomStr = (len: number) => {
  len = len || 10
  var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var maxPos = $chars.length
  var pwd = ''
  for (var i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return 'YSCT-' + pwd
}

const getRoleHandle = () => {
  specialOrgId.value = userDialogRef.value.specialorgid
  spRoleId.value = userDialogRef.value.spRoleId
  baseMsgData.specialOrgId = userDialogRef.value.specialorgid
  roleCode.value = userDialogRef.value.roleCode
  initParam.specialorgid = specialOrgId.value
  initParam.roleCode = roleCode.value
  getYjdwEnum()
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
  }
}

const addMsgHandle = () => {
  diaLogData.isShowPage = true
  diaLogData.title = '预算事项-新增'
  baseMsgData.operationFlag = 'ADD'
  baseMsgData.yssxbm = randomStr(10)
}

const editMsgHandle = (selectedList: List[]) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('请选择一条数据进行编辑！')
    return
  }
  if (selectedList[0].zt !== '00' && selectedList[0].zt !== '03' && selectedList[0].zt !== '04') {
    ElMessage.warning('事项状态非初始、驳回或退回状态，不允许编辑！')
    return
  }

  diaLogData.isShowPage = true
  diaLogData.title = '预算事项-编辑'
  baseMsgData.operationFlag = 'EDIT'
  baseMsgData.selectedData = selectedList[0]
}

const wfParam = ref<WFParam>({
  SXIDS: '',
  FQZZ: '',
  GKCS: '',
  GKBM: ''
})

/**
 * 提 交(含工作流)
 * @param selectedList
 */
const submitDecWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter(
    (item: any) => item.zt !== '00' && item.zt !== '03' && item.zt !== '04'
  )
  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许提交！')
    return
  }

  //限制同一归口部门提交
  var gkbmmcArr = selectedList.map((item) => item.gkbmmc)
  for (var i = 1; i < gkbmmcArr.length; i++) {
    if (gkbmmcArr[i] != gkbmmcArr[0]) {
      ElMessage.error('请选择同一归口部门的数据进行提交!')
      return
    }
  }

  var submitListIds = selectedList.map((item) => item.id).join(',')

  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value
  }

  wfParam.value.SXIDS = submitListIds
  wfParam.value.FQZZ = 'Province'
  wfParam.value.GKCS = selectedList[0].csId
  wfParam.value.GKBM = selectedList[0].zgkbmId

  loading.value = true

  submitWorkflow(
    store.getters.getUserMsg.systemCode,
    'WF_MATTERDECLARELC',
    '',
    wfUserInfo,
    wfParam.value,
    {},
    submitWFCallback
  )
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = false

  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value,
    // ywmc : ywmc,
    // yssxIds : yssxIds,
    // yssxbm : yssxbm,
    // gkcs:zgkbmid.value,
    // gkbm:gkcsid.value,
    wfCode: 'WF_MATTERDECLARELC',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitDec({
    ...spfrom
  })
  if (res.success) {
    loading.value = false
    ElMessage.success('提交成功')
    proTableRef.value?.clearSelection()
    proTableRef.value?.search()
  } else {
    loading.value = false
    let msg = res.msg.split('|').join('<br/>')
    ElMessage.error({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

const submitWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter(
    (item: any) => item.zt !== '00' && item.zt !== '03' && item.zt !== '04'
  )

  if (selectedList.length > 100) {
    ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
    return
  }

  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许提交！')
    return
  }

  //限制同一归口部门提交
  var gkbmmcArr = selectedList.map((item) => item.gkbmmc)
  for (var i = 1; i < gkbmmcArr.length; i++) {
    if (gkbmmcArr[i] != gkbmmcArr[0]) {
      ElMessage.error('请选择同一归口部门的数据进行提交!')
      return
    }
  }
  var paramFLag = '0' //0走工作流  1不走工作流
  baseService
    .get('/workflow/declare/getParamValue?paramKey=MATTER_DECLARE_WORKFLOW')
    .then((res) => {
      if (res.data != null) {
        paramFLag = res.data
        if (selectedList[0].zjly == '0' && paramFLag === '0') {
          submitDecWorkflowHandle(selectedList)
        } else {
          submitNoWorkflowHandle(selectedList)
        }
      } else {
        if (selectedList[0].zjly == '0') {
          submitDecWorkflowHandle(selectedList)
        } else {
          submitNoWorkflowHandle(selectedList)
        }
      }
    })
}

const submitNoWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter(
    (item: any) => item.zt !== '00' && item.zt !== '03' && item.zt !== '04'
  )
  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许提交！')
    return
  }
  let selectedListIds = selectedList.map((item) => item.id)
  ElMessageBox.confirm('是否提交选中数据?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      const res = await submit(selectedListIds)
      if (res.success) {
        loading.value = false
        ElMessage.success('提交成功')
        proTableRef.value?.clearSelection()
        proTableRef.value?.search()
      } else {
        loading.value = false
        let msg = res.msg.split('|').join('<br/>')
        ElMessage.error({
          type: 'error',
          dangerouslyUseHTMLString: true,
          message: msg
        })
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const delMsgHandle = (selectedList: any[]) => {
  let isDelFilter = selectedList.filter(
    (item: any) => item.zt !== '00' && item.zt !== '03' && item.zt !== '04'
  )
  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许删除！')
    return
  }
  let selectedListIds = selectedList.map((item) => item.id)
  ElMessageBox.confirm('是否删除选中数据', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      const res = await delMsg(selectedListIds)
      if (res.success) {
        loading.value = false
        ElMessage.success('删除成功')
        proTableRef.value?.clearSelection()
        proTableRef.value?.search()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    })
    .finally(() => {
      loading.value = false
    })
}

const viewMsgHandle = (selectedList: List[]) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('请选择一条数据进行查看！')
    return
  }
  diaLogData.isShowPage = true
  diaLogData.title = '预算事项-查看'
  baseMsgData.operationFlag = 'VIEW'
  baseMsgData.selectedData = selectedList[0]
}
const reset = async () => {
  await proTableRef.value?.clearSelection()
  await proTableRef.value?.search()
}
const closeDialogMsg = () => {
  processData.isShowDialog = false
}
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 导入
const importMsgHandle = () => {
  let newParmas = {
    specialorgid: specialOrgId.value
  }
  let importApi: any = importData
  if (!importApi) return
  let params = {
    title: '预算事项储备',
    tempApi: getImportTemplate,
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: reset,
    specialorgid: specialOrgId.value
  }
  importRef.value.acceptParams(params)
}

const exportMsgHandle = () => {
  loading.value = true
  exportMsg({
    specialorgid: specialOrgId.value,
    ...proTableRef.value?.searchParam
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

const closeDialogHandle = (val: boolean) => {
  baseMsgData.selectedData = {}
  proTableRef.value?.clearSelection()
  diaLogData.isShowPage = val
}

const searchTableHandle = () => {
  proTableRef.value?.search()
}

onMounted(() => {
  selectRolesHandle()
  getProjectData()
})
</script>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
