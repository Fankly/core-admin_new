<template>
  <div class="table-box" v-if="isShowPage" v-loading="loading">
    <proTable
      @row-click="handerClickTable"
      @search="searchHandle"
      :data-callback="callBackHandle"
      :init-param="initParam"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
      guide-module-key="RentReview"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-permission="'WHGKBM'"
          v-show="isShowBtn"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="provinceEdit(scope.selectedList)"
        >维护省业务归口部门</el-button>
        <el-button
          v-permission="'SUBMIT'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="handlePass(scope.selectedList)"
        >提 交</el-button>
        <el-button
          v-permission="'BACK'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="handleReject(scope.selectedList)"
        >退 回</el-button>
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="handleViewData(scope.selectedList)"
        >查看明细</el-button>
        <el-button
          v-permission="'PROCESS'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="handleProcess(scope.selectedList)"
        >流程履历</el-button>
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
      <template #headerButton>
        <div class="custom-tabs">
          <div
            class="tab-item"
            :class="{ active: searchCode === 'ZLXQ_SZY' }"
            @click="() => searchTableHandle('ZLXQ_SZY')"
          >省专业待审清单</div>
          <div
            class="tab-item"
            :class="{ active: searchCode === 'ZLXQ_SCW' }"
            @click="() => searchTableHandle('ZLXQ_SCW')"
          >省财务待审清单</div>
        </div>
      </template>
    </proTable>
  </div>
  <ProvinceYwModal @detail="refreshData" ref="provinceYwModalRef" />
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    flag="VIEW"
  >
  </CentralizedModification>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <vxe-modal title="财务部门各处室角色选择" v-model="isShowResetModal" :loading="loading">
    <template #default>
      <el-form ref="modalformRef" label-suffix=":" :model="modalForm" :rules="modalFormRules">
        <el-form-item prop="gkcs" label="财务处室">
          <el-select style="width: 100%" v-model="modalForm.gkcs">
            <el-option
              v-for="item in publicCodeList['ZLXQSH_CWCS_COM']"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button type="primary" size="mini" plain @click="handleSubmit">提 交</el-button>
        <el-button size="mini" plain @click="handleClose">关 闭</el-button>
      </div>
    </template>
  </vxe-modal>

  <vxe-modal title="退回" v-model="isShowReturnModal" :loading="loading">
    <template #default>
      <el-form ref="thformRef" label-suffix=":" :model="returnModalForm" :rules="returnModalFormRules">
        <el-form-item label="意见">
          <el-input maxlength="128" v-model="returnModalForm.spyj" type="textarea" :rows="6" resize="none" />
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button type="primary" size="mini" plain @click="returnHandleSubmit">确 定</el-button>
        <el-button size="mini" plain @click="returnHandleClose">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: '/service/xq/RentReview'
}
</script>

