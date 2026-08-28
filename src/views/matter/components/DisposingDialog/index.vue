<template>
  <el-dialog v-loading="loading" top="10px" @open="handleOpenPage" :close-on-press-escape="false" :close-on-click-modal="false" :destroy-on-close="true" :show-close="true" v-model="isShowPage" :title="pageTitle" @close="handleClosePage">
    <el-table ref="tableRef" :load="tableLoad" height="760px" :tree-props="{ children: 'children', hasChildren: 'leaf' }" lazy border stripe row-key="id" :data="tableData">
      <el-table-column width="300" show-overflow-tooltip header-align="center" label="单位名称" prop="dwName"></el-table-column>
      <el-table-column header-align="center" align="right" label="事项预算金额（万元）" prop="fjYs">
        <template #default="{ row }">
          <el-input class="ipt" v-model="row.fjYs" :disabled="isDisabled(row)" maxlength="20" @focus="focusHandle" :oninput="(input:any) => inputChange(input)" style="width: 100%" @blur="(event:any) => handleBlurCheck(event,row)" />
        </template>
      </el-table-column>
      <el-table-column prop="lxje" align="right" header-align="center" label="事项立项金额"></el-table-column>
      <el-table-column prop="fsje" align="right" header-align="center" label="事项发生金额"></el-table-column>
      <el-table-column prop="wxhje" align="right" header-align="center" label="事项未消耗金额"></el-table-column>
    </el-table>
    <template #footer>
      <div class="dialog-footer" style="text-align: center">
        <el-button plain type="primary" @click="handleSavePage" v-if="operationFlag !== 'VIEW'" :disabled="disabled">保 存</el-button>
        <el-button plain type="info" @click="handleClosePage">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
export default {
  name: "DisposingDialog"
};
</script>

<script setup lang="ts">
import { ref, toRef, defineProps, defineEmits, computed } from "vue";
import { BaseMsgData, DialogData, List } from "@/views/matter/types/matterDecl";
import { getYssxFjDetail, yssxFjSave } from "@/api/matter/matterYsfj";
import { ElMessage } from "element-plus";
import { Decimal } from "decimal.js";
import { cloneDeep } from "lodash";
import { getBmFjDetail, yssxBmFjSave } from "@/api/matter/yssxBmFj";
import { getParentNode } from "@/utils/utils";

const props = defineProps<{
  dialogData: DialogData;
  baseMsgData: BaseMsgData;
}>();

const tableRef = ref();
const isShowPage = toRef(props.dialogData, "isShowPage");
const pageTitle = toRef(props.dialogData, "title");
const specialOrgId = toRef(props.baseMsgData, "specialOrgId");
const tabType = toRef(props.baseMsgData, "tabType");
const selectedData = toRef(props.baseMsgData, "selectedData");
const operationFlag = toRef(props.baseMsgData, "operationFlag");
const searchType = toRef<any, any>(props.baseMsgData, "type");

const tableData = ref([]);
const loading = ref(false);

const disabled = computed(() => loading.value);
const tempTableData = ref<any>([]);
const emits = defineEmits(["closePage"]);

const handleSavePage = async () => {
  loading.value = true;
  let res = searchType.value === "DW" ? await yssxFjSave(editTableList.value) : await yssxBmFjSave(editTableList.value);
  if (res.success) {
    loading.value = false;
    ElMessage.success("保存成功");
    handleClosePage();
  } else {
    loading.value = false;
    ElMessage.error(res.msg);
  }
};

const handleClosePage = () => {
  editTableList.value.length = 0;
  isShowPage.value = false;
  emits("closePage", false);
};

const handleOpenPage = () => {
  initData();
};

const initData = async () => {
  let params = {
    yssxId: selectedData.value.yssxId,
    id: selectedData.value.id,
    specialorgid: specialOrgId.value
  };
  let res =
    searchType.value === "DW"
      ? await getYssxFjDetail({
          ...params,
          tabType: tabType.value,
          searchFrom: "1"
        })
      : await getBmFjDetail({
          ...params,
          dateType: props.baseMsgData.selectedData.dataType
        });
  if (res.success) {
    tableData.value = res.data;
    tempTableData.value = cloneDeep(res.data);
  } else {
    ElMessage.error(res.msg);
  }
};

const isDisabled = (row: List) => {
  return operationFlag.value === "EDIT" ? !row?.edit : true;
};

