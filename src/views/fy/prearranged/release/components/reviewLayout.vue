<template>
  <vxe-modal :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="props.title" v-model="showModal" show-zoom resize width="30%" height="800" position="center">
    <div class="operation">
      <div class="operation-btn">
        <slot name="button"></slot>
      </div>
      <div class="operation-form">
        <slot name="form"></slot>
      </div>
    </div>
    <div class="standrand-table">
      <vxe-table  :header-cell-style="headerCellStyle" ref="tableRef" @current-change="currentChange" v-bind="$attrs" height="100%" :border="true" :column-config="{ resizable: true }" :data="tableMsg.tableData">
        <template v-for="item in tableColumns" :key="item.field">
          <vxe-column :show-overflow="true" v-if="item.type && columnTypes.includes(item.type)" v-bind="item" :align="item.align ?? 'center'"></vxe-column>
          <vxe-column :show-overflow="true" v-bind="item" v-if="!item.type && item.field" header-align="center" align="center" :field="item.field" :title="item.title"></vxe-column>
        </template>
      </vxe-table>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "reviewLayout"
};
</script>
<script setup lang="ts">
import { reactive, ref, defineExpose, withDefaults, defineProps, defineEmits, toRef } from "vue";
import { TableMsg } from "../../interface";
import { VxeColumnProps, VxeTable, VxeTableEvents } from "vxe-table";
import { TypeProps } from "@/views/fy/prearranged/release/components/interface";

export interface ModalProps {
  isShowModal: boolean;
  nd: string;
  xsws: string;
  specialorgid: string;
  kmlx: string;
  title: string;
  columns: any[];
  requestApi?: (params: any) => Promise<any>;
  requestError?: (params: any) => void;
  busiType: string;
}

// table 实例
const tableRef = ref<InstanceType<typeof VxeTable>>();

const props = withDefaults(defineProps<ModalProps>(), {
  isShowModal: false,
  nd: new Date().getFullYear().toString()
});

const showModal = toRef(props, "isShowModal");

const curChangeData = ref<any>();

// 接收 columns 并设置为响应式
const tableColumns = reactive<VxeColumnProps[]>(props.columns);

// column 列类型
const columnTypes: TypeProps[] = ["seq", "html", "radio", "checkbox", "expand"];

const emit = defineEmits(["closeDialog", "updateTable"]);

const loading = ref(false);

const tableMsg = reactive<TableMsg>({
  xsws: "",
  tableData: [],
  nd: props.nd,
  rowConfig: {
    height: 32
  }
});

const headerCellStyle = () => {
  return {
    padding: "8px 0",
    lineHeight: "16px"
  };
};

const showHandle = () => {
  tableMsg.nd = props.nd;
  tableMsg.xsws = props.xsws || "2";
  getTableList();
};

const closeHandle = () => {
  // 重置数据
  if (tableMsg.tableData) tableMsg.tableData.length = 0;
  emit("closeDialog", !props.isShowModal);
};

const getTableList = async () => {
  let api = props.requestApi;
  if (!api) return;
  loading.value = true;
  let params = {
    busiType: props.busiType,
    nd: props.nd,
    kmlx: props.kmlx,
    dwId: props.specialorgid
  };
  try {
    let { data } = await api({ ...params });
    tableMsg.tableData = data;
    loading.value = false;
  } catch (error) {
    loading.value = false;
    props.requestError && props.requestError(error);
  }
};

const currentChange: VxeTableEvents.CurrentChange = (val) => {
  curChangeData.value = val;
};

// 暴露给父组件的参数和方法 (外部需要什么，都可以从这里暴露出去)
defineExpose({
  element: tableRef,
  tableData: tableMsg.tableData,
  getTableList,
  curChangeData
});
</script>

<style lang="less" scoped>
.standrand-table {
  margin-top: 10px;
  height: calc(100% - 44px);
}

:deep(.vxe-modal--content) {
  padding: 10px !important;
}

.operation {
  display: flex;

  &-btn,
  &-form {
    width: 50%;
  }

  &-form {
    text-align: right;

    .el-form--inline {
      height: 34px;

      .el-form-item {
        margin: 0;
      }
    }
  }
}
</style>
