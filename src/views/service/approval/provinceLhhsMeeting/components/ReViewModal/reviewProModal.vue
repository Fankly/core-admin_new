<template>
  <vxe-modal
    @close="closeHandle"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="70%"
    height="820"
    resize
    position="center"
    show-zoom
    :title="modalProps.title"
  >
    <ProTable
      @row-click="rowClick"
      row-key="xmId"
      title-msg="已纳入会审项目清单"
      @search="clearSelectRow"
      @reset="clearSelect"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="programColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-show="isShowBtn('ADD')" size="mini" type="primary" plain @click="handleAddPendingTrial('添加')">添 加</el-button>
        <el-button
          :disabled="!scope['isSelected']"
          v-show="isShowBtn('DELETE')"
          size="mini"
          type="primary"
          plain
          @click="handleDeleteData(scope['selectedList'])"
          >删 除</el-button
        >
        <el-button v-show="isShowBtn('EXPORT')" size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
    </ProTable>
  </vxe-modal>
  <PendingTrialProModal @include-in-review="clearSelect" ref="pendingTrialProModalRef" />
</template>

<script setup lang="tsx" name="reViewProModal">
import { ref, reactive } from 'vue'
import {
  deleteYnrxmWhenPsz,
  deleteYnrxm,
  exportYnrxm,
  getYnrhsxmPage,
  YnrhsxmPage,
  YnrhszjPage
} from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { getCommonCodeByParentCode, getSubProtypeTree, getYjdwFromCm, getPublicData, getGkbmInProvince } from '@/api/common'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import PendingTrialProModal from '@/views/service/approval/provinceLhhsMeeting/components/pendingTrialModal/pendingTrialProModal.vue'
import { VXETable } from 'vxe-table'
import { downloadExportBlob } from '@/views/service/approval/provinceLhhsMeeting/utils/download'

interface ModalProps {
  title: string
  search?: () => void
  pageFlag: string
  isView: boolean
  row: Partial<any>
  btnPermissions: string[]
}

const proTableRef = ref()
const pendingTrialProModalRef = ref()
const modalVisible = ref(false)

const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const pszyListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])

const modalProps = ref<ModalProps>({
  isView: false,
  title: '',
  pageFlag: '',
  row: {},
  btnPermissions: []
})

const isShowBtn = (opType: string) => {
  return modalProps.value.btnPermissions.includes(opType)
}
const rowClick = (row: any) => {
  clearSelectRow()
  proTableRef.value?.element.toggleRowSelection(row)
}

const loading = ref(false)

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  pszyListData.value.length = 0
  projectTypeList.value.length = 0
  ndDataList.value.length = 0
}

const getYjdwEnum = async () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  ndDataList.value.length = 0
  let res = await getYjdwFromCm()
  if (res.success) {
    yjdwListData.value.push(...res.data)
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
  let list = await getPublicData('NDCX')
  if (list.success && list.data.length !== 0) {
    ndDataList.value.push(...list.data)
  }
}

const clearSelect = () => {
  ejdwListData.value.length = 0
  clearSelectRow()
  if (modalProps.value.search) {
    modalProps.value.search()
  }
}
const clearSelectRow = () => {
  proTableRef.value?.clearSelection()
}

