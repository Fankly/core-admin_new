<template>
  <div class="table-box">
    <div class="search">
      <el-row :gutter="24">
        <el-col :span="16">
          <el-button size="mini" type="primary" plain @click="openTodoTaskDeal()">处理</el-button>
          <el-button v-if="isShowStatus.button" size="mini" type="primary" plain @click="openTodoTaskDesc()">查看流转过程</el-button>
          <el-button size="mini" type="primary" plain @click="searchPageList()">刷新</el-button>
        </el-col>
        <el-col :span="8">
          <el-form :model="todoTasksFrom">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="业务名称">
                  <el-input v-model="todoTasksFrom.bizName" placeholder="业务名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="">
                  <el-button size="mini" type="primary" plain @click="searchPageList()">查 询</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-col>
      </el-row>
    </div>
    <div class="table">
      <proTable
        @current-change="handleSelectionChange"
        highlight-current-row
        :tool-button="false"
        :data-callback="callBackHandle"
        :init-param="initParam"
        :request-api="getPageList"
        :request-auto="true"
        fit
        height="100%"
        :search-col="4"
        :columns="tableColumns"
        ref="proTableRef"
      ></proTable>
    </div>
  </div>
  <vxe-modal
    :loading="loading"
    show-zoom
    resize
    fullscreen
    destroy-on-close
    @close="closeTodoTaskDeal"
    :title="todoTasksFrame.title"
    v-model="todoTasksFrame.isShowDialog"
    width="86%"
    height="800px"
  >
    <div class="frame-container">
      <iframe
        ref="iframeRef"
        @load="checkAccess"
        frameborder="0"
        scrolling="auto"
        style="border: none"
        width="100%"
        height="100%"
        :src="todoTasksFrame.src"
      ></iframe>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: '/workflow/todoTasks'
}
</script>
<script setup lang="ts">
import { onMounted, reactive, ref, watch, h } from 'vue'
import proTable from '@/components/ProTable/index.vue'
import { ColumnProps } from '@/components/ProTable/interface'
import { ElMessage } from 'element-plus'
import { queryWorkItemsByEmployee, getWfTracking } from '@/api/workflow'

const handleSelectionChange = (val: any) => {
  if (val) {
    isShowStatus.button = val.workflowName ? true : false
    todoTasksRecord.value = val
  }
}
const proTableRef = ref<InstanceType<typeof proTable>>()
const iframeRef = ref()

const isShowStatus = reactive({
  button: true
})

const loading = ref<boolean>(false)

const todoTasksRecord = ref<any>({})

const todoTasksFrame = reactive({
  title: '',
  isShowDialog: false,
  src: ''
})

onMounted(() => {
  window.onmessage = function (e) {
    if (e.data) {
      todoTasksFrame.isShowDialog = false
      if (e.data !== 'close') ElMessage.success(e.data)
      searchPageList()
    }
  }
})

const checkAccess = () => {
  try {
    const iframe = iframeRef.value
    if (!iframe.contentWindow) {
      loading.value = false
      throw new Error('无法访问')
    }
    const href = iframe.contentWindow.loaction.href
  } catch (e: any) {
    if (e.name === 'SecurityError' || e.name === 'DOMException') {
      loading.value = false
    }
  } finally {
    loading.value = false
  }
}

const todoTasksFrom = reactive({
  bizName: ''
})

const initParam = reactive({
  type: 0,
  workFlowCode: '',
  state: 1
})

const urgencyEnum = reactive([
  {
    label: '一般',
    value: '1'
  },
  {
    label: '较急',
    value: '2'
  },
  {
    label: '紧急',
    value: '3'
  }
])

const tableColumns = reactive<ColumnProps<any>[]>([
  {
    prop: 'systemName',
    label: '来源系统',
    width: '180',
    isShow: false
  },
  {
    prop: 'workflowName',
    label: '流程名称',
    width: '250'
  },
  {
    prop: 'bizName',
    label: '业务名称',
    render(scope: any) {
      return h('div', {
        innerHTML: scope.row.bizName
      })
    }
  },
  {
    prop: 'wfInstId',
    label: '流程实例ID',
    width: '180',
    isShow: false
  },
  {
    prop: 'activityDefName',
    label: '操作',
    width: '300'
  },
  {
    prop: 'senderName',
    label: '发送人',
    width: '180'
  },
  {
    prop: 'startTime',
    label: '发送时间',
    width: '180'
  },
  {
    prop: 'urgency',
    label: '紧急程度',
    width: '180',
    // enum: urgencyEnum
    isShow: false
  }
])

const callBackHandle = (val: any) => {
  loading.value = false
  return val
}

const getPageList = (params: any) => {
  loading.value = true
  let newParams = JSON.parse(JSON.stringify(params))
  if (todoTasksFrom.bizName != '') {
    let customFilters = {
      BIZ_NAME: todoTasksFrom.bizName
    }
    newParams['customFilters'] = customFilters
  }
  return queryWorkItemsByEmployee(newParams)
}

const openTodoTaskDeal = () => {
  if (!Reflect.has(todoTasksRecord.value, 'id')) {
    ElMessage.warning('请先选中需要处理的待办！')
  } else {
    loading.value = true
    todoTasksFrame.isShowDialog = true
    todoTasksFrame.title = '业务处理'
    todoTasksFrame.src = todoTasksRecord.value.url
  }
}

const openTodoTaskDesc = () => {
  if (!Reflect.has(todoTasksRecord.value, 'wfInstId')) {
    ElMessage.warning('请先选中需要查看的待办！')
  } else {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(todoTasksRecord.value.wfInstId).then((res: any) => {
      if (res.success) {
        window.open(res.data, '_blank', `width=${width},height=${height},top=${pageTop},left=${pageWidth}`)
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

const closeTodoTaskDeal = () => {
  loading.value = false
  searchPageList()
}

watch(
  () => todoTasksFrame.isShowDialog,
  (newVal) => {
    if (!newVal) {
      if (proTableRef.value) {
        proTableRef.value.element?.setCurrentRow(null)
        todoTasksRecord.value = {}
      }
    }
  }
)

const searchPageList = () => {
  loading.value = true
  if (proTableRef.value) proTableRef.value.search()
}
</script>

<style lang="less" scoped>
.table-box {
  padding: 10px;

  .search {
    height: 43px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
.frame-container {
  height: 100%;
}
</style>
