<template>
  <el-dialog @close="setShowDialog" v-model="props.isShowDialog" :title="props.title" width="60%">
    <div class="table-box">
      <ProTable :request-auto="true" :pagination="true" :requestApi="getDataList"
                ref="proTable"
                :columns="columns"
                :init-param="initParam" @darg-sort="sortTable">
      </ProTable>
    </div>
  </el-dialog>
</template>

<script lang="tsx">
export default {
  name: "dialogLogTable"
};
</script>
<script setup lang="tsx">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getLogByGds } from "@/api/matter/assetProject";

interface GdsData {
  [key: string]: any;
}

interface Props {
  title: string;
  specialorgid: string;
  isShowDialog: boolean;
  logId: string;
  logType: string;
  gdsData: GdsData;
}

const loading = ref<boolean>(true);
const props = defineProps<Props>();
const emit = defineEmits(["close"]);

const setShowDialog = () => {
  emit("close", false);
};

const searchTable = () => {
  // @ts-ignore
  proTable.value?.getTableList();
};


// 如果你想在请求之前对当前请求参数做一些操作，可以自定义如下函数：params 为当前所有的请求参数（包括分页），最后返回请求列表接口
// 默认不做操作就直接在 ProTable 组件上绑定	:requestApi="getDataList"
const getDataList = (params: any) => {
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.gdsId = props.gdsData.code;
  newParams.logType = props.gdsData.codeType;
  return getLogByGds(newParams);
};

// ProTable 实例
const proTable = ref<ProTableInstance>();

// 如果表格需要初始化请求参数，直接定义传给 ProTable (之后每次请求都会自动带上该参数，此参数更改之后也会一直带上，改变此参数会自动刷新表格数据)
const initParam: any = reactive({ type: 1 });

// 表格配置项
const columns = reactive<ColumnProps<any>[]>([
  { width: 180, prop: "gdsName", label: "供电所名称" },
  { width: 180, prop: "name", label: "资产名称" },
  { width: 180, prop: "code", label: "资产编码/国网项目编码" },
  { width: 180, prop: "gwxmbm", label: "国网储备编码", isShow: false, search: { el: "input" } },
  { width: 180, prop: "zcbm", label: "资产编码", isShow: false, search: { el: "input" } },
  { width: 180, prop: "opType", label: "操作类型" },
  { width: 180, prop: "bgsj", label: "变更时间" },
  { width: 180, prop: "bgr", label: "变更人" }
]);

// 表格拖拽排序
const sortTable = ({ newIndex, oldIndex }: { newIndex?: number; oldIndex?: number }) => {
  ElMessage.success("修改列表排序成功");
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
