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
      title-msg="未纳入会审专家清单"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="expertColumns"
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

<script setup lang="tsx" name="PendingTrialExpertModal">
import { ref, defineExpose, reactive, defineEmits } from 'vue'
import { getDnrhszjPage, saveZj, YnrhsxmPage, YnrhszjPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { getCommonCodeByParentCode, getYjdwFromCm, getPublicData } from '@/api/common'
import { VXETable } from 'vxe-table'

interface ModalProps {
  title: string
  pageFlag: string
  jd: '1' | '2'
  isView: boolean
  pszyType: string
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
  jd: '1',
  pageFlag: '',
  pszyType: '',
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
      let ids = selectedList.map((item) => item.expertId)
      const res = await saveZj({
        ids: ids,
        pszyType: modalProps.value.pszyType || '',
        jd: modalProps.value['jd'],
        meetingId: modalProps.value.row['meetingId']
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('纳入会审成功!')
      modalProps.value.getTableList?.()
      modalVisible.value = false
      emit('includeInReview')
    } catch (e) {
      ElMessage.error((e as Error).message)
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

const expertColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'majorName',
    label: '专家专业',
    width: '120'
  },
  {
    prop: 'major',
    label: '专家专业',
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
  params['jd'] = modalProps.value['jd']
  params['meetingId'] = modalProps.value.row['meetingId']
  params['pszyType'] = modalProps.value.pszyType || ''
  params['expertNames'] = params['expertName'] ? params['expertName'].split(',') : []
  params['accounts'] = params['account'] ? params['account'].split(',') : []
  return getDnrhszjPage(params).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (val: any) => {
  return val
}

const modalVisible = ref(false)

const acceptParams = (params: ModalProps) => {
  getYjdwEnum()
  modalProps.value = { ...modalProps.value, ...params }
  getPublicCode()
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
