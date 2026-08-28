<template>
  <el-dialog width="60%" @close="closeDialogHandle" :title="props.diaLogData.title" :destroy-on-close="true" :show-close="true" custom-class="decl-dialog" :close-on-press-escape="isDisabledShow" :close-on-click-modal="isDisabledShow" top="18px" v-model="isShowPage">
    <div class="dialog-main" style="position: relative">
      <el-tabs v-model="activeName">
        <el-tab-pane label="事项储备信息" name="eventReserve">
          <MatterBaseMsg ref="matterBaseMsgRef" @update-table="updateTableHandle" :baseMsgData="props.baseMsgData" @close-dialog="closeDialogHandle"></MatterBaseMsg>
        </el-tab-pane>
        <el-tab-pane label="可研信息" name="backlog">
          <BackLog :baseMsgData="props.baseMsgData" />
        </el-tab-pane>
        <el-tab-pane label="事项扩展信息" name="extensionMsg">
          <ExtensionForm ref="extensionRef" :base-msg-data="props.baseMsgData"></ExtensionForm>
        </el-tab-pane>
      </el-tabs>
      <div class="close-icon">
        <i class="el-icon-close" @click="closeHandle"></i>
      </div>
    </div>
    <template #footer>
      <div class="operation">
        <el-button :disabled="isDisabledShow" v-if="props.baseMsgData.jd === '2' && props.baseMsgData.operationFlag !== 'VIEW'" type="primary" plain @click="submitHandle">保 存 </el-button>
        <el-button :disabled="disabledShow" v-if="props.baseMsgData.jd === '1' && props.baseMsgData.operationFlag !== 'VIEW'" type="primary" plain @click="submitHandle">确 定</el-button>
        <el-button plain @click="closeHandle">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
export default {
  name: "FormMatterDecl"
};
</script>
<script setup lang="ts">
import { BaseMsgData, DialogData } from "../types/matterDecl";
import MatterBaseMsg from "@/views/matter/components/MatterBaseMsg.vue";
import BackLog from "@/views/matter/components/DialogBacklog.vue";
import { computed, ref, defineEmits, defineProps, toRef } from "vue";
import ExtensionForm from "@/views/matter/components/ExtensionForm/index.vue";

interface Props {
  diaLogData: DialogData;
  baseMsgData: BaseMsgData;
}

const emits = defineEmits(["closeDialog", "updateTable"]);
const props = defineProps<Props>();
const matterBaseMsgRef = ref();
const extensionRef = ref();

const isShowPage = toRef(props.diaLogData, "isShowPage");

const disabledShow = computed(() => props.baseMsgData.operationFlag === "VIEW" || props.baseMsgData.jd === "2");
const isDisabledShow = computed(() => props.baseMsgData.operationFlag === "VIEW");

const activeName = ref<string>("eventReserve");

const updateTableHandle = () => {
  emits("updateTable");
};

const closeHandle = () => {
  matterBaseMsgRef.value.closeDialogHandle();
};

const submitHandle = () => {
  matterBaseMsgRef.value.submitHandle(extensionRef.value.saveExtensionData);
};

const closeDialogHandle = (val: boolean) => {
  emits("closeDialog", val);
};
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
