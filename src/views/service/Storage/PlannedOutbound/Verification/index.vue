<template>
  <div v-show="globalParams.isShowPage" class="container">
    <div class="operation" v-if="globalParams.isShowPage">
      <div class="left">
        <el-button
          v-permission="'MSGVIEW'"
          :disabled="isSelected || disabled"
          size="mini"
          type="primary"
          plain
          @click="handleProMsgView"
          >项目信息查看</el-button
        >
        <el-button
          v-permission="'VIEW'"
          :disabled="isSelected || disabled"
          size="mini"
          type="primary"
          plain
          @click="handleViewAdvice"
          >核定意见查看</el-button
        >
        <el-button
          v-permission="'PASS'"
          :disabled="isSelected || disabled"
          size="mini"
          type="primary"
          plain
          @click="handleSubmitData('Y')"
          >通过</el-button
        >
        <el-button
          v-permission="'REJECT'"
          :disabled="isSelected || disabled"
          size="mini"
          type="primary"
          plain
          @click="handleSubmitData('N')"
          >驳回</el-button
        >
        <el-button
          v-permission="'PROCESS'"
          :disabled="isSelected || disabled"
          size="mini"
          type="primary"
          plain
          @click="handleViewProcess"
          >流程履历</el-button
        >
        <el-button
          v-permission="'EXPORT'"
          :disabled="disabled"
          size="mini"
          type="primary"
          plain
          @click="handleExportData"
          >导 出</el-button
        >
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <SearchCriteria
      flag="VERIFICATION"
      @reset="getPageData"
      @search="getPageData"
      ref="searchCriteriaRef"
    />
    <el-tabs @tab-click="changeTabs" v-model="globalParams.selTab" type="border-card">
      <el-tab-pane
        v-for="item in globalParams.tabs"
        :name="item.code"
        :key="item.code"
        :label="item.name"
      >
        <PrimaryTable :ref="setFormRef(item.code)" />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="'VIEW'"
  ></CentralizedModification>
  <ViewAdvice ref="viewAdviceRef" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/service/Storage/PlannedOutbound/Verification/index'
}
</script>

<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import SearchCriteria from '../components/SearchCriteria.vue'
import PrimaryTable from '../components/PrimaryTable.vue'
import ViewAdvice from '../components/ViewAdvice.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { RowVo } from '../interface/index'

import { reactive, ref, onMounted, computed } from 'vue'
import {
  getPage,
  SearchData,
  viewAdvice,
  exportData
} from '@/api/service/Storage/PlannedOutbound/Verification'
import { cloneDeep } from 'lodash'
import { ElMessage } from 'element-plus'
import { formatValue } from '@/utils/utils'
import { useProcess } from '@/hooks/useProcess'
import { getPublicCodeList } from '@/api/common'

const userDialogRef = ref<any>()
const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const searchCriteriaRef = ref<InstanceType<typeof SearchCriteria>>()
const formRefs = ref<InstanceType<typeof PrimaryTable>[]>([])
const editPageRef = ref<InstanceType<typeof CentralizedModification>>()
const viewAdviceRef = ref<InstanceType<typeof ViewAdvice>>()
const selectData = ref<any>({
  id: '',
  xmlx: ''
}) //弹窗参数

const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})

const disabled = computed(
  () => formRefs.value.length !== 0 && formRefs.value[globalParams.selTab].gridOptions.loading
)
const isSelected = computed(
  () =>
    formRefs.value.length !== 0 &&
    formRefs.value[globalParams.selTab].gridRef &&
    formRefs.value[globalParams.selTab].gridRef.getCheckboxRecords().filter((item: any) => item.id)
      .length === 0
)

const setFormRef = (index: any) => (el: any) => {
  if (el) {
    formRefs.value[index] = el
  }
}

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: ''
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const globalParams = reactive<any>({
  bmId: '',
  dwId: '',
  roleId: '',
  selTab: '1',
  page: 1,
  limit: 20,
  total: 0,
  isShowPage: false,
  userInfo: null,
  infoType: '省级统筹项目',
  tabs: []
})

const changeTabs = (val: string) => {
  getPageData()
}

