<template>
  <vxe-modal
    position="center"
    :loading="loading"
    v-model="dialogVisible"
    :title="`文件上传${parameter.title}`"
    :destroy-on-close="true"
    width="580px"
  >
    <div class="import-excel">
      <el-form class="import-excel__form drawer-multiColumn-form" label-width="100px">
        <el-form-item v-if="parameter.tempApi" class="import-excel__item" label="模板下载 :">
          <div class="import-excel__action">
            <el-button type="primary" class="import-excel__button" @click="downloadTemp">点击下载</el-button>
            <span class="import-excel__helper">建议先下载标准模板后填写，再上传导入。</span>
          </div>
        </el-form-item>
        <el-form-item v-if="parameter.importTip" class="import-excel__item" label="导入提示 :">
          <div class="import-excel__tip">{{ parameter.importTip }}</div>
        </el-form-item>
        <el-form-item class="import-excel__item import-excel__item--upload" label="文件上传 :">
          <el-upload
            ref="uploadRef"
            action="#"
            class="upload import-excel__upload"
            :drag="true"
            :limit="excelLimit"
            :multiple="false"
            :show-file-list="true"
            :http-request="uploadExcel"
            :before-upload="beforeExcelUpload"
            :on-exceed="handleExceed"
            accept=".xls,.xlsx,.et"
          >
            <slot name="empty">
              <div class="import-excel__upload-empty">
                <i class="el-icon-upload import-excel__upload-icon"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                <p class="import-excel__upload-note">单次仅支持上传 1 个文件，选中文件后会自动开始导入。</p>
              </div>
            </slot>
            <template #tip>
              <slot name="tip">
                <div class="el-upload__tip import-excel__upload-tip"> 请上传 .xls , .xlsx 标准格式文件，文件最大为 {{ parameter.fileSize }}M </div>
              </slot>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ImportExcel">
import { ref } from 'vue'
import { useDownload } from '@/hooks/useDownload'
import { ElMessage } from 'element-plus'

export interface ExcelParameterProps {
  title: string // 标题
  specialorgid: string // 特殊组织id
  fileSize?: number // 上传文件的大小
  tempApi?: (params: any) => Promise<any> // 下载模板的Api
  importTip?: string // 导入提示
  importApi?: (params: any) => Promise<any> // 导入的Api
  getTableList?: () => void // 获取表格数据的Api
}

const loading = ref(false)

const uploadRef = ref()

// 是否覆盖数据
const isCover = ref(false)
// 最大文件上传数
const excelLimit = ref(1)
// dialog状态
const dialogVisible = ref(false)
// 父组件传过来的参数
const parameter = ref<ExcelParameterProps>({
  title: '',
  fileSize: 50,
  specialorgid: ''
})

// 接收父组件参数
const acceptParams = (params: ExcelParameterProps) => {
  parameter.value = { ...parameter.value, ...params }
  dialogVisible.value = true
}

// Excel 导入模板下载
const downloadTemp = () => {
  if (!parameter.value.tempApi) return
  useDownload(parameter.value.tempApi, `${parameter.value.title}模板`)
}

// 文件上传
const uploadExcel = async (param: any) => {
  loading.value = true
  try {
    let excelFormData = new FormData()
    excelFormData.append('file', param.file)
    excelFormData.append('isCover', isCover.value as unknown as Blob)
    const res = await parameter.value.importApi!({
      specialorgid: parameter.value.specialorgid,
      excelFormData
    })
    if (!res.success) {
      throw new Error(res.msg)
    }
    ElMessage({
      type: 'success',
      message: `导入成功！`
    })
    parameter.value.getTableList && parameter.value.getTableList()
    dialogVisible.value = false
  } catch (e) {
    ElMessage({
      type: 'error',
      message: `${(e as Error).message}，请您重新上传文件！`
    })
    // 清空上传失败的文件
    if (uploadRef.value && uploadRef.value.clearFiles) {
      uploadRef.value.clearFiles()
    }
  } finally {
    loading.value = false
  }
}

/**
 * @description 文件上传之前判断
 * @param file 上传的文件
 * */
const beforeExcelUpload = (file: any) => {
  const allowExt = ['xls', 'xlsx', 'et']
  const ext = file.name.split('.').pop().toLowerCase()
  const isExcel = allowExt.includes(ext)
  const fileSize = file.size / 1024 / 1024 < parameter.value.fileSize!
  if (!isExcel) {
    ElMessage({
      message: '上传文件只能是 xls / xlsx / et 格式！',
      type: 'warning'
    })
    return false
  }
  if (!fileSize) {
    ElMessage({
      message: `上传文件大小不能超过 ${parameter.value.fileSize}MB！`,
      type: 'warning'
    })
    return false
  }
  return true
}

// 文件数超出提示
const handleExceed = () => {
  ElMessage({
    message: '最多只能上传一个文件！',
    type: 'warning'
  })
}

// 上传错误提示
const excelUploadError = () => {
  ElMessage({
    message: `上传${parameter.value.title}失败，请您重新上传！`,
    type: 'error'
  })
}

// 上传成功提示
const excelUploadSuccess = () => {
  ElMessage({
    message: `上传${parameter.value.title}成功！`,
    type: 'success'
  })
}

defineExpose({
  acceptParams
})
</script>
<style lang="less" scoped>
@import './index.less';
</style>
