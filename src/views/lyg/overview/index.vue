<!-- 项目全生命 -->
<template>
  <div class="container" v-show="isShowPage">
    <div class="top_section">
      <div class="top_section_name">项目全生命周期管理平台</div>
      <div class="top_section_year">
        <span>选择年度：</span>
        <el-select v-model="xmnd" placeholder="请选择" @change="handleYear" style="width: 120px">
          <template v-for="item in ndList" :key="item.code">
            <el-option :label="item.name" :value="item.code" />
          </template>
        </el-select>
      </div>
    </div>
    <div class="bottom_section">
      <div class="bottom_section_top">
        <div class="bottom_section_top_left" v-loading="loading">
          <div class="center_section_title">单位预算执行概览</div>
          <div class="bottom_section_top_left_content">
            <div class="bottom_section_top_left_content_item">
              <div class="bottom_section_top_left_content_left bottom_section_top_left_content_text_bgone">
                <div class="bottom_section_top_left_content_text" style="color: #128c87">目标值(万元)</div>
                <div class="bottom_section_top_left_content_left_num" style="color: #1a6b68">{{ dataParams.mbz }}</div>
              </div>
              <div class="bottom_section_top_left_content_left bottom_section_top_left_content_text_bgtwo">
                <div class="bottom_section_top_left_content_text" style="color: #2e667c">完成金额(万元)</div>
                <div class="bottom_section_top_left_content_left_num" style="color: #235b73">{{ dataParams.wcz }}</div>
              </div>
            </div>
            <div class="bottom_section_top_left_content_item">
              <div class="bottom_section_top_left_content_left bottom_section_top_left_content_text_bgthree">
                <div class="bottom_section_top_left_content_text" style="color: #2e6e7c">完成率</div>
                <div class="bottom_section_top_left_content_left_num" style="color: #1c6482">{{ dataParams.wcl }}<span>%</span></div>
              </div>
              <div class="bottom_section_top_left_content_left bottom_section_top_left_content_text_bgfour">
                <div class="bottom_section_top_left_content_text" style="color: #2e667c">{{ `${cropFlag == 'COUNTY' ? '区县' : '地市'}排名` }}</div>
                <div class="bottom_section_top_left_content_left_num" style="color: #06435d">{{ dataParams.dspm }}</div>
              </div>
            </div>
            <div class="bottom_section_top_left_right">
              <div class="bottom_section_top_left_content_right">
                <img class="bottom_section_top_left_content_right_icon" :src="getImageUrl('lyg_sgspjjd')" alt="" />
                <div class="bottom_section_top_left_content_right_text">省公司平均进度</div>
                <div class="bottom_section_top_left_content_right_num">{{ dataParams.sgspjwcl }}<span>%</span></div>
              </div>
              <div class="bottom_section_top_left_content_right">
                <img class="bottom_section_top_left_content_right_icon" :src="getImageUrl('lyg_sndsgstqjd')" alt="" />
                <div class="bottom_section_top_left_content_right_text">上年度同期省公司平均进度</div>
                <div class="bottom_section_top_left_content_right_num">{{ dataParams.sndtqsgspjwcl }}<span>%</span></div>
              </div>
              <div class="bottom_section_top_left_content_right">
                <img class="bottom_section_top_left_content_right_icon" :src="getImageUrl('lyg_gsjcmbz')" alt="" />
                <div class="bottom_section_top_left_content_right_text">公司距离此目标值</div>
                <div class="bottom_section_top_left_content_right_num">{{ dataParams.gsjlcmbz }}<span>万元</span></div>
              </div>
            </div>
          </div>
        </div>
        <div class="bottom_section_top_left" v-loading="xmjdLoading">
          <div class="center_section_title">各阶段项目占比</div>
          <div class="bottom_section_top_left_content">
            <div class="bottom_section_top_right_content_item">
              <div class="bottom_section_top_right_content_left bottom_section_top_right_content_left_bgone">
                <div class="bottom_section_top_right_content_left_text">项目总数</div>
                <div class="bottom_section_top_right_content_left_num">{{ xmzs }}</div>
              </div>
              <div class="bottom_section_top_right_content_left bottom_section_top_right_content_left_bgtwo">
                <div class="bottom_section_top_right_content_left_text">项目年度总预算(万元)</div>
                <div class="bottom_section_top_right_content_left_num">{{ xmzys }}</div>
              </div>
            </div>
            <div class="midden_section_right" ref="pieChartsRef"></div>
          </div>
        </div>
      </div>
      <div class="center_section" v-loading="xmjdLoading">
        <div class="center_section_title">项目进度</div>
        <div class="center_section_content">
          <div class="section_echarts" v-for="(item, index) in dataList" :key="index">
            <template v-if="!item.isEcharts">
              <div class="card_title">
                <div class="title_content">{{ item.name }}</div>
              </div>
              <div class="content_section_item" v-if="item.children.length == 1">
                <template v-for="(card, index1) in item.children" :key="index1">
                  <div class="content_section_one">
                    <div class="content_section_one_title">{{ card.name }}</div>
                    <div class="content_section_one_number" @dblclick="handleViewInfo(card.key, card.name)">{{ card.num }}</div>
                  </div>
                </template>
              </div>
              <div class="content_section_item" v-if="item.children.length == 2">
                <template v-for="(card, index1) in item.children" :key="index1">
                  <div class="content_section_two">
                    <img class="content_section_two_icon" :src="getImageUrl(card.key)" alt="" />
                    <div class="content_section_two_title">{{ card.name }}</div>
                    <div class="content_section_two_number" @dblclick="handleViewInfo(card.key, card.name)">{{ card.num }}</div>
                  </div>
                </template>
              </div>
              <div class="content_section_item" v-if="item.children.length == 3">
                <template v-for="(card, index1) in item.children" :key="index1">
                  <div class="content_section_three">
                    <img class="content_section_three_icon" :src="getImageUrl(card.key)" alt="" />
                    <div class="content_section_three_title">{{ card.name }}</div>
                    <div class="content_section_three_number" @dblclick="handleViewInfo(card.key, card.name)">
                      {{ card.num }}<span v-if="card.name.includes('率')">%</span>
                    </div>
                  </div>
                </template>
              </div>
              <div class="content_section_item" v-if="item.children.length == 4">
                <template v-for="(card, index1) in item.children" :key="index1">
                  <div class="content_section_four">
                    <div class="content_section_four_title">
                      <img class="content_section_four_icon" :src="getImageUrl(card.key)" alt="" /> {{ card.name }}
                    </div>
                    <div class="content_section_four_number" @dblclick="handleViewInfo(card.key, card.name)">
                      {{ card.num }}<span v-if="card.name.includes('率')">%</span>
                    </div>
                  </div>
                </template>
              </div>
            </template>
            <template v-else>
              <div class="card_title">
                <div class="title_content">{{ item.name }}</div>
              </div>
              <div class="content_section_item">
                <template v-for="(card, index1) in item.children" :key="index1">
                  <div class="content_section_three" v-if="!card.name.includes('率')">
                    <img class="content_section_three_icon" :src="getImageUrl(card.key)" alt="" />
                    <div class="content_section_three_title">{{ card.name }}：</div>
                    <div class="content_section_three_number" @dblclick="handleViewInfo(card.key, card.name)">{{ card.num }}</div>
                  </div>
                </template>
                <div class="gauge-container" :ref="(el) => setGaugeRef(el, index)"></div>
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="center_bottom_section">
        <div class="center_bottom_section_content" v-for="(item, index) in buildList" :key="index">
          <div class="card_title">
            <div class="title_content">{{ item.name }}</div>
          </div>
          <div class="center_bottom_section_card">
            <template v-for="(card, index1) in item.children" :key="index1">
              <div class="center_bottom_section_item_content">
                <img class="center_bottom_section_item_icon" :src="getImageUrl(card.key)" alt="" />
                <div class="center_bottom_section_item">
                  <div>{{ card.name }}</div>
                  <div>{{ card.num }}</div>
                </div>
              </div>
              <div class="center_bottom_section_item_line" v-if="index1 != item.children.length - 1"></div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 登录 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <xmDetailModal ref="xmDetailModalRef" :exportApi="exportApi" :getTableList="getTableList" />
