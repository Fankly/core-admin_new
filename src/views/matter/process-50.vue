<script lang="ts">
export default {
  name: "/matter/process-50"
};
</script>
<script setup lang="ts">
import splitpane, { ContextProps } from "@/components/ReSplitPane";
import userDialog from "@/components/select/userDialog.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { getFwzcPage, getImportXmTemplate, getImportZcTemplate, getTreeData, getXmPage, glxmExport, glzcExport, importXm, importZc, qxglxm, qxglzc } from "@/api/matter/assetProject";
import ProTable from "@/components/ProTable/index.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import ImportExcel from "@/components/ImportExcel/index.vue";
import dialogMatterForm from "@/views/matter/components/dialogMatterForm.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import DialogProForm from "@/views/matter/components/dialogProForm.vue";
import DialogLogTable from "@/views/matter/components/dialogLogTable.vue";

const proTable = ref();
const assetsTable = ref();
const dialogMatterFormRef = ref();
const dialogProRef = ref();

const isShowDialog = ref<boolean>(false);
const dialogTitle = ref<string>("");

const settingLR: ContextProps = reactive({
  minPercent: 25,
  defaultPercent: 25,
  split: "vertical"
});

const leftLoad = async (row: any, treeNode: unknown, resolve: (date: any[]) => void) => {
  const { code, codeType } = row;
  let res = await getTreeData({
    specialorgid: specialOrgId.value,
    parentId: code,
    codeType: codeType
  });
  if (res.success) {
    if (res.data.length === 0) {
      resolve([]);
    } else {
      res.data.forEach((item: any) => {
        if (item.isLeaf === "1") {
          delete item.isLeaf;
        }
      });
      resolve(res.data);
    }
  }
};

const leftTableData = ref([]);

// 设置用户信息
const loading = ref<boolean>(true);
const isShowPage = ref<boolean>(false);
const specialOrgId = ref<string>("");
const roleCode = ref<string>("");
// userDialog 实例
const userDialogRef = ref();
const importRef = ref();

onMounted(() => {
  selectRolesHandle();
});

const getLeftTableData = async (initParams: any) => {
  let res: any = await getTreeData({
    ...initParams,
    parentId: "-1",
    codeType: ""
  });
  if (res.success) {
    // 如果是合计，删除isLeaf属性
    res.data.forEach((item: any) => {
      if (item.isLeaf === "1") {
        delete item.isLeaf;
      }
    });
    leftTableData.value = res.data;
  }
};

const selectRolesHandle = () => {
  loading.value = true;
  userDialogRef.value.getUser();
};

const getRoleHandle = () => {
  loading.value = false;
  specialOrgId.value = userDialogRef.value.specialorgid;
  roleCode.value = userDialogRef.value.roleCode;
  initParam.specialorgid = specialOrgId.value;
  initParam.roleCode = roleCode.value;
  getLeftTableData({
    specialorgid: specialOrgId.value,
    roleCode: roleCode.value
  });
  const isQuery = userDialogRef.value.isQuery;
  if (isQuery) {
    isShowPage.value = true;
  }
};

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 });

const leftSelectedData = ref<any>({});

const lefTableChange = (val: any) => {
  leftSelectedData.value = val;
  assetsTable.value?.getTableList();
  proTable.value?.getTableList();
};
// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const assetsDataList = (params: any) => {
  loading.value = true;
  assetsTable.value?.clearSelection();
  return getFwzcPage({
    treeId: leftSelectedData.value.code,
    treeCode: leftSelectedData.value.codeType,
    ...params
  });
};

const setShowDialog = (val: boolean) => {
  isShowDialog.value = val;
  // getLeftTableData(initParam);
};

const proSetShowDialog = (val: boolean) => {
  proIsShowDialog.value = val;
  // getLeftTableData(initParam);
};

const assetsColumns = reactive<ColumnProps<any>[]>([
  { type: "selection", width: 70 },
  { prop: "gsdm", label: "公司代码" },
  { prop: "yjdwName", width: 180, label: "一级单位" },
  { prop: "ejdwName", width: 180, label: "二级单位" },
  { prop: "zcbm", label: "资产编码", search: { el: "input" } },
  { prop: "zcmc", label: "资产名称", search: { el: "input" } },
  { prop: "zcyz", width: 120, label: "资产原值（万元）", align: "right" },
  { prop: "zcjz", width: 120, label: "资产净值（万元）", align: "right" },
  { prop: "zbhrq", label: "资本化日期" },
  { prop: "createTime", label: "创建时间" },
  { prop: "createUser", label: "创建人" },
  { prop: "updateTime", width: 120, label: "最后一次更新时间" },
  { prop: "updateUser", width: 120, label: "最后一次更新人" }
]);

