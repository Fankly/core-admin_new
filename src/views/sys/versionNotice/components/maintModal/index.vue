<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    :title="modalTitle"
    width="800px"
    @close="handleClose"
    @show="handleShow"
    :loading="loading"
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="searchParams" :rules="formRules">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="版本号" prop="versionNo">
            <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.versionNo" placeholder="请输入版本号" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="通知标题" prop="versionTitle">
            <el-input clearable :maxlength="200" show-word-limit v-model.trim="searchParams.versionTitle" placeholder="请输入通知标题" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="检修日期" prop="releaseDate">
            <el-date-picker
              v-model="releaseDateRange"
              type="datetimerange"
              range-separator="~"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              style="width: 100%"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="通知生效时间" prop="noticeTime">
            <el-date-picker
              v-model="searchParams.noticeTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择通知生效时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="通知失效时间" prop="noticeExpireTime">
            <el-date-picker
              v-model="searchParams.noticeExpireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm:ss"
              clearable
              placeholder="请选择通知失效时间"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="检修内容" prop="versionContent">
            <basic-editor ref="basicEditorRef" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="附件">
            <!-- vxe-table.readFile 仅用于选择文件，不展示数据 -->
            <vxe-table ref="attachTableRef" :data="[]" style="display: none" />
            <div class="attach-box">
              <div class="attach-box__header">
                <span class="attach-box__title">附件文件</span>
                <el-button size="mini" plain type="primary" icon="el-icon-upload2" :loading="uploading" @click="uploadHandle"> 上 传 </el-button>
              </div>
              <!-- 已上传附件展示（单附件） -->
              <div v-if="searchParams.fileUuid" class="attach-file-card">
                <i class="el-icon-document attach-file-card__icon"></i>
                <span class="attach-file-card__name" :title="searchParams.fileName">{{ searchParams.fileName }}</span>
                <div class="attach-file-card__actions">
                  <el-button type="text" class="attach-file-card__remove" @click="handleRemoveFile">移除</el-button>
                </div>
              </div>
              <!-- 空态：虚线占位区 -->
              <div v-else class="attach-placeholder" @click="uploadHandle">
                <i class="el-icon-upload2 attach-placeholder__icon"></i>
                <span class="attach-placeholder__text">暂无附件，点击此处或上方按钮上传</span>
              </div>
            </div>
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
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import BasicEditor from '@/components/base/BasicEditor.vue'
import { versionNoticeSave, versionNoticeUpload } from '@/api/sys/versionNotice'
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
const basicEditorRef = ref()
const modalTitle = ref('')

/** 表单数据 */
const searchParams = ref<any>({})

/** 检修日期范围（数组形式绑定 el-date-picker，与 searchParams.releaseDate 字符串互转） */
const releaseDateRange = ref<string[]>([])

/** 附件（单附件模型：fileUuid=平台标识，fileName=原文件名） */
const attachTableRef = ref()
const uploading = ref(false)

/** 上传附件（单文件，后端 /versionNotice/upload 返回 uuid） */
const uploadHandle = async () => {
  const $table = attachTableRef.value
  if (!$table) return
  try {
    const { files } = await $table.readFile({ multiple: false })
    if (!files || !files.length) return
    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    uploading.value = true
    const res = await versionNoticeUpload(formData)
    if (!res.success) return ElMessage.error(res.msg)
    // 上传成功后暂存到表单数据，保存时一并提交
    searchParams.value.fileUuid = res.data
    searchParams.value.fileName = file.name
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    uploading.value = false
  }
}

/** 移除已上传附件（仅清空表单暂存，物理文件由后端保存时清理） */
const handleRemoveFile = () => {
  searchParams.value.fileUuid = ''
  searchParams.value.fileName = ''
}

/** 表单校验规则 */
const formRules = {
  versionNo: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  versionTitle: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  releaseDate: [{ required: true, message: '请选择检修日期', trigger: 'change' }],
  noticeTime: [{ required: true, message: '请选择通知生效时间', trigger: 'change' }],
  noticeExpireTime: [{ required: true, message: '请选择通知失效时间', trigger: 'change' }],
  versionContent: [
    {
      required: true,
      validator: (_rule: any, _value: any, callback: any) => {
        // 富文本内容存在 editor ref 而非表单模型，需从 ref 取值校验
        const html = basicEditorRef.value?.valueHtml || ''
        const text = html
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, '')
          .trim()
        if (!text) return callback(new Error('请输入检修内容'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

/** 日期范围变化时同步到字符串字段 */
const handleDateChange = (val: string[] | null) => {
  searchParams.value.releaseDate = val && val.length === 2 ? val.join('~') : ''
}

/** 重置表单数据与校验状态 */
const resetForm = () => {
  ruleFormRef.value?.resetFields()
  releaseDateRange.value = []
  searchParams.value = {}
  isShowModal.value = false
}

/** 关闭弹窗 */
const handleClose = () => {
  resetForm()
}

/** 弹窗显示后回显富文本内容 */
const handleShow = () => {
  nextTick(() => {
    if (basicEditorRef.value) {
      basicEditorRef.value.valueHtml = searchParams.value.versionContent || ''
    }
  })
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
      // 同步富文本内容到表单数据
      searchParams.value.versionContent = basicEditorRef.value?.valueHtml || ''
      const res = await versionNoticeSave({ ...searchParams.value })
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
const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type
  searchParams.value = { ...params.searchParams }
  // 回显检修日期范围
  releaseDateRange.value = searchParams.value.releaseDate ? searchParams.value.releaseDate.split('~') : []
  // 单附件回显：fileUuid/fileName 直接来自列表行数据，无需额外请求
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.attach-box {
  width: 100%;
  padding: 10px 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.attach-box__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.attach-box__title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.attach-file-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  &:hover {
    border-color: #cbd5e1;
  }
}
.attach-file-card__icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #00706b;
}
.attach-file-card__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #1e293b;
}
.attach-file-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.attach-file-card__remove {
  color: #f56c6c;
}
.attach-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.16s;
  &:hover {
    border-color: #00706b;
  }
}
.attach-placeholder__icon {
  font-size: 20px;
  color: #94a3b8;
}
.attach-placeholder__text {
  font-size: 13px;
  color: #94a3b8;
}
</style>
