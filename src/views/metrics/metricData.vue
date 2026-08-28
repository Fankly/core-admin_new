<!-- 指标数据 -->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <proTable ref="proTableRef" @search="searchHandle" @reset="resetHandle" :data-callback="pageList" :request-api="searchDataHandle" :request-auto="true" :search-col="4" :columns="tableColumns" >
      <template #tableHeader="scope">
        <template v-for="(item, index) in btnList" :key="index">
          <el-button :disabled="!scope.isSelected && item.isSelected" type="primary" size="mini" plain @click="handlerBtn(item.label, scope.selectedList)">{{ item.value }}</el-button>
        </template>
      </template>
    </proTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>
<script lang="tsx">
export default {
  name: "/metrics/metricData"
};
</script>
<script setup lang="tsx">
import userDialog from "@/components/select/userDialog.vue"; //权限弹框
import proTable from "@/components/ProTable/index.vue"; //表格组件
import TreeSelect from "@/components/select/TreeSelectLazy.vue";
import { ref, reactive, onMounted, nextTick } from "vue";
import { getSubProtypeTree, getPublicData,getBizOrgTreeNoPermission } from "@/api/common"; //公共代码
import { xmIndicatorDataPage, xmIndicatorDataExport } from "@/api/metrics/index";
import { ElNotification, ElMessage } from "element-plus";

const loading = ref(false);
const isShowPage = ref(false); //未选择角色前不展示页面
const proTableRef = ref<any>();
const userDialogRef = ref(); // 用户角色
const userInfo = ref<any>(); //用户ID
const searchData = ref<any>({});
const packTypeList = ref<any>([]); //包类型
const indicatorList = ref<any>([]); //指标项
// 按钮
const btnList = ref<any>([{ label: "export", value: "导 出", isSelected: false }]);
// 查询选择框数据
const selectData: any = reactive({
  projectType: [],
  DwList: []
});
// 树形结构props类型
const treeProps = reactive({
  projectTypeProps: {
    children: "children",
    label: "name",
    // disabled: (data: any, node: any) => {
    //   return data.children.length != 0;
    // }
  },
  dwListProps: {
    children: "children",
    label: "name",
    isLeaf:'leaf'
  }
});
// 方法
onMounted(async () => {
  loading.value = true;
  userDialogRef.value.getUser();
});


// 获取项目类型
const getProjectData = () => {
  loading.value = true;
  getSubProtypeTree().then((res: any) => {
    loading.value = false;
    if (res.success) {
      selectData.projectType = res.data;
    } else {
      ElMessage({
        type: "error",
        message: res.msg
      });
    }
  });
};
const getDwData = () => {
  loading.value = true;
  getBizOrgTreeNoPermission('-1').then((res:any)=>{
    loading.value = false;
    if(res.success){
      // res.data[0].children=[]
      selectData.DwList=res.data
    }else{
      ElMessage.error(res.msg)
    }
  })
};

// 搜索
const searchHandle = () => {
  proTableRef.value?.clearSelection();
};
const proTypeRef=ref()
const proDwRef=ref()
//重置
const resetHandle = () => {
  proTypeRef.value.clearSelect();
  proDwRef.value.clearSelect();
  proTableRef.value?.clearSelection();
};
// 按钮点击事件
const handlerBtn = (val: any, selectedList: any) => {
  if (val == "export") {
    ElNotification({
      title: "温馨提示",
      message: "如果数据庞大会导致下载缓慢哦，请您耐心等待！",
      type: "info",
      duration: 3000
    });
    loading.value = true;
    xmIndicatorDataExport(searchData.value).then((res: any) => {
      const blob = res;
      let dom = document.createElement("a");
      let url = window.URL.createObjectURL(blob);
      dom.href = url;
      // 获取文件名
      let filename = "指标数据.xlsx";
      if (res.headers && res.headers["content-disposition"]) {
        filename = res.headers["content-disposition"].split(";")[1].split("=")[1];
      }
      dom.download = `${decodeURI(decodeURI(filename))}`;
      document.body.appendChild(dom);
      dom.click();
      document.body.removeChild(dom);
      window.URL.revokeObjectURL(url);
      loading.value = false;
    });
  }
};
// 获取公共代码
const publicCode = async () => {
  let res = await getPublicData("XMBTYPE_COM");
  if (res.success) {
    packTypeList.value.push(...res.data);
  }
  let item = await getPublicData("INDICATOR_COM");
  if (item.success) {
    indicatorList.value.push(...item.data);
  }
};

