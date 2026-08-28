<template>
  <vxe-modal class-name="modalProcess" @show="showHandle" title="进度指标" v-model="isShowModal" width="70%" height="800" position="center">
    <div class="operation" style="margin-bottom: 10px">
      <el-button type="primary" size="mini" plain @click="exportHandle">导 出</el-button>
    </div>
    <div class="table">
      <vxe-table  ref="tableRef" :data="tableData" border stripe resizable align="center" header-align="center" show-overflow show-header-overflow :row-config="{ height: 32 }" height="100%">
        <vxe-column width="220" title="项目类型" field="xmlx"></vxe-column>
        <vxe-column width="220" title="单位" field="dw"></vxe-column>
        <vxe-colgroup title="当前执行速度">
          <vxe-column field="mbz" title="目标值"></vxe-column>
          <vxe-column field="bys" title="包金额"></vxe-column>
          <vxe-column field="lxz" title="立项值"></vxe-column>
          <vxe-column field="wcz" title="完成值"></vxe-column>
        </vxe-colgroup>
        <!-- <vxe-colgroup title="去年同期执行速度">
          <vxe-column field="qntqzxsd_mbz" title="目标值"></vxe-column>
          <vxe-column field="qntqzxsd_bys" title="包金额"></vxe-column>
          <vxe-column field="qntqzxsd_lxz" title="立项值"></vxe-column>
          <vxe-column field="qntqzxsd_wcz" title="完成值"></vxe-column>
        </vxe-colgroup> -->
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps } from "vue";
import { getProgressDataByTypeNew } from "@/api/report";

interface Props {
  clickTableData: any;
}

const props = defineProps<Props>();

const tableData = ref([]);
const tableRef = ref();

const isShowModal = ref(false);

const exportHandle = () => {
  const $table = tableRef.value;
  if ($table) {
    $table.exportData({
      sheetName: "成本性项目三率报表-进度指标",
      type: "xlsx",
      filename: "成本性项目三率报表-进度指标",
      useStyle: true
    });
  }
};

const showHandle = async () => {
  let field = null;
  if (props.clickTableData && props.clickTableData.field) {
    field = props.clickTableData.field.split("&")[0].split("=")[1];
  }

  const res = await getProgressDataByTypeNew({
    dwId: field || props.clickTableData.dw_id,
    startDate: props.clickTableData.startDate,
    endDate: props.clickTableData.endDate,
    xmlxId: props.clickTableData.id
  });
  if (res.success) {
    tableData.value = res.data;
  }
};

defineExpose({
  isShowModal
});
</script>

<style scoped lang="less">
.table {
  height: calc(100% - 40px);
  min-width: 0;
  min-height: 0;
}
</style>
