<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowModal"
      destroy-on-close
      :title="modalTitle"
      width="600px"
      @close="handleClose"
      :loading="loading"
    >
      <el-form ref="ruleFormRef" label-suffix=":" label-width="180px" label-position="right" :model="searchParams">
        <el-row :gutter="0">
          <el-col :span="24">
            <el-form-item label="责任人账号" prop="projectManagerId">
              <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.projectManagerId" placeholder="请输入责任人账号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="责任人名称" prop="projectManagerName">
              <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.projectManagerName" placeholder="请输入责任人名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目负责主任账号" prop="directorId">
              <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.directorId" placeholder="请输入项目负责主任账号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="项目负责主任姓名" prop="directorName">
              <el-input clearable :maxlength="64" show-word-limit v-model.trim="searchParams.directorName" placeholder="请输入项目负责主任姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="服务招标-类型" prop="serviceBidType">
              <el-select v-model="searchParams.serviceBidType" clearable filterable placeholder="请选择服务招标-类型" style="width: 100%">
                <el-option v-for="item in serviceBidList" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="物资招标-类型" prop="materialBidType">
              <el-select v-model="searchParams.materialBidType" clearable filterable placeholder="请选择物资招标-类型" style="width: 100%">
                <el-option v-for="item in materialBidList" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="结算方式" prop="jsfs">
              <el-select v-model="searchParams.jsfs" clearable filterable placeholder="请选择结算方式" style="width: 100%">
                <el-option v-for="item in jsfsList" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="物资招标批次" prop="materialBidPc">
              <el-input maxlength="80" placeholder="请选择物资招标批次" v-model="searchParams.materialBidPc" disabled>
                <template #append>
                  <el-button class="el-icon-more" @click="handleSearch('1')" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="服务招标批次" prop="serviceBidPc">
              <el-input maxlength="80" placeholder="请选择服务招标批次" v-model="searchParams.serviceBidPc" disabled>
                <template #append>
                  <el-button class="el-icon-more" @click="handleSearch('2')" />
                </template>
              </el-input>
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
    <zbpc ref="zbpcModalRef" @handlePcType="handlePcType" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'maintModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPublicData } from '@/api/common'
import zbpc from '@/views/lyg/project/proInfoAdd/components/zbpc/index.vue'

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
const zbpcModalRef = ref()

const serviceBidList = ref<CodeItem[]>([])
const materialBidList = ref<CodeItem[]>([])
const jsfsList = ref<CodeItem[]>([])

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
      ElMessage.success('保存成功！')
      emit('searchHandle', { ...searchParams.value })
      handleClose()
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  })
}

const handleSearch = (type: any) => {
  const params = {
    type: type,
    modalTitle: type == '2' ? '服务招标批次' : '物资招标批次'
  }
  zbpcModalRef.value.acceptParams({ ...params })
}

const handlePcType = (val: any) => {
  if (val) {
    if (val.type == '2') {
      searchParams.value.serviceBidPc = val.zbpcName
      searchParams.value.fwzbpc = val.zbpc
    } else {
      searchParams.value.materialBidPc = val.zbpcName
      searchParams.value.wzzbpc = val.zbpc
    }
  }
}

/** 获取下拉选项数据 */
const fetchOptions = async () => {
  try {
    const [code1, code2, code3] = await Promise.all([
      getPublicData('LYG_XMQGC_INFO_SERVICE_BID_TYPE_COM'),
      getPublicData('LYG_XMQGC_INFO_MATERIAL_BID_TYPE_COM'),
      getPublicData('LYG_XMQGC_INFO_JSFS_COM')
    ])
    serviceBidList.value = code1.data
    materialBidList.value = code2.data
    jsfsList.value = code3.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

/** 打开弹窗 */
const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type
  isShowModal.value = true
  fetchOptions()
}

defineExpose({ acceptParams })
</script>
