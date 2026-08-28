<template>
  <vxe-modal height="400" width="30%" v-bind="$attrs" :destroy-on-close="true" :loading="loading" @show="showHandle" @close="closeHandle" :title="modalTitle" v-model="showModal" show-zoom resize position="center">
    <el-form :model="formData" ref="formRef" label-position="left" label-width="140px" :rules="dialogFormRules">
      <el-form-item label="序号：">
        <el-input maxlength="8" @input="(v:string) => (formData.sort = v.replace(/[^\d]/g, ''))" :controls="false" :disabled="props.opeartionFlag === 'view'" v-model="formData.sort" placeholder=""></el-input>
      </el-form-item>
      <el-form-item prop="name" label="名称：">
        <el-input maxlength="63" :disabled="props.opeartionFlag === 'view'" v-model="formData.name" placeholder=""></el-input>
      </el-form-item>
      <el-form-item label="承诺项：">
        <MultipleTreeSelect :disabled="disabled" :cnx-datas="selectedDatas" :leaf-only="true" :tree-data="selectList.cnxListData" v-model="formData.cnxs" :props="cnxProps" :lazy="true" :load-method="loadMethod" placeholder="请选择承诺项"> </MultipleTreeSelect>
      </el-form-item>
      <el-form-item label="是否可维护发生值：">
        <el-select :disabled="props.opeartionFlag === 'view'" style="width: 100%" v-model="formData.isEdit">
          <template v-for="item in selectList.statusList" :key="item.value">
            <el-option :label="item.label" :value="item.value"></el-option>
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="是否是委托运维：">
        <el-select :disabled="props.opeartionFlag === 'view'" style="width: 100%" v-model="formData.isWtyw">
          <template v-for="item in selectList.statusList" :key="item.value">
            <el-option :label="item.label" :value="item.value"></el-option>
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="是否展开：">
        <el-select :disabled="props.opeartionFlag === 'view'" style="width: 100%" v-model="formData.sfmrzk">
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
  name: "searchConfigAdd"
};
</script>
<script setup lang="ts">
import MultipleTreeSelect from "@/components/select/MultipleTreeSelect.vue";
import { ElMessage } from "element-plus";
import { defineProps, ref, defineEmits, defineExpose, reactive, computed } from "vue";
import { updateData, saveData } from "@/api/fy/searchConfig";
import { getCnxTree } from "@/api/common";

interface SelectData {
  id?: string;
  pid: string;
  name: string;
  isEdit: string;
  sort: string;
  sfmrzk: string;
  cnxs: {
    cnx: string;
    cnxId: string;
  }[];
}

interface Props {
  title: string;
  opeartionFlag: string;
  selectedCnxDatas: any[];
  nd: string;
  templateCode: string;
  selectData: SelectData;
  sort: number;
  cnxDisabled: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["close", "save"]);

const selectedDatas = computed(() => props.selectedCnxDatas);
const disabled = computed(() => props.cnxDisabled);

const showModal = ref(false);
const loading = ref(false);
const modalTitle = ref("");
const formRef = ref();

const cnxProps = {
  children: "children",
  isLeaf: "leaf",
  label: "name"
};

const formData = reactive<{
  id?: string;
  isEdit: string;
  name: string;
  nd: string;
  pid: string;
  sort: string;
  isWtyw: string;
  sfmrzk: string;
  cnxs: {
    cnx: string;
    cnxId: string;
  }[];
  [key: string]: any;
}>({
  isEdit: "0",
  name: "",
  sfmrzk: "",
  nd: "",
  pid: "",
  id: "",
  sort: "",
  isWtyw: "0",
  cnxs: []
});

const selectList = reactive<any>({
  cnxList: [],
  cnxListData: [],
  statusList: [
    {
      label: "是",
      value: "1"
    },
    {
      label: "否",
      value: "0"
    }
  ]
});

const dialogFormRules = reactive({
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
});

const saveHandle = async () => {
  loading.value = true;
  const formEl = formRef.value;
  if (!formEl) return;
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      let res: any;
      if (props.opeartionFlag !== "add" && props.selectData.id) {
        res = await updateData({
          ...formData,
          templateCode: props.templateCode
        });
      } else {
        res = await saveData({
          ...formData,
          templateCode: props.templateCode
        });
      }
      if (res.success) {
        loading.value = false;
        ElMessage.success("保存成功！");
        emit("save");
        cancelHandle();
      } else {
        loading.value = false;
        ElMessage.error(res.msg);
      }
    }
  });
};

const loadMethod = async (node: any) => {
  let flag = false;
  if (node.length === 0) flag = false;
  else flag = true;
  const id = flag ? node.id : "-1";
  return getCnxTree(id);
};

const cancelHandle = () => {
  closeHandle();
};

const showHandle = async () => {
  modalTitle.value = props.title;
  formData.pid = props.selectData.pid;
  formData.nd = props.nd;
  if (props.opeartionFlag !== "add") {
    formData.id = props.selectData.id;
    formData.name = props.selectData.name;
    formData.isEdit = props.selectData.isEdit ? "1" : "0";
    formData.sfmrzk = props.selectData.sfmrzk ? "1" : "0";
    formData.sort = props.selectData.sort;
    formData.cnxs = props.selectData.cnxs;
  } else {
    formData.sort = (props.sort + 1).toString();
  }
};

const closeHandle = () => {
  for (const key in formData) {
    if (Array.isArray(formData[key])) {
      formData[key] = [];
    } else {
      formData[key] = "";
    }
  }
  formData.isEdit = "0";
  formData.isWtyw = "0";
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
