<!-- 动态报表查询 -->
<!-- 参数说明：1.ShowDrawer  显示抽屉 2.title  抽屉标题  3.searchCode 报表编码-->
<template>
  <div >
    <el-drawer @close="closeDrawer" ref="drawerRef" @open="handleTab1" v-model="isShowDrawer" :title="prop.title" size="450px" :show-close="false" :close-on-click-modal="true">
      <el-tabs v-model="tabMsg" type="border-card" @tab-click="handleTab">
        <el-tab-pane label="查询条件" name="1">
          <el-table ref="tableRef" border :data="pageData" max-height="750">
            <el-table-column label="字段名称" prop="name" align="center" />
            <el-table-column label="是否展示" align="center">
              <template #default="{ row }">
                <el-switch :disabled="row.sfmrzs" v-model="row.link" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="列表项" name="2">
          <el-table ref="tableRef" border :data="pageData1" max-height="750">
            <el-table-column label="字段名称" prop="name" align="center" />
            <el-table-column label="是否展示" align="center">
              <template #default="{ row }">
                <el-switch :disabled="row.sfmrzs" v-model="row.link" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <div style="text-align: center; padding-top: 10px">
          <el-button plain type="primary" size="mini" @click="submitHandle">确 定</el-button>
          <el-button plain type="primary" size="mini" @click="closeDrawer">关 闭</el-button>
        </div>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="DynamicReports">
import { ref, defineEmits, defineProps, onMounted, defineExpose, watch } from "vue";
import { getSearchColumn, updateSearchColumn } from "@/api/service/requirement";
import { ElMessage } from "element-plus";

// 接收父组件传值
const prop = defineProps({
  title: {
    type: String,
    default: "高级设置"
  },
  searchCode: {
    type: String,
    default: "XQLR"
  }
});

const isShowDrawer = ref(false);

// onMounted(() => {
//   searchConfigHandle();
// });

const tabMsg = ref("1");
const pageData = ref([]); //查询条件表格数据
const pageData1 = ref([]); //列表项表格数据
const loading = ref(false); //加载中...
const drawerRef = ref();

// 子组件
const emit = defineEmits(["showModal"]);
//此操作是为了用户在使用中更新后台配置的查询或列表属性
const handleTab = ({ props }: any) => {
  searchConfigHandle()
};
// 抽屉打开时触发，解决没保存直接点关闭再开打数据没重置的问题
const handleTab1 = () => {
  tabMsg.value='1'
  searchConfigHandle()
};

const submitHandle = async () => {
  const dynamciSearchData: any = [];
  const dynamciColumnData: any = [];
  pageData.value.forEach((item: any) => {
    if (item.link) {
      dynamciSearchData.push(item.id);
    }
  });
  pageData1.value.forEach((item: any) => {
    if (item.link) {
      dynamciColumnData.push(item.id);
    }
  });

  const columnsDataRes = await updateSearchColumn({
    searchCode: prop.searchCode,
    searchType: "1",
    ids: dynamciSearchData
  });

  const searchDataRes = await updateSearchColumn({
    searchCode: prop.searchCode,
    searchType: "2",
    ids: dynamciColumnData
  });

  if (columnsDataRes.success && searchDataRes.success) {
    ElMessage.success("操作成功!");
    // searchConfigHandle()
    isShowDrawer.value = false;
    emit("showModal", isShowDrawer.value);
  }
};
const closeDrawer = async () => {
  emit("showModal", isShowDrawer.value);
  isShowDrawer.value = false;
};
const searchConfigHandle = async () => {
  loading.value = true;
  const searchResData = await getSearchColumn({
    searchCode: prop.searchCode,
    searchType: "1"
  });
  const columnsResData = await getSearchColumn({
    searchCode: prop.searchCode,
    searchType: "2"
  });
  if (searchResData.success && columnsResData.success) {
    pageData.value = searchResData.data;
    pageData1.value = columnsResData.data;
    loading.value = false;
  }
};

defineExpose({
  drawerRef,
  isShowDrawer
});
</script>
<style scoped lang="less">
:deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs) {
  flex: 1;
  min-width: auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
}

:deep(.el-tab-pane) {
  flex: 1;
  min-width: auto;
  min-height: auto;
}

:deep(.el-tabs__content) {
  flex: 1;
  min-width: auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
}
</style>
