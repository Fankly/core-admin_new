<script lang="ts">
export default {
  name: '/service/xq/RentProSearch'
}
</script>

<script setup lang="ts">
import { getDataByParent, getPublicCodeList } from '@/api/common'
import { exportZlxmExcel, getExportZlxmData, getXmlb } from '@/api/service/rentProSearch'
import ProTable from '@/components/ProTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useProcess } from '@/hooks/useProcessNew'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import { formatNumValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage } from 'element-plus'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const proTableRef = ref<InstanceType<typeof ProTable>>()
const userInfOther = ref()
const editPageRef = ref()
const userDialogRef = ref()
const loading = ref(false)
const isShowPage = ref(false)
const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})
const selectData = ref<any>()
const exportHandle = () => {
  loading.value = true
  const params = {
    ...proTableRef.value?.searchParam,
    bmId: userInfo.value?.deptId || '',
    ...userInfo.value
  }
  exportZlxmExcel(params).then((res: any) => {
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
const listData = ref<any[]>([])
const zzjgList = ref<any[]>([])
const publicCodeList = reactive<any>({
  ZLYS_ZLBB_ZT: []
})
const xmlbList = ref<any[]>([])

// 获取公共代码
const getPublicCodeData = async () => {
  const res = await getPublicCodeList({
    codes: ['ZLYS_ZLBB_ZT']
  })
  if (res.success) {
    for (const key in publicCodeList) {
      publicCodeList[key].push(...res.data[key])
    }
  }
}

// 获取项目类别
const getXmlbData = async () => {
  const res = await getXmlb({
    bmId: userInfo.value?.deptId || '',
    dwId: userInfo.value?.dwId || ''
  })
  if (res.success) {
    xmlbList.value = res.data
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
const viewHandle = (selectList: any[]) => {
  if (selectList.length !== 1) {
    ElMessage.error('只能选择一条数据进行查看')
    return
  }
  selectData.value = {
    id: selectList[0]['xmid'],
    xmlx: selectList[0]['protypeId'],
    ...selectList[0]
  }
  editPageRef.value.isShowModal = true
}
const dataCallbackHandle = (data: any) => {
  loading.value = false
  return data
}
const processHandle = (selectList: any[]) => {
  if (selectList.length !== 1) {
    ElMessage.error('只能选择一条数据进行查看')
    return
  }
  const selectedList = selectList.map((item) => {
    return {
      id: item['xmid'],
      ...item
    }
  })
  useProcess(selectedList, processData)
}
const getDataList = (params: any) => {
  loading.value = true
  const newParams = {
    ...params,
    bmId: userInfo.value?.deptId || '',
    ...userInfo.value
  }
  proTableRef.value?.clearSelection()
  return getExportZlxmData(newParams)
}
// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = ref()
// 表格配置项
const columns = reactive<any[]>([
  { type: 'selection', width: 80 },
  { type: 'index', width: 80, label: '序号' },
  { prop: 'tjsj', width: 200, label: '发起时间' },
  { prop: 'spsj', width: 200, label: '通过时间' },
  
  {
    prop: 'zts',
    label: '状态',
    search: { el: 'select', order: 5, props: { multiple: true, collapseTags: true } },
    enum: publicCodeList['ZLYS_ZLBB_ZT'],
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  {
    prop: 'tjsj',
    label: '发起时间',
    search: { el: 'date-picker', order: 7, props: { type: 'daterange', valueFormat: 'YYYY-MM-DD', multiple: true, collapseTags: true } },
    isShow: false
  },
  {
    prop: 'spsj',
    label: '通过时间',
    search: { el: 'date-picker', order: 8, props: { type: 'daterange', valueFormat: 'YYYY-MM-DD', multiple: true, collapseTags: true } },
    isShow: false
  },
  {
    prop: 'xmlb',
    label: '项目类别',
    search: { el: 'select',  order: 9, props: { multiple: true, collapseTags: true } },
    enum: xmlbList,
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  { prop: 'yssxName', width: 200, label: '预算事项' },
  { prop: 'ztName', width: 200, label: '状态' },
  { prop: 'protypeName', width: 200, label: '项目类别' },
  { prop: 'sdkbm', width: 200, label: '省对口专业部门' },
  { prop: 'sgbm', width: 200, label: '省业务归口部门' },
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
  { prop: 'zlxmZysgyj', label: '专业审核意见（同意/不同意）', width: 200 },
  { prop: 'zlxmShly', label: '审核理由', width: 180 },
  {
    prop: 'requestor',
    label: '租赁单位（承租人）',
    width: 180,
    search: {
      order: 6,
      el: 'input',
      props: {
        maxLength: 50
      }
    }
  },
  {
    prop: 'czf',
    label: '出租方',
    width: 180,
    search: {
      order: 1,
      el: 'input',
      props: {
        maxLength: 50
      }
    }
  },
  {
    prop: 'zrzcjtmc',
    label: '租赁物',
    width: 160,
    search: {
      order: 2,
      el: 'input',
      props: {
        maxLength: 50
      }
    }
  },
  {
    prop: 'allInvestTax',
    label: '租赁总金额(元)',
    width: 160,
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      return formatNumValue(scope.row['allInvestTax'], 2)
    }
  },
  { prop: 'htqx', label: '合同期限', width: 120 },
  { prop: 'prjSdate', label: '起租日', width: 120 },
  { prop: 'prjEdate', label: '结束日', width: 120 },
  { prop: 'jcyj', label: '决策依据', width: 120 },
  { prop: 'czfsx', label: '是否江苏公司系统内租赁', width: 180 },
  { prop: 'xmssr', label: '填报人', width: 120 },
  { prop: 'phoneNum', label: '联系方式', width: 160 }
])
const store = useStore()
const route = useRoute()
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

const getRoleHandle = async () => {
  try {
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
        initParam.value = userInfoOthers
        isShowPage.value = true
      }
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  const isRoel = await useUser('getZlGlobalInfo')
  getPublicCode()
  getPublicCodeData()
  getXmlbData()
  if (isRoel && route.params.formJsc) {
    const xqGlobalInfo = store.getters.getZlGlobalInfo
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    isShowPage.value = true
    initParam.value = userInfo.value
  } else {
    await userDialogRef.value.getUser()
  }
})

// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(val, true)
  })
}
</script>

<template>
  <div class="table-box" v-loading="loading" v-if="isShowPage">
    <ProTable
      guide-module-key="RentProSearch"
      @row-click="handerClickTable"
      :data-callback="dataCallbackHandle"
      :request-auto="true"
      :pagination="true"
      :search-col="4"
      ref="proTableRef"
      :requestApi="getDataList"
      :init-param="initParam"
      :columns="columns"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-permission="'VIEW'"
          size="mini"
          :disabled="!scope.isSelected"
          type="primary"
          plain
          @click="viewHandle(scope['selectedList'])"
        >查 看</el-button>
        <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
        <el-button
          v-permission="'PROCESS'"
          size="mini"
          type="primary"
          plain
          @click="processHandle(scope['selectedList'])">流程履历</el-button>
      </template>
    </ProTable>
  </div>
  <!--  权限选择-->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    flag="VIEW"
  >
  </CentralizedModification>
</template>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
