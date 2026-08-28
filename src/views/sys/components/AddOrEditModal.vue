<script lang="ts">
export default {
  name: "AddOrEditModal"
};
</script>

<script setup lang="ts">
import { ref, defineExpose, defineProps, reactive, defineEmits, computed } from "vue";
import { getIconList } from "@/utils/utils";
import { appSave, appUpdate } from "@/api/sys/appManager";
import { ElMessage } from "element-plus";

const emit = defineEmits(["updateData"]);

const props = defineProps({
  title: {
    type: String,
    default: "Add Or Edit",
    required: true
  },
  flag: {
    type: String,
    default: "ADD",
    required: true
  },
  selectData: {
    type: Object as any,
    default: null
  }
});

const isShowModal = ref(false);
const formRef = ref();

const formData = reactive({
  appNo: "",
  appName: "",
  appIcon: "",
  appLink: "",
  status: "",
  sort: "",
  appId: ""
});

const iconList = ref([]);
const iconListVisible = ref(false);
const loading = ref(false);

const isDisabled = computed(() => props.flag === "VIEW");

const showHandle = () => {
  iconList.value = getIconList();
  if ((props.flag === "EDIT" || props.flag === "VIEW") && props.selectData) {
    formData.appIcon = props.selectData.appIcon;
    formData.appNo = props.selectData.appNo;
    formData.appId = props.selectData.appId;
    formData.appName = props.selectData.appName;
    formData.appLink = props.selectData.appLink;
    formData.status = props.selectData.status;
    formData.sort = props.selectData.sort;
  }
};

const iconListCurrentChangeHandle = (icon: string) => {
  formData.appIcon = icon;
  iconListVisible.value = false;
};
const rulesForm = reactive({
  appNo: { message: "请输入应用编码", trigger: "blur", required: true },
  appName: { message: "请输入应用名称", trigger: "blur", required: true },
  appIcon: { message: "请选择应用图标", trigger: "change", required: true },
  appLink: { message: "请输入应用链接", trigger: "blur", required: true },
  status: { message: "请选择状态", trigger: "change", required: true },
  sort: { message: "请输入排序", trigger: "blur", required: true }
});

const saveHandle = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      let api = appSave;
      let text = "新增";
      if (props.flag === "EDIT") {
        api = appUpdate;
        text = "编辑";
      }
      const res = await api({
        ...formData
      });
      if (res.success) {
        ElMessage.success(text + "成功");
        closeHandle();
        emit("updateData");
        loading.value = false;
      } else {
        ElMessage.error(res.msg);
        loading.value = false;
      }
    }
  });
};
const closeHandle = () => {
  formRef.value.resetFields();
  isShowModal.value = false;
};

defineExpose({
  isShowModal
});
</script>

<template>
  <vxe-modal @close="closeHandle" :loading="loading" resize @show="showHandle" height="405" position="center" width="500" v-model="isShowModal" :title="props.title">
    <el-form :disabled="isDisabled" ref="formRef" :rules="rulesForm" :model="formData" label-position="right" label-width="80px">
      <el-form-item label="应用编码" prop="appNo">
        <el-input v-model="formData.appNo"></el-input>
      </el-form-item>
      <el-form-item label="应用名称" prop="appName">
        <el-input v-model="formData.appName"></el-input>
      </el-form-item>
      <el-form-item label="应用图标" prop="appIcon">
        <el-popover :width="'400px'" v-model:visible="iconListVisible" ref="iconListPopover" placement="top-start" trigger="click" popper-class="mod-sys__menu-icon-popover">
          <template v-slot:reference>
            <el-input v-model="formData.appIcon" :readonly="true" placeholder="图标"></el-input>
          </template>
          <div class="mod-sys__menu-icon-inner">
            <div class="mod-sys__menu-icon-list">
              <el-button v-for="(item, index) in iconList" :key="index" @click="iconListCurrentChangeHandle(item)" :class="{ 'is-active': formData.appIcon === item }">
                <svg class="icon-svg" aria-hidden="true">
                  <use :xlink:href="`#${item}`"></use>
                </svg>
              </el-button>
            </div>
          </div>
        </el-popover>
      </el-form-item>
      <el-form-item label="应用链接" prop="appLink">
        <el-input v-model="formData.appLink"></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select style="width: 100%" v-model="formData.status">
          <el-option label="启用" value="1"></el-option>
          <el-option label="停用" value="0"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" controls-position="right" :min="0" label="排序"></el-input-number>
      </el-form-item>
    </el-form>
    <div class="operation" style="text-align: center">
      <el-button type="primary" plain @click="saveHandle" v-if="!isDisabled">保 存</el-button>
      <el-button type="primary" plain @click="closeHandle">关 闭</el-button>
    </div>
  </vxe-modal>
</template>

<style scoped lang="less"></style>
