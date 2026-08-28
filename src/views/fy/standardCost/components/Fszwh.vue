<template>
  <vxe-modal height="820" width="700" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="'国网商旅及其他发生值维护'" v-model="showModal" show-zoom resize position="center">
    <div class="operation">
      <el-button type="primary" size="mini" plain @click="saveHandle">保 存</el-button>
      <el-button type="primary" size="mini" plain @click="closeHandle">关 闭</el-button>
    </div>
    <div class="table">
      <vxe-table  stripe resizable ref="tableRef" keep-source :edit-config="tableInfo.editConfig" border :data="tableInfo.tableData" height="100%">
        <vxe-column header-align="center" align="center" type="seq" title="序号" width="60"></vxe-column>
        <vxe-column width="160" header-align="center" align="center" title="成本中心编码" field="cbzx"></vxe-column>
        <vxe-column header-align="center" align="center" title="成本中心名称" field="cbzxName"></vxe-column>
        <vxe-column width="180" :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }" header-align="center" align="right" title="国网商旅及其他发生值" field="gwslFsz">
          <template #edit="{ row }">
            <input v-limit-number class="my-input" v-model="row['gwslFsz']" maxlength="20" />
          </template>
        </vxe-column>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "Fszwh"
};
</script>
<script setup lang="ts">
import { getFsz, updateGwslfsz } from "@/api/fy/searchConfig";
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

const props = defineProps<Props>();

const tableInfo = reactive<TableInfo>({
  tableData: [],
  editConfig: {
    trigger: "click",
    mode: "cell",
    showStatus: true,
    enabled: true
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
      let res = await updateGwslfsz(records);
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
  let res = await getFsz(props.parmas.pzId, props.parmas.dwId);
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