</template>
<script setup lang="ts" name="/lyg/overview/index">
import { nextTick, onMounted, ref, onUnmounted, reactive } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import { overviewParam } from '@/views/lyg/overview/hooks/index'
import { proTypeParam } from '@/views/lyg/overview/hooks/proType'
import { createGauge, createPie } from '@/views/lyg/overview/hooks/pmEcharts'
import { getProjectProgress, getMbzWczData } from '@/api/lyg/index'
import { formatNumValue } from '@/utils/utils'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import xmDetailModal from '@/views/lyg/overview/components/xmDetailModal.vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const { isShowPage, loading, xmjdLoading, userDialogRef, ndList, cropFlag, userInfo, dataParams, getTryCounty, getPublicCode } = overviewParam()
const { dataList, xmzs, xmzys, DETAIL_API_MAP, DETAIL_DATA_MAP, buildList } = proTypeParam()
const gaugeCharts = ref<echarts.ECharts[]>([])
const pieCharts = ref<echarts.ECharts[]>([])
const pieChartsRef = ref()
const gaugeRefs = ref<(HTMLElement | null)[]>([])
const pieData = ref<any[]>([])
const xmnd = ref(new Date().getFullYear().toString())
const store = useStore()
const router = useRouter()

const exportApi = ref()
const getTableList = ref()
const xmDetailModalRef = ref()