const changeEjdwEnum = async (val: string) => {
  loading.value = true
  ejdwListData.value.length = 0
  proTableRef.value.searchParam.ejdw = ''
  if (val) {
    let res = await getCommonCodeByParentCode({
      code: 'DW_COM',
      parentCode: val
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

const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// 获取项目类型
const getProjectData = () => {
  loading.value = true
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      loading.value = false
      projectTypeList.value = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const programColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'meetingCode',
    label: '会议编号',
    width: '100'
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    width: '280'
  },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '180',
    search: {
      order: 0,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    width: '280',
    search: {
      el: 'input',
      order: 1
    }
  },
  // { prop: 'sfgmbName', label: '是否规模包', width: '100' },
  // { prop: 'gmbbm', label: '规模包编码', width: '180' },
  // { prop: 'gmbName', label: '规模包名称', width: '200' },
  { prop: 'isPackName', label: '是否打捆项目', width: '100' },
  {
    prop: 'proType',
    label: '项目类型',
    width: '280',
    search: {
      order: 4,
      render: (scope: any) => {
        return <ElTreeSelect clearable data={projectTypeList.value} props={proTypeProps} nodeKey={'middleId'} modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'ysly',
    search: {
      el: 'select',
      order: 5,
      props: {
        disabled: true
      }
    },
    enum: () => getPublicData('XMLB_YSLY'),
    fieldNames: { label: 'name', value: 'code' },
    label: '预算来源',
    render: ({ row }: any) => {
      return row.ysly
    },
    width: '100'
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    isShow: false,
    search: { el: 'select', props: { onChange: changeEjdwEnum }, order: 2 },
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
    width: '180',
    search: { el: 'select', order: 3 },
    enum: ejdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'ejdwName',
    label: '二级单位',
    width: '180'
  },
  {
    prop: 'applyCenter',
    label: '成本中心',
    width: '180'
  },
  {
    prop: 'amount',
    label: '申报金额（万元）',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6) as string
    }
  },
  {
    prop: 'jhssnd',
    label: '计划实施年份',
    search: { el: 'select', order: 6 },
    enum: ndDataList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'jhssndName',
    label: '计划实施年份',
    width: '140'
  },
  {
    prop: 'zdtxName',
    label: '重点投向',
    width: '180'
  },
  {
    prop: 'zgkbm',
    label: '专业部门',
    width: '180'
  },
  {
    prop: 'zgkbmId',
    label: '专业部门',
    search: {
      el: 'select',
      order: 7,
      props: {
        disabled: true
      }
    },
    enum: () => getGkbmInProvince(),
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'yssxmc',
    label: '预算事项名称',
    search: { el: 'input', order: 8 },
    width: '280',
    render: ({ row }: any) => {
      return row.zyssxmc
    }
  },
  {
    prop: 'remark',
    label: '预算事项说明',
    width: '280'
  },
  {
    prop: 'yjfl',
    label: '一级分类',
    width: '140'
  },
  {
    prop: 'ejfl',
    label: '二级分类',
    width: '140'
  },
  {
    prop: 'sjfl',
    label: '三级分类',
    width: '140'
  },
  {
    prop: 'fzrbh',
    label: '实施部门',
    width: '180'
  },
  {
    prop: 'xmssr',
    label: '项目实施人',
    width: '180'
  },
  {
    prop: 'zyfjftrtjfw',
    label: '研发投入统计范围',
    width: '180'
  },
  {
    prop: 'zyqcgbm',
    label: '预期成果',
    width: '180'
  },
  {
    prop: 'jryftrbfb',
    label: '研发投入百分比',
    width: '180'
  },
  {
    prop: 'bfbjsfssm',
    label: '百分比说明',
    width: '180'
  },
  {
    prop: 'sfaqsc',
    label: '是否安全生产',
    width: '140'
  },
  {
    prop: 'aqscfylx',
    label: '安全生产费用类型',
    width: '180'
  },
  {
    prop: 'xllx',
    label: '线路类型',
    width: '180'
  },
  {
    prop: 'dydj',
    label: '电压等级',
    width: '140'
  },
  {
    prop: 'ssnr',
    label: '项目实施内容',
    width: '280'
  },
  {
    prop: 'xmjys',
    label: '项目建议书（数量）',
    width: '140'
  },
  {
    prop: 'ky',
    label: '可研（数量）',
    width: '140'
  },
  {
    prop: 'pfwj',
    label: '批复文件（数量）',
    width: '140'
  }
])

const handleAddPendingTrial = (title: string) => {
  const params = {
    title,
    pageFlag: modalProps.value.pageFlag,
    isView: title === '查看',
    isPsz: modalProps.value.isView,
    row: { ...modalProps.value.row },
    getTableList: proTableRef.value?.getTableList
  }
  pendingTrialProModalRef.value?.acceptParams(params)
}

const handleDeleteData = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let ids = selectedList.map((item) => item.xmId)
      const api = modalProps.value.isView ? deleteYnrxm : deleteYnrxmWhenPsz
      const res = await api({
        ids: ids,
        meetingId: modalProps.value.row['meetingId']
      })
      if (!res.success) throw new Error(res.msg)
      clearSelect()
      proTableRef.value?.getTableList()
      ElMessage.success('删除成功!')
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }
}

const handleExport = async () => {
  loading.value = true
  let params = {
    ...proTableRef.value?.searchParam
  }
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  try {
    const blob: any = await exportYnrxm(params)
    downloadExportBlob(blob, '已纳入会审项目清单.xlsx')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const getPageList = (params: YnrhsxmPage & YnrhszjPage) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  return getYnrhsxmPage(params).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (val: any) => {
  val.records.forEach((item: any) => {
    item.jhssndName = item.jhssnd
  })
  return val
}

const acceptParams = (params: ModalProps) => {
  getYjdwEnum()
  modalProps.value = { ...modalProps.value, ...params }
  programColumns.forEach((item: any) => {
    if (item.prop == 'ysly') {
      item.search.defaultValue = modalProps.value.row['ysly']
    }
    if (item.prop == 'zgkbmId') {
      item.search.defaultValue = modalProps.value.row['bmId']
    }
  })
  getProjectData()
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
