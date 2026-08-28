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
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="12">
          <el-form-item label="规则类型" prop="ruleMajor" :rules="[{ required: true, message: '请选择规则类型' }]">
            <el-select v-model="searchParams.ruleMajor" clearable filterable placeholder="请选择规则类型" style="width: 100%">
              <el-option v-for="item in ruleMajorList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则编码" prop="ruleCode" :rules="[{ required: true, message: '请输入规则编码' }]">
            <el-input clearable :maxlength="16" show-word-limit v-model.trim="searchParams.ruleCode" placeholder="请输入规则编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则名称" prop="ruleName" :rules="[{ required: true, message: '请输入规则名称' }]">
            <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.ruleName" placeholder="请输入规则名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则分类" prop="ruleClassify" :rules="[{ required: true, message: '请选择规则分类' }]">
            <el-select v-model="searchParams.ruleClassify" clearable filterable placeholder="请选择规则分类" style="width: 100%">
              <el-option v-for="item in ruleClassifyList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则级别" prop="ruleLevel" :rules="[{ required: true, message: '请选择规则级别' }]">
            <el-select v-model="searchParams.ruleLevel" clearable filterable placeholder="请选择规则级别" style="width: 100%">
              <el-option v-for="item in ruleLevel" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="执行阶段" prop="execStage" :rules="[{ required: true, message: '请选择执行阶段' }]">
            <el-select v-model="searchParams.execStage" clearable filterable placeholder="请选择执行阶段" style="width: 100%">
              <el-option v-for="item in zxjdList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort" :rules="[{ required: true, message: '请输入排序' }]">
            <el-input type="number" clearable :maxlength="128" show-word-limit v-model.trim="searchParams.sort" placeholder="请输入排序" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="规则状态" prop="ruleStatus" :rules="[{ required: true, message: '请选择规则状态' }]">
            <el-select v-model="searchParams.ruleStatus" clearable filterable placeholder="请选择规则状态" style="width: 100%">
              <el-option v-for="item in ruleStatus" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="规则描述" prop="ruleDesc" :rules="[{ required: true, message: '请输入规则描述' }]">
            <el-input
              clearable
              :maxlength="1024"
              show-word-limit
              resize="none"
              type="textarea"
              :rows="10"
              v-model.trim="searchParams.ruleDesc"
              placeholder="请输入规则描述"
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
  name: 'manageModal'
}
</script>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { rulManageSaveRule } from '@/api/suzhou/aiAuditRuleManage'
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
const ruleMajorList = ref<CodeItem[]>([])
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
      const res = await rulManageSaveRule({ ...searchParams.value })
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
    const [code1, code2, code3, code4, code5] = await Promise.all([
      getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
      getPublicData('AI_AUDIT_RULE_LEVEL_COM'),
      getPublicData('ZLYS_SFQY'),
      getPublicData('AI_AUDIT_RULE_EXEC_STAGE_COM'),
      getPublicData('AI_AUDIT_RULE_MAJOR_COM')
    ])
    ruleClassifyList.value = code1.data
    ruleLevel.value = code2.data
    ruleStatus.value = code3.data
    zxjdList.value = code4.data
    ruleMajorList.value = code5.data
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
