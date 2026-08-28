<template>
  <div class="accounts28CT2" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <h2>物资整领整退、物资退库率高</h2>
    </div>

    <el-table row-key="row_id" id="crTable" :key="tableKey" border :data="example" v-if="tableHeight" :height="tableHeight" style="width: 100%; margin-top: 20px" :header-cell-style="{ 'text-align': 'center' }" :cell-style="{ 'text-align': 'center' }">
      <el-table-column show-overflow-tooltip :width="setWidth(item.prop)" v-for="(item, index) in dropCol" :key="item.prop" class-name="dropTableColumn" :prop="item.prop" :label="item.label" header-align="center" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
import { defineComponent, reactive } from "vue";
import baseService from "@/service/baseService";
import { ElMessage } from "element-plus";
import Sortable from "sortablejs";

export default defineComponent({
  name: "/budget-process/process-28-2",
  setup() {
    return reactive({
      example: [],
      tableKey: 0,
      loading: false,
      tableHeight: "",
      heightNum: "",
      dropCol: [
        {
          label: "项目编号",
          prop: "pspid"
        },
        {
          label: "项目名称",
          prop: "post1"
        },
        {
          label: "项目类型",
          prop: "qkjxmlxmc"
        },
        {
          label: "项目包名称",
          prop: "qkjxmb_mc"
        },
        {
          label: "一级单位",
          prop: "qkjyjdw_name"
        },
        {
          label: "二级单位",
          prop: "qkjejdw_name"
        },
        {
          label: "归口部门",
          prop: "qkjgkbm_name"
        },
        {
          label: "项目总预算",
          prop: "erpztys"
        },
        {
          label: "当年预算",
          prop: "erpjdys"
        },
        {
          label: "当年财务支出（不含税）",
          prop: "ndzcb_hs"
        },
        {
          label: "当年财务支出（含税）",
          prop: "ndzc_hs"
        },
        {
          label: "过账项目",
          prop: "budat"
        },
        {
          label: "SAP凭证编码",
          prop: "belnr"
        },
        {
          label: "行项目金额（借方正数、贷方负数）",
          prop: "shkzg"
        },
        {
          label: "批次",
          prop: "charg"
        },
        {
          label: "物料编码",
          prop: "matnr"
        },
        {
          label: "物料描述",
          prop: "maktx"
        },
        {
          label: "领用/退库数量",
          prop: "menge"
        },
        {
          label: "领用/退库金额（领用正数、退库负数）",
          prop: "wrbtr"
        },
        {
          label: "整领整退标识",
          prop: "wzzlzt"
        },
        {
          label: "物资累计领用金额",
          prop: "wzleylje_hs"
        },
        {
          label: "物资累计退库金额",
          prop: "wzljtkje_hs"
        },
        {
          label: "物资累计退库率=物资累计退库金额/（物资累计领用金额+物资累计退库金额）",
          prop: "jh_wztkl_je"
        }
      ]
    });
  },
  created() {
    this.loadData();
  },
  mounted() {
    this.heightNum = document.querySelector(".el-card").clientHeight;
    this.topHeight = document.querySelector(".title").clientHeight;
    this.setTableHeight();
  },
  methods: {
    setWidth(prop) {
      if (prop === "post1") {
        return 340;
      }
      return 180;
    },
    columnDrop() {
      const wrapperTr = document.getElementById("crTable").querySelector(".el-table__header-wrapper tr");
      const _this = this;
      this.sortable = Sortable.create(wrapperTr, {
        animation: 180,
        delay: 0,
        draggable: ".dropTableColumn",
        onEnd: (evt) => {
          const oldItem = _this.dropCol[evt.oldIndex];
          _this.dropCol.splice(evt.oldIndex, 1);
          _this.dropCol.splice(evt.newIndex, 0, oldItem);
          _this.tableKey += 1;
          this.$nextTick(() => {
            this.columnDrop();
          });
        }
      });
    },
    setTableHeight() {
      this.tableHeight = this.heightNum - this.topHeight - 90 + "px";
    },
    loadData() {
      this.loading = true;
      let pspid = this.$route.query.pspid;
      const params = {
        pspid: pspid,
        zyear: this.$route.query.zyear,
        zmonth: this.$route.query.zmonth
      };
      baseService.post("/process/process28/ct2", params).then((res) => {
        if (res.success == true) {
          this.loading = false;
          this.example = res.data;
          this.columnDrop();
        } else {
          this.loading = false;
          ElMessage({
            type: "error",
            message: res.msg
          });
        }
      });
    }
  }
});
</script>

<style lang="less" scoped>
.accounts28CT2 {
  padding: 10px;
  margin-bottom: 20px;

  .title {
    width: 100%;
    text-align: center;
    color: #00706b;

    h2 {
      font-size: 16px;
      margin: 0;
      margin-bottom: 20px;
    }
  }

  .el-switch__core {
    background-color: #ccc !important;
  }
}
</style>
