<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="600px"
    @close="handleClose"
    :loading="loading"
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="150px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="预警环节" prop="yjhj" :rules="[{ required: true, message: '请选择预警环节' }]">
            <el-select v-model="searchParams.yjhj" clearable filterable placeholder="请选择预警环节" style="width: 100%">
              <el-option v-for="item in statusList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="编码" prop="bm" :rules="[{ required: true, message: '请输入编码' }]">
            <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.bm" placeholder="请输入编码" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="提醒时间周期(天)" prop="yjsjzqTx" :rules="[{ required: true, message: '请输入提醒时间周期(天)' }]">
            <el-input
              clearable
              type="number"
              :maxlength="6"
              show-word-limit
              v-model.trim="searchParams.yjsjzqTx"
              placeholder="请输入提醒时间周期(天)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="预警时间周期(天)" prop="yjsjzqYj" :rules="[{ required: true, message: '请输入预警时间周期(天)' }]">
            <el-input
              clearable
              type="number"
              :maxlength="6"
              show-word-limit
              v-model.trim="searchParams.yjsjzqYj"
              placeholder="请输入预警时间周期(天)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="警告时间周期(天)" prop="yjsjzq" :rules="[{ required: true, message: '请输入警告时间周期(天)' }]">
            <el-input
              clearable
              type="number"
              :maxlength="6"
              show-word-limit
              v-model.trim="searchParams.yjsjzq"
              placeholder="请输入警告时间周期(天)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <div style="text-align: center; width: 100%; margin-top: 10px">
            <el-button size="mini" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
            <el-button size="mini" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'maintModal'
}
</script>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPublicData } from '@/api/common'
import { yjyzSave } from '@/api/lyg/index'

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Record<string, any>
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')

const statusList = ref<CodeItem[]>([])

/** 使用 reactive 管理表单数据，类型更明确 */
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

/** 保存 */
const handleSave = () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

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
      const res = await yjyzSave({ ...searchParams.value })
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
  })
}

/** 获取下拉选项数据 */
const fetchOptions = async () => {
  try {
    const code = await getPublicData('LYG_YJYZ_YJHJ_COM')
    statusList.value = code.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

/** 打开弹窗 */
const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type
  searchParams.value = params.searchParams
  isShowModal.value = true
  fetchOptions()
}

defineExpose({ acceptParams })
</script>
