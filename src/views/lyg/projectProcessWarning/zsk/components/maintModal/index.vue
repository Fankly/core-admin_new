<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="50%"
    @close="handleClose"
    :loading="loading"
    show-footer
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="140px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="上传附件" prop="nd" :rules="[{ required: true, message: '请上传附件' }]">
            <el-upload
              v-permission="'IMPORT'"
              style="display: inline; padding: 0 0 0 10px"
              :accept="fileList"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleChange"
              :limit="1"
            >
              <el-button size="mini" type="success" icon="el-icon-upload">上传附件</el-button>
            </el-upload>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="主要内容" prop="pcCode" :rules="[{ required: true, message: '请输入主要内容' }]">
            <el-input
              type="textarea"
              clearable
              :maxlength="2000"
              :rows="4"
              show-word-limit
              v-model.trim="searchParams.pcCode"
              placeholder="请输入主要内容"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button size="mini" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
        <el-button size="mini" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
      </div>
    </template>
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
import { zbpcxxSave } from '@/api/lyg/index'

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Record<string, any>
  specialorgid: string
  org_id: string
}

const fileList = 'doc, docx, xls, xlsx, pdf'

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const userInfo = ref<any>()
const zbpcList = ref<CodeItem[]>([])

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
      const res = await zbpcxxSave({ ...searchParams.value })
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

const fetchOptions = async () => {
  try {
    const code = await getPublicData('LYG_ZBPC_TYPE_COM')
    zbpcList.value = code.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const handleChange = async () => {}

/** 打开弹窗 */
const acceptParams = async (params: ModalParams) => {
  userInfo.value = { ...params }
  modalTitle.value = params.type
  searchParams.value = params.searchParams
  isShowModal.value = true
  fetchOptions()
}

defineExpose({ acceptParams })
</script>
