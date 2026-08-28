<template>
  <div class="table-box adjust-box" v-if="isShowPage" v-loading="loading">
    <proTable
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
          >变更单创建</el-button
        >
        <el-button
          v-permission="'EDIT'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="editMsgHandle(scope.selectedList, 'EDIT')"
          >变更单编辑
        </el-button>
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="editMsgHandle(scope.selectedList, 'VIEW')"
          >变更单查看
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
          @click="useProcess(scope.selectedList, processData)"
          type="primary"
          plain
          >流程履历
        </el-button>
      </template>
    </proTable>
    <el-dialog
      :destroy-on-close="true"
      :show-close="true"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      custom-class="adjust-dialog"
      width="80%"
      top="80px"
      title="预算事项查询"
      v-model="isShowDialog"
    >
      <BudgetChanges ref="budgetChangesRef" :base-msg-data="baseMsgData"></BudgetChanges>
      <template #footer>
        <div class="adjust-operation" style="text-align: center">
          <el-button type="primary" plain @click="determineHandle">确认</el-button>
          <el-button plain @click="closeHandle">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    <ChangeRequest
      :diaLogData="dialogData"
      :base-msg-data="baseMsgData"
      @close-dialog="closeHandle"
    ></ChangeRequest>
    <component
      @closeDialog="processData.isShowDialog = false"
      :isShowDialog="processData.isShowDialog"
      :id="processData.id"
      :is="processData.compName"
    ></component>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: '/matter/matterAdjust'
}
</script>

<script setup lang="tsx">
import userDialog from '@/components/select/userDialog.vue'
import proTable from '@/components/ProTable/index.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { onMounted, reactive, ref } from 'vue'
import BudgetChanges from '@/views/matter/components/BudgetChanges/index.vue'
import ChangeRequest from '@/views/matter/components/ChangeRequest/index.vue'
import { BaseMsgData, InitParams, List } from './types/matterDecl'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEjdwList, getYjdwList } from '@/api/matter'
import { getGkbmByEjdw, getYslxct } from '@/api/matter/yssxMatter'
import { getPage, submit, submitAdjust } from '@/api/matter/matterAdjust'
import { useProcess } from '@/hooks/useProcess'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import baseService from '@/service/baseService'
import { getSubProtypeTree } from '@/api/common'

const userDialogRef = ref()
const proTableRef = ref()
const proTypeRef = ref()
const budgetChangesRef = ref()
const store = useStore()

const isShowPage = ref<boolean>(false)
const specialOrgId = ref<string>('')
const spRoleId = ref<string>('')
const roleCode = ref<string>('')
const loading = ref<boolean>(false)
const isShowDialog = ref<boolean>(false)
const dialogData = reactive({
  isShowAdjustFormDialog: false
})
const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})
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
  loading.value = true
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
  selectedData: {}
})

const statusEnum = reactive([
  {
    name: '初始',
    code: '00'
  },
  {
    name: '提交',
    code: '01'
  },
  {
    name: '审批通过',
    code: '02'
  },
  {
    name: '驳回',
    code: '03'
  }
])

const zjlyListEnum = reactive([
  {
    label: '省专项',
    value: '0'
  },
  {
    label: '市自主',
    value: '1'
  },
  {
    label: '县自主',
    value: '2'
  }
])

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
    prop: 'bgsqdh',
    label: '变更申请单号',
    width: '200'
  },
  { prop: 'cjrName', label: '创建人', width: '140' },
  { prop: 'ztimestamp', label: '创建时间', width: '180' },
  { prop: 'bgyy', label: '变更原因', width: '180' },
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
    prop: 'zjly',
    label: '资金来源',
    isShow: false,
    search: {
      el: 'select',
      order: 8
    },
    enum: zjlyListEnum
  },
  {
    prop: 'sfbmd',
    label: '是否规模化',
    search: {
      el: 'select',
      order: 8
    },
    isShow: false,
    enum: isListEnum
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
    prop: 'xmbbm',
    label: '项目包编码',
    width: '180'
  },
  {
    prop: 'xmbmc',
    label: '项目包名称',
    search: {
      el: 'input',
      order: 11
    },
    width: '180'
  },
  {
    prop: 'remark',
    label: '备注',
    width: '180'
  },
  {
    prop: 'zt',
    label: '申请单状态',
    width: '140',
    isShow: false,
    search: {
      el: 'select',
      order: 12,
      props: {
        multiple: true,
        collapseTags: true
      },
      defaultValue: ['00', '01', '03']
    },
    enum: statusEnum,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'xjjzbs', label: '续建结转标识', width: '140' },
  {
    prop: 'ztName',
    label: '状态',
    width: '140'
  }
])

