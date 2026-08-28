<template>
  <vxe-modal
    position="center"
    :loading="loading"
    :destroy-on-close="true"
    v-model="isShow"
    width="70%"
    height="720"
    title="市级联合会审评审报告流转情况"
    show-zoom
    @close="closeDialogHandle"
  >
    <div class="container">
      <el-tabs type="card" v-model="processTab">
        <el-tab-pane label="流程履历" name="process">
          <ProTable
            :data-callback="dataCallBack"
            :tool-button="['other']"
            :request-api="getPageList"
            :request-auto="true"
            :search-col="4"
            :columns="columns"
            ref="proTableRef"
          >
            <template #tableHeader="scope">
              <el-button size="mini" type="primary" plain @click="workflowProcessHandle(scope['selectedList'])" :disabled="!scope['isSelected']"
                >流程履历
              </el-button>
              <el-button size="mini" type="primary" plain @click="closeDialogHandle">关闭</el-button>
            </template>
          </ProTable>
        </el-tab-pane>
        <!-- <el-tab-pane v-if="isShowLog" label="关键操作日志" name="criticalOperations">
          <ProTable
            :data-callback="dataCriticalOperationsCallBack"
            :tool-button="['other']"
            :request-api="getCriticalOperationsLog"
            :request-auto="true"
            :search-col="4"
            :columns="criticalOperationsColumns"
          >
            <template #tableHeader>
              <el-button size="mini" type="primary" plain @click="closeDialogHandle">关闭</el-button>
            </template>
          </ProTable>
        </el-tab-pane> -->
      </el-tabs>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import ProTable from '@/components/ProTable/index.vue'
import { getLcllByCityLhhsPsbg } from '@/api/common'
import { ColumnProps } from '@/components/ProTable/interface'
import { reactive, ref, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import { getWfTracking } from '@/api/workflow'
import { Result } from '@/api/matter/search'

interface Props {
  isShowDialog: boolean
  isShowLog: boolean
  meetingId: string
  searchApi: (params: any) => Promise<Result>
}

const props = withDefaults(defineProps<Props>(), {
  isShowDialog: false,
  isShowLog: true,
  meetingId: '',
  searchApi: getLcllByCityLhhsPsbg
})
const emit = defineEmits(['closeDialog'])

const processTab = ref('process')
const meetingId = toRef(props, 'meetingId')
const isShow = toRef(props, 'isShowDialog')
const loading = ref(false)

const publicData = reactive<any>({
  sHResult: [
    {
      name: '通过',
      code: 'Y'
    },
    {
      name: '不通过',
      code: 'N'
    },
    {
      name: '退回',
      code: 'TH'
    },
    {
      name: '',
      code: ''
    }
  ]
})

const columns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 80 },
  { prop: 'flowName', label: '操作阶段', width: '180' },
  { prop: 'auditStatusName', label: '审核状态', width: '120' },
  { prop: 'nodename', label: '步骤名称', width: '180' },
  { prop: 'creator', label: '提交操作人', width: '120' },
  { prop: 'createDep', label: '提交人部门', width: '220' },
  { prop: 'auditor', label: '审批处理人', width: '120' },
  { prop: 'auditDep', label: '审批部门', width: '220' },
  { prop: 'auditTime', label: '操作时间', width: '160' },
  {
    prop: 'spjg',
    label: '审核结果',
    width: '120',
    enum: publicData.sHResult,
    fieldNames: { label: 'name', value: 'code' }
  },
  { prop: 'spyj', label: '审核意见' }
])

const getPageList = (params: any) => {
  console.log(params, 'params')
  loading.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  newParams.meetingId = meetingId.value
  return props.searchApi(newParams)
}

const dataCallBack = (data: any[]) => {
  loading.value = false
  return data || []
}

const workflowProcessHandle = (list: any[]) => {
  if (list.length !== 1) {
    ElMessage.warning('请选择一条数据进行查看！')
    return
  }
  getWfTracking(list[0].flowId).then((res: any) => {
    if (res.success) {
      window.open(res.data, '_blank', 'width=900,height=600')
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const closeDialogHandle = () => {
  processTab.value = 'process'
  emit('closeDialog', false)
}
</script>

<script lang="ts">
export default {
  name: 'workflowMeeting'
}
</script>

<style scoped lang="less">
.container {
  height: 100%;

  :deep(.el-tabs) {
    height: 100% !important;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;

    .el-tabs__content {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }
  }
}

:deep(.el-tab-pane) {
  min-height: 0;
  min-width: 0;
  height: 100%;
}
</style>
