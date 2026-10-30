<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="900px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form class="air-modal-form" ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="formParams">
          <el-form-item label="文件标题">
            <span class="file-name-text" :title="formParams.attachName">{{ formParams.attachName || '-' }}</span>
          </el-form-item>
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="所属目录" prop="directoryId">
                <ElTreeSelect
                  v-model="formParams.directoryId"
                  clearable
                  :data="directoryList"
                  :props="directoryProps"
                  node-key="id"
                  placeholder="请选择"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业" prop="major">
                <el-select v-model="formParams.major" clearable filterable placeholder="请选择专业" style="width: 100%">
                  <el-option v-for="item in majorList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发文字号" prop="wjzh">
                <el-input v-model.trim="formParams.wjzh" maxlength="64" placeholder="请输入发文字号" resize="none" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发文时间" prop="fwsj">
                <el-date-picker
                  style="width: 100%"
                  :clearable="false"
                  v-model="formParams.fwsj"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  type="date"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文件来源" prop="fwdw">
                <el-select v-model="formParams.fwdw" clearable filterable placeholder="请选择文件来源" style="width: 100%">
                  <el-option v-for="item in fwdwList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="拟稿部门" prop="fwbm">
                <el-input v-model.trim="formParams.fwbm" maxlength="64" placeholder="请输入拟稿部门" resize="none" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="文件使用类型" prop="wjsylx">
                <el-input v-model.trim="formParams.wjsylx" maxlength="128" placeholder="请输入文件使用类型" resize="none" />
                <!-- <el-select v-model="formParams.wjsylx" clearable filterable placeholder="请选择预警环节" style="width: 100%">
                  <el-option v-for="item in wjsylxList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select> -->
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model.trim="formParams.remark"
              type="textarea"
              :rows="4"
              maxlength="200"
              show-word-limit
              placeholder="请输入备注"
              resize="none"
            />
          </el-form-item>
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
import { nextTick, ref } from 'vue'
import { getPublicCodeList } from '@/api/common'
import { getDirectoryTree } from '@/api/sys/fileShare'
import { ElMessage } from 'element-plus'
import ElTreeSelect from '@/components/ElTreeSelect'

interface RemarkParams {
  id: string
  attachName?: string
  remark?: string
  wjzh?: string
  fwsj?: string
  fwdw?: string
  fwbm?: string
  wjsylx?: string
  major?: string
  directoryId?: string
}

const emit = defineEmits<{
  (
    e: 'success',
    val: { id: string; remark: string; wjzh: string; fwsj: string; fwdw: string; fwbm: string; wjsylx: string; major: string; directoryId: string }
  ): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('编辑备注')
const wjsylxList = ref<any[]>([])
const majorList = ref<any[]>([])
const fwdwList = ref<any[]>([])
const directoryList = ref<any[]>([])
const directoryProps = {
  label: 'name',
  children: 'children',
  value: 'id'
}

const formParams = ref<RemarkParams>({
  id: '',
  remark: '',
  attachName: '',
  wjzh: '',
  fwsj: '',
  fwdw: '',
  fwbm: '',
  wjsylx: '',
  major: '',
  directoryId: ''
})

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  loading.value = true
  emit('success', {
    id: formParams.value.id,
    remark: formParams.value.remark || '',
    wjzh: formParams.value.wjzh || '',
    fwsj: formParams.value.fwsj || '',
    fwdw: formParams.value.fwdw || '',
    fwbm: formParams.value.fwbm || '',
    wjsylx: formParams.value.wjsylx || '',
    major: formParams.value.major || '',
    directoryId: formParams.value.directoryId || ''
  })
  loading.value = false
  handleClose()
}

const acceptParams = async (params: RemarkParams) => {
  formParams.value = {
    id: params.id,
    attachName: params.attachName || '',
    remark: params.remark || '',
    wjzh: params.wjzh || '',
    fwsj: params.fwsj || '',
    fwdw: params.fwdw || '',
    fwbm: params.fwbm || '',
    wjsylx: params.wjsylx || '',
    major: params.major || '',
    directoryId: params.directoryId || ''
  }
  isShowModal.value = true
  await nextTick()
  await getCodeList()
}

const getCodeList = async () => {
  const res: any = await getPublicCodeList({
    codes: ['DIRECTORY_WJSYLX', 'DIRECTORY_ATTACH_MAJOR_COM', 'DIRECTORY_ATTACH_FWDW_COM']
  })
  wjsylxList.value = res.data['DIRECTORY_WJSYLX']
  majorList.value = res.data['DIRECTORY_ATTACH_MAJOR_COM']
  fwdwList.value = res.data['DIRECTORY_ATTACH_FWDW_COM']
  const data: any = await getDirectoryTree()
  if (!data.success) return ElMessage.error(data.msg)
  directoryList.value = data.data
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.file-name-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular, #475569);
  font-size: 13px;
}
</style>
