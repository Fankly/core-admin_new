<script lang="ts">
export default {
  name: "/metrics/components/TypeDialog"
};
</script>

<script setup lang="ts">
import { ref, defineExpose, defineProps, toRef, reactive, defineEmits } from "vue";
import ProTypeTreeSelect from "@/components/select/ProTypeTreeSelect.vue";
import { InitParams } from "@/views/metrics/configData/budgetStatisticsConfig.vue";
import { getPublicData, getAllProtypeTree } from "@/api/common";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash";

interface Props {
  initParams: InitParams;
}

const emits = defineEmits(["getTypeData"]);

const props = defineProps<Props>();

const formRef = ref();

const nd = toRef(props.initParams, "nd");

const treeData = ref([]);

const xmbSelectList = ref<
  {
    code: string;
    name: string;
  }[]
>([]);

const showModal = ref(false);

const formData = reactive<any>({
  proType: "",
  packType: ""
});

const rulesForm = reactive({
  proType: [{ required: true, message: "请选择项目类型", trigger: ["change"] }]
});

const initPublicCode = async () => {
  let res = await getPublicData("XMBTYPE_COM");
  if (res.success && res.data) {
    xmbSelectList.value = res.data;
  }
};

const initFormData = async () => {
  const params = {
    parentId: "0",
    startDate: nd.value
  };
  let res = await getAllProtypeTree();
  if (res.success) {
    treeData.value = res.data;
  } else {
    ElMessage({
      type: "error",
      message: res.msg
    });
  }
};

const releaseHandle = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: any) => {
    if (valid) {
      let copyData = cloneDeep(formData);
      emits("getTypeData", copyData);
      closeModalHandle();
    }
  });
};

const showModalHandle = () => {
  initPublicCode();
  initFormData();
};

const closeModalHandle = () => {
  showModal.value = false;
  formData.packType = "";
  formData.proType = "";
};
defineExpose({
  showModal
});
</script>

<template>
  <vxe-modal :destroy-on-close="true" @show="showModalHandle" @close="closeModalHandle" class-name="modal" height="210" v-model="showModal" width="400" title="新增-数据绑定" show-zoom resize position="center">
    <el-form ref="formRef" :rules="rulesForm" :model="formData" label-width="120px" label-position="right">
      <el-form-item prop="proType" label="项目类型：">
        <ProTypeTreeSelect
          style="width: 100%"
          v-model="formData.proType"
          :props="{
            children: 'children',
            label: 'name'
          }"
          :tree-data="treeData"
          placeholder="请选择项目类型"
        ></ProTypeTreeSelect>
      </el-form-item>
      <el-form-item prop="packType" label="项目包类型：">
        <el-select value-key="code" clearable v-model="formData.packType" style="width: 100%">
          <el-option v-for="item in xmbSelectList" :key="item.code" :value="item" :label="item.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="operation">
      <el-button size="mini" type="primary" plain @click="releaseHandle">确 定</el-button>
      <el-button size="mini" type="primary" plain @click="closeModalHandle">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<style lang="less" scoped>
.operation {
  text-align: center;
  line-height: 32px;
}
</style>
