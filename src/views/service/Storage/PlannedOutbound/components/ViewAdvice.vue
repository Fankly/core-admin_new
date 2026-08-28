<template>
  <vxe-modal width="30%" position="center" :destroy-on-close="true" :title="modalProps.title" v-model="modalVisible">
    <el-form label-suffix=" : " label-position="left" ref="ruleFormRef" label-width="120px" :disabled="modalProps.isView" :model="modalProps.row" :hide-required-asterisk="modalProps.isView">
      <el-row :gutter="20">
        <el-col :span="24" v-if="modalProps.isView">
          <el-form-item label="拟出库提交人" prop="nckApplyUsername">
            <el-input maxlength="62" v-model="modalProps.row!.nckApplyUsername"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="modalProps.isView">
          <el-form-item label="拟出库提交时间" prop="nckApplyTime">
            <el-input maxlength="62" v-model="modalProps.row!.nckApplyTime"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="modalProps.isView">
          <el-form-item label="拟出库核定人" prop="nckPassUserName">
            <el-input maxlength="62" v-model="modalProps.row!.nckPassUserName"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="modalProps.isView">
          <el-form-item label="拟出库核定时间" prop="nckPassTime">
            <el-input maxlength="62" v-model="modalProps.row!.nckPassTime"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="拟出库核定意见" prop="nckApprovedOpinions">
            <el-input resize="none" type="textarea" :rows="4" maxlength="120" v-model="modalProps.row!.nckApprovedOpinions"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center">
      <el-button plain type="primary" size="mini" v-show="!modalProps.isView" @click="saveHandle">保 存</el-button>
      <el-button plain type="primary" size="mini" @click="closeHandle">关 闭</el-button>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "ViewAdvice"
};
</script>
<script setup lang="ts">
import { submitData } from "@/api/service/Storage/PlannedOutbound/Verification";
import { ElMessage } from "element-plus";
import { ref, defineExpose } from "vue";
import { VXETable } from "vxe-table";

interface ModalProps {
  title: string;
  isView: boolean;
  row: Partial<any>;
  otherData?: any;
  getTableList?: () => void;
}

const modalProps = ref<ModalProps>({
  isView: false,
  title: "核定意见-查看",
  row: {},
  otherData: {}
});

const modalVisible = ref(false);

const saveHandle = async () => {
  try {
    const type = await VXETable.modal.confirm("确定是否保存？", "提示", {
      status: "warning",
      confirmButtonText: "是",
      cancelButtonText: "否"
    });
    if (type === "confirm") {
      const res = await submitData({
        ...modalProps.value.otherData,
        ...modalProps.value.row
      });
      if (res.success) {
        const msg = modalProps.value.otherData.res === "Y" ? "通过" : "驳回";
        ElMessage.success(msg + "成功!");
        modalVisible.value = false;
        if (modalProps.value.getTableList) modalProps.value.getTableList();
      } else {
        throw new Error(res.msg);
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message);
  }
};

const closeHandle = () => {
  modalVisible.value = false;
};

const acceptParams = (params: ModalProps) => {
  modalProps.value.isView = params.isView;
  modalProps.value.title = params.title;
  modalProps.value.row = params.row;
  if (params.getTableList) modalProps.value.getTableList = params.getTableList;
  if (params.otherData) modalProps.value.otherData = { ...params.otherData };
  modalVisible.value = true;
};

defineExpose({
  acceptParams
});
</script>

<style scoped></style>