const tableLoad = async (row: any, treeNode: unknown, resolve: (date: any[]) => void) => {
  const { id, dataType } = row;
  let params = {
    id: id,
    yssxId: selectedData.value.yssxId,
    specialorgid: specialOrgId.value
  };
  let res =
    searchType.value === "DW"
      ? await getYssxFjDetail({
          ...params,
          tabType: tabType.value,
          searchFrom: "2"
        })
      : await getBmFjDetail({
          ...params,
          dateType: dataType
        });
  if (res.success) {
    if (res.data.length === 0) {
      resolve([]);
    } else {
      addChildrenData(res.data);
      resolve(res.data);
    }
  } else {
    ElMessage.error(res.msg);
    resolve([]);
  }
};

const addChildrenData = (data: any) => {
  if (data.length > 0) {
    if (data[0].dataType === "EJDW") {
      let index = tempTableData.value.findIndex((item: any) => item.id === data[0].parentId);
      if (index !== -1) {
        tempTableData.value[index].children = cloneDeep(data);
      }
    }
    if (data[0].dataType === "BM") {
      tempTableData.value.forEach((item: any) => {
        if (item.children) {
          let index = item.children.findIndex((item: any) => item.id === data[0].parentId);
          if (index !== -1) {
            item.children[index].children = cloneDeep(data);
          }
        } else {
          let index = tempTableData.value.findIndex((item: any) => item.id === data[0].parentId);
          if (index !== -1) {
            tempTableData.value[index].children = cloneDeep(data);
          }
        }
      });
    }
  }
};

const editTableList = ref<any[]>([]);

const checkValue = (row: any, searchType: string) => {
  let parentDatas: any = getParentNode(tempTableData.value, row);
  let parentDatasChils = parentDatas.children;
  let index = -1;
  let totalSum = parseFloat(Decimal.add(0, parseFloat(row.fjYs)).toString());
  for (let i = 0; i < parentDatasChils.length; i++) {
    if (searchType === "DW") {
      if (row.dwId && parentDatasChils[i].dwId === row.dwId) {
        index = i;
        continue;
      }
    } else {
      if (row.dwId && parentDatasChils[i].dwId === row.dwId && row.cbzx && parentDatasChils[i].cbzx === row.cbzx) {
        index = i;
        continue;
      }
    }

    let value = parentDatasChils[i].fjYs ? parseFloat(parentDatasChils[i].fjYs) : 0;
    totalSum = parseFloat(Decimal.add(totalSum, value).toString());
  }
  if (totalSum > parentDatas.fjYs) {
    ElMessage.error(`预算金额不超过${parentDatas.fjYs}万元`);
    row.fjYs = parentDatasChils[index].fjYs;
  } else {
    let editIndex = -1;
    parentDatasChils[index] = cloneDeep(row);
    if (searchType === "DW") {
      editIndex = editTableList.value.findIndex((item) => item.dwId === row.dwId);
    } else {
      editIndex = editTableList.value.findIndex((item) => item.cbzx === row.cbzx);
    }
    if (editIndex > -1) {
      editTableList.value[editIndex] = cloneDeep(row);
    } else {
      editTableList.value.push(...parentDatasChils);
    }
  }
};

const handleBlurCheck = (event: any, row: any) => {
  checkValue(row, searchType.value);
  let tempFjys = row.fjYs ? row.fjYs : 0;
  row.wxhje = Decimal.sub(parseFloat(tempFjys), parseFloat(row.fsje)).toString();
  // let totalVal =
  // console.log(findParentNode(tempTableData.value, row));

  // 找到第二row菜单
  /*  let parentData: any[] = searchType.value === "DW" ? tableData.value.filter((item: any) => item.id === row.parentId) : editTableList.value.filter((item: any) => item.id === row.parentId);
  if (parentData[0].fjYs >= parentData[0].sumYs) {
  } else {
    ElMessage.error(`预算金额不超过${parentData[0].fjYs}万元`);
    row.fjYs = 0;
    let totalSum: any = 0;
    if (parentData.length !== 0) {
      editTableList.value.forEach((item: List) => {
        if (row.parentId === item.parentId) {
          if (!item.fjYs) {
            totalSum = Decimal.add(totalSum, 0);
          } else {
            totalSum = Decimal.add(totalSum, parseFloat(item.fjYs));
          }
        }
      });
      parentData[0].sumYs = totalSum;
    }
  } */
};

const inputChange = (event: any) => {
  event.target.value = "" + event.target.value;
  event.target.value =
    event.target.value
      .replace(/[^\d^.-]+/g, "") // 包括负号的匹配
      .replace(/^0+(\d)/, "$1")
      .replace(/^\./, "0.")
      .match(/^[-]?\d{0,12}(?:\.\d{0,6})?/)[0] || "";
};

const focusHandle = (event: any) => {
  if (event.target.value === "-") event.target.value = "";
};
</script>

<style scoped lang="less">
.ipt {
  :deep(.el-input__inner) {
    text-align: right;
  }
}
</style>