const handleResize = () => {
  gaugeCharts.value.forEach((chart) => {
    chart.resize()
  })
  pieCharts.value.forEach((chart) => {
    chart.resize()
  })
}

const setGaugeRef = (el: any, index: number) => {
  if (el) {
    gaugeRefs.value[index] = el as HTMLElement
  }
}

const getImageUrl = (name: any) => {
  return new URL(`../../../assets/images/lyg/${name}.png`, import.meta.url).href
}

onMounted(async () => {
  await userDialogRef.value.getUser()
  window.addEventListener('resize', handleResize)
})

const getDataOVerview = async () => {
  if (userInfo.value.org_id) {
    xmjdLoading.value = true
    const params = {
      nd: xmnd.value,
      dwId: userInfo.value.org_id,
      cxjb: cropFlag.value == 'COUNTY' ? '1' : '0'
    }

    const res: any = await getProjectProgress({ ...params })
    if (!res.success) ElMessage.error(res.msg)
    xmjdLoading.value = false
    xmzs.value = formatNumValue(res.data.xmzs.toString(), 0)
    xmzys.value = formatNumValue((Number(res.data.xmzys) / 10000).toString(), 2)
    dataList.value.forEach((card) => {
      card.children.forEach((child) => {
        if (res.data[child.key] !== undefined) {
          if (child.name.includes('率')) {
            child.num = formatNumValue(res.data[child.key].toString(), 2)
          } else if (child.name.includes('金额')) {
            child.num = formatNumValue((res.data[child.key] / 10000).toString(), 2)
          } else {
            child.num = formatNumValue(res.data[child.key].toString(), 0)
          }
        }
      })
    })
    await initEcharst()
    const wcaData = await getMbzWczData({ ...params })
    if (!wcaData.success) ElMessage.error(wcaData.msg)
    for (const key in dataParams) {
      if (['mbz', 'wcz', 'gsjlcmbz'].includes(key)) {
        dataParams[key] = formatNumValue(wcaData.data[key].toString(), 2)
      } else if (['wcl', 'sgspjwcl', 'sndtqsgspjwcl'].includes(key)) {
        dataParams[key] = formatNumValue(wcaData.data[key].toString(), 2)
      } else {
        dataParams[key] = wcaData.data[key]
      }
    }
  }
}

const initEcharst = () => {
  gaugeCharts.value.length = 0
  pieCharts.value.length = 0
  pieData.value.length = 0
  dataList.value.forEach((card, index) => {
    if (card.color && gaugeRefs.value[index] && card.children.length > 2) {
      gaugeCharts.value.push(
        createGauge(gaugeRefs.value[index]!, Number(card.children[card.children.length - 1].num) / 100, card.color, '招标计划超期率')
      )
    }
    const num: any = card.children[0].num
    pieData.value.push({
      value: Number(num.replace(/,/g, '')),
      name: card.name,
      itemStyle: { color: card.color || card.fontColor }
    })
  })
  pieCharts.value.push(createPie(pieChartsRef.value, pieData.value, '各阶段项目数量'))
  setTimeout(() => {
    pieCharts.value.forEach((chart) => {
      chart.resize()
    })
  }, 500)
}

const handleViewInfo = (key: string, name: string) => {
  const apiConfig = DETAIL_API_MAP[key]
  const dataConfig = DETAIL_DATA_MAP[key]
  if (apiConfig) {
    exportApi.value = apiConfig.exportApi
    getTableList.value = apiConfig.getTableList

    const params = {
      key,
      prop: apiConfig.prop,
      userId: store.getters.getUserMsg.id,
      bmId: userInfo.value.specialorgid,
      dwId: userInfo.value.org_id,
      roleId: userInfo.value.role_id,
      roleCode: userInfo.value.code,
      name
    }
    xmDetailModalRef.value.acceptParams({ ...params })
    return
  }
  if (dataConfig) {
    router.push({
      name: '/lyg/project/proInfo/index',
      params: {
        status: dataConfig.status,
        roleId: userInfo.value.role_id,
        roleCode: userInfo.value.code,
        dwId: userInfo.value.org_id,
        specialorgid: userInfo.value.specialorgid,
        spRoleId: userInfo.value.id,
        userInfo: JSON.stringify({ ...userInfo.value })
      }
    })
  }
}

