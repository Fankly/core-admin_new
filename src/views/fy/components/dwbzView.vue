<template>
  <vxe-modal v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="props.title" v-model="showModal" show-zoom resize position="center">
    <div class="operation">
      <div class="operation-btn" v-if="toolButton">
        <el-button type="primary" v-if="showToolButton('save')" plain @click="saveHandle">保 存</el-button>
        <el-button type="primary" v-if="showToolButton('sd')" @click="sdHandle" plain>审 定</el-button>
        <el-button type="primary" v-if="showToolButton('import')" plain @click="importHandle">导 入</el-button>
        <el-button type="primary" v-if="showToolButton('export')" plain @click="exportHandle">导 出</el-button>
        <el-button type="primary" v-if="showToolButton('download')" plain @click="viewFileHandle">查看附件</el-button>
        <el-button type="primary" v-if="showToolButton('close')" plain @click="closeHandle">关闭</el-button>
      </div>
      <div class="operation-form">
        <span>单位：</span>
        <vxe-select :disabled="isDisabled" @change="changeDwHandle" v-model="dwMsg.dwId" placeholder="请选择">
          <template v-for="item in dwMsg.dwList" :key="item.code">
            <vxe-option :label="item.name" :value="item.code"></vxe-option>
          </template>
        </vxe-select>
      </div>
    </div>
    <div class="standrand-table">
      <vxe-table 
        :header-cell-style="headerCellStyle"
        :row-config="tableMsg.rowConfig"
        :cell-style="cellStyle"
        keep-source
        :edit-config="tableMsg.editConfig"
        :tree-config="tableMsg.ndTreeConfig"
        height="100%"
        ref="treeTableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :data="tableMsg.tableData"
      >
        <template v-for="item in tableMsg.columns" :key="item.columnKey">
          <vxe-column show-overflow :tree-node="item.columnKey === 'name'" :formatter="formatterData" header-align="center" align="left" v-if="['name', 'cnx', 'sbsm'].includes(item.columnKey)" min-width="200px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
          <vxe-column :formatter="formatterData" show-overflow header-align="center" align="right" v-else-if="item.eidt" min-width="160px" :field="item.columnKey" :title="item.columnValue" :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }">
            <template #edit="{ row }">
              <input v-number-input="tableMsg.xsws" class="my-input" v-if="row?.id && !row?.leaf && item.eidt" @change="sumhandle(row, item.columnKey)" v-model="row[item.columnKey]" maxlength="20" />
            </template>
          </vxe-column>
          <vxe-column show-overflow :formatter="formatterData" header-align="center" align="right" v-else min-width="160px" :field="item.columnKey" :title="item.columnValue"></vxe-column>
        </template>
      </vxe-table>
    </div>
  </vxe-modal>
  <FileUpload :busiId="busiId" @close="(val:boolean)=> uploadMsg.isShowModal = val" :toolButton="false" :kmlx="kmlx" :specialorgid="specialorgid" :nd="tableMsg.nd" :is-show-modal="uploadMsg.isShowModal"></FileUpload>
  <ImportExcel ref="importRef" />
</template>

<script lang="ts">
export default {
  name: "dwbzView"
};
</script>
<script setup lang="ts">
import FileUpload from "@/views/fy/components/FileUpload.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { withDefaults, defineEmits, defineProps, computed, defineExpose, reactive, ref, toRef } from "vue";
import { getDwJc } from "@/api/fy/release";
import { ElMessage } from "element-plus";
import { VXETable } from "vxe-table";
import { getGroupSummary } from "@/utils/prearranged";
import { useStore } from "vuex";
import { TableMsg } from "../prearranged/interface";
import { Decimal } from "decimal.js";
import { judgeSaved } from "@/api/fy/release/provinceReview";
import { formatValue } from "@/utils/utils";

export interface ModalProps {
  isShowModal: boolean;
  dwId: string;
  nd: string;
  xsws: string;
  specialorgid: string;
  kmlx: string;
  flag: string;
  operationFlag: string;
  templateApi?: (params: any) => Promise<any>;
  importDataApi?: (params: any) => Promise<any>;
  tableApi: (params: any) => Promise<any>;
  headerApi: (params: any) => Promise<any>;
  saveApi?: (params: any) => Promise<any>;
  sdApi?: (params: any) => Promise<any>;
  exportApi?: (params: any) => Promise<any>;
  toolButton?: ("save" | "import" | "export" | "download" | "sd" | "close")[] | boolean; // 是否显示
  title: string;
  showHeader: boolean;
  busiId?: string;
  busiType: string;
  sdzt?: string;
}

