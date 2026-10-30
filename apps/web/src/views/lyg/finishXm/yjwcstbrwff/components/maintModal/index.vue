<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="600px"
    height="420px"
    @close="handleClose"
    :loading="loading"
    show-footer
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="140px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="任务年度" prop="nd" :rules="[{ required: true, message: '请选择任务年度' }]">
            <el-date-picker
              :disabled="isEdit"
              v-model="searchParams.nd"
              type="year"
              format="YYYY"
              value-format="YYYY"
              clearable
              placeholder="请选择任务年度"
              style="width: 100%"
              @change="handleYearChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="任务名称" prop="rwName" :rules="[{ required: true, message: '请输入任务名称' }]">
            <el-input v-model="searchParams.rwName" clearable placeholder="请输入任务名称" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="项目数量" prop="xmSl">
            <el-input v-model="searchParams.xmSl" disabled placeholder="选择任务年度后自动带出" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="应填报项目数" prop="ytbXmSl">
            <el-input
              v-model="searchParams.ytbXmSl"
              readonly
              class="link-input"
              placeholder="选择任务年度后自动带出"
              style="width: 100%"
              @click="handleOpenXmDetail"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="项目负责专职人数" prop="fzrZs">
            <el-input v-model="searchParams.fzrZs" disabled placeholder="选择任务年度后自动带出" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button v-if="!isEdit" size="small" :loading="loading" :disabled="loading" @click="handlePublish" plain type="primary">发布任务</el-button>
        <el-button size="small" :loading="loading" :disabled="loading" @click="handleSave" type="primary"> 保 存 </el-button>
        <el-button size="small" :disabled="loading" @click="handleClose" plain> 关 闭 </el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'finishXmMaintModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { finishXmSave, finishXmPublish, finishXmStatByYear } from '@/api/lyg/finishXm'

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Record<string, any>
  specialorgid?: string
  org_id?: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
  (e: 'openXmDetail', val: { nd: string; rwName: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const isEdit = ref(false)
const userInfo = ref<any>()
const searchParams = ref<any>({})

/** 重置表单数据与校验状态 */
const resetForm = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

/** 按任务年度带出项目数量、应填报项目数、项目负责专职人数 */
const fetchStatByYear = async (nd: string) => {
  if (!nd) {
    searchParams.value.xmSl = ''
    searchParams.value.ytbXmSl = ''
    searchParams.value.fzrZs = ''
    return
  }
  try {
    const res: any = await finishXmStatByYear({ nd })
    if (res.success) {
      const data = res.data || {}
      searchParams.value.xmSl = data.xmSl ?? ''
      searchParams.value.ytbXmSl = data.ytbXmSl ?? ''
      searchParams.value.fzrZs = data.fzrZs ?? ''
    }
  } catch (e) {
    console.error(e)
  }
}

/** 任务年度变化 */
const handleYearChange = (val: string) => {
  fetchStatByYear(val)
}

/** 点击应填报项目数，打开项目明细弹窗 */
const handleOpenXmDetail = () => {
  emit('openXmDetail', { nd: searchParams.value.nd, rwName: searchParams.value.rwName })
}

/** 表单校验，返回是否通过 */
const validateForm = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (!ruleFormRef.value) {
      ElMessage.warning('表单未加载完成，请稍后重试')
      return resolve(false)
    }
    ruleFormRef.value.validate((valid: boolean) => resolve(!!valid))
  })

/** 保存 */
const handleSave = async () => {
  if (!(await validateForm())) return

  try {
    const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await finishXmSave({ ...searchParams.value })
    if (res.success) {
      ElMessage.success('保存成功！')
      emit('searchHandle', { param: 'success' })
      handleClose()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/** 发布任务：先保存，再用返回的 rwId 调用发布接口 */
const handlePublish = async () => {
  if (!(await validateForm())) return

  try {
    const type = await VXETable.modal.confirm('发布任务后无法修改，请确认！', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }

  loading.value = true
  try {
    const res: any = await finishXmSave({ ...searchParams.value })
    if (!res.success) {
      ElMessage.error(res.msg)
      return
    }

    const rwId = res.data
    if (!rwId) {
      ElMessage.error('保存成功但未获取到任务ID，请重试')
      return
    }

    const publishRes: any = await finishXmPublish({ rwId })
    if (!publishRes.success) {
      ElMessage.error(publishRes.msg)
      return
    }

    ElMessage.success('发布成功！')
    emit('searchHandle', { param: 'success' })
    handleClose()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/** 打开弹窗 */
const acceptParams = async (params: ModalParams) => {
  userInfo.value = { ...params }
  modalTitle.value = params.type
  isEdit.value = modalTitle.value == '编辑'
  // 清空已有属性，保持 searchParams 引用不变（避免 el-form 的 model 引用失效导致校验失败）
  Object.keys(searchParams.value).forEach((key) => {
    delete searchParams.value[key]
  })
  const src = params.searchParams || {}
  Object.assign(searchParams.value, src)
  // 新增时初始化字段，任务年度从查询条件带入
  if (modalTitle.value === '新增') {
    searchParams.value.nd = src.nd || new Date().getFullYear().toString()
    searchParams.value.rwName = src.rwName || ''
    searchParams.value.xmSl = ''
    searchParams.value.ytbXmSl = ''
    searchParams.value.fzrZs = ''
  }
  isShowModal.value = true
  await fetchStatByYear(searchParams.value.nd)
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.link-input {
  :deep(.el-input__inner) {
    color: #00706b;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
