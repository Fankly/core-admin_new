<template>
  <vxe-modal
    :show-footer="true"
    resize
    :height="height"
    width="720px"
    :destroy-on-close="true"
    :loading="loading"
    @close="closeHandle"
    :title="modalTitle"
    v-model="showModal"
    position="center"
  >
    <el-form ref="formRef" :rules="formRules" :model="formData" label-suffix=":" label-width="120px" label-position="right">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="预算事项" prop="yssxId">
            <el-select style="width: 100%" v-model="formData.yssxId" @change="changeYssxData">
              <el-option v-for="item in yssxData" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="三级分类" prop="sjfl">
            <el-select style="width: 100%" v-model="formData.sjfl" @change="changeSjflData">
              <el-option v-for="item in sjflData" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="是否调度端" prop="isDispatch">
            <el-select clearable style="width: 100%" v-model="formData.isDispatch" @change="changeIsDispatchData">
              <el-option v-for="item in isDispatchData" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="线路类型" prop="xllx">
            <el-select clearable style="width: 100%" v-model="formData.xllx">
              <el-option v-for="item in xllxData" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="电压等级" prop="dydj">
            <el-select style="width: 100%" v-model="formData.dydj">
              <el-option v-for="item in dydjData" :key="item.code" :value="item.code" :label="item.name"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="operation" style="text-align: center">
        <el-button plain type="primary" @click="saveHandle">保 存</el-button>
        <el-button plain type="primary" @click="closeHandle">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts" name="SqckConfirmTypeModal">
import { useLinkMatter } from './hooks/useLinkMatter'

const {
  formRef,
  showModal,
  loading,
  closeHandle,
  modalTitle,
  formData,
  height,
  acceptParams,
  formRules,
  changeYssxData,
  yssxData,
  sjflData,
  isDispatchData,
  dydjData,
  xllxData,
  changeIsDispatchData,
  changeSjflData,
  saveHandle
} = useLinkMatter()

defineExpose({
  acceptParams
})
</script>

<style scoped></style>
