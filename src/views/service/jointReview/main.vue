<script setup lang="ts" name="/service/jointReview/main">
import userDialog from '@/components/select/userDialog.vue'
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { getAppMenu } from '@/api/menu/menuConfig'
import { MenuConfig } from '@/views/service/xq/interface'
import baseService from '@/service/baseService'
import {
  getOverviewData,
  lhhsStatGetStatDataByDw,
  lhhsStatPageYssxInfo,
  lhhsStatExportYssxInfo,
  lhhsStatPageXmInfoByYssx,
  lhhsStatExportXmInfoByYssx
} from '@/api/service/expertinformation'
import { useStore } from 'vuex'
import SvgIcon from '@/components/base/svg-icon/index'
import { getPublicData } from '@/api/common' //公共代码
import sxTable from '@/components/yssxTable/sxTable.vue'
import hyTable from '@/views/service/jointReview/components/hyTable.vue'
import { getCropLimitInfo } from '@/api/lkyptzl'
const userDialogRef = ref()
const modalTbaleRef = ref()
const hyTbaleRef = ref()
const userInfo = ref()
const isShowPage = ref(false)
const popoverVisible = ref(false)
const router = useRouter()
const store = useStore()
const flag = ref('')
const operationBtn = ref<MenuConfig[]>([])
const searchBtn = ref<MenuConfig[]>([])
const ndDataList = ref<any[]>([])
const dwIdList = ref<any[]>([])
const dwType = ref('按单位展示')
const searchData = reactive<any>({
  jhssnd: '',
  statType: 'xmsl'
})
const loading = ref<boolean>(false)
const btnList = [
  { name: '按数量展示', code: 'xmsl' },
  { name: '按金额展示', code: 'amount' }
]
const typeList = [{ name: '按单位展示', code: 'dw' }]
const meetingCount = ref<any[]>([
  {
    name: '在册专家',
    code: 'expertCount',
    count: 0,
    type: '人'
  },
  {
    name: '组织会审',
    code: 'meetingCount',
    count: 0,
    type: '次'
  }
])
const countType = ref<any>({})
const typeCount = ref<any[]>([
  {
    name: '待会审',
    code: 'dhs',
    count: 0
  },
  {
    name: '会审中',
    code: 'hsz',
    count: 0
  },
  {
    name: '待批复',
    code: 'dpf',
    count: 0
  },
  {
    name: '合规审核',
    code: 'hgsh',
    count: 0
  },
  {
    name: '会审通过',
    code: 'hstg',
    count: 0
  },
  {
    name: '会审驳回',
    code: 'hsbh',
    count: 0
  }
])
const maxVisibleItems = 3

const visibleOperationBtn = computed(() => {
  if (operationBtn.value.length <= 4) {
    return operationBtn.value
  }
  return operationBtn.value.slice(0, maxVisibleItems)
})

const hiddenOperationBtn = computed(() => {
  if (operationBtn.value.length <= 4) {
    return []
  }
  return operationBtn.value.slice(maxVisibleItems)
})

const visibleSearchBtn = computed(() => {
  if (searchBtn.value.length <= 4) {
    return searchBtn.value
  }
  return searchBtn.value.slice(0, maxVisibleItems)
})

const hiddenSearchBtn = computed(() => {
  if (searchBtn.value.length <= 4) {
    return []
  }
  return searchBtn.value.slice(maxVisibleItems)
})

const showMoreOperationBtn = computed(() => {
  return operationBtn.value.length > 4
})

const showMoreSearchBtn = computed(() => {
  return searchBtn.value.length > 4
})

