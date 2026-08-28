<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="520px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form class="air-modal-form" ref="ruleFormRef" label-suffix=":" label-width="100px" label-position="right" :model="searchParams">
          <el-form-item label="启用类型" prop="inuseType" :rules="[{ required: true, message: '请选择启用类型' }]">
            <el-select v-model="searchParams.inuseType" clearable filterable placeholder="请选择启用类型" style="width: 100%">
              <el-option v-for="item in enableTypeList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="searchParams.inuseType == '2'"
            label="一级单位"
            prop="yjdwList"
            :rules="[{ required: true, message: '请选择一级单位' }]"
          >
            <el-select v-model="searchParams.yjdwList" multiple clearable filterable placeholder="请选择一级单位" style="width: 100%">
              <el-option v-for="item in yjdwList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="air-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'rangeModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { aiAuditEdit } from '@/api/suzhou/aiAuditInuseRange'
import { VXETable } from 'vxe-table'
import { getPublicData, commonCodeYjdw } from '@/api/common'

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
const enableTypeList = ref<CodeItem[]>([])
const yjdwList = ref<CodeItem[]>([])

const searchParams = ref<any>({})

/** 关闭弹窗 */
const handleClose = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

/** 保存 */
const handleSave = () => {
  if (loading.value) return
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    searchParams.value.yjdwList = searchParams.value.inuseType == '1' ? [] : searchParams.value.yjdwList
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
      const res = await aiAuditEdit({ ...searchParams.value })
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
  enableTypeList.value = []
  yjdwList.value = []
  try {
    const [code, yjdw] = await Promise.all([getPublicData('AI_AUDIT_INUSE_TYPE_COM'), commonCodeYjdw()])
    if (!code.success || !Array.isArray(code.data)) throw new Error(code.msg || '启用类型加载失败')
    if (!yjdw.success || !Array.isArray(yjdw.data)) throw new Error(yjdw.msg || '一级单位加载失败')
    enableTypeList.value = code.data
    yjdwList.value = yjdw.data
  } catch (error) {
    ElMessage.error((error as Error).message || '选项加载失败，请关闭后重试')
  }
}

/** 打开弹窗 */
const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type
  const sp = params.searchParams || {}
  // 单条编辑回显启用类型/一级单位；批量编辑保持空值由用户重新选择
  searchParams.value = {
    ...sp,
    inuseType: sp.inuseType != null && sp.inuseType !== undefined ? String(sp.inuseType) : '',
    yjdwList: Array.isArray(sp.yjdwList) ? [...sp.yjdwList] : []
  }
  isShowModal.value = true
  fetchOptions()
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