const columns = reactive<any>([
  {
    type: 'checkbox',
    width: 80
  },
  {
    title: '项目编码',
    field: 'xmbm'
  },
  {
    title: '项目名称',
    field: 'xmmc',
    width: '180'
  },
  {
    title: '项目类型',
    field: 'protypeName'
  },
  {
    title: '一级单位',
    field: 'yjdw'
  },
  {
    title: '二级单位',
    field: 'ejdw'
  },
  {
    title: '成本中心',
    field: 'applyCenter'
  },
  {
    title: '申报金额（万元）',
    field: 'amount',
    align: 'right',
    formatter({ cellValue }: any) {
      return formatValue(cellValue.toString(), 6)
    }
  },
  {
    title: '计划实施年份',
    field: 'jhssnd'
  },
  {
    title: '重点投向',
    field: 'zdtx'
  },
  {
    title: '省归口部门',
    field: 'sgkbm'
  },
  {
    title: '预算事项名称',
    field: 'zyssxmc'
  },
  {
    title: '预算事项说明',
    field: 'remark'
  },
  {
    title: '一级分类',
    field: 'yjfl'
  },
  {
    title: '二级分类',
    field: 'ejfl'
  },
  {
    title: '三级分类',
    field: 'sjfl'
  },
  {
    title: '实施部门',
    field: 'ssbm'
  },
  {
    title: '项目实施人',
    field: 'xmssr'
  },
  {
    title: '研发投入统计范围',
    field: 'zyfjftrtjfw'
  },
  {
    title: '预期成果',
    field: 'zyqcgbm'
  },
  {
    title: '研发投入百分比',
    field: 'jryftrbfb'
  },
  {
    title: '百分比说明',
    field: 'bfbjsfssm'
  },
  {
    title: '是否安全生产',
    field: 'sfaqsc'
  },
  {
    title: '安全生产费用类型',
    field: 'aqscfylx'
  },
  {
    title: '线路类型',
    field: 'xllx'
  },
  {
    title: '电压等级',
    field: 'dydj'
  },
  {
    title: '项目实施内容',
    field: 'ssnr'
  },
  {
    title: '项目建议书（数量）',
    field: 'xmjys',
    width: '180'
  },
  {
    title: '可研（数量）',
    field: 'ky'
  },
  {
    title: '批复文件（数量）',
    field: 'pfwj'
  }
])

const tableData = ref([])

const handleProMsgView = () => {
  const $grid = formRefs.value[globalParams.selTab].gridRef
  if ($grid) {
    const records = $grid.getCheckboxRecords().filter((item: any) => item.id)
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行操作!')
      return
    }
    if (selectData.value) {
      selectData.value['id'] = records[0].id
      selectData.value['xmlx'] = records[0].protypeId
    }
    if (editPageRef.value) editPageRef.value.isShowModal = true
  }
}

const handleViewAdvice = async () => {
  const $grid = formRefs.value[globalParams.selTab].gridRef
  if ($grid) {
    const records = $grid.getCheckboxRecords().filter((item: any) => item.id)
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行操作!')
      return
    }
    const id = records[0].id
    try {
      const res = await viewAdvice(id)
      if (res.success && res.data) {
        viewAdviceRef.value?.acceptParams({
          isView: true,
          title: '核定意见-查看',
          row: res.data
        })
      } else {
        throw new Error('核定意见为空!')
      }
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  }
}

const handleSubmitData = async (flag: string) => {
  const $grid = formRefs.value[globalParams.selTab].gridRef
  const msg = flag === 'Y' ? '通过' : '驳回'
  if ($grid) {
    const records = $grid.getCheckboxRecords().filter((item: any) => item.id)
    if (records && records.length === 0) {
      ElMessage.warning('请至少选择一条数据进行操作!')
      return
    }
    const flowStatus = records.some((item: RowVo) => item.flowStatus !== '310')
    if (flowStatus) {
      ElMessage.warning('项目需求已核定，无需重复维护!')
      return
    }
    const ids = records.map((item: RowVo) => item.id)
    viewAdviceRef.value?.acceptParams({
      isView: false,
      title: '核定意见-' + msg,
      getTableList: getPageData,
      row: {
        nckPassUserName: '',
        nckPassTime: '',
        nckApprovedOpinions: ''
      },
      otherData: {
        res: flag,
        ids: ids
      }
    })
  }
}

