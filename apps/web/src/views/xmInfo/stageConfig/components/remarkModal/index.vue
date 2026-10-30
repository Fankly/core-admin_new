<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="1100px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form
          class="air-modal-form"
          ref="ruleFormRef"
          label-suffix=":"
          label-width="170px"
          label-position="right"
          :model="formParams"
          :rules="rules"
        >
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="环节编码" prop="groupCode">
                <el-input v-model.trim="formParams.groupCode" maxlength="50" clearable placeholder="请输入环节编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="环节名称" prop="groupName">
                <el-input v-model.trim="formParams.groupName" maxlength="50" clearable placeholder="请输入环节名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="步骤编码" prop="code">
                <el-input v-model.trim="formParams.code" maxlength="50" clearable placeholder="请输入步骤编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="步骤名称" prop="name">
                <el-input v-model.trim="formParams.name" maxlength="100" clearable placeholder="请输入步骤名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="操作角色" prop="operationRole">
                <el-input v-model.trim="formParams.operationRole" maxlength="50" clearable placeholder="请输入操作角色" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色编码" prop="operationRoleCode">
                <el-input v-model.trim="formParams.operationRoleCode" maxlength="50" clearable placeholder="请输入角色编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计处理部门获取方式" prop="yjclbmType">
                <el-select v-model="formParams.yjclbmType" clearable placeholder="请选择获取方式" style="width: 100%">
                  <el-option v-for="item in yjclbmTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计处理部门" prop="yjclbm">
                <el-input
                  v-if="formParams.yjclbmType === '2'"
                  v-model.trim="formParams.yjclbm"
                  type="textarea"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入预计处理部门脚本"
                  resize="none"
                />
                <el-input v-else v-model.trim="formParams.yjclbm" maxlength="100" clearable placeholder="请输入预计处理部门" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="操作类型" prop="operationType">
                <el-select
                  v-model="formParams.operationType"
                  clearable
                  placeholder="请选择操作类型"
                  style="width: 100%"
                  @change="handleOperationTypeChange"
                >
                  <el-option v-for="item in operationTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="评审类型" prop="pslx">
                <el-select v-model="formParams.pslx" clearable placeholder="请选择评审类型" style="width: 100%">
                  <el-option v-for="item in pslxOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="流程编码" prop="wfCode">
                <el-input v-model.trim="formParams.wfCode" maxlength="50" clearable placeholder="请输入流程编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="流程节点编码" prop="wfNodeCode">
                <el-input v-model.trim="formParams.wfNodeCode" maxlength="50" clearable placeholder="请输入流程节点编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="关键操作节点" prop="mainCode">
                <el-input v-model.trim="formParams.mainCode" maxlength="50" clearable placeholder="请输入关键操作节点" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排序" prop="sortCode">
                <el-input type="number" v-model.trim="formParams.sortCode" maxlength="50" clearable placeholder="请输入排序" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="flowStatus">
                <el-input v-model.trim="formParams.flowStatus" maxlength="50" clearable placeholder="请输入状态" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="普通业务操作说明" prop="opeartionDes">
                <el-input
                  v-model.trim="formParams.opeartionDes"
                  type="textarea"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入普通业务操作说明"
                  resize="none"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="说明" prop="remark">
                <el-input
                  v-model.trim="formParams.remark"
                  type="textarea"
                  :rows="3"
                  maxlength="500"
                  show-word-limit
                  placeholder="请输入说明"
                  resize="none"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="air-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="small" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="small" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'remarkModal'
}
</script>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormRules } from 'element-plus'

interface RemarkParams {
  id?: string
  code?: string
  name?: string
  groupCode?: string
  groupName?: string
  operationType?: string
  operationRole?: string
  operationRoleCode?: string
  yjclbmType?: string
  yjclbm?: string
  mainCode?: string
  sortCode?: number | string
  flowStatus?: string
  wfCode?: string
  wfNodeCode?: string
  pslx?: string
  opeartionDes?: string
  remark?: string
}

const emit = defineEmits<{
  (e: 'success', val: RemarkParams): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('新增步骤')

const operationTypeOptions = [
  { value: '1', label: '普通操作' },
  { value: '2', label: '工作流审批' },
  { value: '3', label: '评审意见' }
]
const pslxOptions = [
  { value: '1', label: '外围系统评审' },
  { value: '2', label: '联合会审评审' },
  { value: '3', label: '省专业预审退回' },
  { value: '4', label: '省财务、发展线下会审' }
]
const yjclbmTypeOptions = [
  { value: '1', label: '直接获取' },
  { value: '2', label: '通过脚本获取' }
]

const formParams = ref<RemarkParams>({})

/** 动态校验规则：选中工作流审批(2)时必填流程相关字段 */
const rules = computed<FormRules>(() => {
  const r: FormRules = {
    code: [{ required: true, message: '请输入步骤编码', trigger: 'blur' }],
    name: [{ required: true, message: '请输入步骤名称', trigger: 'blur' }],
    groupCode: [{ required: true, message: '请输入环节编码', trigger: 'blur' }],
    groupName: [{ required: true, message: '请输入环节名称', trigger: 'blur' }],
    operationType: [{ required: true, message: '请选择操作类型', trigger: 'change' }]
  }
  if (formParams.value.operationType === '2') {
    r.wfCode = [{ required: true, message: '请输入流程编码', trigger: 'blur' }]
    r.wfNodeCode = [{ required: true, message: '请输入流程节点编码', trigger: 'blur' }]
  }
  return r
})

/** 切换操作类型时清除已隐藏字段的校验态 */
const handleOperationTypeChange = () => {
  ruleFormRef.value?.clearValidate?.()
}

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      const submitData = { ...formParams.value }
      // 先关闭弹窗再 emit：父组件保存成功后会触发列表 reload + 自动列宽重算，
      // 若此时表单弹窗仍在卸载/动画中，两者叠加会明显卡顿。
      isShowModal.value = false
      emit('success', submitData)
    } finally {
      loading.value = false
    }
  })
}

const acceptParams = (params: Partial<RemarkParams> = {}) => {
  modalTitle.value = params.id ? '编辑步骤' : '新增步骤'
  formParams.value = {
    id: params.id || '',
    code: params.code || '',
    name: params.name || '',
    groupCode: params.groupCode || '',
    groupName: params.groupName || '',
    operationType: params.operationType ?? '',
    operationRole: params.operationRole || '',
    operationRoleCode: params.operationRoleCode || '',
    yjclbmType: params.yjclbmType ?? '',
    yjclbm: params.yjclbm || '',
    mainCode: params.mainCode || '',
    sortCode: params.sortCode || '',
    flowStatus: params.flowStatus || '',
    wfCode: params.wfCode || '',
    wfNodeCode: params.wfNodeCode || '',
    pslx: params.pslx ?? '',
    opeartionDes: params.opeartionDes || '',
    remark: params.remark || ''
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
