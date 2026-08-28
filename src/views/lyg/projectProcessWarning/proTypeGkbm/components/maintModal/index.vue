<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="600px"
    height="460px"
    @close="handleClose"
    :loading="loading"
    show-footer
  >
    <el-form ref="ruleFormRef" label-suffix=":" label-width="150px" label-position="right" :model="searchParams">
      <el-row :gutter="0">
        <el-col :span="24">
          <el-form-item label="单位" prop="yjdw" :rules="[{ required: true, message: '请选择单位' }]">
            <el-select v-model="searchParams.yjdw" @change="selectChange" clearable filterable placeholder="请选择单位" style="width: 100%">
              <el-option v-for="item in yjdwList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="市归口部门" prop="bmId" :rules="[{ required: true, message: '请选择市归口部门' }]">
            <el-select v-model="searchParams.bmId" clearable filterable placeholder="请选择市归口部门" style="width: 100%">
              <el-option v-for="item in gkbmList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="项目类型" prop="protypeList" :rules="[{ required: true, message: '请选择项目类型' }]">
            <ElTreeSelect
              v-model="searchParams.protypeList"
              clearable
              :data="projectTypeList"
              :default-checked-keys="checkedKeys"
              :props="proTypeProps"
              :multiple="true"
              :show-checkbox="true"
              :collapse-tags="true"
              :check-on-click-node="false"
              node-key="middleId"
              placeholder="请选择项目类型"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button size="mini" v-debounce="[handleSave, `click`, 300]" type="primary"> 保 存 </el-button>
        <el-button size="mini" v-debounce="[handleClose, `click`, 300]" plain> 关 闭 </el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'maintModal'
}
</script>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { configSave } from '@/api/lyg/index'
import { getYjdwNew, getSubProtypeTree } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import ElTreeSelect from '@/components/ElTreeSelect/index'

/** 公共代码项 */
interface CodeItem {
  code: string
  name: string
}

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Record<string, any>
  specialorgid: string
  org_id: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')
const userInfo = ref<any>()
const checkedKeys = ref<any[]>([]) //选中的叶子节点
const yjdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
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
      const res = await configSave({ ...searchParams.value })
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

const selectChange = async (val: any) => {
  gkbmList.value.length = 0
  let gkbm: any = await getSgbm({
    YJDW: val,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    parentCode: val
  })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

/** 获取下拉选项数据 */
const fetchOptions = async (specialorgid: any) => {
  try {
    projectTypeList.value.length = 0
    gkbmList.value.length = 0
    const code = await getYjdwNew(specialorgid)
    yjdwList.value = code.data
    const xmlx = await getSubProtypeTree()
    if (xmlx.success && xmlx.data.length !== 0) {
      projectTypeList.value.push(...xmlx.data)
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

/** 打开弹窗 */
const acceptParams = async (params: ModalParams) => {
  userInfo.value = { ...params }
  modalTitle.value = params.type
  searchParams.value = params.searchParams
  isShowModal.value = true
  fetchOptions(userInfo.value.specialorgid)
  if (modalTitle.value == '编辑') {
    searchParams.value.protypeList = searchParams.value.protypeList.split(',')
    checkedKeys.value = searchParams.value.protypeList
    selectChange(searchParams.value.yjdw)
  } else {
    // 新增：初始化为数组，避免 undefined 触发 required 校验报错
    searchParams.value.protypeList = []
    checkedKeys.value = []
  }
}

defineExpose({ acceptParams })
</script>
