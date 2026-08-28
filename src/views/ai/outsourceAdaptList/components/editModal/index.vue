<template>
  <vxe-modal
    ref="modalRef"
    class-name="outsource-adapt-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="860px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="oal-modal-body">
      <div class="oal-modal-panel">
        <el-form class="oal-modal-form" ref="ruleFormRef" label-suffix=":" label-width="160px" label-position="right" :model="formData">
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="序号" prop="seqNo" :rules="[{ required: true, message: '请输入序号' }]">
                <el-input clearable :maxlength="16" show-word-limit v-model.trim="formData.seqNo" placeholder="请输入序号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="业务大类" prop="bizMajorCat" :rules="[{ required: true, message: '请选择业务大类' }]">
                <el-select
                  v-model="formData.bizMajorCat"
                  clearable
                  filterable
                  placeholder="请选择业务大类"
                  style="width: 100%"
                  @change="handleMajorCatChange"
                >
                  <el-option v-for="item in bizMajorCatList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="业务小类" prop="bizSubCat" :rules="[{ required: true, message: '请选择业务小类' }]">
                <el-select
                  v-model="formData.bizSubCat"
                  clearable
                  filterable
                  placeholder="请先选择业务大类"
                  style="width: 100%"
                  :disabled="!formData.bizMajorCat"
                >
                  <el-option v-for="item in bizSubCatList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="禁止外包的整项业务" prop="prohibitedBiz" :rules="[{ required: true, message: '请输入禁止外包的整项业务' }]">
                <el-input
                  clearable
                  :maxlength="512"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="4"
                  v-model.trim="formData.prohibitedBiz"
                  placeholder="请输入禁止外包的整项业务"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item
                label="整项业务中外包的辅助性业务"
                prop="allowedAuxBiz"
                :rules="[{ required: true, message: '请输入整项业务中外包的辅助性业务' }]"
              >
                <el-input
                  clearable
                  :maxlength="512"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="4"
                  v-model.trim="formData.allowedAuxBiz"
                  placeholder="请输入整项业务中外包的辅助性业务"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="oal-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'outsourceAdaptListEditModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { editOutsourceAdaptList } from '@/api/ai/outsourceAdaptList'
import type { OutsourceAdaptListEditParams } from '@/api/ai/outsourceAdaptList'
import { getCommonDict } from '@/api/common'
import { VXETable } from 'vxe-table'

/** 业务大类 / 小类公共代码（级联：大类 getCommonDict(code)，小类 getCommonDict(code, pCode)） */
const BIZ_CAT_CODE = 'OUTSOURCE_RULE_KB_BIZ_CAT'

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Partial<OutsourceAdaptListEditParams>
}

interface EditFormData {
  id?: string
  seqNo: string
  bizMajorCat: string
  bizSubCat: string
  prohibitedBiz: string
  allowedAuxBiz: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const bizMajorCatList = ref<CodeItem[]>([])
const bizSubCatList = ref<CodeItem[]>([])

const createEmptyForm = (): EditFormData => ({
  id: undefined,
  seqNo: '',
  bizMajorCat: '',
  bizSubCat: '',
  prohibitedBiz: '',
  allowedAuxBiz: ''
})

const formData = ref<EditFormData>(createEmptyForm())

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  formData.value = createEmptyForm()
  bizSubCatList.value = []
  isShowModal.value = false
}

/** 加载业务大类 */
const fetchMajorOptions = async () => {
  try {
    const res = await getCommonDict(BIZ_CAT_CODE)
    if (res.success) {
      bizMajorCatList.value = res.data || []
    } else {
      bizMajorCatList.value = []
      ElMessage.error(res.msg || '加载业务大类失败')
    }
  } catch (e) {
    bizMajorCatList.value = []
    ElMessage.error((e as Error).message)
  }
}

/** 按大类加载业务小类 */
const fetchSubOptions = async (majorCode: string) => {
  bizSubCatList.value = []
  if (!majorCode) return
  try {
    const res = await getCommonDict(BIZ_CAT_CODE, majorCode)
    if (res.success) {
      bizSubCatList.value = res.data || []
    } else {
      ElMessage.error(res.msg || '加载业务小类失败')
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

/** 大类变更：清空小类并重新加载 */
const handleMajorCatChange = async (val: string) => {
  formData.value.bizSubCat = ''
  await fetchSubOptions(val || '')
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
      const payload: OutsourceAdaptListEditParams = {
        seqNo: formData.value.seqNo,
        bizMajorCat: formData.value.bizMajorCat,
        bizSubCat: formData.value.bizSubCat,
        prohibitedBiz: formData.value.prohibitedBiz,
        allowedAuxBiz: formData.value.allowedAuxBiz
      }
      if (formData.value.id) {
        payload.id = formData.value.id
      }
      const res = await editOutsourceAdaptList(payload)
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

const acceptParams = async (params: ModalParams) => {
  modalTitle.value = params.type
  formData.value = {
    id: params.searchParams.id,
    seqNo: params.searchParams.seqNo || '',
    bizMajorCat: params.searchParams.bizMajorCat || '',
    bizSubCat: params.searchParams.bizSubCat || '',
    prohibitedBiz: params.searchParams.prohibitedBiz || '',
    allowedAuxBiz: params.searchParams.allowedAuxBiz || ''
  }
  isShowModal.value = true
  loading.value = true
  try {
    await fetchMajorOptions()
    if (formData.value.bizMajorCat) {
      await fetchSubOptions(formData.value.bizMajorCat)
    } else {
      bizSubCatList.value = []
    }
  } finally {
    loading.value = false
  }
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
