<!-- 会议展示列表 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="tableTitle"
      :width="1200"
      :height="700"
      :close-on-press-escape="false"
      @close="closeSxModal"
      :loading="loading"
    >
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        :toolButton="['other']"
        :request-api="pageMeeting"
        :request-auto="false"
        :search-col="4"
        :columns="tableColumns"
        @row-click="handerClickTable"
      >
        <template #tableHeader="scope">
          <el-button
            size="mini"
            type="primary"
            :disabled="!scope.isSelected"
            plain
            @click="showProView(scope.selectedList)"
          >
            查 看
          </el-button>
          <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)">
            导 出
          </el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
  <hymxEcharts ref="hymxRef" />
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, defineEmits, nextTick, defineExpose } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import hymxEcharts from '@/views/service/jointReview/components/hymxEcharts.vue'
import { lhhsStatPageMeetingInfo, lhhsStatExportMeetingInfo } from '@/api/service/expertinformation'
import { formatNumValue } from '@/utils/utils'
import { ElNotification, ElMessage } from 'element-plus'
import { getPublicData } from '@/api/common'
import { apiExportHandle } from '@/utils/export'

// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const proTableRef = ref() // 初始化页面
const hymxRef = ref() // 初始化页面
const modalRef = ref()
const tableParams = ref<any>({})
const tableTitle = ref<any>('')
const isShowTable = ref<boolean>(false)
const apiType = ref<any>('1')
const loading = ref<boolean>(false)
const statusEnum = ref<any>([])


const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true
  const api: any = lhhsStatPageMeetingInfo
  params = { ...params, ...formData.value }
  tableParams.value = { ...formData.value }
  return api(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  val.records.forEach((item: any) => {
    item.statusName = item.status
  })
  return val
}
const closeSxModal = () => {
  isShowTable.value = false
  apiType.value = '1'
}

// 查看
const showProView = (selecList: any) => {
  if (selecList && selecList.length != 0) {
    hymxRef.value.isShowTable = true
    hymxRef.value.loading = true
    nextTick(() => {
      const parmas = {
        meetingIdList: selecList.map((item: any) => item.meetingId)
      }
      hymxRef.value.tableTitle = `组织会审-会议明细`
      hymxRef.value.formData = { ...parmas }
      hymxRef.value.getMeetingData()
    })
  } else {
    ElMessage.warning('请选择要查看的数据')
  }
}
// 导出
const handleExport = (val: any) => {
  try {
    loading.value = true
    const params = { ...formData.value }
    const fileName = '会议列表'
    apiExportHandle(params, fileName, lhhsStatExportMeetingInfo)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}

const getPublicCodeData = async () => {
  try {
    statusEnum.value.length = 0
    const res = await getPublicData('LHHS_MEETING_STATUS')
    if (!res.success) {
      throw new Error(res.msg)
    }
    const statusData: any[] = res.data
    for (let i = 0; i < statusData.length; i++) {
      const tagType = ['info', 'warning', 'success']
      if (i > 3) {
        statusData[i].tagType = 'danger'
      } else {
        statusData[i].tagType = tagType[i]
      }
    }
    statusEnum.value.push(...statusData)
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'status',
    label: '会议状态',
    enum: statusEnum.value,
    search: {
      el: 'select',
      order: 5
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  {
    prop: 'statusName',
    label: '会议状态',
    width: '120'
  },
  {
    prop: 'meetingCode',
    label: '会议编号',
    search: {
      el: 'input',
      order: 1
    },
    width: '120'
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 1
    },
    width: '180'
  },
  {
    prop: 'meetingAddr',
    label: '会议地点',
    width: '180'
  },
  {
    prop: 'organizer',
    label: '组织人',
    width: '80'
  },
  {
    prop: 'phone',
    label: '组织电话',
    width: '180'
  },
  {
    prop: 'startTime',
    label: '会议开始时间',
    width: '150',
    search: {
      el: 'date-picker',
      order: 3,
      props: {
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        onChange: (val: string) => {
          if (val && proTableRef.value?.searchParam.endTime) {
            const startTime = new Date(val).getTime()
            const endTime = new Date(proTableRef.value.searchParam.endTime).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.endTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'endTime',
    label: '会议结束时间',
    width: '150',
    search: {
      el: 'date-picker',
      order: 4,
      props: {
        type: 'datetime',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        onChange: (val: string) => {
          if (!val) {
            proTableRef.value.searchParam.startTime = ''
            return
          }
          if (val && proTableRef.value?.searchParam.startTime) {
            const startTime = new Date(proTableRef.value.searchParam.startTime).getTime()
            const endTime = new Date(val).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.startTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'major',
    label: '评审专业',
    width: '200'
  },
  {
    prop: 'xmNum',
    label: '评审项目数量',
    width: '120'
  },
  {
    prop: 'sumJe',
    label: '评审项目金额(万元)',
    width: '140',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sumJe
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  {
    prop: 'zjNum',
    label: '评审专家人数',
    width: '100'
  }
])

//

defineExpose({
  proTableRef,
  formData,
  tableTitle,
  isShowTable,
  apiType,
  loading,
  getPublicCodeData
})
</script>
<style scoped lang="less"></style>
