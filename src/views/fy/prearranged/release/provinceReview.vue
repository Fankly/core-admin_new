<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header @change-xsws="changeXswsHandle" @change-nd="changeNdHandle" ref="headerRef" :dw-name="userMsg.dwName" :tool-button="['dw', 'nd', 'xsws']" />
    <el-tabs type="border-card" v-model="tabMsg.name" @tab-click="isDisabledBtn">
      <el-tab-pane label="其他运营费用-主业" name="1">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" :disabled="isDisabled" plain @click="reviewHandle" v-permission="'AUDIT'">审 核 </el-button>
            <el-button type="primary" :disabled="isDisabled" plain @click="releaseHandle" v-permission="'RELEASE'"> 审定下达 </el-button>
            <el-button type="primary" v-permission="'EXPORT'" plain @click="exportTableDataHandle()">导 出 </el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ userMsg?.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            :row-config="tableMsg.rowConfig"
            show-overflow
            :loading="userMsg.loading"
            align="center"
            :header-cell-style="headerCellStyle"
            @header-cell-click="(tables: any) => headerCellClickHandle(tables)"
            @cell-click="(tables: any) => cellClickHandle(tables)"
            :cell-style="cellStyle"
            height="100%"
            ref="zyTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.tableData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="!item.hidden"
                :fixed="item.fixed ? 'left' : ''"
                show-overflow
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="340"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column :visible="!item.hidden" width="120" :fixed="item.fixed ? 'left' : ''" show-overflow :formatter="formatterData" header-align="center" align="right" v-else :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2">
        <div class="opeartion" v-if="userMsg.isShowPage">
          <div class="opeartion-left">
            <el-button type="primary" :disabled="isDisabled" plain @click="reviewHandle" v-permission="'AUDIT'">审 核 </el-button>
            <el-button type="primary" :disabled="isDisabled" plain @click="releaseHandle" v-permission="'RELEASE'"> 审定下达 </el-button>
            <el-button type="primary" v-permission="'EXPORT'" plain @click="exportTableDataHandle()">导 出 </el-button>
          </div>
          <div class="opeartion-right">
            <span>当前状态：{{ userMsg?.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table 
            show-overflow
            :row-config="tableMsg.rowConfig"
            :loading="userMsg.loading"
            @cell-click="(tables: any) => cellClickHandle(tables)"
            :cell-style="cellStyle"
            :header-cell-style="headerCellStyle"
            @header-cell-click="(tables: any) => headerCellClickHandle(tables)"
            height="100%"
            ref="ndTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.ndTreeConfig"
            :data="tableMsg.ndData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="!item.hidden"
                :fixed="item.fixed ? 'left' : ''"
                show-overflow
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="340"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column :visible="!item.hidden" width="120" :fixed="item.fixed ? 'left' : ''" show-overflow :formatter="formatterData" header-align="center" align="right" v-else :field="item.columnKey" :title="item.columnValue"></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    <reviewLayout
      :xsws="tableMsg.xsws"
      busi-type="YAP"
      ref="reviewLayoutRef"
      :row-config="{ isCurrent: true, height: 32 }"
      @close-dialog="closeDialog"
      :request-api="getTableList"
      :columns="reviewColumns"
      title="预安排单位审核-单位状态"
      :nd="tableMsg.nd"
      :kmlx="userMsg.flag"
      :specialorgid="userMsg.specialorgid"
      :is-show-modal="reviewMsg.isShowModal"
    >
      <template #button>
        <el-button type="primary" plain @click="sdDataHandle('edit')" :disabled="isDiabledSd">审 定</el-button>
        <el-button type="primary" plain @click="sdDataHandle('view')">查看审定值</el-button>
        <el-button type="primary" plain @click="closeDialog">关 闭</el-button>
      </template>
    </reviewLayout>
    <dwbzView
      :xsws="tableMsg.xsws"
      busi-type="YAP"
      width="94%"
      height="800"
      :busi-id="dwMsg.busiId"
      ref="dwbzViewRef"
      :save-api="saveHandle"
      :sd-api="sdHandle"
      :operation-flag="dwMsg.operationFlag"
      :templateApi="getDwImportTemplate"
      :importDataApi="importData"
      :exportApi="exportForDw"
      :title="dwMsg.title"
      :header-api="headerDataHandle"
      :table-api="getDataListDwDetail"
      flag="ProvinceReview"
      :kmlx="userMsg.flag"
      @update-table="updateTableData"
      :specialorgid="userMsg.specialorgid"
      :dw-id="dwMsg.dwId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'dw')"
      :is-show-modal="dwMsg.isShowModal"
      :toolButton="dwMsg.toolButton"
      :showHeader="dwMsg.showHeader"
      :sdzt="dwMsg.sdzt"
    ></dwbzView>
    <yskmView
      :xsws="tableMsg.xsws"
      busi-type="YAP"
      width="70%"
      height="800"
      :title="kmMsg.title"
      :header-api="getDynamicColumnByKm"
      :table-api="getDataListByKm"
      flag="CityReView"
      :kmlx="userMsg.flag"
      :exportApi="exportForKm"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :km-id="kmMsg.kmId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'km')"
      :is-show-modal="kmMsg.isShowModal"
    ></yskmView>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: "/fy/prearranged/release/provinceReview"
};
</script>

<script setup lang="ts">
import FyHeader from "@/views/fy/components/Header.vue";
import userDialog from "@/components/select/userDialog.vue";
import dwbzView from "@/views/fy/prearranged/release/components/dwbzView.vue";
import reviewLayout from "@/views/fy/prearranged/release/components/reviewLayout.vue";
import yskmView from "@/views/fy/prearranged/release/components/yskmView.vue";
import type { TableMsg, Columns } from "@/views/fy/prearranged/interface";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { VxeColumnProps } from "vxe-table";
import {
  getDataList,
  provinceSd,
  exportForKm,
  importData,
  getDwImportTemplate,
  exportForDw,
  provinceSave,
  getCurrentPageData,
  getDwStatus,
  getDynamicColumn,
  getDynamicColumnDwDetail,
  getDataListDwDetail,
  getDynamicColumnByKm,
  getDataListByKm,
  provinceXd,
  exportData
} from "@/api/fy/release/provinceReview";
import { findPrevNode, formatValue } from "@/utils/utils";

export type ToolButton = ("save" | "import" | "export" | "download" | "sd" | "close")[] | boolean;

const userDialogRef = ref();
const zyTableRef = ref();
const ndTableRef = ref();
const reviewLayoutRef = ref();
const headerRef = ref();
const dwbzViewRef = ref();
const toolbarOneRef = ref();
const toolbarTwoRef = ref();

const isDiabledSd = computed(() => !(reviewLayoutRef.value.curChangeData?.row, reviewLayoutRef.value.curChangeData?.row.sbzt === "1"));

const isDisabled = computed(() => userMsg.shxdzt === "1");

const userMsg = reactive<any>({
  userData: null,
  specialorgid: "",
  dwName: "",
  isShowPage: false,
  loading: false,
  flag: "1",
  busiId: "",
  statusInfo: "",
  shxdzt: ""
});

const reviewMsg = reactive({
  isShowModal: false
});

const dwMsg = reactive<{
  isShowModal: boolean;
  busiId: string;
  dwId: string;
  title: string;
  toolButton: ToolButton;
  showHeader: boolean;
  opType: string;
  dwData: any;
  operationFlag: string;
  sdzt: string;
}>({
  isShowModal: false,
  dwId: "",
  title: "预安排审定 - 单位查看",
  toolButton: ["export", "download", "close"],
  showHeader: false,
  opType: "",
  busiId: "",
  dwData: {},
  operationFlag: "",
  sdzt: ""
});

const tabMsg = reactive({
  name: "1",
  isDisabled: true
});

const kmMsg = reactive<{
  isShowModal: boolean;
  kmId: any;
  title: string;
}>({
  isShowModal: false,
  kmId: [],
  title: "预安排审定 - 科目查看"
});

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  nd: "",
  xsws: "",
  tableData: [],
  ndData: [],
  columns: [],
  ndColumns: [],
  zyTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params = {
        busiType: "YAP",
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: "1",
        parentId: row.id
      };
      return new Promise((resolve: any) => {
        getDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            resolve(res.data);
          } else {
            ElMessage.error(res.msg);
            resolve([]);
          }
        });
      });
    }
  },
  ndTreeConfig: {
    lazy: true,
    hasChildField: "leaf",
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: "2",
        parentId: row.id
      };
      return new Promise((resolve: any) => {
        getDataList({
          busiType: "YAP",
          ...params
        }).then((res: any) => {
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

const getDwData = async (specialorgid: string) => {
  let res = await getCurrentPageData(specialorgid, tableMsg.nd, userMsg.flag);
  if (res.success) {
    userMsg.dwName = res.data.dwName;
    userMsg.busiId = res.data.dwDetailId;
    userMsg.shxdzt = res.data.shxdzt;
    userMsg.statusInfo = res.data.statusInfo;
  } else {
    ElMessage.error(res.msg);
  }
};

const closeDialog = (val: boolean) => {
  reviewMsg.isShowModal = false;
  getDwData(userMsg.specialorgid);
};

const getTableList = (params: any) => {
  params.specialorgid = userMsg.specialorgid;
  return getDwStatus(params);
};

const isDisabledBtn = async ({ props }: any) => {
  userMsg.flag = props.name;
  getTableData();
  linkTable();
};

// 关闭modal
const closeModalHandle = (val: boolean, flag: string) => {
  flag === "dw" ? (dwMsg.isShowModal = val) : (kmMsg.isShowModal = val);
  dwMsg.dwId = "";
  kmMsg.kmId.length = 0;
};

// 审核
const reviewHandle = () => {
  reviewMsg.isShowModal = true;
};

const sdHandle = (params: any) => {
  params.dwId = params.ejdw;
  return provinceSd(params);
};

const saveHandle = (params: any) => {
  const records: any[] = dwbzViewRef.value.element.getUpdateRecords();
  const updateRecords = records.filter((item) => item.id && !item.leaf);
  let mxList = updateRecords.map((item) => {
    return {
      sdje: item.sdje,
      yskmId: item.id,
      detailId: item.detailId ? item.detailId : ""
    };
  });
  params.lists = mxList;
  return provinceSave(params);
};

// 审定
const sdDataHandle = (opType: string) => {
  let record = reviewLayoutRef.value.element.getCurrentRecord();
  if (!record) {
    ElMessage.warning("请选择一条数据进行操作！");
    return;
  }
  dwMsg.isShowModal = true;
  dwMsg.opType = opType;
  opType === "edit" ? (dwMsg.title = "预安排审定 - 单位审定") : (dwMsg.title = "预安排审定 - 单位查看");
  dwMsg.dwId = record.dwId;
  dwMsg.busiId = record.dwDetailId;
  dwMsg.sdzt = record.sdzt;
  dwMsg.operationFlag = opType;
  opType === "edit" ? (dwMsg.toolButton = ["save", "import", "export", "sd", "download", "close"]) : (dwMsg.toolButton = ["export", "close", "download"]);
};

// 下达
const releaseHandle = async () => {
  ElMessageBox.confirm("是否确认审定下达？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "success"
  }).then(async () => {
    let res = await provinceXd({
      nd: tableMsg.nd,
      kmlx: userMsg.flag,
      dwId: userMsg.specialorgid
    });
    if (res.success) {
      getTableData();
      ElMessage.success("审定下达成功!");
    } else {
      ElMessage.error(res.msg);
    }
  });
};

// 导出
const exportTableDataHandle = () => {
  userMsg.loading = true;
  exportData({
    busiType: "YAP",
    kmlx: userMsg.flag,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    parentId: "-1"
  }).then((res: any) => {
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
    userMsg.loading = false;
  });
};

const headerDataHandle = (params: any) => {
  dwMsg.opType === "edit" ? (params.opType = "1") : (params.opType = "0");
  return getDynamicColumnDwDetail(params);
};

// 判断表头是否可以点击
const isClickHeader = (columns: Columns[], field: string) => {
  return columns.find((item: Columns) => item.eidt && item.columnKey === field);
};

// 表头点击
const headerCellClickHandle = ({ column }: any) => {
  const isColumn = isClickHeader(tableMsg.columns as Columns[], column.field);
  if (isColumn) {
    let opType = "view";
    dwMsg.isShowModal = true;
    dwMsg.busiId = isColumn.dwDetailId;
    dwMsg.dwId = column.field;
    dwMsg.isShowModal = true;
    dwMsg.opType = opType;
    opType === "edit" ? (dwMsg.title = "预安排审定 - 单位审定") : (dwMsg.title = "预安排审定 - 单位查看");
    dwMsg.operationFlag = opType;
    opType === "edit" ? (dwMsg.toolButton = ["save", "import", "export", "sd", "download", "close"]) : (dwMsg.toolButton = ["export", "close", "download"]);
  }
};

const headerCellStyle = ({ column }: any) => {
  const isColumn = isClickHeader(tableMsg.columns as Columns[], column.field);
  if (isColumn) {
    return {
      cursor: "pointer",
      color: "rgb(0, 112, 107)",
      padding: "8px 0",
      lineHeight: "16px"
    };
  }
  return {
    cursor: "auto",
    color: "#303133",
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const cellClickHandle = async ({ row, column }: any) => {
  if (row.id && !row.leaf && column.field === "name") {
    kmMsg.isShowModal = true;
    const tableData = Number(userMsg.flag) === 1 ? tableMsg.tableData : tableMsg.ndData;
    kmMsg.kmId = findPrevNode(tableData, row);
  }
};

const cellStyle = ({ row, column }: any) => {
  if (row.id && !row.leaf && column.field === "name") {
    return {
      cursor: "pointer",
      backgroundColor: "rgba(232, 234, 236,0.5)",
      color: "rgb(0, 112, 107)"
    };
  }
  return {
    cursor: "auto",
    backgroundColor: "rgba(232, 234, 236,0.5)",
    color: "rgb(96, 98, 102)"
  };
};

const isNeedNum = (columns: any[], field: string) => {
  let findIndex = columns.findIndex((item) => item.needSum && item.columnKey === field);
  return findIndex > -1;
};

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  if (tableMsg.columns) {
    const isNum = isNeedNum(tableMsg.columns, column.field);
    if (isNum) {
      return formatValue(cellValue, Number(tableMsg.xsws));
    }
  }
  return cellValue;
};

const getRoleHandle = async () => {
  userMsg.userData = { ...userDialogRef.value.userMsg };
  userMsg.specialorgid = userMsg.userData.org_id;
  const isQuery = userDialogRef.value.isQuery;
  tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString();
  tableMsg.xsws = headerRef.value.formParams.xsws || "2";
  if (isQuery) {
    userMsg.isShowPage = true;
    // 判断是否已经下达
    // 获取动态列和动态表头
    await getTableData();
    linkTable();
  }
};

const updateTableData = (val: string) => {
  reviewLayoutRef.value.getTableList();
  getDwData(userMsg.specialorgid);
  getTableData();
  if (val === "sd") closeModalHandle(false, "dw");
};

const linkTable = () => {
  const $table = Number(userMsg.flag) === 1 ? zyTableRef.value : ndTableRef.value;
  const $toolBar = Number(userMsg.flag) === 1 ? toolbarOneRef.value : toolbarTwoRef.value;
  if ($table && $toolBar) {
    $table.connect($toolBar);
  }
};

const getTableData = async () => {
  clearTableData();
  getDwData(userMsg.specialorgid);
  userMsg.loading = true;
  let params = {
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    kmlx: userMsg.flag,
    parentId: "-1",
    busiType: "YAP"
  };
  let res = await Promise.all([getDynamicColumn(params), getDataList(params)]);
  if (res[0].success && res[1].success) {
    tableMsg.columns = res[0].data.filter((item: Columns) => item.visible);
    Number(userMsg.flag) === 1 ? (tableMsg.tableData = res[1].data) : (tableMsg.ndData = res[1].data);
    // compTableWidth();
  } else {
    ElMessage.error("请刷新页面进行重试！");
  }
  userMsg.loading = false;
};

const initData = () => {
  // 调用角色modal
  userDialogRef.value.getUser();
};

const changeNdHandle = (val: string) => {
  tableMsg.nd = val;
  getTableData();
};

const changeXswsHandle = (val: string) => {
  tableMsg.xsws = val;
  getTableData();
};

const clearTableData = () => {
  if (tableMsg.columns) tableMsg.columns.length = 0;
  if (tableMsg.tableData) tableMsg.tableData.length = 0;
  if (tableMsg.ndData) tableMsg.ndData.length = 0;
};

const reviewColumns = reactive<VxeColumnProps[]>([
  {
    type: "seq",
    title: "序号",
    width: 60
  },
  {
    field: "dwName",
    title: "上报单位"
  },
  {
    field: "sbztName",
    title: "上报状态",
    width: 120
  },
  {
    field: "sdztName",
    title: "审核状态",
    width: 120
  }
]);

/* const compTableWidth = () => {
  const tableData = tabMsg.name === "1" ? tableMsg.tableData : tableMsg.ndData;
  tableMsg.columns = tableMsg.columns?.map((value) => {
    const arr = tableData.map((item: any) => {
      if (item[value.columnKey]) {
        return item[value.columnKey];
      } else {
        return value.columnValue;
      }
    });
    value.width = Math.round(getMaxLength(arr) + 40) + "px";
    return value;
  });
}; */

onMounted(initData);
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      padding: 10px;
      height: calc(100% - 39px);
    }

    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .opeartion {
      display: flex;
      margin-bottom: 10px;
      align-items: center;

      &-left,
      &-right {
        width: 50%;
      }

      &-right {
        text-align: right;
      }
    }

    .standrand-table {
      min-width: 0;
      min-height: 0;
      flex: 1;
    }
  }
}

.opeartion-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .toolbar {
    margin-left: 10px;
  }
}
</style>
