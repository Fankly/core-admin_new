<!-- 定时任务 -->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <proTable :cell-style="columnStyle" @cell-click="runTask" ref="proTableRef" :data="dataList" :search-col="4" :columns="tableColumns" :pagination="false">
      <template #tableHeader="scope">
        <template v-for="(item, index) in btnList" :key="index">
          <el-button :disabled="!scope.isSelected && item.isSelected" type="primary" size="mini" plain @click="handlerBtn(item.label, scope.selectedList)">{{ item.value }}</el-button>
        </template>
      </template>
    </proTable>
    <vxe-modal ref="dialogFormRef" v-model="modalRef.isShow" :destroy-on-close="true" :title="modalRef.title" :width="800" :close-on-press-escape="false" @close="closeHandle">
      <el-form label-suffix=" : " ref="rmarkDataRef" :rules="rules" label-width="160px" label-position="right" :model="rmarkData">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="定时任务编码" prop="jobName">
              <el-input :maxlength="120" clearable resize="none" v-model.trim="rmarkData.jobName" placeholder="请输入定时任务编码"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="定时任务名称" prop="jobDesc">
              <el-input :maxlength="120" clearable resize="none" v-model.trim="rmarkData.jobDesc" placeholder="请输入定时任务名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="调用目标" prop="invokeTarget">
              <el-input :maxlength="120" clearable resize="none" v-model.trim="rmarkData.invokeTarget" placeholder="请输入调用目标"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="IP地址" prop="ip">
              <el-input :maxlength="15" clearable v-model.trim="rmarkData.ip" placeholder="请输入IP地址"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态锁" prop="status">
              <el-switch v-model="rmarkData.status" active-value="1" inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div style="text-align: center">
        <el-button size="mini" type="primary" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle">关 闭</el-button>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: '/metrics/scheduledTasks'
}
</script>
<script setup lang="ts">
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { processLockList, processLockRemove, processLockSave, processLockInvoke } from '@/api/metrics/index'

const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const proTableRef = ref()
const rmarkDataRef = ref()
const dataList = ref<any>([])
const modalRef = reactive<any>({ isShow: false, title: '' })
// 弹框参数
const rmarkData = ref<any>({})
// 按钮
const btnList = ref<any>([
  //isSelected 按钮是否需要选择数据
  { label: 'ADD', value: '新 增', isSelected: false },
  { label: 'EDIT', value: '编 辑', isSelected: true },
  { label: 'DEL', value: '删 除', isSelected: true },
  { label: 'REFRESH', value: '刷 新', isSelected: false }
])
const rules = {
  jobName: [{ required: true, message: '请输入定时任务编码', trigger: 'input' }],
  jobDesc: [{ required: true, message: '请输入定时任务名称', trigger: 'input' }]
}
// 关闭
const closeHandle = async () => {
  rmarkDataRef.value.resetFields()
  modalRef.isShow = false
  await pageList()
}
//保存
const pushMsgHandle = async () => {
  loading.value = true
  const result = await rmarkDataRef.value.validate()
  try {
    if (result) {
      let res: any = await processLockSave(rmarkData.value)
      if (res.success) {
        ElMessage.success(`${modalRef.title}成功`)
        closeHandle()
        proTableRef.value?.clearSelection()
        loading.value = false
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    }
  } catch (error: any) {
    console.error(error.toString())
  }
}
const runTask = async (row: any, column: any) => {
  if (column.label == '操作') {
    try {
      if (row.invokeTarget && row.status == '0') {
        let res: any = await processLockInvoke(row.id)
        if (res.success) {
          ElMessage.success('定时任务执行中。。。')
          pageList()
        } else {
          ElMessage.error(res.msg)
        }
      } else {
        if (row.status == '1') {
          ElMessage.warning('状态为已锁')
        }
        if (!row.invokeTarget) {
          ElMessage.warning('调用目标为空')
        }
      }
    } catch (error: any) {
      ElMessage.error(error)
    }
  } else {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(row)
    })
  }
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (column.label == '操作') {
    return 'color:#00706b;cursor: pointer;'
  }
}

// 按钮点击事件
const handlerBtn = (val: any, selectedList: any) => {
  if (['DEL', 'EDIT'].includes(val) && selectedList.length != 1) {
    return ElMessage.warning('请选择一条数据')
  }
  if (['ADD', 'EDIT'].includes(val)) {
    // 新增编辑
    modalRef.title = val == 'ADD' ? '新增' : '编辑'
    rmarkData.value = val == 'ADD' ? {} : selectedList[0]
    modalRef.isShow = true
  } else if (val == 'DEL') {
    ElMessageBox.confirm('是否确定删除所选数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res: any = await processLockRemove(selectedList[0].id)
        if (res.success) {
          ElMessage.success('删除成功')
          pageList()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else if (val == 'REFRESH') {
    pageList()
  }
}

// 方法
onMounted(async () => {
  await pageList()
})

// 列表查询回调
const pageList = async () => {
  loading.value = true
  let res = await processLockList()
  if (res.success) {
    res.data.forEach((item: any) => {
      item.statusName = item.status == '0' ? '未锁' : '已锁'
    })
    dataList.value = res.data
    isShowPage.value = true
    proTableRef.value?.clearSelection()
    loading.value = false
  } else {
    ElMessage.error(res.msg)
    loading.value = false
  }
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'jobName', label: '定时任务编码' },
  { prop: 'jobDesc', label: '定时任务名称' },
  { prop: 'invokeTarget', label: '调用目标' },
  { prop: 'statusName', label: '状态锁', width: '100' },
  { prop: 'ip', label: 'IP地址' },
  { prop: 'startTime', label: '开始时间', width: '150' },
  { prop: 'endTime', label: '结束时间', width: '150' },
  {
    prop: 'task',
    label: '操作',
    width: '80',
    render: ({ row }: any) => {
      return '执 行'
    }
  }
])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
