<template>
  <vxe-modal :loading="loading" @close="closeHandle" :destroy-on-close="true" :width="modalWidth" :height="modalHeight" :show-footer="false" @show="showHandle" show-zoom resize title="可用值明细" position="center" v-model="isShowModal" class-name="custom-modal">
    <div class="container">
      <div class="top">
        <div class="info">
          <span class="highlight">
            单位: <span>{{ showDwName }}</span>
          </span>
          <span class="highlight">
            预算科目: <span>{{ props.initParams.yskmName }}</span>
          </span>
          <span class="highlight">
            查询期间:<span>{{ props.initParams.startTime }} 至 {{ props.initParams.endTime }}</span>
          </span>
          <a href="javascript:void(0)" class="export-button" @click="exportHandle">导 出</a>
        </div>
        <div class="erp-summary">
          <span>ERP费用消耗明细: {{ formatNumValue(erpfsz, 2) }} 万元</span>
        </div>
      </div>
      <div class="main">
        <div class="table">
          <vxe-table header-align="center" :row-style="rowStyle" :row-config="{ height: 32 }" :show-overflow="true" resizable align="center" height="100%" :data="tableData" border stripe>
            <vxe-column width="80" title="序号"></vxe-column>
            <vxe-column field="gwxmbm" width="140" title="项目编码"></vxe-column>
            <vxe-column field="lxsj" width="140" title="立项日期"></vxe-column>
            <vxe-column header-align="center" :formatter="formatterHandle" align="right" field="xmys" width="140" title="项目预算(万元)"></vxe-column>
            <vxe-column header-align="center" align="right" field="djys" width="140" title="冻结预算(万元)">
              <template #default="{ row }">
                <span style="color: red">
                  {{ row["djys"] }}
                </span>
              </template>
            </vxe-column>
            <vxe-column header-align="center" :formatter="formatterHandle" align="right" field="fsz" width="140" title="发生值(万元)"></vxe-column>
            <vxe-column field="applyCenterName" width="260" title="成本中心名称"></vxe-column>
            <vxe-column field="applyCenter" width="140" title="成本中心编码"></vxe-column>
            <vxe-column field="lrzx" width="140" title="利润中心"></vxe-column>
            <vxe-column field="sjfl" width="140" title="三级分类"></vxe-column>
            <vxe-column field="xmbName" width="160" title="项目包名称"></vxe-column>
            <vxe-column field="zt" width="140" title="状态"></vxe-column>
          </vxe-table>
        </div>
        <div class="page">
          <el-pagination :current-page="page.current" background align="center" :page-sizes="[10, 20, 50, 100, 500]" :page-size="page.limit" :total="parseInt(page.total + '')" layout="total, sizes, prev, pager, next, jumper" @size-change="pageChangeHandle" @current-change="limitChangeHandle">
          </el-pagination>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: "/standardCost/components/DetailView"
};
</script>

<script setup lang="ts">
import { CtParams, exportCtData, getctData } from "@/api/fy/search";
import { formatNumValue } from "@/utils/utils";
import { Decimal } from "decimal.js";
import { ElMessage } from "element-plus";
import { ref, defineExpose, defineProps, defineEmits, reactive, computed } from "vue";
import { VxeTablePropTypes } from "vxe-table";

export interface Params {
  dwId: string;
  startTime: string;
  endTime: string;
  yskmName: string;
  id: string;
  fieldId: string | null;
}

interface Props {
  initParams: Params;
}

const props = defineProps<Props>();
const emit = defineEmits(["showModal", "closeModal"]);

const modalWidth = "70%";
const modalHeight = 820;

const dwName = ref("");

const showDwName = computed(() => dwName.value);

const isShowModal = ref(false);
const loading = ref(false);
const tableData = ref([]);

const erpfsz = ref("0");

const page = reactive({
  total: 0,
  limit: 20,
  page: 20,
  current: "1"
});

const exportHandle = () => {
  let params: CtParams = {
    startTime: props.initParams.startTime,
    endTime: props.initParams.endTime,
    id: props.initParams.id,
    dwId: props.initParams.dwId,
    fieldId: props.initParams.fieldId,
    current: page.current,
    size: page.page
  };
  exportCtData(params).then((res: any) => {
    loading.value = true;
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
    loading.value = false;
  });
};

const formatterHandle = ({ column, cellValue }: any) => {
  if (typeof cellValue === "undefined" || cellValue === null || cellValue === "") return "-";
  return new Decimal(cellValue).toFixed(2);
};

const rowStyle: VxeTablePropTypes.RowStyle<any> = ({ row }) => {
  const gwxmbm = row.gwxmbm as string;
  if (gwxmbm.includes("合计")) {
    return {
      fontWeight: 700
    };
  }
};

const showHandle = () => {
  initParams();
  emit("showModal");
};

const closeHandle = () => {
  isShowModal.value = false;
  emit("closeModal");
};

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum;
  initParams();
};
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1;
  page.limit = currentLimitNum;
  initParams();
};

const initParams = async () => {
  loading.value = true;
  let params: CtParams = {
    startTime: props.initParams.startTime,
    endTime: props.initParams.endTime,
    id: props.initParams.id,
    dwId: props.initParams.dwId,
    fieldId: props.initParams.fieldId,
    current: page.current,
    size: page.page
  };
  let res = await getctData(params);
  if (res.success && res.data) {
    erpfsz.value = res.data.erpfsz;
    tableData.value = res.data.mxLists?.records;
    page.total = res.data.mxLists.total;
    dwName.value = res.data.searchDwName;
    loading.value = false;
  } else {
    loading.value = false;
    ElMessage.error(res.msg);
  }
};

defineExpose({
  isShowModal
});
</script>

<style scoped lang="less">
.custom-modal {
  --vxe-modal-border-radius: 8px;
  --vxe-modal-box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.container {
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  color: #333;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;

  .main {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    .table {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }
  }
  .top {
    min-height: 0;
    min-width: 0;
    .erp-summary {
      font-size: 16px;
      margin: 10px 0;
      padding: 15px;
      background-color: #e8f5e9;
      border-left: 5px solid #28a745;
      border-radius: 5px;
      color: #2e7d32;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 0;
      min-width: 0;
    }
    .info {
      font-size: 16px;
      margin-bottom: 10px;
      padding: 15px;
      background-color: #f4f4f4;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      min-height: 0;
      min-width: 0;

      span {
        display: inline-block;
        font-size: 14px;
        color: #555;
        padding: 5px 10px;
        background-color: #e9ecef;
        border-radius: 5px;
        min-height: 0;
        min-width: 0;
      }

      .highlight {
        min-height: 0;
        min-width: 0;
        font-weight: bold;
        color: #212529;
      }

      .export-button {
        display: inline-block;
        padding: 8px 16px;
        font-size: 14px;
        color: #fff;
        background-color: #28a745;
        text-decoration: none;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: background-color 0.3s ease, transform 0.2s ease;
        align-self: center;
      }
      .export-button:hover {
        background-color: #218838;
        transform: translateY(-2px);
      }
    }
  }
  .status {
    font-weight: bold;
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
  }

  .status.completed {
    background-color: #4caf50;
  }
  .status.in-progress {
    background-color: #ff9800;
  }
}
</style>