const selectRolesHandle = () => {
  userDialogRef.value.getUser()
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

const closeDialogHandle = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.search()
}

const editMsgHandle = (selectedList: List[], flag: string) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('请选择一条数据进行操作!')
    return
  }
  if (flag !== 'VIEW') {
    if (selectedList[0].zt !== '00' && selectedList[0].zt !== '03') {
      ElMessage.warning('事项状态非初始或驳回状态，不允许编辑！')
      return
    }
  }

  dialogData.isShowAdjustFormDialog = true
  baseMsgData.operationFlag = flag
  baseMsgData.selectedData = selectedList[0]
}

const wfParam = ref<WFParam>({
  SQIDS: '',
  FQZZ: '',
  GKCS: '',
  GKBM: ''
})

const submitAdjustWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter((item: any) => item.zt !== '00' && item.zt !== '03')
  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许提交！')
    return
  }
  let submitListIds = selectedList.map((item) => item.id).join(',')

  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value
  }

  wfParam.value.SQIDS = submitListIds
  wfParam.value.FQZZ = 'Province'
  wfParam.value.GKCS = selectedList[0].csId
  wfParam.value.GKBM = selectedList[0].zgkbmId

  loading.value = true
  submitWorkflow(
    store.getters.getUserMsg.systemCode,
    'WF_MATTERADJUSTLC',
    '',
    wfUserInfo,
    wfParam.value,
    {},
    submitWFCallback
  )
}

const submitWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter((item: any) => item.zt !== '00' && item.zt !== '03')
  if (selectedList.length != 1) {
    ElMessage.warning('请选择一条数据提交!')
    return
  }
  if (isDelFilter.length !== 0) {
    ElMessage.error('事项状态非初始、驳回或退回状态，不允许提交！')
    return
  }

  var paramFLag = '0' //0走工作流  1不走工作流
  baseService.get('/workflow/declare/getParamValue?paramKey=MATTER_ADJUST_WORKFLOW').then((res) => {
    if (res.data != null) {
      paramFLag = res.data
      if (selectedList[0].zjly == '0' && paramFLag === '0') {
        submitAdjustWorkflowHandle(selectedList)
      } else {
        submitNoWorkflowHandle(selectedList)
      }
    } else {
      if (selectedList[0].zjly == '0') {
        submitAdjustWorkflowHandle(selectedList)
      } else {
        submitNoWorkflowHandle(selectedList)
      }
    }
  })
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = false

  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value,
    wfCode: 'WF_MATTERADJUSTLC',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitAdjust({
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

const submitNoWorkflowHandle = (selectedList: List[]) => {
  let isDelFilter = selectedList.filter((item: any) => item.zt !== '00' && item.zt !== '03')
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

const addMsgHandle = () => {
  isShowDialog.value = true
  baseMsgData.operationFlag = 'ADD'
}

const closeHandle = () => {
  isShowDialog.value = false
  proTableRef.value?.clearSelection()
  proTableRef.value?.search()
}

const determineHandle = () => {
  let res = budgetChangesRef.value.selectHandle()
  if (res) {
    isShowDialog.value = false
    dialogData.isShowAdjustFormDialog = true
    baseMsgData.operationFlag = 'ADD'
    baseMsgData.selectedData = budgetChangesRef.value.selectedList
  }
}

onMounted(() => {
  selectRolesHandle()
  getProjectData()
})
</script>

<style lang="less">
.adjust-box {
  padding: 10px;
}

.adjust-dialog {
  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 0;
    padding-bottom: 10px;
  }
}
</style>
