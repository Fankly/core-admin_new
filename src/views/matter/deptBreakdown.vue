<template>
  <div class="table-box" v-if="isShowPage" v-loading="loading">
    <proTable @search="searchHandle" @reset="resetHandle" :data-callback="callBackHandle" :init-param="initParam" :request-api="getPageList" :request-auto="true" :search-col="4" :columns="tableColumns" ref="proTableRef">
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-permission="'RELEASE'" size="mini" :disabled="!scope.isSelected" type="primary" plain @click="handleDisposing(scope.selectedList, 'EDIT')"> 部门分解下达 </el-button>
        <el-button v-permission="'VIEW'" size="mini" :disabled="!scope.isSelected" type="primary" plain @click="handleDisposing(scope.selectedList, 'VIEW')">部门分解查看 </el-button>
      </template>
      <template #headerButton>
        <el-tabs v-model="tabPosition" @tab-click="searchTableHandle">
          <el-tab-pane label="省专项" name="0"></el-tab-pane>
        </el-tabs>
      </template>
    </proTable>
    <DisposingBMDialog @closePage="handleClosePage" :baseMsgData="baseMsgData" :dialogData="diaLogData" :title="diaLogData.title"></DisposingBMDialog>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: "/matter/deptBreakdown"
};
</script>

<script setup lang="tsx">
import userDialog from "@/components/select/userDialog.vue";
import proTable from "@/components/ProTable/index.vue";
import TreeSelect from "@/components/select/TreeSelect.vue";
import DisposingBMDialog from "@/views/matter/components/DiaposingBMDialog/index.vue";
import { onMounted, reactive, ref } from "vue";
import { BaseMsgData, DialogData, InitParams } from "./types/matterDecl";
import { ElMessage } from "element-plus";
import { getEjdwList, getYjdwList } from "@/api/matter";
import { getGkbmByEjdw, getYslxct } from "@/api/matter/yssxMatter";
import { getYssxBmFjPage } from "@/api/matter/yssxBmFj";
import { getParamValue, getSubProtypeTree } from "@/api/common";

const userDialogRef = ref();
const proTableRef = ref();
const proTypeRef = ref();

const isShowPage = ref<boolean>(false);
const specialOrgId = ref<string>("");
const roleCode = ref<string>("");
const tabPosition = ref("0");

const loading = ref<boolean>(false);

// 查询选择框数据
const selectData: any = reactive({
  projectType: []
});

// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: "children",
    label: "text",
    id: "id"
  },
  projectTypeProps: {
    children: "children",
    label: "name"
  }
});

// 获取选择的数据
const selectedData = (value: any, flag: string) => {
  proTableRef.value.searchParam[flag] = value;
};

// 获取项目类型
const getProjectData = () => {
  loading.value = true;
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      loading.value = false;
      selectData.projectType = res.data;
      baseMsgData.projectTypeData.projectType = getAllProTypeList(res.data);
    } else {
      loading.value = false;
      ElMessage({
        type: "error",
        message: res.msg
      });
    }
  });
};

const handleClosePage = () => {
  proTableRef.value?.clearSelection();
  proTableRef.value?.search();
};

const getAllProTypeList: any = (list: any[]) => {
  return list.map((item: any) => {
    // 如果没有children属性
    if (!item.children || item.children.length === 0) {
      return {
        value: item.middleId,
        name: item.name,
        id: item.id
      };
    }
    return {
      value: item.middleId,
      name: item.name,
      id: item.id,
      children: item.children ? getAllProTypeList(item.children) : []
    };
  });
};

const diaLogData = reactive<DialogData>({
  title: "",
  isShowPage: false
});

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive<InitParams>({
  specialorgid: "",
  roleCode: ""
});

const yjdwListData: any = ref([]);
const ejdwListData: any = ref([]);
const gkbmListData: any = ref([]);

