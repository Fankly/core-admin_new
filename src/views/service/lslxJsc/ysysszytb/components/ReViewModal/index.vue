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
    :title="title"
  >
    <ProTable
      @row-click="rowClick"
      :title-msg="'纳入拟出库项目清单'"
      @search="clearSelectRow"
      @reset="clearSelectRaw"
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
        <el-button size="mini" type="primary" plain @click="handleAddPendingTrial('添加')" v-if="isView">添 加</el-button>
        <el-button size="mini" type="primary" plain @click="handleSaveProject" v-if="isView">保 存</el-button>
        <el-button :disabled="!scope['isSelected']" size="mini" type="primary" plain @click="handleDeleteData(scope['selectedList'])" v-if="isView"
          >删 除</el-button
        >
        <el-button :disabled="scope.selectedList.length != 1" size="mini" type="primary" plain @click="handleProView(scope['selectedList'])"
          >项目信息查看</el-button
        >
        <el-button size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
    </ProTable>
  </vxe-modal>
  <PendingTrialModal :form-data="formData" @include-in-review="clearSelect" ref="pendingTrialModalRef" />
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'" />
</template>

<script lang="tsx">
export default {
  name: 'ReViewModal'
}
</script>

<script setup lang="tsx">
import { ref, reactive } from 'vue'
import { removeZgkbmNckXm, exportLinkedNckXmInfoForZgkbmYs, pageLinkedNckXmInfoForZgkbmYs, updateZgkbmNckXm } from '@/api/lslxJsc/szyBmApi'
import { formatNumValue } from '@/utils/utils'
import { ElMessage, ElInput, ElSelect, ElOption } from 'element-plus'
import { h } from 'vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { getCommonCodeByParentCode, getSubProtypeTree, getYjdwFromCm, getPublicData } from '@/api/common'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import PendingTrialModal from '@/views/service/lslxJsc/ysysszytb/components/PendingTrialModal/index.vue'
import { VXETable } from 'vxe-table'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { apiExportHandle } from '@/utils/export'

interface ModalProps {
  title: string
  isView: boolean
  formData: any
}

const props = defineProps<ModalProps>()
const emit = defineEmits(['getClose'])

const proTableRef = ref()
const pendingTrialModalRef = ref()
const oldData = ref<any[]>([])
const newData = ref<any[]>([])

const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const userInfo = ref<any>() // 用户角色

const yjdwListData: any = ref([])
const ejdwListData: any = ref([])
const projectTypeList: any = ref([])
const ndDataList: any = ref([])
const xmxzList = ref<any[]>([])
const searchData = ref<any>({})

const rowClick = (row: any) => {
  clearSelectRow()
  proTableRef.value?.element.toggleRowSelection(row)
}

const loading = ref(false)
const modalVisible = ref(false)

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  projectTypeList.value.length = 0
  ndDataList.value.length = 0
  xmxzList.value.length = 0
  emit('getClose', true)
}

const getYjdwEnum = async () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  ndDataList.value.length = 0
  xmxzList.value.length = 0
  let res = await getYjdwFromCm()
  if (res.success) {
    yjdwListData.value.push(...res.data)
  } else {
    ElMessage.error(res.msg)
  }
  let list = await getPublicData('NDCX')
  if (list.success && list.data.length !== 0) {
    ndDataList.value.push(...list.data)
  }
  let root = await getPublicData('XMXZ')
  if (root.success && root.data.length !== 0) {
    xmxzList.value.push(...root.data)
  }
}

const clearSelect = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
const clearSelectRaw = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
}

const clearSelectRow = () => {
  proTableRef.value?.clearSelection()
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
  } else {
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
      ElMessage.error(res.msg)
    }
  })
}

const xmColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'versionNo',
    label: '版本编号',
    width: '120'
  },
  {
    prop: 'versionName',
    label: '版本名称',
    width: '180'
  },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '120',
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
    width: '180',
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
    prop: 'xmxz',
    label: '项目性质',
    width: '160',
    headerRender: () => {
      return h('i', { class: 'el-icon-edit-outline' }, '项目性质')
    },
    render: ({ row }: any) => {
      return h(
        ElSelect,
        {
          disabled: row.jhssnd == props.formData.nd || !props.isView,
          modelValue: row.xmxz,
          'onUpdate:modelValue': (val: any) => (row.xmxz = val),
          inputStyle: { border: '1px solid #fff;', textAlign: 'center' }
        },
        () =>
          xmxzList.value.map((option) =>
            h(ElOption, {
              key: option.code,
              label: option.name,
              value: option.code
            })
          )
      )
    }
  },
  {
    prop: 'sbje',
    label: '申报金额（不含税）',
    width: '180',
    headerRender: () => {
      return h('i', { class: 'el-icon-edit-outline' }, '申报金额（不含税）')
    },
    render: ({ row }: any) => {
      return h(ElInput, {
        disabled: row.jhssnd == props.formData.nd || row.xmxz == '0' || !props.isView,
        modelValue: row.sbje,
        'onUpdate:modelValue': (val: any) => {
          row.sbje = val
        },
        onBlur: () => {
          if (Number(row.sbje) < 0 || Number(row.sbje) > Number(row.amount)) {
            row.sbje = '0.000000'
            ElMessage.warning('申报金额不小于零且小于等于项目总金额')
          }
        },
        inputStyle: { border: '1px solid #fff;', textAlign: 'right' }
      })
    }
  },
  {
    prop: 'amount',
    label: '项目总金额',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => {
      const value = row.amount
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
    width: '150'
  },
  {
    prop: 'createor',
    label: '创建人',
    width: '100'
  }
])
const handleSaveProject = async () => {
  const updatalist: any[] = []
  newData.value.forEach((item: any, index: any) => {
    const row = oldData.value[index]
    if (item.xmbm == row.xmbm && (item.xmxz != row.xmxz || item.sbje != row.sbje)) {
      updatalist.push({
        xmId: item.xmId,
        xmxz: item.xmxz,
        sbje: item.sbje
      })
    }
  })
  if (updatalist.length == 0) return ElMessage.warning('暂无修改数据！')
  const type = await VXETable.modal.confirm('请确认要保存的数据。', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    const params = {
      ...props?.formData,
      xmInfoList: updatalist
    }
    const res: any = await updateZgkbmNckXm(params)
    if (res.success) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const handleAddPendingTrial = (title: string) => {
  const params = {
    title,
    getTableList: proTableRef.value?.getTableList
  }
  pendingTrialModalRef.value?.acceptParams(params)
}

const handleProView = (selectedList: any[]) => {
  selectData.value.id = selectedList[0].xmId
  selectData.value.xmlx = selectedList[0].proType
  editPageRef.value.isShowModal = true
}

const handleDeleteData = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('确认删除选择的项目？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let xmIdList = selectedList.map((item) => item.xmId)
      const res = await removeZgkbmNckXm({
        xmIdList: xmIdList,
        ...props.formData
      })
      if (!res.success) throw new Error(res.msg)
      clearSelect()
      ElMessage.success('删除成功!')
    } catch (e: any) {
      const errorMessage = e.message.replace(/^Error:\s*/i, '')
      ElMessage.error(errorMessage)
      console.error(e)
    } finally {
      loading.value = false
    }
  }
}

const handleExport = () => {
  try {
    const params = {
      ...searchData.value,
      ...props.formData
    }
    const fileName = '纳入拟出库项目清单'
    apiExportHandle(params, fileName, exportLinkedNckXmInfoForZgkbmYs)
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }
}

const getPageList = (params: any) => {
  loading.value = true
  params = { ...props?.formData, ...params }
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  searchData.value = { ...params }
  return pageLinkedNckXmInfoForZgkbmYs(params)
}

const callBackHandle = (val: any) => {
  if (val && val.records) {
    loading.value = false
    newData.value = val.records
    oldData.value = JSON.parse(JSON.stringify(val.records))
    return val
  }
}

const acceptParams = () => {
  getYjdwEnum()
  getProjectData()
  modalVisible.value = true
}

defineExpose({
  acceptParams
})
</script>