const treeTableRef = ref();
const importRef = ref();

const isDisabled = computed(() => (props.flag === "ProvinceReview" || props.flag === "CityReView") && props.operationFlag !== "view");

const uploadMsg = reactive({
  isShowModal: false
});

const store = useStore();

const props = withDefaults(defineProps<ModalProps>(), {
  isShowModal: false,
  dwId: "",
  nd: new Date().getFullYear().toString(),
  specialorgid: "",
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  toolButton: true,
  showHeader: false,
  operationFlag: "edit"
});

const showModal = toRef(props, "isShowModal");

const emit = defineEmits(["closeDialog", "updateTable", "viewFile"]);

const loading = ref(false);

const dwMsg = reactive<{
  dwId: string;
  dwList: any;
}>({
  dwId: "",
  dwList: []
});

const activeCellMethod = ({ row }: any) => {
  return row.id && !row.leaf;
};

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  tableData: [],
  nd: "",
  xsws: "",
  columns: [],
  editConfig: {
    trigger: "click",
    mode: "cell",
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  ndTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params = {
        dwId: dwMsg.dwId,
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: props.specialorgid,
        kmlx: props.kmlx,
        parentId: row.id,
        busiType: props.busiType,
        opType: props.operationFlag
      };
      let api = props.tableApi;
      return new Promise((resolve: any) => {
        api(params).then((res) => {
          if (res.success) {
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            resolve([]);
          }
        });
      });
    }
  }
});

const showToolButton = (key: "save" | "export" | "download" | "import" | "sd" | "close") => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton;
};

const isNeedNum = (columns: any[], field: string) => {
  let findIndex = columns.findIndex((item) => item.needSum && item.columnKey === field);
  return findIndex > -1;
};

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") {
    if (props.operationFlag === "view" && props.sdzt && props.sdzt === "0") {
      return new Decimal(0).toFixed(Number(tableMsg.xsws));
    } else {
      return "-";
    }
  }
  if (tableMsg.columns) {
    const isNum = isNeedNum(tableMsg.columns, column.field);
    if (isNum) {
      return formatValue(cellValue, Number(tableMsg.xsws));
    }
  }
  return cellValue;
};

const importHandle = () => {
  let newParmas = {
    busiType: props.busiType,
    dwId: store.getters.getOldDwId,
    kmlx: props.kmlx,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: "-1",
    specialorgid: props.specialorgid,
    ejdw: props.specialorgid
  };
  let tempApi: any = props.templateApi;
  let importApi: any = props.importDataApi;

  if (!tempApi && !importApi) return;
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      };
      return tempApi(newImportParams);
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      };
      return importApi(newImportParams);
    },
    specialorgid: props.specialorgid,
    getTableList: initTableData
  };
  importRef.value.acceptParams(params);
};

const exportHandle = () => {
  loading.value = true;
  let api = props.exportApi;
  if (!api) return;
  let params = {
    busiType: props.busiType,
    dwId: store.getters.getOldDwId,
    kmlx: props.kmlx,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    parentId: "-1",
    specialorgid: props.specialorgid,
    opType: props.operationFlag
  };
  api(params).then((res: any) => {
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
    loading.value = false;
  });
};

const showHandle = () => {
  dwMsg.dwId = props.dwId;
  store.commit("setOldDwId", props.dwId);
  tableMsg.nd = props.nd;
  tableMsg.xsws = props.xsws || "2";
  if (props.operationFlag === "view") {
    if (tableMsg.editConfig) tableMsg.editConfig.enabled = false;
  } else {
    if (tableMsg.editConfig) tableMsg.editConfig.enabled = true;
  }
  initDwData();
  initTableData();
};

const sumhandle = (row: any, key: string) => {
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(tableMsg.xsws)) : new Decimal(0).toFixed(Number(tableMsg.xsws));
  getGroupSummary(tableMsg.tableData, tableMsg.ndTreeConfig as any, key, Number(tableMsg.xsws), "leaf", "id");
};

const changeDwHandle = async ({ value }: any) => {
  const $table = treeTableRef.value;
  if ($table) {
    const updateRecordsLength = $table.getUpdateRecords().length;
    if (updateRecordsLength > 0) {
      const type = await VXETable.modal.confirm("存在数据未保存,是否进行保存？", "提示");
      if ("cancel" !== type) {
        saveHandle();
      }
    }
  }
  store.commit("setOldDwId", value);
  initTableData();
};

const initDwData = async () => {
  let res = await getDwJc(props.specialorgid, props.busiType, props.kmlx);
  if (res.success) {
    dwMsg.dwList = res.data;
  } else {
    ElMessage.error("请刷新页面进行重试！");
  }
};

