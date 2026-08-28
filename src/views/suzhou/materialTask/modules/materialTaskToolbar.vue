<template>
  <div class="operation">
    <el-button v-if="hasPermission('ADD')" type="primary" plain @click="openModal">新增任务</el-button>
    <el-button v-if="hasPermission('DELETE')" type="primary" plain @click="handleDelete">删除任务</el-button>
    <el-button v-if="hasPermission('RESUBMIT')" type="primary" plain @click="handleResubmit">重新提交</el-button>
  </div>
  <vxe-modal
    resize
    position="center"
    showZoom
    show-footer
    v-model="isShowModal"
    title="项目物料-新增"
    width="510px"
    destroy-on-close
    :loading="modalLoading"
    @close="handleClose"
  >
    <el-form ref="formRef" label-suffix=" : " :model="formData" label-width="120px">
      <el-row>
        <el-form-item label="一级单位" prop="yjdw" :rules="[{ required: true, message: '请选择一级单位' }]">
          <el-select style="width: 300px" v-model="formData.yjdw" placeholder="请选择一级单位" clearable>
            <el-option v-for="item1 in yjdwList" @click="selectChange(item1)" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="二级单位" prop="ejdw" :rules="[{ required: isEjdwRule, message: '请选择二级单位' }]">
          <el-select style="width: 300px" v-model="formData.ejdw" placeholder="请选择二级单位" clearable>
            <el-option v-for="item1 in ejdwList" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年月" prop="taskTime" :rules="[{ required: true, message: '请选择年月' }]">
          <el-date-picker style="width: 300px" :clearable="false" v-model="formData.taskTime" value-format="YYYY-MM" format="YYYY-MM" type="month" />
        </el-form-item>
      </el-row>
    </el-form>
    <template #footer>
      <div class="footer">
        <el-button @click="isShowModal = false">取 消</el-button>
        <el-button type="primary" @click="handleSave">确 定</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="materialTaskToolbar">
import { ElMessage } from 'element-plus'
import type { InjectionKey, Ref } from 'vue'
import { VXETable } from 'vxe-table'
import { ref, inject, reactive } from 'vue'
import { usePermission } from '@/hooks/usePermission'
import { createTask, removeTask, retryTask } from '@/api/suzhou/materialTask'
import { CrudTableRefInjectionKey, CheckedRowsInjectionKey } from '@/views/suzhou/common/types/crud'
import { useStore } from 'vuex'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { getCropLimitInfo } from '@/api/lkyptzl/index'

interface taskParamVo {
  taskTime: string
  yjdw: string
  ejdw: string
}

const { hasPermission } = usePermission()
const materialTableRef = inject(CrudTableRefInjectionKey, ref())
const checkedData = inject<Ref<[]>>(CheckedRowsInjectionKey as InjectionKey<Ref<[]>>, ref([]) as Ref<[]>)
const store = useStore()

const isShowModal = ref(false)
const modalLoading = ref(false)
const isEjdwRule = ref<boolean>(false)
const formRef = ref()
const formData = ref<taskParamVo>({ taskTime: '', yjdw: '', ejdw: '' })
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const szwlInfo = reactive<{ bmId: string; dwId: string }>({
  bmId: '',
  dwId: ''
})

const openModal = async () => {
  const SZWLlobalInfo: any = store.getters.getSZWLlobalInfo
  szwlInfo.bmId = SZWLlobalInfo.bmId
  szwlInfo.dwId = SZWLlobalInfo.dwId
  formData.value = { taskTime: '', yjdw: '', ejdw: '' }
  isShowModal.value = true
  const res: any = await getYjdwList({ bmId: szwlInfo.bmId, dwId: szwlInfo.dwId })
  if (res.success && res.data.length !== 0) {
    yjdwList.value = res.data
  }
  const cropInfo: any = await getCropLimitInfo({ dwId: szwlInfo.dwId, isUpLimit: true })
  if (!cropInfo.success) ElMessage.error(cropInfo.msg)
  isEjdwRule.value = ['ZSDW', 'COUNTY'].includes(cropInfo.data.cropFlag)
}

const handleDelete = async () => {
  if (!checkedData.value || checkedData.value.length == 0) {
    ElMessage.warning('请选择数据进行操作!')
    return
  }
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const taskIdList = checkedData.value.map(({ taskId }: any) => taskId)
  const res = await removeTask(taskIdList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('删除成功!')
  materialTableRef.value?.reloadData()
}

const handleResubmit = async () => {
  if (!checkedData.value || checkedData.value.length == 0) {
    ElMessage.warning('请选择数据进行操作!')
    return
  }
  const isFailed = checkedData.value.every((task: any) => task.status == '3')
  if (!isFailed) return ElMessage.warning('请选择失败的任务提交!')
  const type = await VXETable.modal.confirm('是否确定重新提交？', '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const taskIdList = checkedData.value.map(({ taskId }: any) => taskId)
  const res = await retryTask(taskIdList)
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('任务已经重新提交!')
  materialTableRef.value?.reloadData()
}

// 选择一级单位联动二级单位
const selectChange = (val: any) => {
  formData.value.ejdw = ''
  ejdwList.value.length = 0
  const param = {
    YJDW: val.code,
    parentCode: val.code,
    bmId: szwlInfo.bmId,
    dwId: szwlInfo.dwId
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const type = await VXETable.modal.confirm('是否确定创建任务？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    modalLoading.value = true
    try {
      const timeList = formData.value.taskTime.split('-')
      let params = {
        ...formData.value,
        nd: timeList[0],
        yd: Number(timeList[1]).toString()
      }
      const res = await createTask({ ...params })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('创建成功!')
      handleClose()
      materialTableRef.value?.reloadData()
    } catch (error) {
      ElMessage.error((error as Error).message || '创建失败!')
    } finally {
      modalLoading.value = false
    }
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  isShowModal.value = false
}
</script>

<style scoped>
.footer {
  text-align: center;
}
</style>
