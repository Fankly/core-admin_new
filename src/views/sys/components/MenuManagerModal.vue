<script lang="ts">
export default {
  name: "MenuManagerModal"
};
</script>

<script setup lang="ts">
import AddOrEditMenuModal from "src/views/sys/components/AddOrEditMenuModal.vue";
import { ref, defineExpose, reactive, defineProps } from "vue";
import VXETable from "vxe-table";
import { appMenuDelete, getAppMenuListPageData } from "@/api/sys/appManager";
import { ElMessage } from "element-plus";

const props = defineProps({
  selectData: {
    type: Object as any,
    default: null
  }
});
const addOrEditMenuModalRef = ref();
const isShowModal = ref(false);
const loading = ref(false);

const tableData = ref([]);

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
});

const addOrEditModalMenuData = reactive({
  title: "",
  selectData: null,
  flag: ""
});

const showHandle = () => {
  getTableData();
};

const getTableData = async () => {
  loading.value = true;
  let params = {
    page: page.page,
    limit: page.limit,
    appId: props.selectData.appId
  };
  const res = await getAppMenuListPageData(params);
  if (res.success) {
    tableData.value = res.data.records;
    page.total = res.data.total;
    loading.value = false;
  } else {
    ElMessage.error(res.msg);
    loading.value = false;
  }
};

const removeHandle = async (row: any) => {
  if (!row) return;
  const type = await VXETable.modal.confirm("是否确定删除？", "提示", {
    status: "warning"
  });
  if (type === "confirm") {
    const res = await appMenuDelete(row.id);
    if (res.success) {
      ElMessage.success("删除成功");
      await getTableData();
    } else {
      ElMessage.error(res.msg);
    }
  }
};

const addOrEditHandle = (flag: string, row?: any) => {
  addOrEditMenuModalRef.value.isShowModal = true;
  addOrEditModalMenuData.flag = flag;
  addOrEditModalMenuData.title = flag === "ADD" ? "新增" : flag === "EDIT" ? "编辑" : "查看";
  if (flag !== "ADD" && row) {
    addOrEditModalMenuData.selectData = row;
  }
};

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  getTableData();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  getTableData();
};

const formatterLabel = ({ cellValue }) => {
  if (typeof cellValue === "string") {
    return cellValue === "1" ? "操作" : "查询";
  }
  return cellValue;
};

defineExpose({
  isShowModal
});
</script>

<template>
  <vxe-modal :loading="loading" resize @show="showHandle" height="800" position="center" width="70%" v-model="isShowModal" title="应用菜单">
    <div class="container">
      <div class="operation">
        <el-button type="primary" size="mini" @click="addOrEditHandle('ADD')">新 增</el-button>
      </div>
      <div class="table">
        <vxe-table 
          :row-config="{
            height: 32
          }"
          show-overflow
          ref="tableRef"
          row-id="appId"
          :data="tableData"
          stripe
          resizable
          align="center"
          header-align="center"
          border
          height="100%"
        >
          <vxe-column field="appNo" title="应用编码"></vxe-column>
          <vxe-column field="appId" title="应用Id" :visible="false"></vxe-column>
          <vxe-column field="appName" title="应用名称"></vxe-column>
          <vxe-column field="menuId" title="菜单id" :visible="false"></vxe-column>
          <vxe-column field="name" title="菜单名称"></vxe-column>
          <vxe-column field="sort" title="排序"></vxe-column>
          <vxe-column field="label" title="标签" :formatter="formatterLabel"></vxe-column>
          <vxe-column title="操作">
            <template #default="{ row }">
              <el-button type="text" size="mini" @click="addOrEditHandle('EDIT', row)">编 辑</el-button>
              <el-button type="text" size="mini" @click="addOrEditHandle('VIEW', row)">查 看</el-button>
              <el-button type="text" size="mini" @click="removeHandle(row)">删 除</el-button>
            </template>
          </vxe-column>
        </vxe-table>
      </div>
      <div class="pager">
        <el-pagination :current-page="page.page" background align="center" :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
      </div>
    </div>
  </vxe-modal>
  <AddOrEditMenuModal @updateData="getTableData" :outsideRowData="props.selectData" ref="addOrEditMenuModalRef" :flag="addOrEditModalMenuData.flag" :select-data="addOrEditModalMenuData.selectData" :title="addOrEditModalMenuData.title"></AddOrEditMenuModal>
</template>

<style scoped lang="less">
.container {
  padding: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .operation {
    margin-bottom: 10px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
