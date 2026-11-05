<template>
  <vxe-modal
    ref="modalRef"
    :destroy-on-close="true"
    :loading="loading"
    @close="handleCancel"
    :height="modalHeight"
    v-model="isShowModal"
    :width="modalWidth"
    :title="modalTitle"
    :show-footer="true"
    resize
  >
    <template #default>
      <el-form ref="versionFormRef" :model="versionForm" :rules="versionFormRules" label-suffix=":" label-postion="right" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="省专业部门" prop="bmName">
              <el-input maxlength="100" show-word-limit :disabled="true" v-model="versionForm.bmName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年度" prop="bmName">
              <el-input maxlength="100" show-word-limit :disabled="true" v-model="versionForm.nd"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="版本名称" prop="versionName">
              <el-input maxlength="64" show-word-limit v-model.trim="versionForm.versionName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input maxlength="1000" show-word-limit :rows="4" resize="none" type="textarea" v-model.trim="versionForm.remark"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </template>
    <template #footer>
      <div class="footer" style="text-align: center">
        <el-button type="primary" plain @click="handleSaveData">保 存</el-button>
        <el-button type="info" plain @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="TargetBudgetVersion">
import { useTargetBudgetVersion } from '@/views/targetBudget/provinceTarget/components/hooks/useTargetBudgetVersion'

interface TargetBudgetVersionProps {
  search: () => void
}

const props = defineProps<TargetBudgetVersionProps>()

const {
  loading,
  isShowModal,
  modalTitle,
  modalWidth,
  modalHeight,
  acceptParams,
  versionForm,
  versionFormRules,
  handleCancel,
  handleSaveData,
  versionFormRef
} = useTargetBudgetVersion(props)

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped></style>
