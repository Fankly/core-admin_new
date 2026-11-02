<template>
  <div class="ImplementationProgress">
    <div class="tabs">
      <div class="fatherBox box-1" @click="changeColor('box-1')">
        <el-icon class="ep-icon-reading"><EpReading /></el-icon>
        执行进度监控
        <div class="box-right"></div>
      </div>

      <div class="fatherBox box-2" @click="changeColor('box-2')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-pie-chart"><EpPieChart /></el-icon>
        储备与立项
      </div>

      <div class="fatherBox box-3" @click="changeColor('box-3')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-data-analysis"><EpDataAnalysis /></el-icon>
        招投标
      </div>

      <div class="fatherBox box-4" @click="changeColor('box-4')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-collection-tag"><EpCollectionTag /></el-icon>
        合同签订
      </div>

      <div class="fatherBox box-5" @click="changeColor('box-5')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-files"><EpFiles /></el-icon>
        项目实施
      </div>

      <div class="fatherBox box-6" @click="changeColor('box-6')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-discount"><EpDiscount /></el-icon>
        项目审计
      </div>

      <div class="fatherBox box-7" @click="changeColor('box-7')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-bank-card"><EpCreditCard /></el-icon>
        结算与支付
      </div>

      <div class="fatherBox box-8" @click="changeColor('box-8')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-coin"><EpCoin /></el-icon>
        决算与增资
      </div>

      <div class="fatherBox box-9" @click="changeColor('box-9')">
        <div class="box-left"></div>
        <div class="box-right"></div>
        <el-icon class="ep-icon-turn-off"><EpTurnOff /></el-icon>
        项目关闭
      </div>
    </div>

    <ProgressMonitoring v-if="this.temShow === 'box-1'"></ProgressMonitoring>
    <ReserveEstablishment v-if="this.temShow === 'box-2'"></ReserveEstablishment>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-3'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-4'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-5'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-6'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-7'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-8'"></echarts>
    <echarts :data-one="dataOne" :data-two="dataTwo" v-if="this.temShow === 'box-9'"></echarts>
  </div>
</template>

<script setup>
import {
  Coin as EpCoin,
  CollectionTag as EpCollectionTag,
  CreditCard as EpCreditCard,
  DataAnalysis as EpDataAnalysis,
  Discount as EpDiscount,
  Files as EpFiles,
  PieChart as EpPieChart,
  Reading as EpReading,
  TurnOff as EpTurnOff
} from '@element-plus/icons-vue'
import { markRaw as markElementIconRaw, reactive, toRef, onMounted } from 'vue'
import ProgressMonitoring from '@/components/progress-monitoring/ProgressMonitoring.vue'
import ReserveEstablishment from '@/components/progress-monitoring/ReserveEstablishment.vue'
import echarts from '@/components/quality-monitoring/echarts.vue'
const setupState = reactive({
  EpCoin: markElementIconRaw(EpCoin),
  EpCollectionTag: markElementIconRaw(EpCollectionTag),
  EpCreditCard: markElementIconRaw(EpCreditCard),
  EpDataAnalysis: markElementIconRaw(EpDataAnalysis),
  EpDiscount: markElementIconRaw(EpDiscount),
  EpFiles: markElementIconRaw(EpFiles),
  EpPieChart: markElementIconRaw(EpPieChart),
  EpReading: markElementIconRaw(EpReading),
  EpTurnOff: markElementIconRaw(EpTurnOff),
  temShow: ''
})
const temShow = toRef(setupState, 'temShow')
function changeColor(name) {
  //选中元素的样式
  setupState.temShow = name
  let box = document.querySelector(`.${name}`)
  box.classList.add('publicStyle')
  let rightSon = box.querySelector('.box-right')
  rightSon.classList.add('right')
  if (box.querySelectorAll('.box-left').length > 0) {
    box.querySelector('.box-left').classList.add('left')
  }

  //除选中元素外的其他元素
  let domList = []
  let p = box.parentNode.children
  for (var i = 0, pl = p.length; i < pl; i++) {
    if (p[i] !== box) domList.push(p[i])
  }
  domList.forEach((item) => {
    item.querySelector('.box-right').classList.remove('right')
    item.classList.remove('publicStyle')
    if (item.querySelectorAll('.left').length > 0) {
      item.querySelector('.left').classList.remove('left')
    }
  })
}
onMounted(() => {
  changeColor('box-1')
})
defineExpose({
  EpCoin,
  EpCollectionTag,
  EpCreditCard,
  EpDataAnalysis,
  EpDiscount,
  EpFiles,
  EpPieChart,
  EpReading,
  EpTurnOff,
  temShow,
  changeColor
})
</script>

<style lang="less" scoped>
.publicStyle {
  background-color: #00706b !important;
  color: #fff !important;
}
.right {
  border-left: 20px solid #00706b !important;
}
.left {
  border-top: 20px solid #00706b !important;
  border-bottom: 20px solid #00706b !important;
  border-left: 20px solid transparent !important;
  border-right: 0 solid #00706b !important;
}
.ImplementationProgress {
  .tabs {
    display: flex;
    min-width: 1090px;
    .fatherBox {
      width: 9%;
      height: 40px;
      background-color: #f4fafb;
      color: rgb(68, 63, 63);
      text-align: center;
      line-height: 40px;
      min-width: 40px;
      margin: auto;
      cursor: pointer;
      position: relative;
    }
    .box-right {
      position: absolute;
      top: 0;
      left: 100%;
      border-top: 20px solid transparent;
      border-bottom: 20px solid transparent;
      border-left: 20px solid #f4fafb;
      border-right: 0 solid transparent;
    }
    .box-left {
      border-top: 20px solid #f4fafb;
      border-bottom: 20px solid #f4fafb;
      border-left: 20px solid transparent;
      border-right: 0 solid #f4fafb;
      position: absolute;
      top: 0;
      right: 100%;
    }
  }
}
</style>
