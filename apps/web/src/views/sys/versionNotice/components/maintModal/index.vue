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
          <div style="text-align: center; width: 100%; margin-top: 10px">
            <el-button size="small" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
            <el-button size="small" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
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
import { versionNoticeSave } from '@/api/sys/versionNotice'

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
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>
