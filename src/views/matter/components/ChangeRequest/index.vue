<template>
  <el-dialog width="60%" @close="closeDialogHandle" :destroy-on-close="true" :show-close="true" custom-class="request-dialog" :close-on-press-escape="isDisabled" :close-on-click-modal="isDisabled" top="18px" v-model="isShowDialog">
    <div class="dialog-main" style="position: relative">
      <el-tabs v-model="activeName">
        <el-tab-pane label="事项变更信息" name="eventReserve">
          <MatterChanges @close-dialog="closeDialogHandle" ref="matterChagnesRef" :base-msg-data="props.baseMsgData"></MatterChanges>
        </el-tab-pane>
        <el-tab-pane class="change-res" label="可研信息" name="backlog">
          <BackLog flag="changes" :baseMsgData="props.baseMsgData" />
        </el-tab-pane>
      </el-tabs>
      <div class="close-icon">
        <i class="el-icon-close" @click="() => closeDialogHandle(false)"></i>
      </div>
    </div>
    <template #footer>
      <div class="operation" style="text-align: center">
        <el-button v-if="!isDisabled" type="primary" plain @click="saveDataHandle">保 存</el-button>
        <el-button plain @click="closeDialogHandle">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import BackLog from "@/views/matter/components/DialogBacklog.vue";
import MatterChanges from "@/views/matter/components/MatterChanges/index.vue";
import type { BaseMsgData, List } from "@/views/matter/types/matterDecl";
import { computed, ref, toRef, defineEmits, defineProps } from "vue";

interface Props {
  baseMsgData: BaseMsgData;
  diaLogData: List;
}

const emits = defineEmits(["closeDialog"]);
const props = defineProps<Props>();
const isDisabled = computed(() => props.baseMsgData.operationFlag === "VIEW");
const matterChagnesRef = ref();
const isShowDialog = toRef(props.diaLogData, "isShowAdjustFormDialog");

const activeName = ref<string>("eventReserve");

const saveDataHandle = () => {
  matterChagnesRef.value.submitHandle();
};

const closeDialogHandle = (val: boolean) => {
  isShowDialog.value = false;
  activeName.value = "eventReserve";
  emits("closeDialog", val);
};
</script>

<style lang="less">
.request-dialog {
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
