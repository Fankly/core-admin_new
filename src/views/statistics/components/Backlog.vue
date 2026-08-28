<template>
  <div class="container">
    <div class="upload-table">
      <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text"
        ><h3 class="sub-title">
          可研报告及支撑材料
          <span>
            <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span></h3
      ></el-button>
      <div v-show="!isShowSearch" class="table-box" v-loading="loading">
        <proTable :data-callback="dataCallBackHandle" :tool-button="[]" :pagination="false" :request-api="getFjTableHandle" :requestAuto="true" :columns="fjColumns" ref="backLogRef">
          <template #opreation="scope">
            <el-button size="mini" type="primary" plain @click="previewHandle(scope.row)">预览</el-button>
          </template>
        </proTable>
      </div>
    </div>
    <div class="preview-layout">
      <el-button class="title-button" @click="isShowTable = !isShowTable" type="text"
        ><h3 class="sub-title">
          附件预览
          <span>
            <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
          </span></h3
      ></el-button>
      <div class="perview" v-show="!isShowTable">
        <iframe frameborder="0" scrolling="auto" style="border: none" :src="previewUrl" width="100%" height="100%"></iframe>
      </div>
    </div>
  </div>
</template>

<script lang="tsx">
export default {
  name: "BackLog"
};
</script>
<script setup lang="tsx">
import proTable from "@/components/ProTable/index.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { onMounted, reactive, ref, toRef, defineProps } from "vue";
import { downloadAttach, getAttach } from "@/api/matter/yssxMatter";
import emits from "@/utils/emits";
import { getParamValue } from "@/api/common";
import { RowVo, DetailParams } from "../interface";

interface Props {
  detailParams: RowVo & DetailParams;
}

const props = defineProps<Props>();

const backLogRef = ref();

const loading = ref(false);
const isShowSearch = ref(false);
const isShowTable = ref(false);

const previewUrl = ref("");

const selectedData = toRef(props, "detailParams");

const uploadId = ref("");

const fileSize = ref("50");

emits.on("getMatterChangeMsg", (val) => {
  uploadId.value = val.matterBaseMsg.id;
  backLogRef.value?.search();
});

onMounted(async () => {
  const res = await getParamValue("QMYS_GROUP", "YSSX_WJDX");
  if (res.success && res.data) {
    fileSize.value = res.data;
  }
});

const getFjTableHandle = (params: any) => {
  loading.value = true;
  let yssxbm = selectedData.value.yssxbm;
  uploadId.value = yssxbm;
  return getAttach(yssxbm, "2");
};

const uploadTableData = ref();

const dataCallBackHandle = (data: any[]) => {
  if (data.length !== 0) {
    previewHandle(data[0]);
  } else {
    previewUrl.value = "";
  }
  uploadTableData.value = data;
  loading.value = false;
  return data;
};

const downloadUploadHandle = async (params: any) => {
  loading.value = true;
  let res = await downloadAttach(params.uuid);
  const blob: any = res;
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
  loading.value = false;
};

const fjColumns = reactive<ColumnProps<any>[]>([
  { type: "index", label: "序号" },
  {
    prop: "fjmc",
    label: "附件名称",
    render: (scope) => {
      return (
        <el-button type="text" onClick={() => downloadUploadHandle(scope.row)}>
          {scope.row.fjmc}
        </el-button>
      );
    }
  },
  { prop: "filesize", label: "附件大小" },
  { prop: "opreation", label: "操作" }
]);

const previewHandle = async (params: any) => {
  let res = await downloadAttach(params.uuid);
  let url = window.URL.createObjectURL(new Blob([res], { type: "application/pdf" }));
  previewUrl.value = url + "#toolbar=0";
};
</script>

<style lang="less" scoped>
.container {
  height: 820px;
  display: flex;
  flex-direction: column;
  padding: 10px 34px;

  .upload-table {
    display: flex;
    flex-direction: column;
  }

  .preview-layout {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .perview {
      flex: 1;
      min-width: 0;
      min-height: 0;
      border: 1px solid black;
    }
  }
}

.el-upload__tip {
  margin-top: 10px;
  color: red;
}

:deep(.operate) {
  height: auto !important;
}

.sub-title {
  font-size: 18px;
  text-align: left;
}

.title-button {
  margin: 0 0 10px 0;
  padding: 0;
  height: 40px;
}
</style>
