<script lang="ts">
export default {
  name: "/ygConfigData/components/TreeDialog"
};
</script>

<script setup lang="ts">
import { ref } from "vue";
import { getYszxlyNodeTree, getNodeTree } from "@/api/statistics/budgetStatisticsConfig";
import { InitParams } from "@/views/ygConfigData/budgetStatisticsConfig.vue";
import { ElMessage } from "element-plus";
import { getPublicData, getBizOrgXzTreeExcludeBmNoPermissionNoLazy } from "@/api/common";
import { useRoute } from "vue-router";

interface Props {
  initParams: InitParams;
}

const route = useRoute();
const treeTypeList = ref<any[]>([]);
const treeTypeCode = ref<any>("YSZXYL");
const defaultProps = ref({
  id: "id",
  label: "name",
  children: "children"
  // disabled: (data: any, node: any) => {
  //   return data.children.length != 0;
  // }
});
const treeRef = ref();

const emits = defineEmits(["getTreeData"]);

const props = defineProps<Props>();
const showModal = ref(false);
const treeDataList = ref<any[]>([]);

const closeModalHandle = () => {
  showModal.value = false;
  // 清空数据
};
// 公共代码
const initParamLists = async () => {
  const publicCodeList = await getPublicData("YS_STAT_BUSI_TYPE");
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    treeTypeList.value = publicCodeList.data;
  }
  await getTreeData();
};

const detailHandle = () => {
  const nodes: any[] = treeRef.value.getCheckedNodes();
  if (nodes && nodes.length > 0) {
    nodes.forEach((element: any) => {
      element.children.length = 0;
    });
    emits("getTreeData", nodes);
  }
};

// const showModalHandle = async () => {
//   await getTreeData();
// };
const getTreeData = async () => {
  let res = await getNodeTree(treeTypeCode.value, props.initParams.nd);
  if (res.success && res.data) {
    treeDataList.value = res.data;
  } else {
    ElMessage.error(res.msg);
  }
};
const handlerTree = () => {
  getTreeData();
};
defineExpose({
  showModal,
  initParamLists
});
</script>

<template>
  <!-- @show="showModalHandle" -->
  <vxe-modal @close="closeModalHandle" class-name="modal" height="450" v-model="showModal" width="500" title="新增-明细汇总" show-zoom resize position="center">
    <div class="modal-table">
      <div style="display: flex; align-items: center;margin:0 0 10px 0;justify-content: right">
        <span style="color:#000">业务类型：</span>
        <el-select style="width: 150px" v-model="treeTypeCode" placeholder="请选择" @change="handlerTree">
          <el-option v-for="item1 in treeTypeList" :key="item1.code" :label="item1.name" :value="item1.code"/>
        </el-select>
      </div>

      <div class="table">
        <el-tree :check-strictly="true" ref="treeRef" show-checkbox :props="defaultProps" :data="treeDataList"/>
      </div>
      <div class="operation">
        <el-button plain size="mini" type="primary" @click="detailHandle">确 定</el-button>
        <el-button plain size="mini" type="primary" @click="closeModalHandle">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<style lang="less" scoped>
.modal-table {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  .table {
    overflow: auto;
    min-width: 0;
    min-height: 0;
    flex: 1;
    padding-bottom: 10px;
  }

  .operation {
    text-align: center;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
