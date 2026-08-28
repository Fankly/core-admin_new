<template>
  <vxe-modal height="820" width="40%" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="'执行值维护'" v-model="showModal" show-zoom resize position="center">
    <div class="operation">
      <el-button type="primary" size="mini" plain @click="saveHandle">保 存</el-button>
      <el-button type="primary" size="mini" plain @click="closeHandle">关 闭</el-button>
    </div>
    <div class="table">
      <vxe-table  ref="tableRef" keep-source :edit-config="tableInfo.editConfig" border :data="tableInfo.tableData" height="100%">
        <vxe-column width="80" title="序号" field="dispOrder"></vxe-column>
        <vxe-column header-align="center" align="center" title="单位名称" field="dwName"></vxe-column>
        <vxe-column :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }" header-align="center" align="right" title="年度目标值" field="ysje">
          <template #edit="{ row }">
            <input v-limit-number class="my-input" v-model="row['ysje']" maxlength="20" />
          </template>
        </vxe-column>
        <vxe-column header-align="center" align="right" title="12月发生值" field="finalYsje" :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }">
          <template #edit="{ row }">
            <input v-limit-number class="my-input" v-model="row['finalYsje']" maxlength="20" />
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "Maintenance"
};
</script>
<script setup lang="ts">
import { getZxz, updateZxz } from "@/api/fy/searchConfig";
import { ElMessage } from "element-plus";
import { ref, defineExpose, defineProps, reactive } from "vue";
import { VXETable, VxeTablePropTypes } from "vxe-table";

interface Params {
  dwId: string;
  pzId: string;
  month: number;
  nd: string;
}

interface Props {
  parmas: Params;
}

interface TableInfo {
  tableData: any[];
  editConfig: VxeTablePropTypes.EditConfig;
}

const beforeEditMethod = ({ column }: any) => {
  if (props.parmas.month !== 12 && column.field === "finalYsje") {
    return false;
  }
  return true;
};

const props = defineProps<Props>();

const tableInfo = reactive<TableInfo>({
  tableData: [],
  editConfig: {
    trigger: "click",
    mode: "cell",
    showStatus: true,
    enabled: true,
    beforeEditMethod: beforeEditMethod
  }
});

const showModal = ref(false);
const loading = ref(false);
const tableRef = ref();

const saveHandle = async () => {
  const $table = tableRef.value;
  if ($table) {
    const records = $table.getUpdateRecords();
    if (records.length === 0) {
      ElMessage.warning("未进行修改操作,请修改后再进行保存！");
      return false;
    }
    const type = await VXETable.modal.confirm("是否确定保存？", "提示", {
      status: "warning"
    });
    if (type === "confirm") {
      let res = await updateZxz(records);
      if (res.success) {
        ElMessage.success("保存成功");
        closeHandle();
      } else {
        ElMessage.error(res.msg);
      }
    }
  }
};

const showHandle = async () => {
  let res = await getZxz(props.parmas.dwId, props.parmas.pzId);
  if (res.success) {
    tableInfo.tableData = res.data;
  } else {
    ElMessage.error(res.msg);
  }
};

const closeHandle = () => {
  showModal.value = false;
  tableInfo.tableData.length = 0;
};

defineExpose({
  showModal,
  loading
});
</script>

<style scoped lang="less">
.btn {
  text-align: center;
}

.operation {
  margin-bottom: 10px;
}

.table {
  height: calc(100% - 38px);
}
</style>
