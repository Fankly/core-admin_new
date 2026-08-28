<!-- 两库一平台总览 -->
<template>
  <div class="containerAll">
    <div class="page_other">
      <div>
        <span style="color: #000; font-weight: bold">计划实施年度：</span>
        <el-select style="width: 180px" v-model="formData.jhssnd" placeholder="请选择计划实施年度" clearable @change="handlerClick">
          <el-option v-for="item in ndDataList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
        </el-select>
      </div>
      <div class="scroll_div">
        <div class="srcoll_text">
          {{ text }}
        </div>
      </div>
      <div class="page_other_top">
        <div v-for="(item, index) in btnList" :key="index">
          <div class="page_other_top_click" :class="item.code == type ? 'page_other_top_active' : ''" @click="handletype(item.code)">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="menu mb">
      <meun :stat-type="type" :userInfo="userInfo" ref="menuDataRef" @changeAppNo="changeAppNo" @yssxInfo="clickHistroy" />
    </div>
    <div class="charts">
      <e-charts ref="eChartsDataRef" />
      <viewTable ref="isCountyRef" :isCity="isCity" />
    </div>
  </div>
  <sxTable ref="modalTbaleRef" />
</template>
<script lang="ts">
export default {
  name: '/service/lkyptzl/drillDown'
}
</script>
<script setup lang="ts">
import { reactive, ref, onMounted, onActivated, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import meun from '@/views/service/lkyptzl/components/meun.vue'
import viewTable from '@/views/service/lkyptzl/components/viewTable.vue'
import ECharts from '@/views/service/lkyptzl/components/echarts.vue'
import sxTable from '@/views/service/lkyptzl/components/sxTable.vue'
import { getCropLimitInfo, getCoreIndicator, getAppMenuData } from '@/api/lkyptzl/index'
import { getAppListPageData } from '@/api/sys/appManager'
import { useStore } from 'vuex'
import { getPublicData } from '@/api/common' //公共代码
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'

const loading = ref(false)
const modalTbaleRef = ref()
const userInfo = ref<any>({}) //角色信息
const type = ref<any>('xmsl')
const store = useStore()
const menuDataRef = ref()
const eChartsDataRef = ref()
const isCountyRef = ref()
const isCity = ref<boolean>(false)
const flag = ref('')
const route = useRoute()
const params = ref<any>({})
const formData = reactive({ jhssnd: '', type: '0' })
const cropLimitInfo = ref<any>()
const ndDataList = ref<any[]>([])
const appNo = ref<any>('XQK')
const text = ref<string>('') //核心指标
const btnList = [
  { name: '按数量', code: 'xmsl' },
  { name: '按金额', code: 'amount' }
]

onMounted(() => {
  publicCode()
})
// 年度列表
const publicCode = async () => {
  userInfo.value = JSON.parse(decrypt(route.query.drillDownParams as string))
  let year = new Date().getFullYear()
  if (year < 2026) {
    formData.jhssnd = (year + 1).toString()
  } else {
    formData.jhssnd = year.toString()
  }
  const res: any = await getPublicData('NDCX')
  if (res.success && res.data.length !== 0) {
    ndDataList.value = res.data
    await getTryCounty(userInfo.value.dwId)
    await MenuList()
  }
}
// 核心指标
const getCoreIndex = async () => {
  if (cropLimitInfo.value && cropLimitInfo.value.cropName && cropLimitInfo.value.cropFlag != 'COUNTY') {
    let res: any = await getCoreIndicator({ dwId: cropLimitInfo.value.cropId, nd: formData.jhssnd })
    if (res.success) {
      const content: any = res.data
      const mbz = Number(content.cbxmmbz).toFixed(2)
      const wcz = Number(content.cbxmwcz).toFixed(2)
      const wcl = Number(content.cbxmwcl).toFixed(2)
      text.value = `当前单位：${cropLimitInfo.value.cropName}；成本项目目标值：${mbz}万元；成本项目完成值：${wcz}万元；成本项目完成率：${wcl}%。`
    } else {
      ElMessage.error(res.msg)
    }
  } else {
    text.value = ''
  }
}
// 是否县公司角色
const getTryCounty = async (val: any) => {
  let res: any = await getCropLimitInfo({ dwId: val, isUpLimit: false })
  if (res.success) {
    cropLimitInfo.value = res.data
    eChartsDataRef.value.formData.cropFlag = res.data.cropFlag
    eChartsDataRef.value.formData.isCity = isCity.value = ['COUNTY', 'ZSDW'].includes(res.data.cropFlag)
    xmDataPage()
    getCoreIndex()
  } else {
    ElMessage.error(res.msg)
  }
}
// 类型切换
const handletype = (val: any) => {
  isCountyRef.value.formData.statType = eChartsDataRef.value.formData.statType = type.value = val
  if (!isCity.value) {
    loading.value = true
    eChartsDataRef.value.showBack = false
    eChartsDataRef.value.getDataChar()
    loading.value = false
  }
}
// 选择年份
const handlerClick = (val: any) => {
  loading.value = true
  formData.jhssnd = val
  eChartsDataRef.value.showBack = false
  xmDataPage()
  getCoreIndex()
}
// 选择编码
const changeAppNo = (val: any) => {
  appNo.value = val
  eChartsDataRef.value.showBack = false
  loading.value = true
  getHandlerTab()
  loading.value = false
}
const MenuList = async () => {
  try {
    let code: any = await getAppListPageData({
      page: 1,
      limit: 100
    })
    let res: any = await getAppMenuData()
    if (code.success && code.data && res.success && res.data && menuDataRef.value && menuDataRef.value.meunList) {
      menuDataRef.value.meunList.forEach((menu: any) => {
        const codenName = code.data.records.find((item: any) => item.appNo == menu.code)
        menu.name = codenName.appName
        if (res.data[menu.code]) {
          if (res.data[menu.code]['1'] && res.data[menu.code]['1'].length > 0) {
            const isLength = res.data[menu.code]['1'].map((item: any) => item.name).join(',')
            menu.tab = res.data[menu.code]['1'].filter((item1: any, index: any) => (isLength.length < 28 ? index < 4 : index < 3))
            menu.other = res.data[menu.code]['1'].filter((item1: any, index: any) => (isLength.length < 28 ? index > 3 : index > 2))
          }
          if (res.data[menu.code]['2'] && res.data[menu.code]['2'].length > 0) {
            const orLength = res.data[menu.code]['2'].map((item: any) => item.name).join(',')
            menu.search = res.data[menu.code]['2'].filter((item1: any, index: any) => (orLength.length < 28 ? index < 4 : index < 3))
            menu.any = res.data[menu.code]['2'].filter((item1: any, index: any) => (orLength.length < 28 ? index > 3 : index > 2))
          }
        }
      })
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.log(error)
  }
}

const xmDataPage = async () => {
  try {
    params.value = {
      jhssnd: formData.jhssnd,
      cropLimitInfo: cropLimitInfo.value,
      bmId: userInfo.value.bmId,
      bmxz: userInfo.value.bmxz,
      isCwbm: userInfo.value.isBMCW
    }
    await getHandlerTab()
    await menuDataRef.value.cardApi(params.value)
  } catch (error) {
    console.log(error)
  }
}

const getHandlerTab = () => {
  if (isCity.value) {
    isCountyRef.value.formData = { ...params.value, isClick: '2', appNo: appNo.value }
    isCountyRef.value?.proTableRef.clearSelection()
    isCountyRef.value?.proTableRef.getTableList()
  } else {
    eChartsDataRef.value.showPage = false
    eChartsDataRef.value.appNo = appNo.value
    eChartsDataRef.value.isBMCW = userInfo.value.isBMCW
    eChartsDataRef.value.formData = { ...params.value }
    eChartsDataRef.value.getDataChar()
    eChartsDataRef.value.showPage = true
  }
}

const clickHistroy = (item: any) => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    const parmas = {
      ...params.value,
      appNo: item.code,
      indicatorCode: item.indicatorCode
    }
    modalTbaleRef.value.tableTitle = `${item.name}-事项明细`
    modalTbaleRef.value.apiType = '2'
    modalTbaleRef.value.formData = { ...parmas }
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}
watch(
  () => route.query,
  () => {
    if (route.name === '/service/lkyptzl/drillDown' && route.query) {
      const params = JSON.parse(decrypt(route.query.drillDownParams as string))
    }
  },
  {
    deep: true
  }
)
</script>
<style lang="less" scoped>
.containerAll {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  box-sizing: border-box;

  .page_other {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .scroll_div {
      width: 65%;
      height: 50px;
      white-space: nowrap;
      line-height: 50px;
      padding: 0 10px;
      font-size: 16px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
      color: var(--color-primary, #00857c);

      .srcoll_text {
        display: inline-block;
        position: absolute;
        padding-left: 100%;
        white-space: nowrap;
        animation: scroll 25s linear infinite;
      }

      @keyframes scroll {
        0% {
          transform: translate(0);
        }

        100% {
          transform: translate(-100%);
        }
      }
    }

    .scroll_div:hover .srcoll_text {
      animation-play-state: paused;
    }

    .scroll_div:hover .srcoll_text.reverse {
      animation-direction: reverse;
    }

    .page_other_top {
      cursor: pointer;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      width: 180px;
      height: 30px;
      border-radius: 30px;
      border: 1px solid #e8e8e8;
      background-color: #fff;

      .page_other_top_click {
        width: 90px;
        height: 30px;
        line-height: 30px;
        text-align: center;
        border-radius: 30px;
        color: #333;
      }

      .page_other_top_active {
        color: #fff;
        background-color: var(--color-primary, #00857c);
      }
    }
  }
  .menu {
    height: 230px;
    min-width: 0;
    min-height: 0;
  }

  .charts {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
.mb {
  margin-bottom: 10px;
}
</style>
