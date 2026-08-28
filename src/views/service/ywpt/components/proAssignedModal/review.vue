<template>
  <vxe-modal
    @close="closeHandle"
    :title="'添加退改需求'"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="70%"
    height="820"
    resize
    show-zoom
    position="center"
  >
    <ProTable
      @row-click="rowClick"
      @search="clearSelect"
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
        <el-button
          :disabled="!scope['isSelected']"
          size="mini"
          type="primary"
          plain
          @click="handleIAssigned(scope['selectedList'])"
        >
          添加退改需求
        </el-button>
        <el-button size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
      </template>
      <template #headerButton>
        <el-tabs>
          <el-tab-pane label="添加退改需求项目清单" name="0"></el-tab-pane>
        </el-tabs>
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="tsx">
export default {
  name: 'proAssignedModal'
}
</script>

<script setup lang="tsx">
import { ref, reactive } from 'vue'
import { pageCxnrhsXmInfo, exportCxnrhsXmInfo, cxnrhs } from '@/api/service/jointReview'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  getCommonCodeByParentCode,
  getSubProtypeTree,
  getYjdwFromCm,
  getPublicData
} from '@/api/common'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { VXETable } from 'vxe-table'
import { apiExportHandle } from '@/utils/export'

interface ModalProps {
  title: string
  pageFlag: string
  isView: boolean
  row: Partial<any>
  btnPermissions: string[]
  getTableList?: () => void
}

const proTableRef = ref()
const emit = defineEmits(['includeInReview'])

const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])
const searchData: any = ref([])

const rowClick = (row: any) => {
  clearSelect()
  proTableRef.value?.element.toggleRowSelection(row)
}

const modalProps = ref<ModalProps>({
  isView: false,
  title: '',
  pageFlag: '',
  row: {},
  btnPermissions: []
})

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  ndDataList.value.length = 0
  projectTypeList.value.length = 0
}

const clearSelect = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
}

// 导出
const exportHandle = (val: any) => {
  try {
    loading.value = true
    const params = { ...searchData.value }
    const fileName = '项目明细表'
    apiExportHandle(params, fileName, exportCxnrhsXmInfo)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}

const handleIAssigned = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('请确认？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      const originXmIdList = selectedList.map(({ xmId }: any) => xmId)
      const res = await cxnrhs({
        ...modalProps.value.row,
        originXmIdList: originXmIdList
      })
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('添加退改需求成功!')
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
      ElMessage.error(res.msg)
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
      order: 6,
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
  { prop: 'isPack', label: '是否打捆项目', width: '100' },
  {
    prop: 'proType',
    label: '项目类型',
    width: '280',
    search: {
      order: 4,
      render: (scope: any) => {
        return (
          <ElTreeSelect
            clearable
            data={projectTypeList.value}
            props={proTypeProps}
            nodeKey={'middleId'}
            modelValue={scope.modelValue}
          />
        )
      }
    }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: changeEjdwEnum }, order: 2 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: '180',
    search: { el: 'select', order: 3 },
    enum: ejdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
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
    search: { el: 'select', order: 4 },
    width: '140',
    enum: ndDataList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.jhssnd
    }
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
    prop: 'zyssxmc',
    label: '预算事项名称',
    width: '280'
  },
  {
    prop: 'yssxmc',
    label: '预算事项名称',
    width: '280',
    search: {
      el: 'input',
      order: 5
    },
    isShow: false
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

const getPageList = (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  params['expertId'] = modalProps.value.row['expertId']
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  if (params['xmbmList'].length > 1000) {
    return ElMessage.error('项目编码最大支持1000条！')
  }
  searchData.value = { ...params }
  return pageCxnrhsXmInfo(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const modalVisible = ref(false)

const acceptParams = (params: ModalProps) => {
  getYjdwEnum()
  modalProps.value = { ...modalProps.value, ...params }
  getProjectData()
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
