<template>
  <div v-show="isShowPage" class="container" v-loading="loading">
    <div class="operation" v-if="isShowPage">
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
        <vxe-column field="appName" title="应用名称"></vxe-column>
        <vxe-column field="appIcon" title="应用图标"></vxe-column>
        <vxe-column field="appLink" title="应用链接"></vxe-column>
        <vxe-column :formatter="formatterStatus" field="status" title="状态"></vxe-column>
        <vxe-column field="sort" title="排序"></vxe-column>
        <vxe-column title="操作">
          <template #default="{ row }">
            <el-button type="text" size="mini" @click="addOrEditHandle('EDIT', row)">编 辑</el-button>
            <el-button type="text" size="mini" @click="addOrEditHandle('VIEW', row)">查 看</el-button>
            <el-button type="text" size="mini" @click="removeHandle(row)">删 除</el-button>
            <el-button type="text" size="mini" @click="showMenuModalHandle(row)">应用菜单</el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination :current-page="page.page" background align="center" :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
    </div>
  </div>
  <AddOrEditModal :selectData="addOrEditModalData.selectData" @updateData="getTableData" ref="addOrEditModalRef" :title="addOrEditModalData.title" :flag="addOrEditModalData.flag" />
  <MenuManagerModal :selectData="addOrEditModalData.selectData" ref="menuManagerModalRef" />
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: "/sys/AppManager"
};
</script>

<script setup lang="ts">
import userDialog from "@/components/select/userDialog.vue";
import AddOrEditModal from "@/views/sys/components/AddOrEditModal.vue";
import { onMounted, reactive, ref } from "vue";
import VXETable, { VxeTableInstance } from "vxe-table";
import { appDelete, getAppListPageData } from "@/api/sys/appManager";
import { ElMessage } from "element-plus";
import MenuManagerModal from "@/views/sys/components/MenuManagerModal.vue";

const tableRef = ref<VxeTableInstance>();
const addOrEditModalRef = ref();
const menuManagerModalRef = ref();
const userDialogRef = ref();

const addOrEditModalData = reactive({
  title: "",
  selectData: null,
  flag: ""
});

const userInfo = ref({});

const loading = ref(false);
const isShowPage = ref(false);

const tableData = ref([]);

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
});

const initData = async () => {
  await userDialogRef.value.getUser();
  await getTableData();
};

const getTableData = async () => {
  loading.value = true;
  let params = {
    page: page.page,
    limit: page.limit
  };
  const res = await getAppListPageData(params);
  if (res.success) {
    tableData.value = res.data.records;
    page.total = res.data.total;
    loading.value = false;
  } else {
    ElMessage.error(res.msg);
    loading.value = false;
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

const addOrEditHandle = (flag: string, row?: any) => {
  addOrEditModalRef.value.isShowModal = true;
  addOrEditModalData.flag = flag;
  addOrEditModalData.title = flag === "ADD" ? "新增" : flag === "EDIT" ? "编辑" : "查看";
  if (flag !== "ADD" && row) {
    addOrEditModalData.selectData = row;
  }
};

const removeHandle = async (row: any) => {
  if (!row) return;
  const type = await VXETable.modal.confirm("是否确定删除？", "提示", {
    status: "warning"
  });
  if (type === "confirm") {
    const res = await appDelete(row.appId);
    if (res.success) {
      ElMessage.success("删除成功");
      await getTableData();
    } else {
      ElMessage.error(res.msg);
    }
  }
};

const showMenuModalHandle = (row: any) => {
  if (!row) return;
  if (row) {
    addOrEditModalData.selectData = row;
    menuManagerModalRef.value.isShowModal = true;
  }
};

const formatterStatus = ({ cellValue }) => {
  if (typeof cellValue === "string") {
    return cellValue === "1" ? "启用" : "停用";
  }
  return cellValue;
};

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery;
  userInfo.value = { ...userDialogRef.value.userMsg };
  if (isQuery) {
    isShowPage.value = true;
  }
};

onMounted(initData);
</script>

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