// 关联
const assetsAssociation = () => {
  isShowDialog.value = true;
  dialogTitle.value = "关联房屋资产";
  dialogMatterFormRef.value.searchTable();
};
//取消关联
const assetsDisassociate = async (selectedListIds: any) => {
  if (selectedListIds.length === 0) {
    ElMessage.warning("请选择要取消关联的资产");
    return;
  }
  ElMessageBox.confirm("确定要取消关联吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    qxglzc({
      ids: selectedListIds
    }).then((res) => {
      if (res.success) {
        ElMessage.success("取消关联成功");
        assetsTable.value?.getTableList();
        assetsTable.value?.clearSelection();
        clearTreeData();
      } else {
        ElMessage.error(res.msg);
      }
    });
  });
};

// 导入
const assetsImportMsg = () => {
  let params = {
    title: "关联房屋资产",
    tempApi: getImportZcTemplate,
    importApi: importZc,
    specialorgid: specialOrgId.value,

    getTableList: assetsTable.value?.getTableList
  };
  importRef.value.acceptParams(params);
  assetsTable.value?.getTableList();
  assetsTable.value?.clearSelection();
  clearTreeData();
};

// 导出
const assetsExportMsg = () => {
  glzcExport({
    treeId: leftSelectedData.value.code,
    treeCode: leftSelectedData.value.codeType,
    specialorgid: specialOrgId.value,
    ...proTable.value?.searchParam
  }).then((res) => {
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
  });
};

const proColumns = reactive<ColumnProps<any>[]>([
  { type: "selection", width: 70 },
  { prop: "xmmc", width: 300, label: "项目名称" },
  { prop: "xmbm", width: 180, label: "储备编码", search: { el: "input" } },
  { prop: "gwxmbm", width: 180, label: "国网储备编码", search: { el: "input" } },
  { prop: "xmlx", width: 180, label: "项目类型" },
  { prop: "xmbName", width: 300, label: "项目包名称" },
  {
    prop: "nd",
    label: "年度",
    search: {
      el: "date-picker",
      props: {
        type: "year",
        valueFormat: "YYYY",
        clearable: true
      }
    }
  },
  { prop: "yjdw", width: 180, label: "一级单位" },
  { prop: "ejdw", width: 180, label: "二级单位" },
  { prop: "gkbm", width: 180, label: "归口部门" },
  { prop: "zys", width: 180, label: "总预算（万元）", align: "right" },
  { prop: "dnys", width: 180, label: "当年预算（万元）", align: "right" },
  { prop: "xmxz", width: 180, label: "项目性质" },
  { prop: "lxsj", width: 180, label: "立项时间" },
  { prop: "yjfl", width: 180, label: "一级分类" },
  { prop: "ejfl", width: 180, label: "二级分类" },
  { prop: "sjfl", width: 180, label: "三级分类" }
]);

const proDataList = (params: any) => {
  loading.value = true;

  proTable.value?.clearSelection();
  return getXmPage({
    treeId: leftSelectedData.value.code,
    treeCode: leftSelectedData.value.codeType,
    ...params
  });
};

// 根据左侧选中的单位的codeType等于GDS，才能关联项目
const disabledAssociation = computed(() => {
  return leftSelectedData.value.codeType !== "GDS";
});

// 根据左侧选中的单位的codeType等于GDS，才能关联项目
const disabledLog = computed(() => {
  return leftSelectedData.value.codeType === "GDS" || leftSelectedData.value.codeType === "EJDW";
});

const proIsShowDialog = ref<boolean>(false);

// 关联
const proAssociation = () => {
  proIsShowDialog.value = true;
  dialogProRef.value.searchTable();
};
//取消关联
const proDisassociate = async (selectedListIds: any) => {
  ElMessageBox.confirm("确定要取消关联吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    qxglxm({
      ids: selectedListIds
    }).then((res) => {
      if (res.success) {
        ElMessage.success("取消关联成功");
        clearTreeData();
        proTable.value?.getTableList();
        proTable.value?.clearSelection();
      } else {
        ElMessage.error(res.msg);
      }
    });
  });
};

const proImportMsg = () => {
  let params = {
    title: "关联项目",
    tempApi: getImportXmTemplate,
    importApi: importXm,
    specialorgid: specialOrgId.value,

    getTableList: proTable.value?.getTableList
  };
  importRef.value.acceptParams(params);
  clearTreeData();
  proTable.value?.getTableList();
  proTable.value?.clearSelection();
};

const proExportMsg = () => {
  glxmExport({
    treeId: leftSelectedData.value.code,
    treeCode: leftSelectedData.value.codeType,
    specialorgid: specialOrgId.value,
    ...proTable.value?.searchParam
  }).then((res) => {
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
  });
};

const logType = ref<string>("");
const logId = ref<string>("");
const dialogLogTable = ref();

const assetsLogMsg = () => {
  logType.value = leftSelectedData.value.codeType;
  logId.value = leftSelectedData.value.id;
  setDialogLog(true);
  dialogLogTable.value.searchTable();
};

