<template>
  <vxe-modal height="250" width="20%" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="modalTitle" v-model="showModal" show-zoom resize position="center">
    <el-form label-position="right" label-width="90px">
      <el-form-item label="序号：">
        <el-input maxlength="8" @input="(v:string) => (formData.sort = v.replace(/[^\d]/g, ''))" :controls="false" :disabled="props.opeartionFlag === 'view'" v-model="formData.sort" placeholder=""></el-input>
      </el-form-item>
      <el-form-item label="科目名称：">
        <el-input maxlength="63" :disabled="props.opeartionFlag === 'view'" v-model="formData.itemName" placeholder=""></el-input>
      </el-form-item>
      <el-form-item label="是否启用：">
        <el-select :disabled="props.opeartionFlag === 'view'" style="width: 100%" v-model="formData.status">
          <template v-for="item in selectList.statusList" :key="item.value">
            <el-option :label="item.label" :value="item.value"></el-option>
          </template>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="btn">
      <el-button v-if="props.opeartionFlag !== 'view'" plain size="mini" type="primary" @click="saveHandle">保 存</el-button>
      <el-button v-if="props.opeartionFlag !== 'view'" plain size="mini" type="primary" @click="cancelHandle">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "kmfzpzAdd"
};
</script>
<script setup lang="ts">
import { editData, saveData } from "@/api/xmInfo/kmfzpz";
import { ElMessage } from "element-plus";
import { defineProps, ref, defineEmits, defineExpose, reactive } from "vue";

interface SelectData {
  itemId: string;
  itemName: string;
  status: string;
  sort: string;
}

interface Props {
  title: string;
  opeartionFlag: string;
  yskmId: string;
  nd: string;
  selectData: SelectData;
}

const props = defineProps<Props>();
const emit = defineEmits(["close", "save"]);

const showModal = ref(false);
const loading = ref(false);
const modalTitle = ref("");

const formData = reactive({
  itemName: "",
  status: "1",
  sort: ""
});

const selectList = reactive({
  statusList: [
    {
      label: "启用",
      value: "1"
    },
    {
      label: "停用",
      value: "0"
    }
  ]
});

const saveHandle = async () => {
  const params: any = {
    nd: props.nd,
    ...formData
  };
  if (Number(props.yskmId)) {
    params.yskmId = Number(props.yskmId);
  }
  let res: any;
  if (props.opeartionFlag !== "add" && props.selectData.itemId) {
    res = await editData({
      ...params,
      itemId: props.selectData.itemId
    });
  } else {
    res = await saveData(params);
  }
  if (res.success) {
    ElMessage.success("保存成功！");
    emit("save", params);
    cancelHandle();
  } else {
    ElMessage.error(res.msg);
  }
};

const cancelHandle = () => {
  closeHandle();
};

const showHandle = async () => {
  modalTitle.value = props.title;
  if (props.opeartionFlag !== "add" && props.selectData.itemId) {
    formData.itemName = props.selectData.itemName;
    formData.status = props.selectData.status;
    formData.sort = props.selectData.sort;
  }
};
const closeHandle = () => {
  formData.itemName = "";
  formData.status = "1";
  formData.sort = "";
  showModal.value = false;
  emit("close", showModal.value);
};

defineExpose({
  showModal
});
</script>

<style scoped>
.btn {
  text-align: center;
}
</style>
