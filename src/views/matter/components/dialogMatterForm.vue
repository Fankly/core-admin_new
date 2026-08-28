<template>
  <el-dialog @close="setShowDialog" v-model="isShow" :title="props.title" width="60%">
    <div class="table-box">
      <ProTable :request-auto="true" :pagination="true" :requestApi="getDataList" :search-col="4" ref="dialogFormRef" :columns="columns" :init-param="initParam" @darg-sort="sortTable">
        <!-- 表格 header 按钮 -->
        <template #tableHeader="scope">
          <el-button size="mini" :disabled="!scope.isSelected" type="primary" plain @click="determineDialog(scope.selectedListIds)">确 定 </el-button>
          <el-button size="mini" type="primary" plain @click="closeDialog"> 取 消 </el-button>
        </template>
      </ProTable>
    </div>
  </el-dialog>
</template>

<script lang="tsx">
export default {
  name: "dialogMatterForm"
};
</script>
<script setup lang="tsx">
import { ref, reactive, defineExpose, defineProps, defineEmits, toRef } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getFwzcGlPage, glzc } from "@/api/matter/assetProject";

interface GdsData {
  [key: string]: any;
}

interface Props {
  title: string;
  specialorgid: string;
  isShowDialog: boolean;
  gdsData: GdsData;
}

const props = defineProps<Props>();
const isShow = toRef(props, "isShowDialog");
const emit = defineEmits(["close", "clearTree"]);
const setShowDialog = () => {
  dialogFormRef.value?.clearSelection();
  emit("close", false);
};

const determineDialog = async (selectedList: any) => {
  const res = await glzc({ gdsId: props.gdsData.id, ids: selectedList });
  if (res.success) {
    ElMessage.success("关联成功");
    emit("clearTree");
    setShowDialog();
  } else {
    ElMessage.error(res.msg);
  }
};

// 取消
const closeDialog = () => {
  setShowDialog();
};
// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const getDataList = (params: any) => {
  dialogFormRef.value?.clearSelection();
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.specialorgid = props.specialorgid;
  newParams.treeId = props.gdsData.code;
  return getFwzcGlPage(newParams);
};

// ProTable 实例
const dialogFormRef = ref<ProTableInstance>();

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 });

// dataCallback 是对于返回的表格数据做处理，如果你后台返回的数据不是 list && total && pageNum && pageSize 这些字段，可以在这里进行处理成这些字段
// 或者直接去 hooks/useTable.ts 文件中把字段改为你后端对应的就行

// 表格配置项
const columns = reactive<ColumnProps<any>[]>([
  { type: "selection", fixed: "left", width: 70 },
  { prop: "gsdm", label: "公司代码" },
  { prop: "yjdwName", label: "一级单位" },
  { prop: "ejdwName", label: "二级单位" },
  { prop: "zcbm", label: "资产编码", search: { el: "input" } },
  { prop: "zcmc", label: "资产名称", search: { el: "input" } },
  { prop: "zcyz", label: "资产原值（万元）", align: "right" },
  { prop: "zcjz", label: "资产净值（万元）", align: "right" },
  { prop: "zbhrq", label: "资本化日期" }
]);

// 表格拖拽排序
const sortTable = ({ newIndex, oldIndex }: { newIndex?: number; oldIndex?: number }) => {
  ElMessage.success("修改列表排序成功");
};

const searchTable = () => {
  dialogFormRef.value?.getTableList();
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
