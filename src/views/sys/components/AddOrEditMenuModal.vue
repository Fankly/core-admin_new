<script lang="ts">
export default {
  name: "AddOrEditModal"
};
</script>

<script setup lang="ts">
import { ref, defineExpose, defineProps, reactive, defineEmits, computed } from "vue";
import { appMenuSave, appMenuUpdate } from "@/api/sys/appManager";
import { ElMessage } from "element-plus";
import baseService from "@/service/baseService";
import { IObject } from "@/types/interface";

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
  },
  outsideRowData: {
    type: Object as any,
    default: null
  }
});

const isShowModal = ref(false);
const menuListVisible = ref(false);
const formRef = ref();

const formData = reactive({
  appId: "",
  id: "",
  menuId: "",
  label: "",
  sort: 0,
  name: "",
  appName: ""
});

const menuList = ref([]);
const loading = ref(false);

const isDisabled = computed(() => props.flag === "VIEW");

const showHandle = () => {
  getMenuList();
  if (props.outsideRowData && props.flag === "ADD") {
    formData.appId = props.outsideRowData.appId;
    formData.appName = props.outsideRowData.appName;
  }
  if ((props.flag === "EDIT" || props.flag === "VIEW") && props.selectData) {
    formData.appId = props.selectData.appId;
    formData.name = props.selectData.name;
    formData.label = props.selectData.label;
    formData.sort = props.selectData.sort;
    formData.menuId = props.selectData.menuId;
    formData.id = props.selectData.id;
    formData.appName = props.selectData.appName;
  }
};

// 获取菜单列表
const getMenuList = () => {
  return baseService.get("/sys/menu/list?type=0").then((res) => {
    if (res.code !== 0) {
      return this.$message.error(res.msg);
    }
    menuList.value = res.data.map((item) => ({
      ...item,
      menuId: item.id
    }));
  });
};

const rulesForm = reactive({
  appId: { message: "请输入应用id", trigger: "blur", required: true },
  menuId: { message: "请输入菜单id", trigger: "blur", required: true },
  label: { message: "请选择标签", trigger: "change", required: true },
  sort: { message: "请输入排序", trigger: "blur", required: true }
});

const saveHandle = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      let api = appMenuSave;
      let text = "新增";
      if (props.flag === "EDIT") {
        api = appMenuUpdate;
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

const menuListTreeCurrentChangeHandle = (data: IObject) => {
  formData.menuId = data.id;
  formData.name = data.name;
  menuListVisible.value = false;
};

const deptListTreeSetDefaultHandle = () => {
  formData.menuId = "0";
  formData.name = "";
};

const closeHandle = () => {
  formRef.value.resetFields();
  isShowModal.value = false;
  formData.menuId = "0";
  formData.name = "";
};

defineExpose({
  isShowModal
});
</script>

<template>
  <vxe-modal @close="closeHandle" :loading="loading" resize @show="showHandle" height="310" position="center" width="500" v-model="isShowModal" :title="props.title">
    <el-form :disabled="isDisabled" ref="formRef" :rules="rulesForm" :model="formData" label-position="right" label-width="80px">
      <el-form-item label="应用" prop="appId">
        <el-input :disabled="true" v-model="formData.appName"></el-input>
      </el-form-item>
      <el-form-item label="菜单" prop="menuId">
        <el-popover v-model:visible="menuListVisible" ref="menuListPopover" placement="bottom-start" trigger="click" :width="400">
          <template v-slot:reference>
            <el-input v-model="formData.name" :readonly="true" placeholder="请选择菜单">
              <template v-slot:suffix><i v-if="formData.menuId !== '0'" @click.stop="deptListTreeSetDefaultHandle()" class="el-input__icon"></i></template>
            </el-input>
          </template>
          <el-tree :data="menuList" :props="{ label: 'name', children: 'children' }" node-key="id" ref="menuListTree" :highlight-current="true" :expand-on-click-node="false" accordion @current-change="menuListTreeCurrentChangeHandle"></el-tree>
        </el-popover>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-select style="width: 100%" v-model="formData.label">
          <el-option label="操作" value="1"></el-option>
          <el-option label="查询" value="2"></el-option>
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
