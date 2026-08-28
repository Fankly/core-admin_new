<!-- 作业标准成本体系配置-新增/编辑/查看 -->
<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    show-footer
    :title="modalParams.type"
    width="60%"
    height="600px"
    @close="reset"
    :loading="loading"
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="formData" :disabled="isDisabled">
      <el-row :gutter="0">
        <el-col :span="12">
          <el-form-item label="作业编码" prop="zybm" :rules="[{ required: true, message: '请输入作业编码' }]">
            <el-input clearable :maxlength="64" v-model.trim="formData.zybm" placeholder="请输入作业编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="作业名称" prop="zymc" :rules="[{ required: true, message: '请输入作业名称' }]">
            <el-input clearable :maxlength="128" v-model.trim="formData.zymc" placeholder="请输入作业名称" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="作业内容描述" prop="zynrms">
            <el-input
              resize="none"
              clearable
              type="textarea"
              :maxlength="2000"
              show-word-limit
              :rows="3"
              v-model.trim="formData.zynrms"
              placeholder="请输入作业内容描述"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电压等级" prop="dydj">
            <el-input clearable :maxlength="64" v-model.trim="formData.dydj" placeholder="请输入电压等级" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="容量(KVA)" prop="rl">
            <el-input clearable :maxlength="64" v-model.trim="formData.rl" placeholder="请输入容量" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备单位" prop="sbdw">
            <el-input clearable :maxlength="64" v-model.trim="formData.sbdw" placeholder="请输入设备单位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="人材机编码" prop="rcjbm">
            <el-input clearable :maxlength="64" v-model.trim="formData.rcjbm" placeholder="请输入人材机编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="人材机名称" prop="rcjmc">
            <el-input clearable :maxlength="128" v-model.trim="formData.rcjmc" placeholder="请输入人材机名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单位" prop="dw">
            <el-input clearable :maxlength="32" v-model.trim="formData.dw" placeholder="请输入单位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="单价(元)" prop="dj">
            <el-input clearable :maxlength="32" v-model.trim="formData.dj" placeholder="请输入单价" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数量" prop="sl">
            <el-input clearable :maxlength="32" v-model.trim="formData.sl" placeholder="请输入数量" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额(元)" prop="je">
            <el-input clearable :maxlength="32" v-model.trim="formData.je" placeholder="请输入金额" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sortNo">
            <el-input clearable :maxlength="32" v-model.trim="formData.sortNo" placeholder="请输入排序" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              resize="none"
              clearable
              type="textarea"
              :maxlength="500"
              show-word-limit
              :rows="2"
              v-model.trim="formData.remark"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button v-if="!isDisabled" size="mini" v-debounce="[save, `click`, 300]" type="primary">保 存</el-button>
        <el-button size="mini" v-debounce="[reset, `click`, 300]" plain>关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'zyDetailModal'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { saveOrUpdateHandler, queryById } from '@/api/service/xmcs/workStandardCostConfig'

interface ModalProps {
  type: string // 新增 / 编辑 / 查看
  dirId: string // 所属三级目录
  row?: any // 编辑/查看时的明细数据
}

const isShowModal = ref(false)
const loading = ref(false)
const isDisabled = ref(false)
const ruleFormRef = ref()
const modalParams = ref<ModalProps>({ type: '', dirId: '' })
const formData = ref<any>({})

const emits = defineEmits(['saveDataAfter'])

const initForm = () => {
  formData.value = {
    id: '',
    dirId: '',
    zybm: '',
    zymc: '',
    zynrms: '',
    dydj: '',
    rl: '',
    sbdw: '',
    rcjbm: '',
    rcjmc: '',
    dw: '',
    dj: '',
    sl: '',
    je: '',
    sortNo: '',
    remark: ''
  }
}

const save = () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
    if (type !== 'confirm') return ElMessage.info('已取消')
    const params = { ...formData.value, dirId: modalParams.value.dirId, id: formData.value.id || undefined }
    loading.value = true
    try {
      const res = await saveOrUpdateHandler([params])
      if (!res.success) return ElMessage.error(res.msg)
      ElMessage.success('保存成功！')
      emits('saveDataAfter')
      reset()
    } finally {
      loading.value = false
    }
  })
}

const reset = () => {
  initForm()
  isDisabled.value = false
  isShowModal.value = false
}

const acceptParams = async (params: ModalProps) => {
  initForm()
  modalParams.value = { ...params }
  isDisabled.value = params.type === '查看'
  isShowModal.value = true
  if (params.type === '新增') {
    formData.value.dirId = params.dirId
    return
  }
  // 编辑 / 查看：优先用列表行回显，再尝试按 id 拉取最新
  formData.value = { ...formData.value, ...(params.row || {}) }
  if (params.row?.id) {
    loading.value = true
    try {
      const res: any = await queryById({ id: params.row.id })
      if (res.success && res.data) {
        const detail = Array.isArray(res.data?.records) ? res.data.records[0] : Array.isArray(res.data) ? res.data[0] : res.data
        if (detail) formData.value = { ...formData.value, ...detail }
      }
    } finally {
      loading.value = false
    }
  }
}

defineExpose({ acceptParams })
</script>
<style scoped lang="less"></style>
