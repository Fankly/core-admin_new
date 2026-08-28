<template>
  <el-dialog width="60%" @close="closeHandle" :destroy-on-close="true" :show-close="true" custom-class="decl-dialog" :close-on-press-escape="false" :close-on-click-modal="false" top="18px" v-model="isShowModal">
    <el-tabs v-model="activeName">
      <el-tab-pane label="事项储备信息" name="eventReserve">
        <MatterDeclMsg :detailParams="detailTableParams"></MatterDeclMsg>
      </el-tab-pane>
      <el-tab-pane label="可研信息" name="backlog">
        <Backlog :detailParams="detailTableParams"></Backlog>
      </el-tab-pane>
      <el-tab-pane label="事项扩展信息" name="extensionMsg">
        <ExtensionMsg :detailParams="detailTableParams" />
      </el-tab-pane>
    </el-tabs>
    <div class="close-icon">
      <i class="el-icon-close" @click="closeHandle"></i>
    </div>
    <template #footer>
      <div class="operation">
        <el-button plain @click="closeHandle" size="mini">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import MatterDeclMsg from "@/views/statistics/components/MatterDeclMsg.vue";
import Backlog from "@/views/statistics/components/Backlog.vue";
import ExtensionMsg from "@/views/statistics/components/ExtensionMsg.vue";
import { ref, defineProps, defineExpose, toRef } from "vue";
import { TableDetailParams } from "../interface";

interface Props {
  detailParams: TableDetailParams;
}

const props = defineProps<Props>();

const detailTableParams = toRef(props, "detailParams");

const activeName = ref<string>("eventReserve");
const isShowModal = ref(false);

const closeHandle = () => {
  isShowModal.value = false;
  activeName.value = "eventReserve";
};

defineExpose({
  isShowModal
});
</script>

<style lang="less">
.decl-dialog {
  position: relative;

  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0 !important;
    margin: 0;
  }

  .el-tabs__header {
    padding: 0 !important;
    margin: 0 10px !important;
  }

  .el-dialog__footer {
    margin: 0;
    padding: 0 0 10px 0;
  }

  .operation {
    text-align: center;
  }
}
</style>