<script setup lang="ts">
import { getDataByParent, getParamValueMulti, getPublicCodeList } from '@/api/common'
import {
  exportData,
  fallback,
  getPage,
  skipToScw,
  zlxqzswhSubmitWf,
  zlxqzyshSubmitWf
} from '@/api/service/zlxqszy'
import proTable from '@/components/ProTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useProcess } from '@/hooks/useProcessNew'
import { useUser } from '@/hooks/useUser'
import { submitWorkflow, WFData, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import CentralizedModification from '@/views/service/xq/components/CentralizedModificationNew.vue'
import ProvinceYwModal from '@/views/service/xq/components/ProvinceYwModal.vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onMounted, reactive, ref, h } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import VXETable from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText'
import { checkSameProperty } from '@/utils/utils'

const route = useRoute()
const store = useStore()

interface PublicCode {
  code: string
  name: string
}

// 状态
const ZL_STATUS = {
  PROVINCE_YS_SUBMIT: 'Q50', // 租赁需求待省预算提交
  PROVINCE_GK_REJECT: 'Q51', // 租赁需求省归口驳回
  PROVINCE_GK_APPROVE: 'Q52', // 租赁需求省归口审批中
  PROVINCE_GK_FINISHED: 'Q53', // 租赁需求省归口已审批
  PROVINCE_CS_REJECT: 'Q54', // 租赁需求省财务处室审批驳回
  PROVINCE_YS_REJECT: 'Q55', // 租赁需求省预算专职驳回
  PROVINCE_ZJC_REJECT: 'Q56', // 租赁需求省资金处专职驳回
  PROVINCE_CWC_APPROVE: 'Q57', // 租赁需求省财务处室审批中
  PROVINCE_CWC_PASS: 'Q58', // 租赁需求省财务处室审批通过
  PROVINCE_YS_PASS: 'Q59', // 租赁需求省预算专职审批通过
  FINISHED: 'Q60' // 租赁需求审批完成
}

const checkassStatus = ['Q52', 'Q57', 'Q58', 'Q59', 'Q60']

const isShowBtn = computed(() => searchCode.value === 'ZLXQ_SZY')

const wfParam = ref<{
  XMIDS: string
  GKBM_WF: string
  GKCS: string
  ZJC: string
  YSC: string
}>({
  XMIDS: '',
  GKBM_WF: '',
  GKCS: '',
  YSC: '',
  ZJC: ''
})

const ztsList = ref<any[]>([])
const listData = ref<any[]>([])
const zzjgList = ref<any[]>([])
const selectedListData = ref<any[]>([])
const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})
const provinceYwModalRef = ref<InstanceType<typeof ProvinceYwModal>>()
const userDialogRef = ref<InstanceType<typeof userDialog>>()
const proTableRef = ref<InstanceType<typeof proTable>>()
const selectData = ref()

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})
const modalformRef = ref()
const thformRef = ref()
const isShowResetModal = ref(false)
const isShowReturnModal = ref(false)
const modalForm = reactive({
  gkcs: ''
})
const modalFormRules = reactive({
  gkcs: [{ required: true, message: '请选择财务处室', trigger: ['change'] }]
})
const returnModalForm = ref({
  spyj: ''
})
const returnModalFormRules = reactive({
  spyj: [{ required: true, message: '请填写意见', trigger: 'blur' }]
})
const userInfOther = ref()

const editPageRef = ref()

const isShowPage = ref<boolean>(false)

const loading = ref<boolean>(false)

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = ref<any>({})

const searchCode = ref('ZLXQ_SZY')

const handleClose = () => {
  isShowResetModal.value = false
  loading.value = false
  modalForm.gkcs = ''
}

const returnHandleClose = () => {
  isShowReturnModal.value = false
  loading.value = false
  returnModalForm.value.spyj = ""
  selectedListData.value = []
}

const selectedData = ref<any[]>([])

