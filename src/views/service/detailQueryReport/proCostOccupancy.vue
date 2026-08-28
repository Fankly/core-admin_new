<!-- 项目成本占用明细查询报表 -->
<template>
  <div class="container" v-show="isShowPage">
    <otherTable @reset="reset" ref="otherTableRef" :columnsTable="columns" :tableType="'2'" :file-name="'项目成本占用明细查询报表'" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: "/service/detailQueryReport/proCostOccupancy"
};
</script>
<script setup lang="tsx">
import { onMounted, ref, reactive } from "vue";
import { getDeptData, getYjdwFromCm, getEjdwByYjdw, } from "@/api/common"; //公共代码
import userDialog from "@/components/select/userDialog.vue"; //权限弹框
import otherTable from "@/views/service/detailQueryReport/components/table.vue"; //表格组件
import { formatNumValue } from "@/utils/utils";
import TreeSelect from "@/components/select/TreeSelectLazy.vue";


const userDialogRef = ref();// 用户角色
const isShowPage = ref(false); //未选择角色前不展示页面
const otherTableRef = ref()
const levelOne = ref<any>([]); // 一级单位
const levelTwo = ref<any>([]); // 二级单位
const cbzxList = ref<any>([]); // 成本中心
const proTypeRef = ref()
// 树形结构props类型
const treeProps = reactive({
  projectTypeProps: {
    children: "children",
    label: "text",
  },
});
// 方法
onMounted(async () => {
  await initParamLists()
  await userDialogRef.value.getUser();
});

//公共代码
const initParamLists = async () => {
  levelOne.value.length = 0; //清空单位
  // 获取公共代码 一级单位
  const res = await getYjdwFromCm();
  if (res.success && res.data.length !== 0) {
    levelOne.value.push(...res.data);
  }
};
// 选择一级单位联动二级单位
const selectChange = (val: any) => {
  const params = otherTableRef.value.proTableRef?.searchParam;
  params.ejdw = "";
  resetProTypeData()
  levelTwo.value.length = 0;
  cbzxList.value.length = 0;
  proTypeRef.value.clearSelect();
  getEjdwByYjdw(val).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      levelTwo.value.push(...res.data);
    }
  });
};

// 选择二级单位联动成本中心
const changyjdw = (val: any) => {
  resetProTypeData()
  cbzxList.value.length = 0
  proTypeRef.value.clearSelect();
  const paramsData = {
    parentCode: "CBZX",
    rootCode: val,
    objId: -1,
    level: 0
  };
  getDeptData(paramsData).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      cbzxList.value.push(...res.data);
    }
  });
}

const reset = (val: any) => {
  if (val.type == "RESET") {
    levelTwo.value.length = 0;
    cbzxList.value.length = 0;
    proTypeRef.value?.clearSelect();
  }
}

// 获取选择的项目类型合集
const selectedData = (value: any, flag: string) => {
  otherTableRef.value.proTableRef.searchParam[flag] = value;
};
// 清空项目类型
const resetProTypeData = () => {
  const $table = otherTableRef.value.proTableRef;
  if (Array.isArray($table.searchParam.cbzxList)) {
    $table.searchParam.cbzxList.length = 0;
  } else {
    $table.searchParam.cbzxList = "";
  }
};

const columns = reactive<any>([
  { type: "index", width: 50, label: "序号" },
  { prop: "nd", label: "年度", width: "100", },
  { prop: "yd", label: "月度", width: "80" },
  {
    prop: "nd",
    label: "年度",
    isShow: false,
    search: {
      el: "date-picker",
      order: 1,
      props: {
        type: "year",
        valueFormat: "YYYY",
        clearable: true
      }
    }
  },
  {
    prop: "yd",
    label: "月度",
    search: { el: "select", order: 2 },
    enum: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
      { value: "5", label: "5" },
      { value: "6", label: "6" },
      { value: "7", label: "7" },
      { value: "8", label: "8" },
      { value: "9", label: "9" },
      { value: "10", label: "10" },
      { value: "11", label: "11" },
      { value: "12", label: "12" }
    ],
    isShow: false
  },
  {
    prop: "cnxbm",
    label: "承诺项编码",
    width: "180",
    search: {
      el: 'input',
      order: 3,
      props: {
        maxlength: 20,
        showWordLimit: true,
        inputStyle: { paddingRight: '80px' }
      }
    }
  },
  { prop: "cnxmc", label: "承诺项名称" },
  {
    prop: "yjdw",
    label: "一级单位",
    isShow: false,
    search: { el: "select", props: { onChange: selectChange }, order: 4 },
    enum: levelOne.value,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "ejdw",
    label: "二级单位",
    isShow: false,
    search: { el: "select", props: { onChange: changyjdw }, order: 5 },
    enum: levelTwo.value,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "cbzxList",
    label: "成本中心",
    isShow: false,
    search: {
      order: 6,
      render: () => {
        return (
          <TreeSelect
            onClearData={resetProTypeData}
            is-child-node={false}
            data={cbzxList.value}
            onSelectChange={(value: any) => selectedData(value, "cbzxList")}
            is-leaf={false}
            ref={proTypeRef}
            data-type="objCode"
            default-props={treeProps.projectTypeProps}
            node-key="objCode"
          />
        );
      }
    },
  },
  { prop: "yjdwName", label: "一级单位", },
  { prop: "ejdwName", label: "二级单位" },
  { prop: "cbzxName", label: "成本中心" },
  {
    prop: "ysje",
    label: "完成值(万元)",
    width: "180",
    align: "right",
    headerAlign: "center",
    render: (scope: any) => {
      const value = scope.row.ysje;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 6);
    }
  },
]);

// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery;
    if (isQuery) {
      isShowPage.value = true;
    }
  } catch (e) {
    console.error(e);
  }
};

</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  position: relative;
}
</style>