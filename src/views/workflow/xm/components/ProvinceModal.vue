<template>
  <vxe-modal :loading="loading" title="省对口专业部门选择" v-model="isShowModal">
    <el-form ref="formRef" label-suffix=":" :model="formData" :rules="modalFormRules">
        <el-form-item prop="sdkzybmId" label="省对口专业部门">
          <el-select style="width: 100%" v-model="formData.sdkzybmId">
            <el-option v-for="item in selcteList" :key="item.code" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    <div class="btn" style="text-align: center;">
      <el-button type="primary" size="mini" plain @click="handleDetail">确 认</el-button>
      <el-button size="mini" plain @click="handleCancel">取 消</el-button>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="ProvinceModal">
interface Parameter {
  xmIds: string[];
  workItemId:string;
}
import { getDataByParent } from "@/api/common";
import { modiySdkzybm } from "@/api/workflow/xm";
import { ElMessage } from "element-plus";
import { defineEmits, defineExpose, reactive, ref } from "vue";
import { VXETable } from "vxe-table";

interface PublicCode {
  code:string;
  name:string;
}

const emits = defineEmits(["close", "detail"]);

const isShowModal = ref(false);
const loading = ref(false);

const formRef = ref();

const selcteList = ref<PublicCode[]>([]);

const formData = reactive({
  sdkzybmId: ""
});

const modalFormRules = reactive({
  sdkzybmId: [{ required: true, message: "请选择省对口专业部门",  trigger: ["change"]  }]
});


const parameter = ref<Parameter>({
  xmIds: [],
  workItemId:''
});


const getPublicCode = async ()=>{
  try {
    const res = await getDataByParent("QMYS_ZZJG");
    if(res.success){
    selcteList.value = res.data;
      return true;
    }else{
      throw new Error(res.msg);
    }
  } catch (e) {
    const error = e as Error;
    ElMessage.error(error.message);
    return false;
  }
}


// 接收父组件参数
const acceptParams = (params: Parameter) => {
  getPublicCode();
  parameter.value = { ...parameter.value, ...params };
  isShowModal.value = true;
};

const handleCancel = () => {
  if (formRef.value) {
    isShowModal.value = false;
    formRef.value.resetFields();
    emits("close");
  }
};

const handleDetail = () => {
  formRef.value.validate(async (valid: any) => {
    const type = await VXETable.modal.confirm("是否确定?", "提示", {
      confirmButtonText: "是",
      cancelButtonText: "否"
    });
    if (type === "confirm") {
      loading.value = true;
      try {
          const res = await modiySdkzybm({
          sdkzybmId:formData.sdkzybmId,
          xmIds:parameter.value.xmIds,
          workItemId:parameter.value.workItemId
          });
          if(res.success){
            isShowModal.value = false;
            formRef.value.resetFields();
            ElMessage.success('操作成功！');
            emits('detail');
          }else{
            throw new Error(res.msg);
          }
      }catch(e){
        const error = e as Error;
        ElMessage.error(error.message);
      }finally{
        loading.value = false;
      }
    }
  });
};

defineExpose({
  acceptParams
});
</script>

<style scoped></style>
