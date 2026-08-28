<template>
  <vxe-modal
    ref="modalRef"
    class-name="xmrp-edit-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="860px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="xmrp-modal-body">
      <div class="xmrp-modal-panel">
        <el-form class="xmrp-modal-form" ref="ruleFormRef" label-suffix=":" label-width="140px" label-position="right" :model="formData">
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="物料大类" prop="materialMajor">
                <el-input clearable :maxlength="64" show-word-limit v-model.trim="formData.materialMajor" placeholder="请输入物料大类" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物料中类" prop="materialMiddle">
                <el-input clearable :maxlength="64" show-word-limit v-model.trim="formData.materialMiddle" placeholder="请输入物料中类" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物料小类" prop="materialMinor">
                <el-input clearable :maxlength="64" show-word-limit v-model.trim="formData.materialMinor" placeholder="请输入物料小类" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物料编码" prop="materialCode" :rules="[{ required: true, message: '请输入物料编码' }]">
                <el-input clearable :maxlength="64" show-word-limit v-model.trim="formData.materialCode" placeholder="请输入物料编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-input clearable :maxlength="32" show-word-limit v-model.trim="formData.unit" placeholder="请输入单位" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="除税价格（元）"
                prop="priceExTax"
                :rules="[{ validator: validateNumber, trigger: 'blur' }]"
              >
                <el-input clearable v-model.trim="formData.priceExTax" placeholder="请输入除税价格" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="含税价格（元）"
                prop="priceInTax"
                :rules="[{ validator: validateNumber, trigger: 'blur' }]"
              >
                <el-input clearable v-model.trim="formData.priceInTax" placeholder="请输入含税价格" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="物料描述" prop="materialDesc">
                <el-input
                  clearable
                  :maxlength="256"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="3"
                  v-model.trim="formData.materialDesc"
                  placeholder="请输入物料描述"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="xmrp-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'xmMaterialRefPriceEditModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { saveOrUpdateXmMaterialRefPrice } from '@/api/ai/xmMaterialRefPrice'
import type { XmMaterialRefPriceEditParams } from '@/api/ai/xmMaterialRefPrice'
import { VXETable } from 'vxe-table'

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Partial<XmMaterialRefPriceEditParams>
}

interface EditFormData {
  id?: string
  materialMajor: string
  materialMiddle: string
  materialMinor: string
  materialCode: string
  materialDesc: string
  unit: string
  priceExTax: string
  priceInTax: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')

const createEmptyForm = (): EditFormData => ({
  id: undefined,
  materialMajor: '',
  materialMiddle: '',
  materialMinor: '',
  materialCode: '',
  materialDesc: '',
  unit: '',
  priceExTax: '',
  priceInTax: ''
})

const formData = ref<EditFormData>(createEmptyForm())

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  formData.value = createEmptyForm()
  isShowModal.value = false
}

/** 价格数字校验（允许空值，后端导入支持千分位逗号） */
const validateNumber = (_rule: any, value: string, callback: any) => {
  if (value === '' || value == null) return callback()
  const normalized = String(value).replace(/,/g, '')
  if (isNaN(Number(normalized))) return callback(new Error('请输入有效数字'))
  callback()
}

const handleSave = () => {
  if (loading.value) return
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
      const payload: XmMaterialRefPriceEditParams = {
        materialMajor: formData.value.materialMajor,
        materialMiddle: formData.value.materialMiddle,
        materialMinor: formData.value.materialMinor,
        materialCode: formData.value.materialCode,
        materialDesc: formData.value.materialDesc,
        unit: formData.value.unit,
        priceExTax: formData.value.priceExTax,
        priceInTax: formData.value.priceInTax
      }
      if (formData.value.id) {
        payload.id = formData.value.id
      }
      const res = await saveOrUpdateXmMaterialRefPrice(payload)
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

const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type
  formData.value = {
    id: params.searchParams.id,
    materialMajor: params.searchParams.materialMajor || '',
    materialMiddle: params.searchParams.materialMiddle || '',
    materialMinor: params.searchParams.materialMinor || '',
    materialCode: params.searchParams.materialCode || '',
    materialDesc: params.searchParams.materialDesc || '',
    unit: params.searchParams.unit || '',
    priceExTax: params.searchParams.priceExTax ?? '',
    priceInTax: params.searchParams.priceInTax ?? ''
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
