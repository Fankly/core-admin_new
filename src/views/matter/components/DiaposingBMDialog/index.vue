<template>
  <el-dialog v-loading="loading" custom-class="diaposing-bm-dialog" width="60%" top="10px" @open="handleOpenPage" :close-on-press-escape="false" :close-on-click-modal="false" :destroy-on-close="true" :show-close="true" v-model="isShowPage" :title="pageTitle" @close="handleClosePage">
    <vxe-table 
      ref="tableRef"
      :edit-config="{ trigger: 'click', mode: 'cell' }"
      @checkbox-change="selectChangeHandle"
      resizable
      row-id="dwId"
      :checkbox-config="{ showHeader: false, labelField: 'dwName', visibleMethod: isVisibleHandle, checkStrictly: false }"
      :tree-config="treeConfig"
      border
      :height="760"
      :data="tableData"
    >
      <vxe-column show-overflow="tooltip" type="checkbox" title="单位名称" width="280" tree-node></vxe-column>
      <vxe-column align="right" header-align="center" field="fjYs" title="事项预算金额（万元）" :edit-render="{}">
        <template #edit="{ row }">
          <el-input :oninput="(input: any) => inputChange(input)" style="width: 100%" @blur="(event: any) => handleBlurCheck(event, row)" maxlength="20" v-if="operationFlag === 'EDIT' && row.edit" v-model="row.fjYs"></el-input>
          <span v-else> {{ row.fjYs }}</span>
        </template>
      </vxe-column>
      <vxe-column align="right" header-align="center" field="lxje" title="事项立项金额（万元）"></vxe-column>
      <vxe-column align="right" header-align="center" field="fsje" title="事项发生金额（万元）"></vxe-column>
      <vxe-column align="right" header-align="center" field="wxhje" title="事项未消耗金额（万元）"></vxe-column>
      <vxe-column align="center" header-align="center" field="zdjxcs" title="自动建项次数"></vxe-column>
    </vxe-table>
    <template #title>
      <div class="header-operation">
        <el-button v-if="operationFlag === 'EDIT' && isShowButton" type="primary" plain @click="autoBuildHandle">自动建项 </el-button>
        <span class="el-dialog__title" v-else>{{ pageTitle }}</span>
      </div>
    </template>
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
  name: "DisposingBMDialog"
};
</script>

<script setup lang="ts">
import { reactive, ref, toRef, defineProps, defineEmits, computed } from "vue";
import { BaseMsgData, DialogData } from "@/views/matter/types/matterDecl";
import { getYssxFjDetail, yssxFjSave } from "@/api/matter/matterYsfj";
import { ElMessage, ElMessageBox } from "element-plus";
import { Decimal } from "decimal.js";
import { cloneDeep } from "lodash";
import { autoBuildPro, getBmFjDetail, yssxBmFjSave } from "@/api/matter/yssxBmFj";
import { getParentNode } from "@/utils/utils";
import { VxeTableEvents, VxeTableInstance, VxeTablePropTypes } from "vxe-table";

const props = defineProps<{
  dialogData: DialogData;
  baseMsgData: BaseMsgData;
}>();

const isShowButton = toRef(props.baseMsgData, "isShowButton");

const loading = ref(false);

const disabled = computed(() => loading.value);

const treeConfig = reactive<any>({
  lazy: true,
  hasChildField: "leaf",
  loadMethod({ row }) {
    return new Promise((resolve: any) => {
      const { id, dataType } = row;
      let params = {
        id: id,
        yssxId: selectedData.value.yssxId,
        specialorgid: specialOrgId.value
      };
      getBmFjDetail({
        ...params,
        dateType: dataType
      }).then((res) => {
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
      });
    });
  }
});

const tableRef = ref<VxeTableInstance>();
const isShowPage = toRef(props.dialogData, "isShowPage");
const pageTitle = toRef(props.dialogData, "title");
const specialOrgId = toRef(props.baseMsgData, "specialOrgId");
const tabType = toRef(props.baseMsgData, "tabType");
const selectedData = toRef(props.baseMsgData, "selectedData");
const operationFlag = toRef(props.baseMsgData, "operationFlag");
const searchType = toRef<any, any>(props.baseMsgData, "type");

const tableData = ref([]);
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

const selectChangeHandle: VxeTableEvents.CheckboxChange = ({ $table, row }) => {
  if (!$table.isTreeExpandByRow(row)) {
    $table.setTreeExpand(row, true);
  }
};

const isVisibleHandle = ({ row }: any) => {
  if (operationFlag.value === "EDIT") {
    return row.dataType !== "YJDW";
  }
  return false;
};

const autoBuildHandle = () => {
  const $table = tableRef.value;
  const records: any[] = $table?.getCheckboxRecords() as any[];
  const bmRec = records.filter((item: any) => item.dataType === "BM");
  if (bmRec.length === 0) {
    ElMessage.warning("请选择部门数据后,再进行自动建项");
    return;
  }
  ElMessageBox.confirm("是否根据选中数据进行自动建项", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  }).then(async () => {
    let tipsMsg: string[] = [];
    for (let i = 0; i < bmRec.length; i++) {
      if (!bmRec[i].id) {
        tipsMsg.push(records[i].dwName);
      }
    }
    if (tipsMsg.length !== 0) {
      ElMessage.warning(tipsMsg.join("，") + "：事项预算金额进行分解保存后，再进行自动建项！");
      return;
    }
    const bmId = bmRec.map((item: any) => item.id).join(",");
    const res = await autoBuildPro(bmId);
    if (res.success) {
      ElMessage.success("自动建项成功!");
      handleClosePage();
    } else {
      ElMessage.error(res.msg);
    }
  });
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
</script>

<style lang="less" scoped>
.ipt {
  :deep(.el-input__inner) {
    text-align: right;
  }
}
</style>