const getYjdwEnum = async () => {
  let res: any = await getYjdwList(specialOrgId.value);
  if (res.success) {
    yjdwListData.value.push(...res.data);
    baseMsgData.yjdwListData = res.data;
  } else {
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};
const changeEjdwEnum = async (val: string) => {
  loading.value = true;
  ejdwListData.value.length = 0;
  proTableRef.value.searchParam.ejdw = "";
  gkbmListData.value.length = 0;
  proTableRef.value.searchParam.gkbmId = "";
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: specialOrgId.value
    });
    if (res.success) {
      ejdwListData.value.push(...res.data);
      loading.value = false;
    } else {
      ElMessage({
        type: "error",
        message: res.msg
      });
      loading.value = false;
    }
  } else {
    loading.value = false;
  }
};

const changeGkbmEnum = async (val: string) => {
  loading.value = true;
  gkbmListData.value.length = 0;
  proTableRef.value.searchParam.gkbmId = "";
  if (val) {
    let res = await getGkbmByEjdw(val);
    if (res.success) {
      gkbmListData.value.push(...res.data);
      loading.value = false;
    } else {
      ElMessage({
        type: "error",
        message: res.msg
      });
      loading.value = false;
    }
  } else {
    loading.value = false;
  }
};

const isListEnum = reactive([
  {
    label: "是",
    value: "1"
  },
  {
    label: "否",
    value: "0"
  }
]);

const getPageList = (params: any) => {
  loading.value = true;
  return getYssxBmFjPage(params);
};

const callBackHandle = (val: any) => {
  loading.value = false;
  return val;
};

const searchHandle = () => {
  proTableRef.value?.clearSelection();
};

const resetHandle = () => {
  ejdwListData.value.length = 0;
  proTypeRef.value.clearSelect();
  proTableRef.value?.clearSelection();
};

const resetProTypeData = () => {
  const $table = proTableRef.value;
  if (Array.isArray($table.searchParam.xmlx)) {
    $table.searchParam.xmlx.length = 0;
  } else {
    $table.searchParam.xmlx = "";
  }
};

const baseMsgData = reactive<BaseMsgData>({
  yjdwListData: [],
  isYapListData: isListEnum,
  projectTypeData: {
    projectType: [],
    defaultProps: treeProps.projectTypeProps
  },
  tabType: 0,
  roleCode: "",
  specialOrgId: "",
  selectedData: {},
  operationFlag: "",
  isShowButton: true,
  type: "BM"
});

