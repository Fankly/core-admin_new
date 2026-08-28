<template>
  <div class="container" v-loading="loading">
    <div class="container-btn">
      <el-button @click="exportDataHandle" size="mini" type="info">导 出</el-button>
    </div>
    <div class="container-table">
      <div class="table">
        <el-table :data="tableData" :header-cell-style="{ 'text-align': 'center' }" border height="100%">
          <template v-for="item in tableColumn" :key="item.prop">
            <el-table-column :width="140" :formatter="formatHandle" :align="setTableCenter(item.prop)" :show-overflow-tooltip="true" :prop="item.prop" :label="item.label"></el-table-column>
          </template>
        </el-table>
      </div>
      <div class="pagination">
        <el-pagination :current-page="page.page" background :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="limitChangeHandle" @current-change="pageChangeHandle"></el-pagination>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "/budget-process/monitorDetails"
};
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { Decimal } from "decimal.js";
import { exportDetail, searchDetail } from "@/api/process";
import { ElMessage } from "element-plus";
import { useStore } from "vuex";

const store = useStore();
/*const specialorgid = ref(store.getters.getPenetrateParams.specialorgid);
const dataList = ref(store.getters.getPenetrateParams.data);
const nd = ref(store.getters.getPenetrateParams.nd);*/
const proParams = ref({
  nd: "",
  data: [],
  specialorgid: ""
});
const specialorgid = ref("");
const dataList = ref([]);
const nd = ref("");
onMounted(() => {
  proParams.value = store.getters.getPenetrateParams.nd ? store.getters.getPenetrateParams : JSON.parse(sessionStorage.getItem("PenetrateParams") as string);
  nd.value = proParams.value.nd;
  specialorgid.value = proParams.value.specialorgid;
  dataList.value = proParams.value.data;
  searchHandle();
});

const loading = ref(true);
const exportDataHandle = () => {
  exportDetail({
    page: page.page,
    limit: page.limit,
    specialorgid: specialorgid.value,
    nd: nd.value,
    data: dataList.value
  }).then((res: any) => {
    const blob = res;
    let dom = document.createElement("a");
    let url = window.URL.createObjectURL(blob);
    dom.href = url;
    // 获取文件名
    let filename = res.headers["content-disposition"].split(";")[1].split("=")[1];
    dom.download = `${decodeURI(decodeURI(filename))}`;
    document.body.appendChild(dom);
    dom.click();
    document.body.removeChild(dom);
    window.URL.revokeObjectURL(url);
  });
};

const searchHandle = () => {
  loading.value = true;
  searchDetail({
    page: page.page,
    limit: page.limit,
    specialorgid: specialorgid.value,
    nd: nd.value,
    data: dataList.value
  }).then((res: any) => {
    if (res.success) {
      loading.value = false;
      page.total = res.data.total;
      tableData.value = res.data.records;
    } else {
      loading.value = false;
      ElMessage({
        type: "error",
        message: res.msg
      });
    }
  });
};
// 表格数据
const tableData: any = ref([]);

// formatHandle 格式化数据
const formatHandle = (row: any, column: any) => {
  if (column.property === "gll") {
    return new Decimal(row.gll).toFixed(2);
  }
  if (column.property === "je" || column.property === "yglxmje" || column.property === "yrzcb" || column.property === "dnys" || column.property === "dnrzcb" || column.property === "ljrzcb") {
    if (row[column.property] === null || row[column.property] === undefined) {
      return "0.000000";
    }
    return new Decimal(row[column.property]).toFixed(6);
  }
  return row[column.property];
};

watch(
  () => store.state.penetrateParams,
  (newVal) => {
    specialorgid.value = newVal.specialorgid;
    dataList.value = newVal.data;
    nd.value = newVal.nd;
    searchHandle();
  },
  {
    deep: true
  }
);

// 表格数据设置
const tableColumn = reactive([
  {
    label: "事项名称",
    prop: "yssxmc",
    hidden: false
  },
  {
    label: "预算事项编码",
    prop: "yssxbm",
    hidden: false
  },
  {
    label: "预安排",
    prop: "isYap",
    hidden: false
  },
  {
    label: "预算类别",
    prop: "yslb",
    hidden: false
  },
  {
    label: "预算立项辞条",
    prop: "yslxct",
    hidden: false
  },
  {
    label: "事项归口部门",
    prop: "sxgkbm",
    hidden: false
  },
  {
    label: "金额(万元)",
    prop: "je",
    hidden: false
  },
  {
    label: "项目名称",
    prop: "xmmc",
    hidden: false
  },
  {
    label: "国网项目编码",
    prop: "gwxmbm",
    hidden: false
  },
  {
    label: "项目类型",
    prop: "xmlx",
    hidden: false
  },
  {
    label: "项目包名称",
    prop: "xmbmc",
    hidden: false
  },
  {
    label: "年度",
    prop: "nd",
    hidden: false
  },
  {
    label: "一级单位",
    prop: "yjdw",
    hidden: false
  },
  {
    label: "二级单位",
    prop: "ejdw",
    hidden: false
  },
  {
    label: "归口部门",
    prop: "gkbm",
    hidden: false
  },
  {
    label: "当年预算(万元)",
    prop: "dnys",
    hidden: false
  },
  {
    label: "项目性质",
    prop: "xmxz",
    hidden: false
  },
  {
    label: "立项时间",
    prop: "lxsj",
    hidden: false
  },
  {
    label: "一级分类",
    prop: "yjfl",
    hidden: false
  },
  {
    label: "二级分类",
    prop: "ejfl",
    hidden: false
  },
  {
    label: "三级分类",
    prop: "sjfl",
    hidden: false
  },
  {
    label: "当年入账成本(万元)",
    prop: "dnrzcb",
    hidden: false
  },
  {
    label: "累计入账成本(万元)",
    prop: "ljrzcb",
    hidden: false
  }
]);

// 设置表格居中
const setTableCenter = (prop: string) => {
  const centerArr = ["nd", "isYap", "gkbm", "gll", "yglxmsl", "yssxbm", "yslb", "yslxct", "sxgkbm", "xmmc", "gwxmbm", "xmlx", "xmbmc", "yjdw", "ejdw", "xmxz", "lxsj", "yjfl", "ejfl", "sjfl"];
  const rightArr = ["je", "yglxmje", "yrzcb", "dnys", "dnrzcb", "ljrzcb"];
  if (centerArr.includes(prop)) {
    return "center";
  } else if (rightArr.includes(prop)) {
    return "right";
  } else {
    return "left";
  }
};

// 分页
const page = reactive({
  page: 1,
  limit: 10,
  total: 0
});

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  searchHandle();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  searchHandle();
};
</script>

<style lang="less" scoped>
.container {
  width: 100%;
  height: calc(100vh - 146px);
  padding: 10px;

  &-btn {
    height: 28px;
    margin: 10px 0 15px 0;
  }

  &-table {
    height: calc(100% - 40px);

    .table {
      height: calc(100% - 40px);
    }

    .pagination {
      width: 100%;
      height: 28px;

      .el-pagination {
        padding: 0;
        margin: 15px 0 10px 0;
      }
    }
  }
}
</style>