const setDialogLog = (val: boolean) => {
  isShowDialogLog.value = val;
};

const clearTreeData = () => {
  leftTableData.value = [];
  leftSelectedData.value = {};
  getLeftTableData(initParam);
};

const assetsTreeData = () => {
  clearTreeData();
  assetsTable.value?.getTableList();
};

const proTreeData = () => {
  clearTreeData();
  proTable.value?.getTableList();
};

const proDataCallbackHandle = (data: any) => {
  loading.value = false;
  return data;
};

const assetsDataCallbackHandle = (data: any) => {
  loading.value = false;
  return data;
};

const isShowDialogLog = ref<boolean>(false);
</script>

<template>
  <div v-loading="loading" v-if="isShowPage" class="table-box">
    <splitpane :splitSet="settingLR">
      <template #paneL>
        <el-table class="leftTable" height="100%" highlight-current-row @current-change="lefTableChange" :data="leftTableData" row-key="id" border lazy :load="leftLoad" :tree-props="{ hasChildren: 'isLeaf' }">
          <el-table-column header-align="center" show-overflow-tooltip prop="name" label="单位"> </el-table-column>
          <el-table-column show-overflow-tooltip align="center" prop="glzcNum" label="关联资产数"> </el-table-column>
          <el-table-column show-overflow-tooltip align="center" prop="glxmNum" label="关联项目数"> </el-table-column>
        </el-table>
      </template>
      <template #paneR>
        <el-tabs type="card" class="selectPanel">
          <el-tab-pane label="关联房屋资产">
            <div class="main-table">
              <ProTable :data-callback="assetsDataCallbackHandle" :pagination="true" :requestApi="assetsDataList" :search-col="4" ref="assetsTable" :columns="assetsColumns" :init-param="initParam">
                <!-- 表格 header 按钮 -->
                <template #tableHeader="scope">
                  <el-button v-permission="'ASSOCIATION'" size="mini" :disabled="disabledAssociation" type="primary" plain @click="assetsAssociation">新增关联 </el-button>
                  <el-button v-permission="'DISASSOCIATE'" size="mini" :disabled="!scope.isSelected" type="primary" plain @click="assetsDisassociate(scope.selectedListIds)"> 取消关联 </el-button>
                  <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="assetsImportMsg">导 入 </el-button>
                  <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="assetsExportMsg">导 出 </el-button>
                  <el-button v-permission="'LOG'" size="mini" type="primary" :disabled="!disabledLog" plain @click="assetsLogMsg">日 志 </el-button>
                </template>
              </ProTable>
            </div>
          </el-tab-pane>
          <el-tab-pane label="关联项目">
            <div class="main-table">
              <ProTable :data-callback="proDataCallbackHandle" :pagination="true" :requestApi="proDataList" :search-col="4" ref="proTable" :columns="proColumns" :init-param="initParam">
                <!-- 表格 header 按钮 -->
                <template #tableHeader="scope">
                  <el-button v-permission="'ASSOCIATION'" size="mini" :disabled="disabledAssociation" type="primary" plain @click="proAssociation">新增关联 </el-button>
                  <el-button v-permission="'DISASSOCIATE'" size="mini" :disabled="!scope.isSelected" type="primary" plain @click="proDisassociate(scope['selectedListIds'])"> 取消关联 </el-button>
                  <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="proImportMsg">导 入 </el-button>
                  <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="proExportMsg">导 出 </el-button>
                  <el-button v-permission="'LOG'" :disabled="!disabledLog" size="mini" type="primary" plain @click="assetsLogMsg">日 志 </el-button>
                </template>
              </ProTable>
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </splitpane>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
  <dialogMatterForm @clearTree="assetsTreeData" :gdsData="leftSelectedData" @close="setShowDialog" :title="dialogTitle" :isShowDialog="isShowDialog" :specialorgid="specialOrgId" ref="dialogMatterFormRef" />
  <DialogProForm @clearTree="proTreeData" ref="dialogProRef" :gdsData="leftSelectedData" @close="proSetShowDialog" title="关联项目" :is-show-dialog="proIsShowDialog" :specialorgid="specialOrgId"></DialogProForm>
  <DialogLogTable :gdsData="leftSelectedData" ref="dialogLogTable" :logId="logId" :logType="logType" @close="setDialogLog" title="日志" :is-show-dialog="isShowDialogLog" :specialorgid="specialOrgId"></DialogLogTable>
</template>

<style scoped lang="less">
:deep(.container) {
  padding: 10px 10px 10px 0;
}

:deep(.el-tabs__header) {
  padding: 0;
  margin: 0;
}

.leftTable {
  :deep(.el-table__body tr.current-row > td) {
    color: #28a458;
    background: rgb(197, 213, 255) !important;
  }
}

.main-table {
  height: calc(100vh - 148px);
}

.selectPanel {
  :deep(.is-active) {
    background-color: rgba(0, 0, 0, 0.1);
  }
}
</style>