//   切换年度
const handleYear = (val: any) => {
  xmnd.value = val
  getDataOVerview()
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  gaugeCharts.value.forEach((chart) => {
    chart.dispose()
  })
  pieCharts.value.forEach((chart) => {
    chart.dispose()
  })
  gaugeCharts.value = []
  pieCharts.value = []
})

const getRoleHandle = async () => {
  try {
    isShowPage.value = false
    loading.value = true
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      getPublicCode()
      getTryCounty(userInfo.value.org_id)
      getDataOVerview()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
    isShowPage.value = true
    loading.value = false
  } finally {
    isShowPage.value = true
    loading.value = false
  }
}
</script>
<style lang="less" scoped>
@import (less) './css/index.css';

.bottom_section {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background-color: #f5fafd;
  border-radius: 10px;
  padding: 10px;
  .bottom_section_top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    .bottom_section_top_left {
      width: 49.5%;
      .bottom_section_top_left_content {
        width: 100%;
        height: 179px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.02);
        padding: 10px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        box-sizing: border-box;
        .bottom_section_top_left_content_item {
          display: flex;
          flex-direction: column;
          gap: 15px;
          .bottom_section_top_left_content_left {
            width: 220px;
            height: 68px;
            border-radius: 5px;
            padding: 10px 20px 10px 48px;
            box-sizing: border-box;
            .bottom_section_top_left_content_text {
              font-size: 16px;
            }
            .bottom_section_top_left_content_left_num {
              text-align: right;
              font-size: 24px;
            }
          }
          .bottom_section_top_left_content_text_bgone {
            background: url('@/assets/images/lyg/lyg_mbz.png') no-repeat;
            background-size: 100% 100%;
          }
          .bottom_section_top_left_content_text_bgtwo {
            background: url('@/assets/images/lyg/lyg_wcje.png') no-repeat;
            background-size: 100% 100%;
          }
          .bottom_section_top_left_content_text_bgthree {
            background: url('@/assets/images/lyg/lyg_wcl.png') no-repeat;
            background-size: 100% 100%;
          }
          .bottom_section_top_left_content_text_bgfour {
            background: url('@/assets/images/lyg/lyg_dspm.png') no-repeat;
            background-size: 100% 100%;
          }
        }
        .bottom_section_top_left_right {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 15px;
          .bottom_section_top_left_content_right {
            display: flex;
            align-items: center;
            width: 100%;
            height: 40px;
            border: 1px solid #8dc0bc;
            background-color: #fafafa;
            border-radius: 5px;
            padding: 10px;
            box-sizing: border-box;
            gap: 10px;
            .bottom_section_top_left_content_right_icon {
              width: 26px;
              height: 26px;
            }
            .bottom_section_top_left_content_right_text {
              font-size: 16px;
              color: #616161;
            }
            .bottom_section_top_left_content_right_num {
              font-size: 18px;
              margin-left: auto;
              color: #1c1c1c;
              > span {
                font-size: 14px;
                color: #666666;
              }
            }
          }
        }
        .bottom_section_top_right_content_item {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 15px;
          .bottom_section_top_right_content_left {
            width: 100%;
            height: 68px;
            background-color: #d9f5f0;
            border-radius: 5px;
            padding: 20px 20px 20px 70px;
            display: flex;
            align-items: center;
            gap: 10px;
            .bottom_section_top_right_content_left_text {
              color: #128c87;
              font-size: 16px;
            }
            .bottom_section_top_right_content_left_num {
              color: #1a6b68;
              font-size: 24px;
              margin-left: auto;
            }
          }
          .bottom_section_top_right_content_left_bgone {
            background: url('@/assets/images/lyg/lyg_xmzs.png') no-repeat;
            background-size: 100% 100%;
          }
          .bottom_section_top_right_content_left_bgtwo {
            background: url('@/assets/images/lyg/lyg_xmndzys.png') no-repeat;
            background-size: 100% 100%;
          }
        }
      }
    }
  }
}

