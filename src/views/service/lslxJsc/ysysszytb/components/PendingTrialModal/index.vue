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
    :title="'添加'"
  >
    <ProTable
      @row-click="rowClick"
      @search="clearSelectRow"
      @reset="clearSelect"
      :title-msg="'未纳入拟出库项目清单'"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="xmColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" plain @click="handleSelectAll">全 选</el-button>
        <el-button size="mini" type="primary" plain @click="handleInverseSelect">反 选</el-button>
        <el-button :disabled="scope.selectedList.length != 1" size="mini" type="primary" plain @click="handleProView(scope['selectedList'])"
          >项目信息查看</el-button
        >
        <el-button :disabled="!scope['isSelected']" size="mini" type="primary" plain @click="handleIncludeInReview(scope['selectedList'])"
          >添加</el-button
        >
      </template>
    </ProTable>
  </vxe-modal>
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'" />
</template>

<script lang="tsx">
export default {
  name: 'PendingTrialModal'
}
</script>

<script setup lang="tsx">
import { ref, defineExpose, reactive, defineEmits } from 'vue'
import { pageUnLinkedNckXmInfoForZgkbmYs, addZgkbmNckXm } from '@/api/lslxJsc/szyBmApi'
import { formatNumValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { getCommonCodeByParentCode, getSubProtypeTree, getYjdwFromCm, getPublicData } from '@/api/common'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { VXETable } from 'vxe-table'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'

interface ModalProps {
  title: string
  pageFlag: string
  row: Partial<any>
  btnPermissions: string[]
  getTableList?: () => void
}

interface reviewData {
  version: string
  zgkbmId: string
  nd: string
}
interface ViewProps {
  formData: any
}
const props = defineProps<ViewProps>()
const emit = defineEmits(['includeInReview'])

const proTableRef = ref()
const editPageRef = ref() //弹窗元素

const selectData = ref<any>({}) //弹窗参数
const userInfo = ref<any>() // 用户角色
const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const pszyListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])

const rowClick = (row: any) => {
  clearSelectRow()
  proTableRef.value?.element.toggleRowSelection(row)
}

const closeHandle = () => {
  yjdwListData.value.lengt = 0
  ejdwListData.value.lengt = 0
  pszyListData.value.lengt = 0
  ndDataList.value.lengt = 0
  projectTypeList.value.lengt = 0
  modalVisible.value = false
}

const handleSelectAll = () => {
  const tableData = proTableRef.value?.tableData
  if (!tableData) return
  tableData.forEach((row: any) => {
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

const handleProView = (selectedList: any[]) => {
  selectData.value.id = selectedList[0].xmId
  selectData.value.xmlx = selectedList[0].proType
  editPageRef.value.isShowModal = true
}

const handleIncludeInReview = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('确认将选中项纳入拟出库项目清单？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let xmIdList = selectedList.map((item) => item.xmId)
      const res = await addZgkbmNckXm({ xmIdList: xmIdList, ...props.formData })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('添加成功!')
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

const xmColumns = reactive<any[]>([
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
  {
    prop: 'proType',
    label: '项目类型',
    width: '280',
    search: {
      order: 4,
      render: (scope: any) => {
        return <ElTreeSelect clearable data={projectTypeList.value} props={proTypeProps} nodeKey={'middleId'} modelValue={scope.modelValue} />
      }
    },
    render: ({ row }: any) => {
      return row.proTypeName
    }
  },
  {
    prop: 'jhssnd',
    label: '计划实施年份',
    search: { el: 'select', order: 4 },
    enum: ndDataList.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '120',
    render: ({ row }: any) => {
      const value = row.jhssnd
      if (value === undefined || value === null) return '-'
      return value
    }
  },
  {
    prop: 'xmxzName',
    label: '项目性质',
    width: '120'
  },
  // {
  //   prop: 'sbje',
  //   label: '申报金额（不含税）',
  //   width: '180',
  //   align: 'right',
  //   headerAlign: 'center',
  //   render: (scope: any) => {
  //     const value = scope.row.sbje
  //     if (value === undefined || value === null) return '-'
  //     return formatNumValue(value, 6) as string
  //   }
  // },
  {
    prop: 'amount',
    label: '项目总金额',
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
    prop: 'zdtx',
    label: '重点投向',
    width: '180'
  },
  {
    prop: 'yssxmc',
    label: '预算事项',
    width: '180',
    search: {
      el: 'input',
      order: 5
    }
  },
  {
    prop: 'sjfl',
    label: '三级分类',
    width: '140'
  },
  {
    prop: 'zgkbm',
    label: '省归口部门',
    width: '180'
  },
  {
    prop: 'applyCenter',
    label: '成本中心',
    width: '180'
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: '180'
  },
  {
    prop: 'createor',
    label: '创建人',
    width: '120'
  }
])

const getPageList = (params: any) => {
  loading.value = true
  params = { ...params, ...props?.formData }
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  return pageUnLinkedNckXmInfoForZgkbmYs(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const modalVisible = ref(false)

const acceptParams = () => {
  getYjdwEnum()
  getProjectData()
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
