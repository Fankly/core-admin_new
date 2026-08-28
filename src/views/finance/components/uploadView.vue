<template>
  <dialogContainer
    :bodyStyle="{ marginTop: '10px' }"
    :bodyWapperStyle="{ margin: '0 30px' }"
    :buttonLoading="uploadLoading"
    class="uploadView"
    ref="dialogContainer"
    :onCancel="() => onCancel(false)"
    :onSubmit="() => onSubmit()"
  >
    <DashboardContainer rectangularIcon circleIcon title="选择文件" :headerStyle="{ padding: '0', height: '32px' }" :bodyStyle="{ padding: 0 }">
      <template v-slot:extra>
        <el-button v-if="handleTemplate" @click="handleExportTemplate" type="text">点击下载模版文件</el-button>
      </template>
      <FormConfigBox
        style="margin-top: 5px"
        v-if="formOptions && formOptions.length > 0"
        :config="{ labelWidth: '95px' }"
        ref="formOptions"
        :options="formOptions"
        v-model="dataValue"
      />
      <el-upload
        ref="uploadFile"
        drag
        multiple
        :auto-upload="false"
        :on-preview="handlePreview"
        :file-list="dataValue.importFile"
        :http-request="handleUpload"
        class="upload-view"
        :accept="accept || '.xls,.xlsx,.et'"
        :action="''"
        :on-remove="onRemove"
        :on-success="onUploadSuccess"
        :on-error="onUploadError"
        :on-exceed="onUploadLimit"
        :on-change="handleChange"
        :before-upload="onBeforeUpload"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处</div>
        <template #tip>
          <div class="el-upload__tip">支持拓展名: {{ accept || '.xls,.xlsx,.et' }}</div>
        </template>
      </el-upload>
    </DashboardContainer>
  </dialogContainer>
</template>
<script>
import httpUtil from '@/core/http/index.js'

import { uploadCustomMixin, uploadMixin } from '@/core/mixins'

// const isImage = (fileName) => {
//   return /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName);
// };

export default {
  components: {},
  props: {
    accept: String,
    uploadUrl: String,
    fieldName: String,
    param: Object,
    formOptions: {
      type: Array
    },
    handleTemplate: {
      type: Function
    }
  },
  name: 'uploadView',
  mixins: [uploadCustomMixin, uploadMixin],
  data() {
    return {
      buttonLoading: false,
      dataValue: {
        importFile: []
      },
      maxSizeMap: {
        // 'application/zip': 200 * 1024 * 1024, // .zip 最大 1GB
        // 'application/x-rar-compressed': 200 * 1024 * 1024, // .rar 最大 1GB
        // 'application/msword': 20 * 1024 * 1024, // .doc 最大 2MB
        // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 20 * 1024 * 1024, // .docx 最大 2MB
        // 'application/pdf': 2 * 1024 * 1024, // .pdf 最大 2MB
        // 'image/png': 2 * 1024 * 1024, // .png 最大 2MB
        // 'image/jpeg': 2 * 1024 * 1024, // .jpg 最大 2MB
        'application/vnd.ms-excel': 1024 * 1024 * 1024, // .xls 最大 1GB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 1024 * 1024 * 1024, // .xlsx 最大 1GB
        // WPS表格格式
        'application/vnd.ms-excel.et': 1024 * 1024 * 1024 // .et 最大 1GB
      }
    }
  },
  created() {},
  mounted() {},
  methods: {
    handleChange(file, fileList) {
      this.dataValue.importFile = [fileList[fileList.length - 1]] // 只保留最新文件
    },
    addApi(callback) {
      // this.handleUpload(callback);
      // this.$refs.uploadFile.submit();
      // callback();
      return new Promise((resolve, reject) => {
        const submit = () => {
          this.uploadCallback = (res) => {
            resolve(res)
          }
          this.$refs.uploadFile.submit()
        }
        if (this.$refs.formOptions) {
          this.$refs.formOptions.validate((valid) => {
            if (valid) {
              // 保存回调函数，以便在上传成功后调用
              submit()
            } else {
              reject()
            }
          })
        } else {
          submit()
        }
      })
    },
    onCancel(isSuccess = false, data) {
      if (this.observer != null) {
        this.observer.cancel(isSuccess, data)
      }
    },
    onSubmit() {
      this.buttonLoading = true
      this.addApi()
        .then((res) => {
          this.onCancel(true, res)
        })
        .catch((error) => {
          console.error('上传失败:', error)
          // this.buttonLoading = false;
        })
        .finally(() => {
          // this.buttonLoading = false;
        })
    },
    handleUpload({ file }) {
      const url = this.uploadUrl
      const fieldName = this.fieldName
      const { importFile, ...other } = this.dataValue

      this.customUpload({ file, url, fieldName, params: { ...other, ...this.param } }, this.uploadCallback)
    },
    handleExportTemplate() {
      this.handleTemplate?.(this.dataValue)
    },
    handlePreview(file) {}
  },
  computed: {},
  watch: {}
}
</script>
<style lang="scss" scoped></style>