.midden_section {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  background-color: #fff;
  box-sizing: border-box;
  border: 1px solid red;
  display: flex;
  position: relative;
  .midden_section_left {
    width: 50%;
    display: flex;
    flex-wrap: wrap;
    align-content: space-evenly;
    .midden_section_left_top {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 70px;
      margin: 10px 0 20px 50px;
      .midden_section_left_con {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-left: 20px;
        div:first-child {
          width: 100px;
          color: #98a6bb;
        }
        div:last-child {
          width: 130px;
          font-size: 18px;
          font-weight: bold;
          > span {
            font-size: 12px;
            font-weight: 500;
            color: #a3b0c2;
            margin-left: 10px;
          }
        }
      }
    }
    .midden_section_left_bottom {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 180px;
      margin: 0 0 0 50px;
      .midden_section_left_con {
        display: flex;
        flex-direction: column;
        gap: 15px;
        div:first-child {
          max-width: 200px;
          color: #98a6bb;
        }
        div:last-child {
          max-width: 130px;
          font-size: 18px;
          font-weight: bold;
          > span {
            font-size: 12px;
            font-weight: 500;
            color: #334155;
            margin-left: 10px;
          }
        }
      }
    }
  }
}
.midden_section_right {
  width: 380px;
  height: 150px;
  border-left: 1px solid #f0f0f1;
}
.section_echarts {
  width: 408px;
  height: 172px;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.02);
  padding: 8px;
  box-sizing: border-box;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}
.content_section_item {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  gap: 6px;
  .content_section_one {
    width: 100%;
    height: 80%;
    border-radius: 5px;
    background: url('@/assets/images/lyg/ygb_ygbxms.png') no-repeat;
    background-size: 100% 100%;
    color: #fff;
    padding: 30px 0 0 34px;
    box-sizing: border-box;
    .content_section_one_title {
      font-size: 16px;
    }
    .content_section_one_number {
      font-size: 24px;
      cursor: pointer;
    }
  }
  .content_section_two {
    width: 182px;
    background-color: #fff;
    border-radius: 5px;
    border: 1px solid #eaeaec;
    display: flex;
    flex-direction: column;
    padding: 10px;
    box-sizing: border-box;
    gap: 10px;
    .content_section_two_icon {
      width: 26px;
      height: 26px;
    }
    .content_section_two_title {
      font-size: 14px;
      color: #494949;
    }
    .content_section_two_number {
      font-size: 24px;
      color: #3b3b3b;
      cursor: pointer;
    }
  }
  .content_section_three {
    width: 122px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    gap: 10px;
    padding: 2px;
    box-sizing: border-box;
    background-image: linear-gradient(0deg, #e3ecff 0%, rgba(227, 242, 250, 0.35) 35%, #e2f7f5 100%), linear-gradient(#fafafa, #fafafa);
    background-blend-mode: normal, normal;
    .content_section_three_icon {
      width: 24px;
      height: 28px;
    }
    .content_section_three_title {
      font-size: 12px;
      color: #494949;
    }
    .content_section_three_number {
      font-size: 22px;
      color: #3b3b3b;
      cursor: pointer;
      > span {
        font-size: 12px;
        color: #666666;
      }
    }
  }
  .content_section_four {
    width: 190px;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
    padding: 6px;
    box-sizing: border-box;
    background-image: linear-gradient(0deg, #e3ecff 0%, rgba(227, 242, 250, 0.35) 35%, #e2f7f5 100%), linear-gradient(#f8f9fa, #f8f9fa);
    background-blend-mode: normal, normal;
    .content_section_four_title {
      font-size: 12px;
      color: #494949;
      display: flex;
      align-items: center;
      gap: 5px;
      .content_section_four_icon {
        width: 22px;
        height: 22px;
      }
    }
    .content_section_four_number {
      font-size: 18px;
      color: #3b3b3b;
      text-align: right;
      cursor: pointer;
      > span {
        font-size: 12px;
        color: #666666;
      }
    }
  }
}
.center_bottom_section {
  width: 100%;
  height: 110px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .center_bottom_section_content {
    width: 49.5%;
    height: 100%;
    background-color: #fff;
    border-radius: 10px;
    padding: 10px;
    box-sizing: border-box;
  }
  .center_bottom_section_card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .center_bottom_section_item_content {
      display: flex;
      gap: 10px;
      .center_bottom_section_item_icon {
        width: 24px;
        height: 24px;
      }
      .center_bottom_section_item {
        display: flex;
        flex-direction: column;
        gap: 10px;
        > div:first-child {
          font-size: 14px;
          color: #2f2f2f;
        }
        > div:last-child {
          font-size: 20px;
          color: #2f2f2f;
        }
      }
    }
    .center_bottom_section_item_line {
      width: 1px;
      height: 20px;
      background-image: linear-gradient(#ededed, #ededed), linear-gradient(#1fab85, #1fab85);
    }
  }
}
</style>