const isClickHeader = (columns: any, field: string) => {
  let column = columns.find((item: any) => item.eidt && item.columnKey === field);
  return !!column;
};

const cellStyle = ({ row, column }: any) => {
  if (tableMsg.editConfig && !tableMsg.editConfig.enabled) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }
  if (!isClickHeader(tableMsg.columns, column.field)) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }

  if (!row.id || row.leaf) {
    return {
      cursor: "auto",
      backgroundColor: "rgba(232, 234, 236,0.5)"
    };
  }
};

const initTableData = async () => {
  loading.value = true;
  let api = props.tableApi;
  let headerApi = props.headerApi;
  if (!api && !headerApi) return;
  try {
    let params = {
      busiType: props.busiType,
      dwId: dwMsg.dwId,
      kmlx: props.kmlx,
      nd: tableMsg.nd,
      xsws: tableMsg.xsws,
      specialorgid: props.specialorgid,
      opType: props.operationFlag
    };
    let tableData = await api({
      ...params,
      parentId: "-1"
    });
    let headerData = await headerApi(params);
    tableMsg.tableData = tableData.data;
    tableMsg.columns = headerData.data.filter((item: any) => !item.hidden);
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const sdHandle = async () => {
  // 判断是否存在修改值,如果修改值,提示是否保存
  if (props.sdzt && props.sdzt === "0") {
    // 调用保存接口
    let saveRes = await judgeSaved({
      busiType: props.busiType,
      dwId: dwMsg.dwId,
      kmlx: props.kmlx,
      nd: tableMsg.nd,
      xsws: tableMsg.xsws
    });
    if (!saveRes.data) {
      ElMessage.warning("请保存后,再进行审定");
      return;
    }
  }
  const $table = treeTableRef.value;
  const updateRecordsLength = $table.getUpdateRecords().length;
  let type: string;
  if (updateRecordsLength > 0) {
    type = await VXETable.modal.confirm("存在数据未保存,是否继续进行审定？", "提示");
    if ("cancel" === type) {
      return;
    }
  } else {
    type = await VXETable.modal.confirm("是否确定审定？", "提示", {
      status: "warning"
    });
    if ("cancel" === type) {
      return;
    }
  }
  if (type === "confirm") {
    let api = props.sdApi;
    if (!api) return;
    try {
      if ($table) {
        let params = {
          busiType: props.busiType,
          ejdw: dwMsg.dwId,
          kmlx: props.kmlx,
          nd: tableMsg.nd,
          xsws: tableMsg.xsws
        };
        let res = await api({
          ...params
        });
        if (res.success) {
          ElMessage.success("审定成功");
          emit("updateTable", "sd");
        } else {
          ElMessage.error(res.msg);
        }
      }
      loading.value = false;
    } catch (error) {
      loading.value = false;
    }
  }
};

const viewFileHandle = () => {
  uploadMsg.isShowModal = true;
  emit("viewFile");
};

const saveHandle = async () => {
  const type = await VXETable.modal.confirm("是否确定保存？", "提示", {
    status: "warning"
  });
  if (type === "confirm") {
    loading.value = true;
    const $table = treeTableRef.value;
    let api = props.saveApi;
    if (!api) return;
    try {
      if ($table) {
        let params = {
          busiType: props.busiType,
          dwId: store.getters.getOldDwId,
          kmlx: props.kmlx,
          nd: tableMsg.nd,
          xsws: tableMsg.xsws
        };
        let tableData = await api({
          ...params
        });
        if (tableData.success) {
          await initTableData();
          ElMessage.success("保存成功");
          emit("updateTable", "save");
        } else {
          ElMessage.error(tableData.msg);
        }
      }
      loading.value = false;
    } catch (error) {
      loading.value = false;
    }
  }
};

const closeHandle = () => {
  // 重置数据
  if (tableMsg.tableData) tableMsg.tableData.length = 0;
  emit("closeDialog", !props.isShowModal);
};

defineExpose({
  element: treeTableRef,
  closeHandle,
  saveHandle
});
</script>

<style scoped lang="less">
.vxe-modal--content {
  padding: 10px;

  .standrand-table {
    margin-top: 10px;
    height: calc(100% - 44px);
  }
}

.operation {
  display: flex;

  &-btn,
  &-form {
    width: 50%;
  }

  &-form {
    text-align: right;

    .el-form--inline {
      height: 34px;

      .el-form-item {
        margin: 0;
      }
    }
  }
}
</style>
