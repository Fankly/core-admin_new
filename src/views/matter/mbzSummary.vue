<template>
  <div v-show="initInfo.isShowPage" class="container">
    <Header :helpMessage="helpMessage" ref="headerRef" @exportApiData="exportApiDataHandle" @expandData="expandDataHandle" @pageExportData="pageExportDataHandle" v-if="initInfo.isShowPage" />
    <div class="main" v-if="initInfo.isShowPage">
      <MbzSearchMain @isExport="isExportHandle" @isLoad="isLoadHandle" @isDisable="isDisableHandle" ref="mbzSearchMainRef" name="mbz" fileName="省级统筹目标值汇总查询报表-按页面导出" :initInfo="initInfo"></MbzSearchMain>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: "/matter/mbzSummary"
};
</script>

<script setup lang="ts">
import { getPublicCodeList } from "@/api/common";
import userDialog from "@/components/select/userDialog.vue";
import Header from "@/views/matter/components/search/Header.vue";
import MbzSearchMain from "@/views/matter/components/search/MbzSearchMain.vue";
import { onMounted, reactive, ref } from "vue";
import { InitInfo } from "./interface";

const userDialogRef = ref();
const mbzSearchMainRef = ref();
const headerRef = ref();

const helpMessage = ref("");

const initInfo = reactive<InitInfo>({
  isShowPage: false,
  userInfo: {}
});

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery;
  initInfo.userInfo = { ...userDialogRef.value.userMsg };
  if (isQuery) {
    initInfo.isShowPage = true;
  }
};

const initData = () => {
  let codes = ["MBZBZXX"];
  getPublicCodeList({ codes }).then((res) => {
    if (res.success && res.data && res.data[codes[0]]) {
      helpMessage.value = res.data[codes[0]][0].name;
    }
  });
  userDialogRef.value.getUser();
};

const expandDataHandle = () => {
  mbzSearchMainRef.value.expandHandle();
};

const pageExportDataHandle = () => {
  mbzSearchMainRef.value.pageExportHandle();
};

const exportApiDataHandle = () => {
  mbzSearchMainRef.value.exportApiHandle();
};

const isDisableHandle = (val: boolean) => {
  const $header = headerRef.value;
  if ($header) {
    $header.isDisabled = val;
  }
};
const isLoadHandle = (val: boolean) => {
  const $header = headerRef.value;
  if ($header) {
    $header.isLoaded = val;
  }
};

const isExportHandle = (val: boolean) => {
  const $header = headerRef.value;
  if ($header) {
    $header.isExported = val;
  }
};

onMounted(initData);
</script>

<style scoped lang="less">
.container {
  height: calc(100vh - 110px);
  padding: 10px;
  display: flex;
  flex-direction: column;
  .main {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
