<!-- 项目明细 -->
<template>
  <div>
    <vxe-modal resize show-zoom fullscreen  v-model="isShowModel" :destroy-on-close="true" title="项目明细" :width="1200" :close-on-press-escape="false" @close="closeHandle">
      <proTable row-key="id" ref="proTableRef" sortable :search-col="4" :data-callback="pageList" :request-api="pageMeeting" :request-auto="true" :columns="tableColumns" >
        <template #tableHeader>
          <el-button type="primary" size="mini" plain @click="handlerExport">导 出</el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: "projectData"
};
</script>
<script setup lang="ts">
import { ref, defineProps, defineEmits, defineExpose, reactive, nextTick } from "vue";
import { ElMessageBox, ElMessage, ElNotification } from "element-plus";
import { h } from "vue";
import { yksjtjPageXmInfo,exportXmInfo } from "@/api/metrics/index";
import proTable from "@/components/ProTable/index.vue"; //表格组件
import { ColumnProps } from "@/components/ProTable/interface";
import { formatNumValue } from "@/utils/utils";

//接收父组件传参
const props = defineProps({
  specialorgid: {
    type: String,
    default: ""
  }
});

const isShowModel = ref(false);
const treeModalRef = ref();
const proTableRef = ref();
const dataList = ref<[]>([]); //单位数据
const oldlist = ref<any>([]); //单位数据深拷贝
const formParams=ref<any>({})


// 数据处理回调
const pageList = (val: any) => {
  return val;
};
// 接口调用
const pageMeeting = (params: any) => {
  params={...formParams.value,...params}
  return yksjtjPageXmInfo(params)
}
// 导出
const handlerExport = () => {
  ElNotification({
    title: "温馨提示",
    message: "如果数据庞大会导致下载缓慢哦，请您耐心等待！",
    type: "info",
    duration: 3000
  });
  const api: any = ''
  exportXmInfo(formParams.value)
    .then((res: any) => {
      const blob = res;
      let dom = document.createElement("a");
      let url = window.URL.createObjectURL(blob);
      dom.href = url;
      // 获取文件名
      let filename = `项目明细.xlsx`;
      dom.download = `${decodeURI(decodeURI(filename))}`;
      document.body.appendChild(dom);
      dom.click();
      document.body.removeChild(dom);
      window.URL.revokeObjectURL(url);
    })
    .catch((error: any) => {
      ElMessage.error(error);
    });
};
// 关闭单位弹窗
const closeHandle = () => {
  isShowModel.value = false;
};
// 列表项
const tableColumns = reactive<ColumnProps<any>[]>([
  { type: "index", width: 50, label: "序号" },
  { prop: "xmmc", label: "项目名称", width: "130" },
  { prop: "gwxmbm", label: "国网项目编码", width: "200" },
  { prop: "pro_type", label: "项目类型", width: "200" },
  { prop: "xmb_name", label: "项目包名称", width: "200" },
  { prop: "jddetype_type", label: "项目包类型", width: "200" },
  { prop: "ctmc", label: "重点投向", width: "200" },
  { prop: "zyssxmc", label: "预算事项", width: "200" },
  { prop: "sxgkbm", label: "事项归口部门", width: "200" },
  { prop: "gkbm", label: "归口部门", width: "200" },
  { prop: "yjdw", label: "一级单位", width: "200" },
  { prop: "ejdw", label: "二级单位", width: "200" },
  { prop: "fzrbh", label: "实施部门", width: "200" },
  {
    prop: "dntzjh",
    label: "当年投资计划（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.dntzjh;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "year_invest_tax",
    label: "当年预算（含税）（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.year_invest_tax;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "dnys",
    label: "当年预算（不含税）（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.dnys;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "dncwzc",
    label: "当年结算（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.dncwzc;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "dnsj",
    label: "当年税金（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.dnsj;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "dnwcz",
    label: "当年结算（含税）（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.dnwcz;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "ndyswcl",
    label: "当年完成率（%）",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.ndyswcl;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 2);
    }
  },
  { prop: "xmxz", label: "项目性质", width: "200" },
  { prop: "pre_arr_status", label: "是否预安排项目", width: "200" },
  {
    prop: "yap_ys",
    label: "预安排预算不含税（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.yap_ys;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  { prop: "zyfjftrtjfw", label: "研发经费投入统计范围", width: "200" },
  { prop: "zyqcgbm", label: "预期成果", width: "200" },
  {
    prop: "jryftrbfb",
    label: "计入研发投入百分比",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.jryftrbfb;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 2);
    }
  },
  { prop: "bfbjsfssm", label: "百分比计算方式说明", width: "200" },
  { prop: "sfaqsc", label: "是否安全生产", width: "200" },
  { prop: "aqscfylx", label: "安全生产费用类型", width: "200" },
  { prop: "saptime", label: "立项时间", width: "200" },
  { prop: "gbtime", label: "关闭时间", width: "200" },
  { prop: "yjfl", label: "一级分类", width: "200" },
  { prop: "ejfl", label: "二级分类	", width: "200" },
  { prop: "sjfl", label: "三级分类", width: "200" },
  { prop: "cnx1", label: "承诺项", width: "200" },
  {
    prop: "ztzjh",
    label: "总投资计划（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.ztzjh;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "all_invest_tax",
    label: "总预算（含税）（万元））",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.all_invest_tax;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "yqljtzjh",
    label: "累计投资计划（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.yqljtzjh;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "amount",
    label: "总预算（不含税）（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.amount;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "ljfsz",
    label: "累计结算（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.ljfsz;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "ljsj",
    label: "累计税金（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.ljsj;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "ljwcz",
    label: "累计结算（含税）（万元）",
    align: "right",
    headerAlign: "center",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.ljwcz;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 4);
    }
  },
  {
    prop: "xmljwcl",
    label: "累计完成率（%）",
    width: "200",
    render: (scope: any) => {
      const value = scope.row.xmljwcl;
      if (value === undefined || value === null) return "-";
      return formatNumValue(value, 2);
    }
  },
  { prop: "ispackname", label: "单体/打捆", width: "200" }
]);

// 子组件暴露方法到父组件
defineExpose({
  isShowModel,
  pageMeeting,
  formParams
});
</script>