const handleSubmit = async () => {
  // 提交工作流
  const type = await VXETable.modal.confirm('确认是否提交?', '提示', {
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type === 'confirm') {
    // 提交工作流
    submitWorkflowHandle(selectedData.value, modalForm.gkcs)
  }
}

const returnHandleSubmit = async () => {
  // 退回
  if (!returnModalForm.value.spyj) {
    ElMessage.warning('意见不能为空!')
    return
  }
  const ids = selectedListData.value.map((item) => item.xmid)
  const res = await fallback({
    ids,
    spyj: returnModalForm.value.spyj
  })
  if (res.success) {
    returnHandleClose()
    ElMessage.success('退回成功!')
    proTableRef.value?.clearSelection()
    proTableRef.value?.search()
  } else {
    throw new Error(res.msg)
  }
}

const getPageList = (params: any) => {
  params['searchCode'] = searchCode.value
  loading.value = true
  return getPage(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const searchHandle = () => {
  if (proTableRef.value) proTableRef.value.clearSelection()
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80 },
  { type: 'index', width: 80, label: '序号' },
  { prop: 'ztName', width: 200, label: '状态' },
  {
    prop: 'zts',
    label: '状态',
    search: { el: 'select', order: 5, props: { multiple: true, collapseTags: true } },
    enum: ztsList.value,
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  { prop: 'sdkbm', width: 200, label: '省对口专业部门' },
  { prop: 'sgbm', width: 200, label: '省业务归口部门' },
  { prop: 'xmlb', width: 200, label: '项目类别' },
  {
    prop: 'sgbmId',
    width: 200,
    label: '省业务归口部门',
    enum: zzjgList.value,
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    search: {
      order: 4,
      el: 'select'
    },
    isShow: false
  },
  {
    prop: 'sdkbmId',
    width: 200,
    label: '省对口专业部门',
    enum: listData.value,
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    search: {
      order: 3,
      el: 'select'
    },
    isShow: false
  },
  {
    prop: 'requestor',
    width: 200,
    label: '填报单位',
    search: {
      order: 6,
      el: 'input',
      props: {
        maxLength: 50
      }
    }
  },
  { prop: 'requestor', width: 200, label: '承租方' },
  { prop: 'zlxz', width: 200, label: '租赁性质1' },
  { prop: 'zlxz2', width: 200, label: '租赁性质2' },
  {
    prop: 'xmbms',
    width: 200,
    label: '租赁需求编码',
    search: {
      order: 1,
      render: (scope: any) => {
        return h(ReMultipleText, { modelValue: scope.modelValue })
      }
    },
    isShow: false
  },
  {
    prop: 'xmbm',
    width: 200,
    label: '租赁需求编码'
  },
  { prop: 'xmmc', width: 200, label: '租赁需求名称' },
  {
    prop: 'czf',
    width: 200,
    label: '出租方',
    search: {
      order: 1,
      el: 'input',
      props: {
        maxLength: 50
      }
    }
  },
  { prop: 'czfsx', width: 200, label: '出租方属性' },
  { prop: 'zlSfqdhtName', width: 200, label: '是否已签订合同' },
  { prop: 'zlHtqdrq', width: 200, label: '合同签订日期' },
  { prop: 'zlHtbm', width: 200, label: '合同编码' },
  { prop: 'ssnr', width: 200, label: '实施内容及必要性说明' },
  { prop: 'zrzclb', width: 200, label: '租入资产类型' },
  { prop: 'zrzcjtmc', width: 200, label: '租入资产具体名称' },
  { prop: 'sl', width: 200, label: '数量' },
  { prop: 'dw', width: 200, label: '单位' },
  { prop: 'fwghyt', width: 200, label: '房屋/仓库规划用途' },
  { prop: 'fwmj', width: 200, label: '房屋/仓库面积(平方米)' },
  { prop: 'zrzcjzTax', width: 200, label: '含税租入资产价值(元)' },
  { prop: 'allInvestTax', width: 200, label: '含税总租金(万元)' },
  { prop: 'zzjgc', width: 200, label: '含税总租构成' },
  { prop: 'prjSdate', width: 200, label: '预计起租日' },
  { prop: 'prjEdate', width: 200, label: '预计到期日' },
  { prop: 'leasemonth', width: 200, label: '租赁期(月)' },
  { prop: 'dqclfs', width: 200, label: '到期处置方式' },
  { prop: 'jcyj', width: 200, label: '需求决策依据' },
  { prop: 'zjzjyj', width: 200, label: '租金作价依据' },
  { prop: 'xmssr', width: 200, label: '填报人' },
  { prop: 'phoneNum', width: 200, label: '联系方式' }
])

const searchTableHandle = (flag: string) => {
  if (proTableRef.value) {
    ztsList.value.length = 0
    proTableRef.value.searchParam['zts'] = []
    // 清空状态
    if (flag === 'ZLXQ_SZY') ztsList.value.push(...publicCodeList['ZLXQ_SZY_STATUS'])
    else ztsList.value.push(...publicCodeList['ZLXQ_SCW_STATUS'])
    searchCode.value = flag
    proTableRef.value.clearSelection()
    proTableRef.value.search()
  }
}

const refreshData = () => {
  if (proTableRef.value) {
    proTableRef.value.clearSelection()
    proTableRef.value.search()
  }
}

const selectRolesHandle = () => {
  userDialogRef.value && userDialogRef.value.getUser()
}

// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(val, true)
  })
}

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value) {
      const isQuery = userDialogRef.value.isQuery
      userInfOther.value = { ...userDialogRef.value.userMsg }
      if (isQuery) {
        const flagData = await baseService.post(
          `/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`
        )
        if (flagData.success && flagData.data) {
          const userInfoOthers = {
            deptId: userInfOther.value.specialorgid,
            deptName: userInfOther.value.specialorgname,
            dwId: userInfOther.value.org_id,
            dwName: userInfOther.value.org_name,
            roleId: userInfOther.value.role_id,
            roleCode: userInfOther.value.code,
            spRoleId: userInfOther.value.id,
            specialorgcode: userInfOther.value.specialorgcode,
            fqzzFlag: flagData.data
          }
          userInfo.value = userInfoOthers
          store.commit('setZlGlobalInfo', userInfoOthers)
          initParam.value = {
            bmId: userInfo.value.deptId,
            ...userInfoOthers
          }
          isShowPage.value = true
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const handlePass = async (selectedList: any[]) => {
  if (selectedList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作！')
    return
  }
  if (selectedList.length > 100) {
    ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
    return
  }
  if (searchCode.value === 'ZLXQ_SZY') {
    const isNullStatus = selectedList.some((item: any) => !item.sgbmId)
    if (isNullStatus) {
      ElMessage.warning('存在省业务归口部门为空的记录,请确认后,再进行提交操作!')
      return
    }
    const someWorkflowStatus = checkSameProperty(selectedList, 'sgbmId')
    if (!someWorkflowStatus) {
      ElMessage.warning('省业务归口部门相同的记录才允许合并提交，请检查!')
      return
    }
  }

  const filterData = []
  for (let i = 0; i < selectedList.length; i++) {
    const status = selectedList[i].zt
    if (checkassStatus.includes(status)) {
      filterData.push(selectedList[i])
    }
    if (filterData.length !== 0) {
      const name = filterData.map((item) => item.xmmc).join(',')
      ElMessage.warning(`项目:${name}已提交,无需重复提交,请检查!`)
      return
    }
  }
  if (searchCode.value === 'ZLXQ_SZY') {
    const type = await VXETable.modal.confirm('确认是否提交?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      // 判断是否走工作流
      /* const isNeedWorkflow = checkSameProperty(selectedList, 'sdkbmId')
      if (isNeedWorkflow) {
        // 不走工作流
        noSubmitWorkflowHandle(selectedList)
      } else {
        // 提交工作流
        submitWorkflowHandle(selectedList)
      } */
      // 提交工作流
      submitWorkflowHandle(selectedList)
    }
  } else {
    // 展示
    selectedData.value = selectedList
    isShowResetModal.value = true
  }
}

// 不走工作流
const noSubmitWorkflowHandle = async (selectedList: any[]) => {
  try {
    loading.value = true
    const xmIds: string[] = selectedList.map((item) => item.xmid)
    const res = await skipToScw(xmIds)
    if (res.success) {
      ElMessage.success('提交成功')
      proTableRef.value?.clearSelection()
      proTableRef.value?.search()
    } else {
      throw new Error(res.msg)
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const submitWorkflowHandle = (selectedList: any[], gkcs?: string) => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || ''
  }
  const xmIds = selectedList.map((item) => item.xmid).join(',')
  const wfCode = searchCode.value === 'ZLXQ_SZY' ? 'WF_ZLXQSZYSHLC' : 'WF_ZLXQSCWSHLC'
  wfParam.value.XMIDS = xmIds
  wfParam.value.GKBM_WF = selectedList[0].sgbmId || ''
  wfParam.value.GKCS = gkcs || ''
  wfParam.value.ZJC = ZJC_CODE.value
  wfParam.value.YSC = YSC_CODE.value
  loading.value = true

  submitWorkflow(
    store.getters.getUserMsg.systemCode,
    wfCode,
    '',
    wfUserInfo,
    wfParam.value,
    {},
    submitWFCallback
  )
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = true
  const wfCode = searchCode.value === 'ZLXQ_SZY' ? 'WF_ZLXQSZYSHLC' : 'WF_ZLXQSCWSHLC'
  const api = searchCode.value === 'ZLXQ_SZY' ? zlxqzyshSubmitWf : zlxqzswhSubmitWf
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || '',
    wfCode: wfCode,
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await api({
    ...spfrom
  })
  if (res.success) {
    loading.value = false
    ElMessage.success('提交成功')
    proTableRef.value?.clearSelection()
    proTableRef.value?.search()
    handleClose()
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

const handleReject = async (selectedList: any[]) => {
  if (selectedList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作！')
    return
  }
  const filterData: any[] = []
  for (let i = 0; i < selectedList.length; i++) {
    const status = selectedList[i].zt

    const statusType = publicCodeList['ZLYS_ZLCANBEBH_STATUS'].map(({ code }: any) => code)
    // if (!publicCodeList["ZLYS_ZLCANBEBH_STATUS"].includes(status)) {
    //   filterData.push(selectedList[i]);
    // }
    if (!statusType.includes(status)) {
      filterData.push(selectedList[i])
    }
  }
  if (filterData.length !== 0) {
    const name = filterData.map((item) => item.xmmc).join(',')
    ElMessage.warning(`项目:${name}的状态不支持退回操作,请检查后,再进行尝试!`)
    return
  }

  try {
    const type = await VXETable.modal.confirm('确认是否退回?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })

    if (type === 'confirm') {
      selectedListData.value = selectedList
      isShowReturnModal.value = true
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  }
}
const handleViewData = (selectedList: any[]) => {
  if (selectedList.length !== 1) {
    ElMessage.warning('请选择一条数据进行查看！')
    return
  }
  const data = selectedList.map((item: any) => {
    return {
      id: item.xmid,
      xmlx: item.protypeId,
      ...item
    }
  })
  selectData.value = data[0]
  console.log(111, selectData.value)
  editPageRef.value.isShowModal = true
}

const provinceEdit = (selectedList: any[]) => {
  const status = ['Q50', 'Q51']
  const findData = selectedList.filter((item) => !status.includes(item.zt))
  if (findData.length !== 0) {
    const names = findData.map((item) => item.xmmc).join(',')
    ElMessage.warning(`项目：${names}的当前状态不支持维护操作！`)
    return
  }
  if (selectedList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行操作！')
    return
  }
  let params = {
    xmIds: selectedList.map((item: any) => item.xmid)
  }
  if (provinceYwModalRef.value) {
    provinceYwModalRef.value.acceptParams(params)
  }
}

const handleProcess = (selectedList: any[]) => {
  const selectList = selectedList.map((item) => {
    return {
      id: item['xmid'],
      ...item
    }
  })
  useProcess(selectList, processData)
}
const handleExport = () => {
  loading.value = true
  const params = {
    ...proTableRef.value?.searchParam,
    ...initParam.value,
    searchCode: searchCode.value
  }
  exportData(params).then((res: any) => {
    const blob = res
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
const publicCodeList = reactive<any>({
  ZLYS_ZLCANBEBH_STATUS: [],
  ZLXQ_SZY_STATUS: [],
  ZLXQSH_CWCS_COM: [],
  ZLXQ_SCW_STATUS: []
})

// 获取公共代码
const getPublicCodeData = async () => {
  const res = await getPublicCodeList({
    codes: ['ZLYS_ZLCANBEBH_STATUS', 'ZLXQ_SZY_STATUS', 'ZLXQ_SCW_STATUS', 'ZLXQSH_CWCS_COM']
  })
  if (res.success) {
    for (const key in publicCodeList) {
      publicCodeList[key] = res.data[key]
    }
    ztsList.value.push(...publicCodeList['ZLXQ_SZY_STATUS'])
  }
}

const ZJC_CODE = ref('')
const YSC_CODE = ref('')

// 获取参数配置
const getParamsConfigData = async () => {
  const res = await getParamValueMulti(['ZJC_CODE', 'YSC_CODE'])
  if (res.success && res.data) {
    ZJC_CODE.value = res.data['ZJC_CODE']
    YSC_CODE.value = res.data['YSC_CODE']
  }
}

const getPublicCode = async () => {
  try {
    const res = await getDataByParent('QMYS_ZZJG')
    if (res.success) {
      zzjgList.value.push(...res.data)
      listData.value.push(...res.data)
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

onMounted(async () => {
  getPublicCodeData()
  getPublicCode()
  getParamsConfigData()
  const isRoel = await useUser('getZlGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const xqGlobalInfo = store.getters.getZlGlobalInfo
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    isShowPage.value = true
    initParam.value = {
      bmId: userInfo.value.deptId,
      ...userInfo.value
    }
  } else {
    selectRolesHandle()
  }
})
</script>

<style scoped lang="less">
.table-box {
  padding: 10px;

  .custom-tabs {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1.5px solid #e4e7ed;
    background: none;
  }

  .tab-item {
    padding: 10px;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    margin: 0 6px;
  }

  .tab-item.active {
    color: #00706b;
  }

  .tab-item.active::after {
    content: '';
    display: block;
    position: absolute;
    left: 50%;
    bottom: -2px;
    width: 100px;
    height: 3px;
    background: linear-gradient(90deg, #00706b, #00604a);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: width 0.3s;
  }
}
</style>
