<template>
  <vxe-modal :loading="loading" :mask="true" :lock-scroll="true" :lock-view="true" show-zoom resize position="center" title="变更WBS预算" v-model="isShowModal" width="40%" height="150">
    <div class="content">
      <el-form ref="searchRef" label-position="right" :model="searchForm">
        <Grid ref="gridRef" :gap="[10, 0]" :cols="2">
          <GridItem>
            <el-form-item prop="wbsName1">
              <template #label>
                <el-space :size="4">
                  <span>{{ `WBS名称1` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <input min="0" class="my-sbsm" maxlength="127" v-model="searchForm.wbsName1" :disabled="true" />
              </div>
            </el-form-item>
          </GridItem>
          <GridItem>
            <el-form-item prop="je1">
              <template #label>
                <el-space :size="4">
                  <span>{{ `WBS金额1（万元）` }}</span>
                </el-space>
                <span>&nbsp;：</span>
              </template>
              <div class="form">
                <input min="0" v-number-input="6" class="my-input" v-model="searchForm.je1" maxlength="20" :disabled="!isShowEdit" />
              </div>
            </el-form-item>
          </GridItem>
        </Grid>
        <div class="operation" style="text-align: center">
          <el-button plain type="primary" size="mini" v-if="isShowEdit" @click="handleDetail">确 定</el-button>
          <el-button plain type="primary" size="mini" @click="handleClose">关 闭</el-button>
        </div>
      </el-form>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { RowVo } from "@/views/service/budget/changes/components/budgetChangeHistory/interface";
import GridItem from "@/components/Grid/components/GridItem.vue";
import Grid from "@/components/Grid/index.vue";

interface CheckedData {
  checkedData: RowVo | RowVo[] | null;
  isEdit: boolean;
}

export default defineComponent({
  name: "wbsEditModal",
  components: { Grid, GridItem },
  emits: ["setData"],
  setup(props, { emit, expose }) {
    const isShowModal = ref(false);
    const searchForm = ref({
      wbsName1: "",
      je1: 0,
      wbsId1: ""
    });
    const loading = ref(false);
    const parameter = ref<CheckedData>({
      checkedData: null,
      isEdit: false
    });
    const isShowEdit = computed(() => parameter.value.isEdit);
    const acceptParams = (params: CheckedData) => {
      parameter.value = { ...parameter.value, ...params };
      if (params.checkedData) {
        if (Array.isArray(params.checkedData)) {
          const selectedData = params.checkedData[0];
          searchForm.value.je1 = selectedData.je1;
          searchForm.value.wbsName1 = selectedData.wbsName1;
          searchForm.value.wbsId1 = selectedData.wbsId1;
        } else {
          searchForm.value.je1 = params.checkedData.je1;
          searchForm.value.wbsName1 = params.checkedData.wbsName1;
          searchForm.value.wbsId1 = params.checkedData.wbsId1;
        }
      }

      isShowModal.value = true;
    };
    const handleClose = () => {
      isShowModal.value = false;
      searchForm.value.wbsName1 = "";
      searchForm.value.je1 = 0;
      searchForm.value.wbsId1 = "";
    };

    const handleDetail = () => {
      emit("setData", searchForm.value);
      isShowModal.value = false;
    };
    expose({
      acceptParams
    });
    return {
      handleDetail,
      handleClose,
      searchForm,
      isShowEdit,
      isShowModal,
      loading
    };
  }
});
</script>

<style scoped></style>
