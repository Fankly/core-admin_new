<template>
  <div class="table-box" v-loading="loading" style="height: 730px">
    <proTable @reset="resetHandle" :tool-button="false" :data-callback="callBackHandle" :init-param="initParam" :request-api="getPageList" :request-auto="true" :search-col="4" :columns="tableColumns" ref="proTableRef"></proTable>
  </div>
</template>
<script lang="tsx">
export default {
  name: "BudgetChanges"
};
</script>
<script setup lang="tsx">
import proTable from "@/components/ProTable/index.vue";
import TreeSelect from "@/components/select/TreeSelect.vue";
import { onMounted, defineExpose, reactive, ref, toRef, defineProps } from "vue";
import { BaseMsgData, InitParams, List } from "@/views/matter/types/matterDecl";
import { ElMessage } from "element-plus";
import { getEjdwList, getYjdwList } from "@/api/matter";
import { getGkbmByEjdw, getYslxct } from "@/api/matter/yssxMatter";
import { getPublicData, getSubProtypeTree } from "@/api/common";
import { getCkPageList } from "@/api/matter/matterYsck";

interface Props {
  baseMsgData: BaseMsgData;
}

const props = defineProps<Props>();

const proTableRef = ref();
const proTypeRef = ref();
const specialOrgId = toRef(props.baseMsgData, "specialOrgId");
const roleCode = toRef(props.baseMsgData, "roleCode");
const loading = ref<boolean>(false);
const selectedList = ref({});

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
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      loading.value = false;
      selectData.projectType = res.data;
      budgetChangesData.projectTypeData.projectType = getAllProTypeList(res.data);
    } else {
      loading.value = false;
      ElMessage({
        type: "error",
        message: res.msg
      });
    }
  });
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

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam = reactive<InitParams>({
  specialorgid: specialOrgId.value,
  roleCode: roleCode.value as string,
  sfxg: "1"
});

const yjdwListData: any = ref([]);
const ejdwListData: any = ref([]);
const gkbmListData: any = ref([]);

const getYjdwEnum = async () => {
  let res: any = await getYjdwList(specialOrgId.value);
  if (res.success) {
    yjdwListData.value.push(...res.data);
    budgetChangesData.yjdwListData = res.data;
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
  return getCkPageList(params);
};

const callBackHandle = (val: any) => {
  loading.value = false;
  return val;
};

const resetHandle = () => {
  proTypeRef.value.clearSelect();
  proTableRef.value?.clearSelection();
};

const budgetChangesData = reactive<BaseMsgData>({
  yjdwListData: [],
  isYapListData: isListEnum,
  projectTypeData: {
    projectType: [],
    defaultProps: treeProps.projectTypeProps
  },
  specialOrgId: specialOrgId.value,
  operationFlag: "ADD",
  selectedData: {},
  jd: "2"
});

const statusEnum = ref<any[]>([]);

const getStatusDataHandle = async () => {
  loading.value = true;
  let showData = ["02", "11", "12", "13"];
  let res = await getPublicData("ZLYS_YSSXZT");
  if (res.success) {
    let data = res.data.filter((item: List) => {
      return showData.includes(item.code);
    });
    statusEnum.value.push(...data);
  } else {
    ElMessage.error(res.msg);
  }
  loading.value = false;
};

const resetProTypeData = () => {
  const $table = proTableRef.value;
  if (Array.isArray($table.searchParam.xmlx)) {
    $table.searchParam.xmlx.length = 0;
  } else {
    $table.searchParam.xmlx = "";
  }
};

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
    isShow: false,
    width: "140"
  },
  {
    prop: "xmlxName",
    label: "项目类型",
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
    enum: isListEnum,
    width: "180"
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
    enum: gkbmListData.value,
    width: "180"
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
    prop: "xmbbm",
    label: "项目包编码",
    width: "180"
  },
  {
    prop: "xmbName",
    label: "项目包名称",
    width: "180"
  },
  {
    prop: "remark",
    label: "备注",
    width: "180"
  },
  {
    prop: "zt",
    label: "状态",
    width: "140",
    isShow: false,
    search: {
      el: "select",
      order: 12,
      props: {
        multiple: true,
        collapseTags: true,
        disabled: true
      },
      defaultValue: ["12"]
    },
    enum: statusEnum.value,
    fieldNames: { label: "name", value: "code" }
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
  { prop: "xjjzbs", label: "续建结转标识", width: "140" }
]);

const selectHandle = () => {
  if (proTableRef.value.selectedList.length !== 1) {
    ElMessage.warning("请选择一条数据进行操作!");
    return false;
  } else {
    selectedList.value = proTableRef.value.selectedList[0];
    budgetChangesData.selectedData = proTableRef.value.selectedList[0];
    return true;
  }
};

onMounted(() => {
  getYjdwEnum();
  getProjectData();
  getStatusDataHandle();
});

defineExpose({
  selectHandle,
  budgetChangesData,
  selectedList
});
</script>

<style scoped lang="less">
.table-box {
  padding: 10px;
}
</style>
