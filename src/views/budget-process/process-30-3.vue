<template>
  <div class="accountsCT" v-loading="loading" element-loading-text="正在从服务器获取数据.....">
    <div class="title">
      <h2>超合同支付、收款方不一致</h2>
    </div>

    <el-table border :data="example" v-if="tableHeight" :height="tableHeight" :span-method="objectSpanMethod" style="width: 100%; margin-top: 20px" :header-cell-style="{ 'text-align': 'center' }" :cell-style="{ 'text-align': 'center' }">
      <el-table-column width="160" fixed prop="pspid" label="项目编码"></el-table-column>
      <el-table-column width="300" fixed prop="post1" label="项目名称"></el-table-column>
      <el-table-column width="160" prop="qkjxmlxmc" label="项目类型"></el-table-column>
      <el-table-column width="160" prop="qkjxmb_mc" label="项目包名称"></el-table-column>
      <el-table-column width="300" prop="qkjyjdw_name" label="一级单位"></el-table-column>
      <el-table-column width="300" prop="qkjejdw_name" label="二级单位"></el-table-column>
      <el-table-column width="160" prop="qkjgkbm_name" label="归口部门"></el-table-column>
      <el-table-column width="160" prop="erpztys" label="项目总预算"></el-table-column>
      <el-table-column width="160" prop="erpjdys" label="当年预算"></el-table-column>
      <el-table-column width="160" prop="ndzcb_hs" label="当年财务支出（不含税）"></el-table-column>
      <el-table-column width="160" prop="ndzc_hs" label="当年财务支出（含税）"></el-table-column>

      <el-table-column width="160" prop="zhtbh" label="经法合同编号"></el-table-column>
      <el-table-column label="合同信息">
        <el-table-column width="160" prop="zhtje" label="经法合同金额"></el-table-column>
        <el-table-column width="160" prop="lifnr_ht" label="(合同)供应商编码"></el-table-column>
        <el-table-column width="160" prop="lifnr_htname" label="供应商名称"></el-table-column>
      </el-table-column>
      <el-table-column label="付款申请单信息">
        <el-table-column width="160" prop="lifnr" label="收款方编码"></el-table-column>
        <el-table-column width="160" prop="lifnr_name" label="收款方名称"></el-table-column>
        <el-table-column width="160" prop="zhxmzfje" label="资金支付金额（合计）"></el-table-column>
      </el-table-column>
      <el-table-column width="160" prop="chtfkje" label="超合同付款金额"></el-table-column>
      <el-table-column width="160" label="收款方与合同不一致">
        <template #default="scope">
          <div v-if="scope.row.lifnr_ht == scope.row.lifnr">否</div>
          <div v-else>是</div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { defineComponent, reactive } from "vue";
import baseService from "@/service/baseService";
import { ElMessage } from "element-plus";
export default defineComponent({
  name: "/budget-process/process-30-3",
  setup() {
    return reactive({
      example: [],
      loading: false,
      tableHeight: "",
      heightNum: ""
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
      baseService.post("/process/process30/ct3", params).then((res) => {
        if (res.success == true) {
          this.loading = false;
          this.example = res.data;
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
.accountsCT {
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
