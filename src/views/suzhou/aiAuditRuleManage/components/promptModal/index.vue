<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-rule-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    :width="1400"
    @close="handleClose"
    :loading="loading"
  >
    <el-form class="ai-audit-rule-form" ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="提示词" prop="prompt" :rules="[{ required: true, message: '请输入提示词' }]">
            <el-input
              clearable
              resize="none"
              type="textarea"
              :maxlength="15000"
              show-word-limit
              :rows="30"
              v-model.trim="searchParams.prompt"
              placeholder="请输入提示词"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <div class="ai-audit-rule-form__footer">
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
  name: 'promptModal'
}
</script>

<style lang="less">
@import '../../css/modal.less';
</style>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { editPrompt } from '@/api/suzhou/aiAuditRuleManage'
import { VXETable } from 'vxe-table'
import { getPublicData } from '@/api/common'

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

const ruleClassifyList = ref<CodeItem[]>([])
const ruleLevel = ref<CodeItem[]>([])
const ruleStatus = ref<CodeItem[]>([])
const zxjdList = ref<CodeItem[]>([])

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
      const res = await editPrompt({ ...searchParams.value })
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
    const [code1, code2, code3, code4] = await Promise.all([
      getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
      getPublicData('AI_AUDIT_RULE_LEVEL_COM'),
      getPublicData('ZLYS_SFQY'),
      getPublicData('AI_AUDIT_RULE_EXEC_STAGE_COM')
    ])
    ruleClassifyList.value = code1.data
    ruleLevel.value = code2.data
    ruleStatus.value = code3.data
    zxjdList.value = code4.data
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
