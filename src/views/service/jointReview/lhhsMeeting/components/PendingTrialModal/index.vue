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
      @search="clearSelectRow"
      @reset="clearSelect"
      :title-msg="modalProps.pageFlag === 'PROGRAM' ? '未纳入会审项目清单' : '未纳入会审专家清单'"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="modalProps.pageFlag !== 'PROGRAM'"
      :search-col="4"
      :columns="modalProps.pageFlag === 'PROGRAM' ? programColumns : expertColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="handleSelectAll">全 选</el-button>
        <el-button size="mini" type="primary" plain @click="handleInverseSelect">反 选</el-button>
        <el-button :disabled="!scope['isSelected']" size="mini" type="primary" plain @click="handleIncludeInReview(scope['selectedList'])"
          >纳入会审</el-button
        >
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="tsx">
export default {
  name: 'PendingTrialModal'
}
</script>

<script setup lang="tsx">
import { ref, defineExpose, reactive, defineEmits } from 'vue'
import { getDnrhsxmPage, getDnrhszjPage, saveXm, saveXmWhenPsz, saveZj, YnrhsxmPage, YnrhszjPage } from '@/api/service/IhhsMeeting'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { getCommonCodeByParentCode, getSubProtypeTree, getYjdwFromCm, getPublicData, getGkbmInProvince } from '@/api/common'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { VXETable } from 'vxe-table'

interface ModalProps {
  title: string
  pageFlag: string
  isView: boolean
  isPsz: boolean
  row: Partial<any>
  btnPermissions: string[]
  getTableList?: () => void
}

const proTableRef = ref()
const emit = defineEmits(['includeInReview'])

const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const pszyListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])

const rowClick = (row: any) => {
  clearSelectRow()
  proTableRef.value?.element.toggleRowSelection(row)
}

const modalProps = ref<ModalProps>({
  isView: false,
  title: '',
  pageFlag: '',
  row: {},
  isPsz: false,
  btnPermissions: []
})

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  pszyListData.value.length = 0
  ndDataList.value.length = 0
  projectTypeList.value.length = 0
}

const handleSelectAll = () => {
  const tableData = proTableRef.value?.tableData
  if (!tableData) return
  tableData.forEach((row: YnrhsxmPage & YnrhszjPage) => {
    proTableRef.value?.element?.toggleRowSelection(row, true)
  })
}
const handleInverseSelect = () => {
  const tableData = proTableRef.value?.tableData
  if (!tableData) return
  tableData.forEach((row: any) => {
    proTableRef.value?.element?.toggleRowSelection(row)
  })
}

const clearSelect = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
}

const clearSelectRow = () => {
  proTableRef.value?.clearSelection()
}

const handleIncludeInReview = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('确认将选中项纳入会审？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let ids = modalProps.value.pageFlag === 'PROGRAM' ? selectedList.map((item) => item.xmId) : selectedList.map((item) => item.expertId)
      const api = modalProps.value.pageFlag === 'PROGRAM' ? (modalProps.value?.isPsz ? saveXm : saveXmWhenPsz) : saveZj
      const res = await api({
        ids: ids,
        meetingId: modalProps.value.row['meetingId']
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('纳入会审成功!')
      modalProps.value.getTableList?.()
      modalVisible.value = false
      emit('includeInReview')
    } catch (e: any) {
      ElMessage.error(e.toString())
      console.error(e)
    } finally {
      loading.value = false
    }
  }
}

const loading = ref(false)

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

const getPublicCode = async () => {
  pszyListData.value.length = 0
  let list = await getPublicData('MAJOR_COM')
  if (list.success) {
    pszyListData.value.push(...list.data)
  } else {
    ElMessage.error(list.msg)
  }
}

const changeEjdwEnum = async (val: string) => {
  ejdwListData.value.length = 0
  proTableRef.value.searchParam.ejdw = ''
  if (val) {
    let res = await getCommonCodeByParentCode({
      code: 'DW_COM',
      parentCode: val
    })
    if (res.success) {
      ejdwListData.value.push(...res.data)
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// 获取项目类型
const getProjectData = () => {
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      projectTypeList.value = res.data
    } else {
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
      defaultValue: modalProps.value.row['ysly'],
      props: {
        disabled: modalProps.value.row['ysly']
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
    search: { el: 'select', props: { onChange: changeEjdwEnum }, order: 2 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
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
    label: '省归口部门',
    width: '180'
  },
  {
    prop: 'zgkbmId',
    label: '省归口部门',
    search: { el: 'select', order: 7 },
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
const expertColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'majorName',
    label: '评审专业',
    width: '120'
  },
  {
    prop: 'major',
    label: '评审专业',
    isShow: false,
    search: {
      el: 'select',
      order: 5
    },
    enum: pszyListData.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'expertName',
    label: '专家姓名',
    width: '80',
    search: {
      order: 3,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'sex',
    label: '专家性别',
    width: '80'
  },
  {
    prop: 'account',
    label: '统一权限账号',
    width: '110',
    search: {
      order: 4,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'phoneNo',
    label: '联系方式',
    width: '110'
  },
  {
    prop: 'mail',
    label: '邮箱',
    width: '180'
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: changeEjdwEnum }, order: 1 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'yjdwName',
    label: '一级单位',
    width: '180'
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: '280',
    search: { el: 'select', order: 2 },
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
    prop: 'deptName',
    label: '所属部门',
    width: '180'
  },
  {
    prop: 'remark',
    label: '备注',
    width: '180',
    search: {
      el: 'input',
      order: 6
    }
  }
])

const getPageList = (params: YnrhsxmPage & YnrhszjPage) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  if (modalProps.value.pageFlag === 'PROGRAM') {
    params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  } else {
    params['expertNames'] = params['expertName'] ? params['expertName'].split(',') : []
    params['accounts'] = params['account'] ? params['account'].split(',') : []
  }

  const api = modalProps.value.pageFlag === 'PROGRAM' ? getDnrhsxmPage : getDnrhszjPage
  return api(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  if (modalProps.value.pageFlag === 'PROGRAM') {
    val.records.forEach((item: any) => {
      item.jhssndName = item.jhssnd
    })
  }
  return val
}

const modalVisible = ref(false)

const acceptParams = (params: ModalProps) => {
  getYjdwEnum()
  modalProps.value = { ...modalProps.value, ...params }
  if (params.pageFlag === 'PROGRAM') {
    programColumns.forEach((item: any) => {
      if (item.prop == 'ysly') {
        item.search.defaultValue = modalProps.value.row['ysly']
        item.search.props.disabled = modalProps.value.row['ysly'] ? true : false
      }
    })
    getProjectData()
  } else {
    getPublicCode()
  }
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
