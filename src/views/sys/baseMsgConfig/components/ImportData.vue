<template>
  <vxe-modal @close="closeHandle" width="570" height="510" :destroy-on-close="true" :show-footer="false" show-zoom resize position="center" title="数据配置" v-model="isShowModal">
    <div class="form-group">
      <label class="form-label">表名：</label>
      <input v-model="formData.tabName" type="text" class="form-input" placeholder="请输入表名" />
    </div>
    <div class="form-group">
      <label class="form-label">配置代码：</label>
      <input v-model="formData.sysParamCode" type="text" class="form-input" placeholder="请输入配置代码" />
    </div>
    <div class="header-with-action">
      <el-button type="button" class="download-btn" @click="downloadHandle">模板下载</el-button>
    </div>
    <div class="divider"></div>
    <div class="form-group" style="margin-bottom: 0">
      <el-upload ref="uploadRef" action="#" class="upload-area" :drag="true" :limit="excelLimit" :multiple="false" :show-file-list="true" :http-request="uploadExcel" :before-upload="beforeExcelUpload" :on-exceed="handleExceed" :accept="parameter.fileType!.join(',')">
        <slot name="empty">
          <p class="el-upload__text">将文件拖到此处，或<em>点击上传</em></p>
          <p class="file-limits">请上传 .xls , .xlsx 标准格式文件</p>
        </slot>
      </el-upload>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "/sys/baseMsgConfig/components/ImportData"
};
</script>
<script setup lang="ts">
import { batchUpdateData, getBatchOperationTemplate } from "@/api/fy/common/utils";
import { ElMessage } from "element-plus";
import { ref, reactive, defineExpose } from "vue";

interface ExcelParameterProps {
  title: string; // 标题
  specialorgid: string; // 特殊组织id
  fileSize?: number; // 上传文件的大小
  fileType?: File.ExcelMimeType[]; // 上传文件的类型
}

const uploadRef = ref();
const isShowModal = ref(false);

// 最大文件上传数
const excelLimit = ref(1);

const formData = reactive({
  tabName: "",
  sysParamCode: ""
});

const parameter = ref<ExcelParameterProps>({
  title: "",
  fileSize: 5,
  specialorgid: "",
  fileType: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
});

const closeHandle = () => {
  formData.tabName = "";
  formData.sysParamCode = "";
  if (uploadRef.value && uploadRef.value.clearFiles) {
    uploadRef.value.clearFiles();
  }
};

const downloadHandle = async () => {
  let res = await getBatchOperationTemplate(formData.sysParamCode, formData.tabName);
  const blob = res;
  let dom = document.createElement("a");
  let url = window.URL.createObjectURL(blob);
  dom.href = url;
  // 获取文件名
  let filename = res.headers["content-disposition"].split(";")[1].split("=")[1];
  dom.download = `${decodeURI(decodeURI(filename))}`;
  document.body.appendChild(dom);
  dom.click();
  document.body.removeChild(dom);
  window.URL.revokeObjectURL(url);
};

// 文件上传
const uploadExcel = async (param: any) => {
  let excelFormData = new FormData();
  excelFormData.append("file", param.file);
  const res = await batchUpdateData({
    ...formData,
    excelFormData
  });
  if (res.success) {
    ElMessage({
      type: "success",
      message: `上传${parameter.value.title}成功！`
    });
  } else {
    ElMessage({
      type: "error",
      message: `${res.msg}，请您重新上传！`
    });
    // 清空上传失败的文件
    if (uploadRef.value && uploadRef.value.clearFiles) {
      uploadRef.value.clearFiles();
    }
  }
};

/**
 * @description 文件上传之前判断
 * @param file 上传的文件
 * */
const beforeExcelUpload = (file: any) => {
  const isExcel = parameter.value.fileType?.includes(file.type as File.ExcelMimeType);
  if (!isExcel)
    ElMessage({
      message: "上传文件只能是 xls / xlsx 格式！",
      type: "warning"
    });
  return isExcel;
};

// 文件数超出提示
const handleExceed = () => {
  ElMessage({
    message: "最多只能上传一个文件！",
    type: "warning"
  });
};

defineExpose({
  isShowModal
});
</script>

<style scoped lang="less">
.form-group {
  font-family: --apple-stylem, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetia Neue", Arial, sans-serif;
  margin-bottom: 10px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 500;
}
.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-input:focus {
  border-color: #00b894;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 184, 148, 0.2);
  color: #333;
}

:deep(.el-upload--text) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}
:deep(.el-upload-dragger):hover {
  border-color: #00b894;
  background: rgba(0, 184, 148, 0.05);
}
.upload-text {
  color: #606f7b;
  text-decoration: none;
}

.upload-link {
  color: #00b894;
  text-decoration: none;
}

.file-limits {
  font-size: 10px;
  color: #999;
  margin-bottom: 4px;
}

.header-with-action {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.download-btn {
  color: #00b894;
  font-size: 14px;
  outline: none;
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.download-btn:hover {
  color: #00a383;
  text-decoration: underline;
  background-color: rgba(0, 184, 148, 0.1);
}

.section-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 16px;
}

.divider {
  height: 1px;
  background: none;
  border-top: 1px dashed #ccc;
  margin: 15px 0;
}

.form-group:last-of-type {
  margin-bottom: 16px;
}
</style>