const handelGetVal = async () => {
  let res = await getOverviewData(searchData)
  if (res.success && res.data) {
    typeCount.value.forEach((item: any) => {
      for (const key in res.data.xmStatData) {
        if (item.code == key) {
          if (searchData.statType == 'xmsl') {
            item.count = res.data.xmStatData[key]
          } else {
            item.count = res.data.xmStatData[key] ? Number(res.data.xmStatData[key]).toFixed(2) : '0.00'
          }
        }
      }
    })
    meetingCount.value[0].count = res.data.expertCount
    meetingCount.value[1].count = res.data.meetingCount
    countType.value = typeCount.value[0]
    isShowPage.value = true
  }
  const res1: any = await getPublicData('NDCX')
  if (res1.success && res1.data.length !== 0) {
    ndDataList.value = res1.data
    echartsData()
  }
}
const echartsData = async () => {
  try {
    let res = await lhhsStatGetStatDataByDw({ ...searchData, indicatorCode: countType.value.code })
    if (res.success) {
      dwOBarOptions.yAxis.name = searchData.statType == 'amount' ? '金额：万元' : '数量：个'
      dwOBarOptions.xAxis.data = res.data.xAxisData
      dwOBarOptions.series.forEach((item: any, index: any) => {
        item.data = res.data.seriesDataList[index].map((root: any) => (root == 0 ? '' : root))
      })
      dwIdList.value = res.data.dwIdList
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    console.log(error)
  }
}

// 选择年份
const handlerClick = (val: any) => {
  loading.value = true
  searchData.jhssnd = val
  handelGetVal()
}

// 类型切换
const handletype = (val: any) => {
  loading.value = true
  searchData.statType = val
  handelGetVal()
  loading.value = false
}

const handleRequired = async (MenuMsg: any) => {
  let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${MenuMsg.outsideMenu}&spRoleId=${userInfo.value.id}`)
  if (res.success) {
    if (res.success) {
      store.commit('setPermissions', res.data)
    }
  }
  popoverVisible.value = false
  router.push({
    name: MenuMsg.url,
    params: { formJsc: '1' }
  })
}

// 是否省公司角色
const getTryCounty = async (val: any) => {
  let res: any = await getCropLimitInfo({ dwId: val, isUpLimit: true })
  if (res.success && res.data) {
    if (res.data.cropFlag == 'PROVINCE' && userInfo.value.specialorgcode.includes('BM_CW')) {
      handelGetVal()
    } else {
      ElMessage.error('仅限省公司财务部门访问')
    }
  } else {
    ElMessage.error(res.msg)
  }
}

const getRoleHandle = async () => {
  try {
    searchData.jhssnd = new Date().getFullYear().toString()
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        flag.value = flagData.data
        getTryCounty(userInfo.value.org_id)
        store.commit('setJRGlobalInfo', {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flag.value
        })
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const dwOBarOptions = reactive<any>({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '4%',
    right: '4%',
    bottom: '4%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: {
      show: false,
      lineStyle: {
        color: '#6a6866',
        fontSize: '50'
      }
    },
    axisTick: {
      show: false
    },
    axisLabel: {
      textStyle: {
        fontFamily: 'Microsoft YaHei'
        // padding: [20, 0, 0, 105]
      },
      interval: 0,
      clickable: true,
      rich: {
        a: {
          color: 'blue',
          textDecoration: 'underline',
          cursor: 'pointer'
        }
      }
    },
    silent: false,
    triggerEvent: true
  },
  yAxis: {
    name: '数量：个',
    nameTextStyle: {
      color: '#9eaabb',
      fontSize: 12
    },
    type: 'value',
    axisLine: {
      show: false,
      lineStyle: {
        color: '#939aa3'
      }
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#efefef'
      }
    },
    triggerEvent: true
  },
  series: [
    {
      name: '',
      type: 'bar',
      barWidth: 10,
      label: {
        show: true,
        position: 'top'
      },
      itemStyle: {
        color: '#01b998',
        borderRadius: [2, 2, 0, 0]
      },
      data: []
    }
  ]
})

onMounted(async () => {
  await userDialogRef.value.getUser()
  const operationRes = await getAppMenu({
    appNo: 'LHHSK',
    label: '1'
  })
  const searchRes = await getAppMenu({
    appNo: 'LHHSK',
    label: '2'
  })
  if (operationRes.success && searchRes.success) {
    operationBtn.value = operationRes.data
    searchBtn.value = searchRes.data
  }
})

// 点击数字
const handleCount = (val: any) => {
  countType.value = val
  echartsData()
}

// 点击会议数字
const handleMeeting = (val: any) => {
  if (val.code != 'meetingCount') return
  hyTbaleRef.value.isShowTable = true
  hyTbaleRef.value.loading = true
  nextTick(() => {
    const parmas = {
      jhssnd: searchData.jhssnd
    }
    hyTbaleRef.value.getPublicCodeData()
    hyTbaleRef.value.tableTitle = `组织会审-会议列表`
    hyTbaleRef.value.formData = { ...parmas }
    hyTbaleRef.value?.proTableRef.getTableList()
  })
}
// 显示事项
const handleActive = () => {
  modalTbaleRef.value.isShowTable = true
  modalTbaleRef.value.loading = true
  nextTick(() => {
    const parmas = {
      indicatorCode: countType.value.code,
      jhssnd: searchData.jhssnd
    }
    modalTbaleRef.value.tableTitle = `${countType.value.name}-事项明细`
    modalTbaleRef.value.apiType = '3'
    modalTbaleRef.value.formData = { ...parmas }
    modalTbaleRef.value?.proTableRef.getTableList()
  })
}
// 点击柱状图
const handleClick = (val: any) => {
  if (val.componentType == 'series') {
    modalTbaleRef.value.isShowTable = true
    modalTbaleRef.value.loading = true
    modalTbaleRef.value.apiType = '3'
    nextTick(() => {
      modalTbaleRef.value.tableTitle = `${countType.value.name}-${val.name}-事项明细`
      modalTbaleRef.value.formData = {
        ...searchData,
        dwId: dwIdList.value[val.dataIndex],
        indicatorCode: countType.value.code
      }
      modalTbaleRef.value?.proTableRef.getTableList()
    })
  }
}
</script>

<template>
  <div class="container" v-show="isShowPage">
    <div class="page_other">
      <div>
        <span style="color: #000; font-weight: bold">年度：</span>
        <el-select style="width: 180px" v-model="searchData.jhssnd" placeholder="请选择年度" clearable @change="handlerClick">
          <el-option v-for="item in ndDataList" :key="item.code" :label="item.name" :value="item.code"> </el-option>
        </el-select>
      </div>
      <div class="page_other_top">
        <div v-for="(item, index) in btnList" :key="index">
          <div class="page_other_top_click" :class="item.code == searchData.statType ? 'page_other_top_active' : ''" @click="handletype(item.code)">
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>
    <div class="container-btn">
      <div class="container-btn-box container-btn-bgcOne">
        <div class="container-btn-box-content">
          <h2>联合会审总览</h2>
          <div class="container-btn-box-content-count">
            <div>
              <div v-for="(item, index) in typeCount" :key="index">
                <div class="container-btn-box-content-middel" :class="item.name == countType.name ? 'activer' : ''" @click="handleCount(item)">
                  <span class="left">{{ item.name }}</span>
                  <span :class="searchData.statType == 'xmsl' ? 'middle' : 'middle_wy'">{{ item.count }}</span>
                  <span class="right">{{ searchData.statType == 'xmsl' ? '个' : '万元' }}</span>
                </div>
              </div>
            </div>
            <div>
              <div v-for="(item, index) in meetingCount" :key="index">
                <div class="container-btn-box-content-right">
                  <span class="left">{{ item.name }}</span>
                  <span class="middle" @click="handleMeeting(item)">{{ item.count }}</span>
                  <span class="right">{{ item.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="container-btn-box-icon">
          <img src="@/assets/service/bank.png" alt="" />
        </div>
      </div>
      <div class="container-btn-box container-btn-bgcTwo">
        <div class="container-btn-box-content">
          <h2>业务处理</h2>
          <div class="container-btn-box-content-container-operation">
            <el-row :gutter="24">
              <template v-for="operation in visibleOperationBtn" :key="operation.id">
                <el-col :span="12">
                  <div class="container-btn-box-content-container-box" @click="handleRequired(operation)">
                    <svg-icon v-if="operation.icon" :name="operation.icon"></svg-icon>
                    <i v-else class="el-icon-document"></i>
                    <span>{{ operation.name }}</span>
                  </div>
                </el-col>
              </template>
              <el-popover v-if="showMoreOperationBtn" :width="220" placement="bottom" trigger="click" v-model="popoverVisible">
                <template #reference>
                  <el-col :span="12">
                    <div class="container-btn-box-content-container-box">
                      <i class="el-icon-document"></i>
                      <span>更 多</span>
                    </div>
                  </el-col>
                </template>
                <div class="more-items-popover">
                  <template v-for="operation in hiddenOperationBtn" :key="operation.id">
                    <div class="item-popover" @click="handleRequired(operation)">
                      <svg-icon v-if="operation.icon" :name="operation.icon"></svg-icon>
                      <i v-else class="el-icon-document"></i>
                      <span style="padding-left: 4px">{{ operation.name }}</span>
                    </div>
                  </template>
                </div>
              </el-popover>
            </el-row>
          </div>
        </div>
        <div class="container-btn-box-icon">
          <img src="@/assets/service/tv.png" alt="" />
        </div>
      </div>
      <div class="container-btn-box container-btn-bgcThree">
        <div class="container-btn-box-content">
          <h2>快速查询</h2>
          <div class="container-btn-box-content-container-operation">
            <el-row :gutter="24">
              <template v-for="search in visibleSearchBtn" :key="search.id">
                <el-col :span="12">
                  <div class="container-btn-box-content-container-box" @click="handleRequired(search)">
                    <svg-icon v-if="search.icon" :name="search.icon"></svg-icon>
                    <i v-else class="el-icon-search"></i>
                    <span>{{ search.name }}</span>
                  </div>
                </el-col>
              </template>
              <el-popover v-if="showMoreSearchBtn" :width="220" placement="bottom" trigger="click" v-model="popoverVisible">
                <template #reference>
                  <el-col :span="12">
                    <div class="container-btn-box-content-container-box">
                      <i class="el-icon-search"></i>
                      <span>更 多</span>
                    </div>
                  </el-col>
                </template>
                <div class="more-items-popover">
                  <template v-for="search in hiddenSearchBtn" :key="search.id">
                    <div class="item-popover" @click="handleRequired(search)">
                      <svg-icon v-if="search.icon" :name="search.icon"></svg-icon>
                      <i class="el-icon-search"></i>
                      <span>{{ search.name }}</span>
                    </div>
                  </template>
                </div>
              </el-popover>
            </el-row>
          </div>
        </div>
        <div class="container-btn-box-icon">
          <img src="@/assets/service/computer.png" alt="" />
        </div>
      </div>
    </div>
    <div class="container-charts">
      <div class="container-charts-box">
        <div class="container-charts-box-content" style="margin-left: 10px">
          <el-select style="width: 180px" v-model="dwType" placeholder="请选择展示类型">
            <el-option v-for="item in typeList" :key="item.name" :label="item.name" :value="item.name"> </el-option>
          </el-select>
          <div class="container-charts-box-title">
            {{ countType.name }}
            <span @click="handleActive">{{ countType.count }}</span>
            {{ searchData.statType == 'xmsl' ? '个' : '万元' }}
          </div>
          <div class="container-charts-box-content-main">
            <v-chart @click="handleClick" :option="dwOBarOptions" :autoresize="true" />
          </div>
        </div>
      </div>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <sxTable
    ref="modalTbaleRef"
    :getTableApi="lhhsStatPageYssxInfo"
    :exportApi="lhhsStatExportYssxInfo"
    :xmGetTableApi="lhhsStatPageXmInfoByYssx"
    :xmExportApi="lhhsStatExportXmInfoByYssx"
    :xm-lsxt="true"
    :api-params-type="''"
  />
  <hyTable ref="hyTbaleRef" />
</template>

<style scoped lang="less">
.charts-style {
  margin-right: 10px;
}

.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;

  .icon-style {
    width: 80px;
    height: 80px;
    cursor: auto;
  }

  .container-btn {
    display: flex;
    justify-content: space-evenly;
    height: 200px;

    .container-btn-bgcOne {
      background: linear-gradient(to right, #db8300, #ddb427);
    }

    .container-btn-bgcTwo {
      background: linear-gradient(to right, #00857c, #1abfb6);
    }

    .container-btn-bgcThree {
      background: linear-gradient(to right, #1c7ba7, #02a9b4);
    }

    .container-btn-box {
      padding: 0 20px;
      width: 100%;
      height: 100%;
      border-radius: 10px;
      color: white;
      display: flex;

      &:nth-of-type(2) {
        margin: 0 10px;
      }

      .container-btn-box-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 150px;
      }

      .container-btn-box-content {
        flex: 1;
        min-height: 0;
        min-width: 0;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        .container-btn-box-content-count {
          width: 100%;
          display: flex;
          justify-content: space-between;
          position: absolute;
          left: 0px;
          top: 60px;
        }
        .container-btn-box-content-middel:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .activer {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .container-btn-box-content-middel,
        .container-btn-box-content-right {
          max-width: 300px;
          font-size: 14px;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          .left {
            width: 80px;
          }
          .middle {
            width: 80px;
            text-align: right;
            box-sizing: border-box;
            padding-right: 10px;
          }
          .middle_wy {
            width: 180px;
            text-align: right;
            box-sizing: border-box;
            padding-right: 10px;
          }
          .right {
            width: 40px;
          }
        }

        .container-btn-box-content-container {
          flex: 1;
          min-height: 0;
          min-width: 0;
          display: flex;
          align-items: center;
          height: 100%;
          justify-content: space-between;
          max-width: 280px;

          .container-btn-box-content-box {
            font-size: 14px;
            font-weight: 400;
            text-align: center;

            .container-btn-box-content-box__content:first-of-type {
              font-size: 16px;
            }
          }
        }
      }
    }
  }

  .container-btn-box-content-container-box {
    padding: 6px 0;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      border-radius: 6px;
      background-color: rgba(255, 255, 255, 0.2);
    }

    span {
      padding: 0 4px;
    }
  }

  .container-search {
    width: 100%;
    margin: 10px 0;

    .container-search-outside {
      box-sizing: border-box;
      width: 100%;
      border: 1px solid #eeeeee;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .container-search-box {
        padding: 20px;
        align-items: center;
        display: flex;

        span {
          width: 200px;
          padding: 0 20px;
        }
      }
    }
  }

  .container-charts {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .container-charts-box {
      width: 100%;
      height: 100%;

      .container-charts-box-content {
        border-radius: 10px;
        border: 1px solid #eeeeee;
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding-top: 10px;
        box-sizing: border-box;
        .container-charts-box-title {
          font-weight: bold;
          letter-spacing: 2px;
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translate(-50%, -50%);
          > span {
            cursor: pointer;
            text-decoration: underline;
            color: var(--color-primary, #00857c);
          }
        }

        .container-charts-box-content-main {
          flex: 1;
          min-height: 0;
          min-width: 0;
        }
      }
    }
  }
}
.more-items-popover {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;

  .item-popover {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px 12px;
    transition: all 0.3s;
    color: #333;
    border-radius: 4px;
    &:hover {
      background-color: #f5f7fa;
      color: #00a19c;
    }
  }
}
.page_other {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .page_other_top {
    cursor: pointer;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 180px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid #d8d8d8;
    background-color: #fff;

    .page_other_top_click {
      width: 90px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      border-radius: 8px;
      color: #333;
    }

    .page_other_top_active {
      color: #fff;
      background-color: var(--color-primary, #00857c);
    }
  }
}
</style>