const tableColumns = reactive<any>([
  { type: "selection", width: 50 },
  { type: "index", width: 50, label: "序号" },
  { prop: "nd", label: "年度", width: "80" },
  { prop: "yd", label: "月度", width: "80" },
  {
    prop: "dwList",
    label: "单位",
    search: {
      order: 0,
      render: () => {
        return (
          <TreeSelect lazy={true}   ref={proDwRef} check-strictly={true} onClearData={resetDwData} is-child-node={false} data={selectData.DwList} onSelectChange={(value: any) => selectedDwData(value, "dwList")}  is-leaf={false} data-type="id" default-props={treeProps.dwListProps} node-key="id" />
        );
      }
    },
    isShow: false
  },
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
    prop: "proTypeList",
    label: "项目类型",
    search: {
      order: 3,
      render: () => {
        return (
          <TreeSelect
            onClearData={resetProTypeData}
            is-child-node={false}
            data={selectData.projectType}
            onSelectChange={(value: any) => selectedData(value, "proTypeList")}
            is-leaf={false}
            ref={proTypeRef}
            data-type="middleId"
            default-props={treeProps.projectTypeProps}
            node-key="middleId"
          />
        );
      }
    },
    isShow: false
  },
  {
    prop: "packTypeList",
    label: "包类型",
    isShow: false,
    search: { el: "select", order: 4, props: { multiple: true, collapseTags: true } },
    enum: packTypeList.value,
    fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "dataTypeList",
    label: "数据类型",
    isShow: false,
    search: { el: "select", order: 5, props: { multiple: true, collapseTags: true } },
    enum: [
      { label: "单位", value: "dw" },
      { label: "部门", value: "bm" }
    ]
    // fieldNames: { label: "name", value: "code" }
  },
  {
    prop: "indicatorCodeList",
    label: "指标项",
    isShow: false,
    search: { el: "select", order: 6, props: { multiple: true, collapseTags: true } },
    enum: indicatorList.value,
    fieldNames: { label: "name", value: "code" }
  },
  { prop: "proType", label: "项目类型",  },
  { prop: "packType", label: "包类型", width: "180" },
  { prop: "dw", label: "单位"},
  { prop: "cbzx", label: "成本中心" },
  { prop: "dataType", label: "数据类型", },
  // { prop: "indicatorCode", label: "指标编码", width: "120" },
  { prop: "indicatorName", label: "指标项", width: "120" },
  { prop: "indicatorValue", label: "指标值", width: "120" },
  { prop: "updateTime", label: "更新时间", width: "150" }
]);

// 数据处理回调
const pageList = (val: any) => {
  loading.value = false;
  return val;
};
// 列表查询回调
const searchDataHandle = async (params: any) => {
  loading.value = true;
  searchData.value = {};
  if(params.yd && !params.nd){
    return ElMessage.warning('请选择年度')
  }
  for (const key in params) {
    if (!["limit", "page"].includes(key)) {
      searchData.value[key] = params[key];
    }
  }
  return xmIndicatorDataPage(params);
};
// 获取选择的项目类型合集
const selectedData = (value: any, flag: string) => {
  proTableRef.value.searchParam[flag] = value;
};
// 清空项目类型
const resetProTypeData = () => {
  const $table = proTableRef.value;
  if (Array.isArray($table.searchParam.proTypeList)) {
    $table.searchParam.proTypeList.length = 0;
  } else {
    $table.searchParam.proTypeList = "";
  }
};
// 获取选择的单位合集
const selectedDwData = (value: any, flag: string) => {
  proTableRef.value.searchParam[flag] = value;
};
// 清空单位
const resetDwData = () => {
  const $table = proTableRef.value;
  if (Array.isArray($table.searchParam.dwList)) {
    $table.searchParam.dwList.length = 0;
  } else {
    $table.searchParam.dwList = "";
  }
};


// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery;
    const userMsg = { ...userDialogRef.value.userMsg };
    userInfo.value = userMsg.specialOrgId;
    if (isQuery) {
      await publicCode();
      await getProjectData();
      await getDwData();
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
  width: 100%;
  height: 100%;
  padding: 10px;
}
</style>
