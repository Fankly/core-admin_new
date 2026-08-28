<template>
  <vxe-modal
    position="center"
    :loading="loading"
    :destroy-on-close="true"
    v-model="isShow"
    width="70%"
    height="720"
    title="项目信息流转情况"
    show-zoom
    @close="closeDialogHandle"
  >
    <div class="container">
      <el-tabs type="card" v-model="processTab">
        <el-tab-pane label="流程履历" name="process">
          <ProTable
            ref="proTableRef"
            :data-callback="dataCallBack"
            :tool-button="['other']"
            :request-api="getPageList"
            :request-auto="true"
            :search-col="4"
            :columns="columns"
          >
            <template #tableHeader="scope">
              <el-button size="mini" type="primary" plain @click="workflowProcessHandle(scope['selectedList'])" :disabled="!scope['isSelected']">
                流程履历
              </el-button>
              <el-button size="mini" type="primary" plain @click="closeDialogHandle">关闭</el-button>
            </template>
          </ProTable>
        </el-tab-pane>
        <el-tab-pane label="关键操作日志" name="criticalOperations">
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
        </el-tab-pane>
      </el-tabs>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import ProTable from '@/components/ProTable/index.vue'
import { getLcllForZl } from '@/api/common'
import { ColumnProps } from '@/components/ProTable/interface'
import { reactive, ref, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import { getWfTracking } from '@/api/workflow'
import { getMainOpLog } from '@/api/log/processLog'

interface Props {
  isShowDialog: boolean
  id: string
}

const props = defineProps<Props>()
const emit = defineEmits(['closeDialog'])

const processTab = ref('process')
const id = toRef(props, 'id')
const isShow = toRef(props, 'isShowDialog')
const loading = ref(false)

const getCriticalOperationsLog = (params: any) => {
  loading.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  newParams.xmId = id.value
  return getMainOpLog(newParams)
}

const dataCriticalOperationsCallBack = (data: any[]) => {
  loading.value = false
  return data || []
}

const criticalOperationsColumns = reactive<ColumnProps<any>[]>([
  // { prop: 'xmid', label: '项目id', width: '140' },
  { prop: 'operationType', label: '操作类型' },
  { prop: 'flowStatusBefore', label: '操作前状态' },
  { prop: 'flowStatusAfter', label: '操作后状态' },
  { prop: 'operatorName', label: '操作人' },
  { prop: 'operateTime', label: '操作时间' }
])

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
  loading.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  newParams.id = id.value
  return getLcllForZl(newParams)
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
  name: 'workflowProcessNew'
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
