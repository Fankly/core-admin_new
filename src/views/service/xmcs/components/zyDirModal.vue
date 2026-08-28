<!-- 作业标准分类目录-新增/编辑 -->
<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    show-footer
    :title="modalParams.type"
    width="480px"
    @close="reset"
    :loading="loading"
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="100px" label-position="right" :model="formData">
      <el-form-item label="上级目录">
        <el-input :model-value="modalParams.parentName || '顶级目录'" disabled />
      </el-form-item>
      <el-form-item label="目录名称" prop="dirName" :rules="[{ required: true, message: '请输入目录名称' }]">
        <el-input clearable :maxlength="128" show-word-limit v-model.trim="formData.dirName" placeholder="请输入目录名称" />
      </el-form-item>
      <el-form-item label="排序" prop="sortNo">
        <el-input-number v-model="formData.sortNo" :min="0" :max="9999" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          resize="none"
          clearable
          type="textarea"
          :maxlength="500"
          show-word-limit
          :rows="3"
          v-model.trim="formData.remark"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button size="mini" v-debounce="[save, `click`, 300]" type="primary">保 存</el-button>
        <el-button size="mini" v-debounce="[reset, `click`, 300]" plain>关 闭</el-button>
      </div>
    </template>
  </vxe-modal>
</template>
<script lang="ts">
export default {
  name: 'zyDirModal'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { saveOrUpdateDir } from '@/api/service/xmcs/workStandardCostConfig'

interface ModalProps {
  type: string // 新增 / 编辑
  parentId: string // 父目录id，一级目录为 0
  parentName?: string // 父目录名称（仅展示）
  nodeLevel: number // 当前目录层级
  row?: any // 编辑时回显的目录数据
}
const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalParams = ref<ModalProps>({ type: '', parentId: '0', nodeLevel: 1 })
const formData = ref<any>({ id: '', dirName: '', sortNo: 0, remark: '' })

const emits = defineEmits(['saveDataAfter'])

const save = () => {
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
    if (type !== 'confirm') return ElMessage.info('已取消')
    const params = {
      id: formData.value.id || undefined,
      parentId: modalParams.value.parentId,
      nodeLevel: modalParams.value.nodeLevel,
      dirName: formData.value.dirName,
      sortNo: formData.value.sortNo,
      remark: formData.value.remark
    }
    loading.value = true
    try {
      const res = await saveOrUpdateDir(params as any)
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
  formData.value = { id: '', dirName: '', sortNo: 0, remark: '' }
  isShowModal.value = false
}

const acceptParams = (params: ModalProps) => {
  modalParams.value = { ...params }
  if (params.type === '编辑' && params.row) {
    formData.value = {
      id: params.row.id || '',
      dirName: params.row.dirName || '',
      sortNo: params.row.sortNo ?? 0,
      remark: params.row.remark || ''
    }
  } else {
    formData.value = { id: '', dirName: '', sortNo: 0, remark: '' }
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>
<style scoped lang="less"></style>
