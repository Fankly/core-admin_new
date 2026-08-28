<template>
  <userDialog ref="userDialog" @loadCompany="loadCompany"></userDialog>
  <div v-loading="loading" v-if="isShow" class="ImplementationProgress">
    <div class="tabs">
      <div class="fatherBox box-1" @click="changeColor('box-1')">
        <div class="box-right"></div>
        总览
      </div>

      <div class="fatherBox box-2" @click="changeColor('box-2')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        储备与立项
      </div>

      <div class="fatherBox box-3" @click="changeColor('box-3')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        招投标
      </div>

      <div class="fatherBox box-4" @click="changeColor('box-4')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        合同签订
      </div>

      <div class="fatherBox box-5" @click="changeColor('box-5')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        项目实施
      </div>

      <div class="fatherBox box-6" @click="changeColor('box-6')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        项目审计
      </div>

      <div class="fatherBox box-7" @click="changeColor('box-7')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        结算与支付
      </div>

      <div class="fatherBox box-8" @click="changeColor('box-8')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        决算与增资
      </div>

      <div class="fatherBox box-9" @click="changeColor('box-9')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        项目关闭
      </div>
    </div>

    <overView :dataObj="dataObj" v-if="this.temShow === 'box-1'"></overView>
    <reserveEntry :dataObj="dataObj" v-if="this.temShow === 'box-2'"></reserveEntry>
    <Bidding :dataObj="dataObj" v-if="this.temShow === 'box-3'"></Bidding>
    <Contract :dataObj="dataObj" v-if="this.temShow === 'box-4'"></Contract>
    <projectImplementation :dataObj="dataObj" v-if="this.temShow === 'box-5'"></projectImplementation>
    <projectAudit :dataObj="dataObj" v-if="this.temShow === 'box-6'"></projectAudit>
    <settlementCapital :dataObj="dataObj" v-if="this.temShow === 'box-7'"></settlementCapital>
    <capital-increase :dataObj="dataObj" v-if="this.temShow === 'box-8'"></capital-increase>
    <pro-close :dataObj="dataObj" v-if="this.temShow === 'box-9'"></pro-close>
  </div>
</template>

<script>
import { defineComponent, nextTick, reactive } from "vue";
import overView from "@/views/budget-process/components/overview.vue";
import reserveEntry from "@/views/budget-process/components/reserveEntry.vue";
import Bidding from "@/views/budget-process/components/Bidding.vue";
import Contract from "@/views/budget-process/components/Contract.vue";
import projectImplementation from "@/views/budget-process/components/projectImplementation.vue";
import projectAudit from "@/views/budget-process/components/projectAudit.vue";
import settlementCapital from "@/views/budget-process/components/settlementCapital.vue";
import CapitalIncrease from "@/views/budget-process/components/capitalIncrease.vue";
import ProClose from "@/views/budget-process/components/proClose.vue";
import { ElMessage } from "element-plus";
import userDialog from "@/components/select/userDialog.vue";
import baseService from "@/service/baseService";

export default defineComponent({
  name: "/budget-process/04-monitor/visualOverview",
  components: {
    userDialog,
    ProClose,
    CapitalIncrease,
    Contract,
    Bidding,
    overView,
    reserveEntry,
    projectImplementation,
    projectAudit,
    settlementCapital
  },
  setup() {
    return reactive({
      temShow: "",
      isShow: false,
      loading: false,
      dataObj: {}
    });
  },
  mounted() {
    this.loading = true;
    this.$refs.userDialog.getUser(this.userId, this.userCode);
    this.getData();
  },
  methods: {
    getData() {
      this.loading = true;
      baseService.get("/testView/getData?code=ZLYS_CSSJ").then((res) => {
        if (res.success) {
          this.loading = false;
          this.dataObj = res.data;
        } else {
          this.ElMessage({
            type: "error",
            message: res.msg
          });
        }
      });
    },
    loadCompany() {
      this.loading = false;
      this.specialorgid = parseInt(this.$refs.userDialog.specialorgid);
      this.isShow = true;
      if (this.$refs.userDialog.isQuery) {
        nextTick(() => {
          this.changeColor("box-1");
        });
      }
    },
    changeColor(name) {
      //选中元素的样式
      this.temShow = name;
      let box = document.querySelector(`.${name}`);
      box.classList.add("publicStyle");

      let rightSon = box.querySelector(".box-right");
      rightSon.classList.add("right");

      if (box.querySelectorAll(".box-left").length > 0) {
        box.querySelector(".box-left").classList.add("left");
      }

      //除选中元素外的其他元素
      let domList = [];
      let p = box.parentNode.children;
      for (var i = 0, pl = p.length; i < pl; i++) {
        if (p[i] !== box) domList.push(p[i]);
      }
      domList.forEach((item) => {
        item.querySelector(".box-right").classList.remove("right");
        item.classList.remove("publicStyle");
        if (item.querySelectorAll(".left").length > 0) {
          item.querySelector(".left").classList.remove("left");
        }
      });
    }
  }
});
</script>

<style lang="less" scoped>
.publicStyle {
  color: #fff !important;
  background-color: #0c2d2c !important;
}

.ImplementationProgress {
  .tabs {
    display: flex;
    min-width: 1090px;

    .fatherBox {
      font-size: 16px;
      font-weight: 700;
      background: url("@/assets/images/tab_bc.png") no-repeat;
      background-size: 100% 100%;
      margin-right: 10px;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
      width: 9%;
      height: 40px;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      line-height: 40px;
      min-width: 40px;
      cursor: pointer;
      position: relative;
    }
  }
}
</style>