const tableColumns = reactive<any>([
  { type: "selection", width: 80 },
  { type: "index", width: 80, label: "序号" },
  {
    prop: "yssxbm",
    label: "事项编码",
    search: {
      el: "input",
      order: 2
    },
    width: "180"
  },
  {
    prop: "yssxmc",
    label: "事项名称",
    search: {
      el: "input",
      order: 1
    },
    width: "200"
  },
  {
    prop: "yslxctId",
    label: "重点投向",
    search: {
      el: "select",
      order: 4,
      props: {
        filterable: true
      }
    },
    enum: getYslxct,
    isShow: false,
    fieldNames: { label: "ctmc", value: "id" },
    width: "140"
  },
  {
    prop: "yslxctName",
    label: "重点投向",
    width: "180"
  },
  {
    prop: "xmlx",
    label: "项目类型",
    search: {
      order: 3,
      render: () => {
        return <TreeSelect onClearData={resetProTypeData} is-child-node={false} data={selectData.projectType} onSelectChange={(value: any) => selectedData(value, "xmlx")} ref={proTypeRef} is-leaf={false} data-type="middleId" default-props={treeProps.projectTypeProps} node-key="middleId" />;
      }
    },
    isShow: false
  },
  {
    prop: "xmlxName",
    label: "项目类型",
    width: "180"
  },
  {
    prop: "zjlyName",
    label: "资金来源",
    width: "180"
  },
  {
    prop: "xmbbm",
    label: "项目包编码",
    width: "180"
  },
  {
    prop: "xmbmc",
    label: "项目包名称",
    search: {
      el: "input",
      order: 11
    },
    width: "180"
  },
  {
    prop: "sfyap",
    label: "是否预安排",
    search: {
      el: "select",
      order: 9
    },
    isShow: false,
    enum: isListEnum
  },
  {
    prop: "isYapName",
    label: "是否预安排",
    width: "180"
  },
  {
    prop: "sfbmd",
    label: "是否规模化",
    search: {
      el: "select",
      order: 8
    },
    isShow: false,
    enum: isListEnum
  },
  {
    prop: "sfbmdName",
    label: "是否规模化",
    width: "180"
  },
  {
    prop: "yjdw",
    label: "一级单位",
    isShow: false,
    search: { el: "select", props: { onChange: changeEjdwEnum }, order: 5 },
    enum: yjdwListData.value,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "yjdwName",
    label: "一级单位",
    width: "180"
  },
  {
    prop: "ejdw",
    label: "二级单位",
    search: { el: "select", order: 6, props: { onChange: changeGkbmEnum } },
    enum: ejdwListData.value,
    isShow: false,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "ejdwName",
    label: "二级单位",
    width: "180"
  },
  {
    prop: "gkbmmc",
    label: "归口部门",
    width: "180"
  },
  {
    prop: "gkbmId",
    label: "归口部门",
    isShow: false,
    search: {
      el: "select",
      order: 7,
      props: {
        multiple: true,
        collapseTags: true
      }
    },
    fieldNames: { label: "name", value: "code" },
    enum: gkbmListData.value
  },
  {
    prop: "csmc",
    label: "处室",
    width: "180"
  },
  {
    prop: "nd",
    label: "年度",
    search: {
      el: "date-picker",
      order: 10,
      props: {
        type: "year",
        valueFormat: "YYYY",
        clearable: true
      }
    }
  },
  {
    prop: "sxys",
    label: "事项预算（万元）",
    headerAlign: "center",
    align: "right",
    width: "140"
  },
  {
    prop: "remark",
    label: "备注",
    width: "180"
  },
  {
    prop: "ztName",
    label: "状态",
    width: "140"
  },
  { prop: "zscflag", label: "删除标识", width: "140" },
  { prop: "ztimestamp", label: "创建时间", width: "180" },
  { prop: "cjrName", label: "创建人", width: "140" },
  { prop: "zhggrq", label: "最后更改日期", width: "180" },
  { prop: "zhggrName", label: "最后更改人", width: "140" },
  { prop: "cksj", label: "出库时间", width: "140" },
  { prop: "xjjzbs", label: "续建结转标识", width: "140" }
]);

const searchTableHandle = (flag: any) => {
  let num = flag.props ? flag.props.name : "0";
  initParam.tabType = Number(num);
  baseMsgData.tabType = num;
  proTableRef.value?.clearSelection();
  proTableRef.value?.search();
};

const selectRolesHandle = () => {
  userDialogRef.value.getUser();
};

const getRoleHandle = () => {
  specialOrgId.value = userDialogRef.value.specialorgid;
  baseMsgData.specialOrgId = userDialogRef.value.specialorgid;
  roleCode.value = userDialogRef.value.roleCode;
  baseMsgData.roleCode = userDialogRef.value.roleCode;
  initParam.specialorgid = specialOrgId.value;
  initParam.roleCode = roleCode.value;
  getYjdwEnum();
  const isQuery = userDialogRef.value.isQuery;
  if (isQuery) {
    isShowPage.value = true;
  }
};

const isShowBtn = async () => {
  const res = await getParamValue("QMYS_GROUP", "YSSX_ZDJX");
  if (res.success) {
    if (res.data === "false") {
      baseMsgData.isShowButton = false;
    } else {
      baseMsgData.isShowButton = true;
    }
  }
};

const handleDisposing = (selectedList: any[], flag: string) => {
  if (selectedList.length !== 1) {
    ElMessage.warning("请选择一条数据进行查看！");
    return;
  }
  diaLogData.title = flag === "EDIT" ? "预算分解-下达" : "预算分解-查看";
  diaLogData.isShowPage = true;
  baseMsgData.operationFlag = flag;
  baseMsgData.selectedData = selectedList[0];
};

onMounted(() => {
  selectRolesHandle();
  getProjectData();
  isShowBtn();
});
</script>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
