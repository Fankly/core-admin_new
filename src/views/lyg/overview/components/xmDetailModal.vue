<template>
  <vxe-modal resize show-zoom v-model="isShowModal" destroy-on-close :title="modalTitle" fullscreen width="50%" @close="handleClose">
    <ProTable
      @search="resetTable"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
      height="100%"
    >
      <template #tableHeader>
        <el-button @click="handleExport" size="mini" type="primary">导 出</el-button>
      </template>
    </ProTable>
  </vxe-modal>
</template>

<script lang="tsx">
export default {
  name: 'xmDetailModal'
}
</script>

<script setup lang="tsx">
import { ref, reactive, nextTick, h } from 'vue'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { apiExportHandle } from '@/utils/export'
import ProTable from '@/components/ProTablePage/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'

interface propsVo {
  exportApi: (params: any) => Promise<any> // 下载模板的Api
  getTableList: (params: any) => Promise<any> // 查询
}
const props = defineProps<propsVo>()

const isShowType = ref<string>()
const getParams = ref()
const exportParams = ref()

const isShowModal = ref(false)
const loading = ref(false)
const proTableRef = ref<any>(null)
const modalTitle = ref('')
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  proTableRef.value?.clearSelection()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    // proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  param = {
    ...param,
    ...getParams.value
  }
  param.pspidList = param.pspid ? param.pspid.split(',') : []
  exportParams.value = { ...param }
  return props.getTableList({ ...param })
}

/** 重置表单数据与校验状态 */
const resetForm = () => {
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

// 导出
const handleExport = () => {
  const fileName = '项目信息明细'
  apiExportHandle({ ...exportParams.value }, fileName, props.exportApi)
}

const initParamLists = async (specialorgid: string) => {
  yjdwList.value.length = 0
  projectTypeList.value.length = 0
  let res: any = await getYjdwList({ bmId: getParams.value.bmId, dwId: getParams.value.dwId })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }

  let xmlx = await getSubProtypeTree()
  if (xmlx.success && xmlx.data.length !== 0) {
    projectTypeList.value.push(...xmlx.data)
  }
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.qkjejdw = ''
  params.qkjgkbm = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  const param = {
    YJDW: val,
    parentCode: val,
    bmId: getParams.value.bmId,
    dwId: getParams.value.dwId
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
  let gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'zyear',
    label: '年度',
    width: 80,
    search: { el: 'select', order: 5 },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'pspid',
    label: '项目编码',
    width: 150,
    search: {
      order: 7,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    }
  },
  { prop: 'post1', label: '项目名称', width: 180, search: { el: 'input', order: 8 } },
  {
    prop: 'qkjxmlxbmList',
    label: '项目类型',
    width: 150,
    search: {
      order: 3,
      render: (scope: any) => {
        return (
          <ElTreeSelect
            showCheckbox
            collapseTags
            clearable
            data={projectTypeList.value}
            props={proTypeProps}
            nodeKey={'middleId'}
            modelValue={scope.modelValue}
          />
        )
      }
    },
    render: ({ row }: any) => {
      return row.qkjxmlxmc
    }
  },
  {
    prop: 'qkjyjdw',
    label: '一级单位',
    width: 150,
    search: { el: 'select', props: { onChange: selectChange }, order: 1 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjyjdw
    }
  },
  {
    prop: 'qkjejdwList',
    label: '二级单位',
    width: 150,
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true } },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjejdw
    }
  },
  {
    prop: 'qkjgkbmList',
    label: '项目归口部门',
    width: 150,
    search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true } },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjgkbm
    }
  },
  { prop: 'projectManagerName', label: '责任人', width: 150, search: { el: 'input', order: 6 } },
  { prop: 'projectProgress', label: '项目阶段', width: 150 },
  { prop: 'yjlx', label: '预警类型', width: 150 },
  { prop: 'xmckrq', label: '项目出库日期', width: 150, isShow: false },
  { prop: 'firstWinBidDate', label: '项目中标日期', width: 150, isShow: false },
  { prop: 'erdat', label: '项目立项日期', width: 150, isShow: false },
  { prop: 'cqts', label: '超期天数', width: 120 },
  {
    prop: 'sfqxyj',
    label: '是否取消预警',
    width: 120,
    search: { el: 'select', order: 7, defaultValue: '0' },
    enum: () => getPublicData('GY_SF'),
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.sfqxyj
    }
  },
  { prop: 'yjfqsj', label: '预警发起时间', width: 120 },
  { prop: 'yjlcwcsj', label: '预警流程完成时间', width: 120 },
  { prop: 'yysm', label: '原因说明', width: 200, align: 'right', headerAlign: 'center' }
])
/** 打开弹窗 */
const acceptParams = async (params: any) => {
  modalTitle.value = params.name
  isShowType.value = params.key
  getParams.value = { ...params }
  isShowModal.value = true
  if (getParams.value) initParamLists(getParams.value.bmId)
  tableColumns.forEach((item: any) => {
    if (['xmckrq', 'firstWinBidDate', 'erdat'].includes(item.prop)) {
      if (getParams.value.prop == item.prop) {
        item.isShow = true
      } else {
        item.isShow = false
      }
    }
  })
}
defineExpose({ acceptParams })
</script>
