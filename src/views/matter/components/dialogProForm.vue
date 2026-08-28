<template>
  <el-dialog @close="setShowDialog" v-model="isCloseDialog" :title="props.title" width="60%">
    <div class="table-box">
      <ProTable :request-auto="true" @reset="resetParams" :pagination="true" :requestApi="getDataList" :search-col="3" ref="proTable" :columns="columns" :init-param="initParam" @darg-sort="sortTable">
        <!-- 表格 header 按钮 -->
        <template #tableHeader="scope">
          <el-button size="mini" :disabled="!scope.isSelected" type="primary" plain @click="determineDialog(scope.selectedListIds)">确 定 </el-button>
          <el-button size="mini" type="primary" plain @click="closeDialog"> 取 消</el-button>
        </template>
      </ProTable>
    </div>
  </el-dialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="tsx">
export default {
  name: "dialogProForm"
};
</script>
<script setup lang="tsx">
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getEjdwList, getYjdwList } from "@/api/matter";
import { getXmGlPage, glxm } from "@/api/matter/assetProject";
import TreeSelect from "@/components/select/TreeSelect.vue";
import { getProTypeTreeNode, getXmbmc } from "@/api/process";
import { ref, reactive, onMounted, defineProps, defineEmits, defineExpose, computed } from "vue";

interface GdsData {
  [key: string]: any;
}

interface Props {
  title: string;
  specialorgid: string;
  isShowDialog: boolean;
  gdsData: GdsData;
}

const isCloseDialog = computed(() => props.isShowDialog);

const loading = ref<boolean>(true);
const importRef = ref();
const proTypeRef = ref();
const props = defineProps<Props>();
const emit = defineEmits(["close", "clearTree"]);

const setShowDialog = () => {
  proTable.value?.clearSelection();
  emit("close", false);
};

const determineDialog = async (ids: any) => {
  const res = await glxm({ gdsId: props.gdsData.id, ids: ids });
  if (res.success) {
    ElMessage.success("关联成功");
    emit("clearTree");
    setShowDialog();
  } else {
    ElMessage.error(res.msg);
  }
};

// 取消
const closeDialog = (ids: string[]) => {
  setShowDialog();
};
// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const getDataList = (params: any) => {
  proTable.value?.clearSelection();
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.specialorgid = props.specialorgid;
  if (newParams.xmbm) {
    newParams.xmbms = newParams.xmbm.split(",");
    delete newParams.xmbm;
  }
  newParams.treeId = props.gdsData.code;
  return getXmGlPage(newParams);
};

// ProTable 实例
const proTable = ref<ProTableInstance>();

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 });

// dataCallback 是对于返回的表格数据做处理，如果你后台返回的数据不是 list && total && pageNum && pageSize 这些字段，可以在这里进行处理成这些字段
// 或者直接去 hooks/useTable.ts 文件中把字段改为你后端对应的就行

const ejdwListData: any = ref([]);

const changeEjdwEnum = async (val: string) => {
  ejdwListData.value.length = 0;
  if (proTable.value) proTable.value.searchParam.ejdwName = "";
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: props.specialorgid
    });
    if (res.success) {
      ejdwListData.value.push(...res.data);
    }
  }
};
// 树形结构props类型
const treeProps = reactive({
  defaultProps: {
    children: "children",
    label: "text"
  },
  projectTypeProps: {
    children: "children",
    label: "name"
  }
});

const resetParams = () => {
  proTypeRef.value.clearSelect();
  getProjectData();
  ejdwListData.value.length = 0;
};

// 获取选择的数据
const selectedData = (list: any[], flag: string) => {
  const codeList: any = list.map((item) => item.code).join(",");
  const idList: any = list.map((item) => item.id);

  if (proTable.value) proTable.value.searchParam.xmlx = idList;
  getXmbmcList(codeList);
};

// 查询选择框数据
const selectData: any = reactive({
  projectType: []
});

const getData = () => {
  getProjectData();
  getXmbmcList("");
};

// 获取项目类型
const getProjectData = () => {
  loading.value = true;
  const params = {
    parentId: "0",
    startDate: proTable.value ? proTable.value.searchParam.nd : currentYear.value
  };
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      loading.value = false;
      selectData.projectType = res.data;
    } else {
      loading.value = false;
      ElMessage({
        type: "error",
        message: res.msg
      });
    }
  });
};

const xmbmcData: any = ref([]);

const currentYear = ref(new Date().getFullYear().toString());

const getXmbmcList = async (codeList: any) => {
  loading.value = true;
  xmbmcData.value.length = 0;
  const params = {
    year: proTable.value ? proTable.value.searchParam.nd : currentYear.value,
    xmlx: codeList.length !== 0 ? codeList : ""
  };
  let res = await getXmbmc(params);
  xmbmcData.value.push(...res.data);
  if (res.success) {
    loading.value = false;
  } else {
    loading.value = false;
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};

onMounted(() => {
  getProjectData();
  getXmbmcList("");
});

// 表格配置项
const columns = reactive<ColumnProps<any>[]>([
  { type: "selection", fixed: "left", width: 70 },
  { prop: "xmmc", width: 300, label: "项目名称", search: { el: "input" }, align: "left" },
  { prop: "xmbm", width: 180, label: "储备编码", search: { el: "input" } },
  { prop: "gwxmbm", width: 180, label: "国网储备编码" },
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
        clearable: false,
        onChange: getData
      },
      defaultValue: currentYear.value
    }
  },
  {
    prop: "yjdw",
    label: "一级单位",
    width: 180,
    search: { el: "select", props: { onChange: changeEjdwEnum } },
    enum: () => getYjdwList(props.specialorgid),
    isFilterEnum: false,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "ejdw",
    label: "二级单位",
    width: 180,
    isFilterEnum: false,
    search: { el: "select" },
    enum: ejdwListData.value,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "xmlx",
    width: 180,
    label: "项目类型",
    search: {
      render: () => {
        return <TreeSelect is-all={true} data={selectData.projectType} onSelectChange={(value: any) => selectedData(value, "xmlx")} ref={proTypeRef} is-leaf={false} data-type="id" default-props={treeProps.projectTypeProps} node-key="id"></TreeSelect>;
      }
    }
  },
  // 联动
  {
    prop: "xmbId",
    width: 180,
    label: "项目包名称",
    search: {
      el: "select",
      props: {
        collapseTags: true,
        filterable: true
      }
    },
    isShow: false,
    enum: xmbmcData.value,
    fieldNames: { label: "name", value: "code" }
  },
  { prop: "xmbName", width: 180, label: "项目包" },
  { prop: "gkbm", width: 180, label: "归口部门" },
  { prop: "zys", width: 180, label: "总预算（万元）", align: "right" },
  { prop: "dnys", width: 180, label: "当年预算（万元）", align: "right" },
  { prop: "xmxz", width: 180, label: "项目性质" },
  { prop: "lxsj", width: 180, label: "立项时间" },
  { prop: "yjfl", width: 180, label: "一级分类" },
  { prop: "ejfl", width: 180, label: "二级分类" },
  { prop: "sjfl", width: 180, label: "三级分类" }
]);

// 表格拖拽排序
const sortTable = ({ newIndex, oldIndex }: { newIndex?: number; oldIndex?: number }) => {
  ElMessage.success("修改列表排序成功");
};

const searchTable = () => {
  proTable.value?.getTableList();
};

defineExpose({
  searchTable
});
</script>

<style scoped lang="less">
.table-box {
  height: 100%;
}

:deep(.table-main) {
  height: 100%;
}
</style>
