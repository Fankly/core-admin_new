<script lang="ts">
export default {
  name: "ExtensionForm"
};
</script>

<script setup lang="ts">
import { computed, onMounted, ref, toRef, defineProps, defineExpose } from "vue";
import { BaseMsgData } from "@/views/matter/types/matterDecl";
import { getYhzd, saveOrUpdateYhzd } from "@/api/matter";

interface Props {
  baseMsgData: BaseMsgData;
}

const props = defineProps<Props>();

const isShowSearch = ref(false);

const extensionData = ref<any>({
  yssxId: "",
  yhzd1: "",
  yhzd2: "",
  yhzd3: "",
  yhzd4: "",
  yhzd5: "",
  yhzd6: "",
  yhzd7: "",
  yhzd8: "",
  yhzd9: "",
  yhzd10: ""
});

onMounted(() => {
  if (props.baseMsgData.operationFlag !== "ADD") {
    initEditParams();
  }
});

const clearData = () => {
  for (const key in extensionData.value) {
    extensionData.value[key] = "";
  }
};

const baseMsgData = toRef(props, "baseMsgData");

const isDisabled = computed(() => baseMsgData.value.operationFlag === "VIEW");

const initEditParams = async () => {
  let res = await getYhzd(props.baseMsgData.selectedData.id);
  if (res.success && res.data) {
    extensionData.value = res.data;
  }
};

const saveExtensionData = (val: string) => {
  if (props.baseMsgData.operationFlag === "ADD") {
    extensionData.value.yssxId = val;
    saveOrUpdateYhzd({
      ...extensionData.value
    });
  } else {
    extensionData.value.yssxId = props.baseMsgData.selectedData.yssxId;
    saveOrUpdateYhzd({
      ...extensionData.value
    });
  }
};

defineExpose({
  saveExtensionData,
  extensionData,
  clearData
});
</script>

<template>
  <div class="container">
    <el-button class="title-button" @click="isShowSearch = !isShowSearch" type="text"
      ><h3 class="sub-title">
        事项扩展信息
        <span>
          <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
        </span></h3
    ></el-button>
    <el-form :disabled="isDisabled" v-show="!isShowSearch" :model="extensionData" label-position="right" label-width="80px">
      <el-form-item label="备注1:">
        <el-input maxlength="100" v-model="extensionData.yhzd1" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注2:">
        <el-input maxlength="100" v-model="extensionData.yhzd2" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注3:">
        <el-input maxlength="100" v-model="extensionData.yhzd3" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注4:">
        <el-input maxlength="100" v-model="extensionData.yhzd4" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注5:">
        <el-input maxlength="100" v-model="extensionData.yhzd5" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注6:">
        <el-input maxlength="100" v-model="extensionData.yhzd6" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注7:">
        <el-input maxlength="100" v-model="extensionData.yhzd7" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注8:">
        <el-input maxlength="100" v-model="extensionData.yhzd8" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注9:">
        <el-input maxlength="100" v-model="extensionData.yhzd9" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
      <el-form-item label="备注10:">
        <el-input maxlength="100" v-model="extensionData.yhzd10" type="textarea" row="2" resize="none"></el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="less">
.container {
  position: relative;
  height: 820px;
  padding: 10px 34px;

  .sub-title {
    font-size: 18px;
  }

  .title-button {
    margin: 0 0 10px 0;
    padding: 0;
    height: 40px;
  }
}
</style>