const handleViewProcess = async () => {
  const $grid = formRefs.value[globalParams.selTab].gridRef
  if ($grid) {
    const records = $grid.getCheckboxRecords().filter((item: any) => item.id)
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行操作!')
      return
    }
    useProcess(records, processData)
  }
}

const handleExportData = async () => {
  formRefs.value[globalParams.selTab]!.gridOptions.loading = true
  if (searchCriteriaRef.value) {
    const searchParams = cloneDeep(searchCriteriaRef.value.formData as SearchData)
    if (typeof searchParams['xmbms'] === 'string') {
      if (searchParams['xmbms']) {
        const xmbms = searchParams['xmbms'] as string
        searchParams['xmbms'] = xmbms.split(',')
      } else {
        searchParams['xmbms'] = []
      }
    }
    exportData({
      ...searchParams,
      ysly: globalParams.selTab,
      page: Number(globalParams.page),
      limit: Number(globalParams.limit),
      dwId: globalParams.dwId,
      bmId: globalParams.bmId,
      roleId: globalParams.roleId
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
      formRefs.value[globalParams.selTab].gridOptions.loading = false
    })
  }
}

const getRoleHandle = async () => {
  try {
    if (userDialogRef.value) {
      const isQuery = userDialogRef.value.isQuery
      globalParams.bmId = userDialogRef.value.userMsg.specialorgid
      globalParams.dwId = userDialogRef.value.userMsg.org_id
      globalParams.roleId = userDialogRef.value.userMsg['role_id']
      globalParams.userInfo = userDialogRef.value.userMsg
      userInfo.value = {
        deptId: userDialogRef.value.userMsg['specialorgid'],
        deptName: userDialogRef.value.userMsg['specialorgname'],
        dwId: userDialogRef.value.userMsg['org_id'],
        dwName: userDialogRef.value.userMsg['org_name']
      }
      const res = await getPageData()
      if (isQuery && res) {
        globalParams.isShowPage = true
      }
    }
  } catch (e) {
    console.error(e)
  }
}

// 获取项目列表
const getPageData = async (): Promise<boolean> => {
  try {
    if (searchCriteriaRef.value) {
      if (formRefs.value[globalParams.selTab]) {
        formRefs.value[globalParams.selTab].gridOptions.loading = true
      }

      const searchParams = cloneDeep(searchCriteriaRef.value.formData as SearchData)
      if (typeof searchParams['xmbms'] === 'string') {
        if (searchParams['xmbms']) {
          const xmbms = searchParams['xmbms'] as string
          searchParams['xmbms'] = xmbms.split(',')
        } else {
          searchParams['xmbms'] = []
        }
      }
      const res = await getPage({
        ...searchParams,
        ysly: globalParams.selTab,
        page: Number(globalParams.page),
        limit: Number(globalParams.limit),
        dwId: globalParams.dwId,
        bmId: globalParams.bmId,
        roleId: globalParams.roleId
      })
      if (res.success && res.data) {
        tableData.value = res.data.records
        globalParams.total = res.data.total

        formRefs.value[globalParams.selTab].acceptParams({
          columns: columns,
          data: tableData.value,
          page: globalParams.page,
          limit: globalParams.limit,
          total: globalParams.total,
          getTableList: getPageData
        })
        return true
      } else {
        throw new Error(res.msg)
      }
    } else {
      throw new Error('请重新再试!')
    }
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message)
    return false
  } finally {
    formRefs.value[globalParams.selTab]!.gridOptions.loading = false
  }
}

const getPublicCodeData = async () => {
  const res = await getPublicCodeList({
    codes: ['XMLB_YSLY']
  })
  if (res.success) {
    globalParams.tabs = res.data['XMLB_YSLY']
  }
}

const initData = () => {
  if (userDialogRef.value) {
    userDialogRef.value.getUser()
  }
}

onMounted(() => {
  getPublicCodeData()
  initData()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;

  .operation {
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

:deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  .el-tabs__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;

    .el-tab-pane {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }
  }
}
</style>
