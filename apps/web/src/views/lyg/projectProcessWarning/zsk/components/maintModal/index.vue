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
        <el-col :span="24" v-if="modalTitle === '编辑'">
          <el-form-item label="文件名称">
            <span class="file-name-text">{{ searchParams.fileName }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="modalTitle === '新增'">
          <el-form-item label="上传附件" prop="fileName" :rules="[{ required: true, message: '请上传附件' }]">
            <el-upload
              v-permission="'IMPORT'"
              style="display: inline; padding: 0 0 0 10px"
              :accept="fileList"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleChange"
              :limit="1"
            >
              <el-button size="small" type="success" icon="el-icon-upload">上传附件</el-button>
            </el-upload>
            <span v-if="searchParams.fileName" class="file-name-text" style="margin-left: 10px">{{ searchParams.fileName }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="主要内容" prop="mainContent" :rules="[{ required: true, message: '请输入主要内容' }]">
            <el-input
              type="textarea"
              clearable
              :maxlength="2000"
              :rows="4"
              show-word-limit
              v-model.trim="searchParams.mainContent"
              placeholder="请输入主要内容"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button size="small" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
        <el-button size="small" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { knowledgeBaseSave, knowledgeBaseUpload } from '@/api/lyg/knowledgeBase'

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

/** 表单数据：编辑时含 kbId/fileUuid/fileName/mainContent；新增时含 fileName/mainContent/fileUuid */
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

/** 选择文件后直传，拿到 fileUuid 与文件名回填 */
const handleChange = async (file: any) => {
  if (!file || !file.raw) return
  try {
    loading.value = true
    const formData = new FormData()
    formData.append('file', file.raw)
    const res = await knowledgeBaseUpload({ excelFormData: formData })
    if (!res.success) throw new Error(res.msg)
    // 后端返回 fileUuid；文件名取本地选中文件名
    searchParams.value.fileUuid = res.data?.fileUuid || res.data?.uuid || res.data
    searchParams.value.fileName = file.name
    ruleFormRef.value?.validateField?.('fileName')
    ElMessage.success('附件上传成功')
  } catch (e) {
    ElMessage.error((e as Error).message || '附件上传失败')
  } finally {
    loading.value = false
  }
}

/** 保存：新增用 fileUuid + mainContent；编辑用 kbId + fileUuid + mainContent */
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
      const payload: any = { mainContent: searchParams.value.mainContent }
      if (modalTitle.value === '编辑') {
        payload.kbId = searchParams.value.kbId
        payload.fileUuid = searchParams.value.fileUuid
      } else {
        if (!searchParams.value.fileUuid) {
          ElMessage.warning('请先上传附件！')
          loading.value = false
          return
        }
        payload.fileUuid = searchParams.value.fileUuid
        payload.fileName = searchParams.value.fileName
      }
      const res = await knowledgeBaseSave(payload)
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

/** 打开弹窗 */
const acceptParams = async (params: ModalParams) => {
  userInfo.value = { ...params }
  modalTitle.value = params.type
  searchParams.value = params.searchParams
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less" scoped>
.file-name-text {
  color: #475569;
  word-break: break-all;
}
</style>
