<template>
  <div class="page_top">
    <template v-for="(item, index) in meunList" :key="index">
      <div
        class="page_top_btn"
        :class="'page_top_btn' + index"
        :style="{
          marginTop: index == clickTab ? '-10px' : '',
          boxShadow: index == clickTab ? '0px 8px 16px  rgba(0,0,0,0.2)' : ''
        }"
        v-loading="item.loading"
      >
        <div class="page_top_btn_line" @click="clickAppNo(item, index)">
          <div class="page_top_btn_con">
            <div class="page_top_btn_con_top" :style="{ color: item.color }">
              <span class="page_top_btn_con_top_title">{{ item.name }}</span>
            </div>
            <div class="page_top_btn_con_other" @click.stop="clickHistroy(item, index, 'lj')">
              <span class="countType"> {{ props.statType == 'xmsl' ? item.ljName : item.ljCount }}： </span>
              <span class="page_top_btn_con_count" :style="{ color: item.color }">
                {{ props.statType == 'xmsl' ? item.ljCode : item.ljValue }}
              </span>
              <span class="page_top_btn_con_count_unit">
                {{ props.statType == 'xmsl' ? '个' : '万元' }}
              </span>
            </div>
            <div class="page_top_btn_con_other" @click.stop="clickHistroy(item, index, 'current')" style="font-weight: bolder">
              <span class="countType"> {{ props.statType == 'xmsl' ? item.currentName : item.currentCount }}： </span>
              <span class="page_top_btn_con_count" :style="{ color: item.color }">
                {{ props.statType == 'xmsl' ? item.currentCode : item.currentValue }}
              </span>
              <span class="page_top_btn_con_count_unit">
                {{ props.statType == 'xmsl' ? '个' : '万元' }}
              </span>
            </div>
            <div class="page_top_btn_con_other" @click.stop="clickHistroy(item, index, 'yck')">
              <span class="countType"> {{ props.statType == 'xmsl' ? item.accruedName : item.accruedCount }}： </span>
              <span class="page_top_btn_con_count" :style="{ color: item.color }">
                {{ props.statType == 'xmsl' ? item.accruedCode : item.accruedValue }}
              </span>
              <span class="page_top_btn_con_count_unit">
                {{ props.statType == 'xmsl' ? '个' : '万元' }}
              </span>
            </div>
            <div>
              <!-- <span class="page_top_btn_con_count_type"
                >(
                <template v-for="(cont, index) in item.otherCont" :key="index">
                  <span class="countTypeOther">{{ cont.name }}</span>
                  <span class="page_top_btn_con_count" :style="{ color: item.color }" @click.stop="clickHistroy(item, index, cont.code)">
                    {{ props.statType == 'xmsl' ? cont.count : cont.value }}
                  </span>
                  <span class="page_top_btn_con_count_unit">
                    {{ props.statType == 'xmsl' ? '个' : '万元' }}
                  </span>
                  <span v-if="item.otherCont.length > 1 && item.otherCont.length - 1 != index">、</span> </template
                >)</span
              > -->
            </div>
          </div>
        </div>
        <div class="page_top_btn_tab" :style="{ color: item.tabColor }">
          <div class="page_top_btn_tab_action">
            <div class="page_top_btn_tab_type">业务操作：</div>
            <div v-for="(root, num) in item.tab" :key="num">
              <span class="page_top_btn_tab_click" @click="handleRequired(root)">
                {{ root.name }}
              </span>
              <span v-if="num != item.tab.length - 1">、</span>
            </div>
            <el-popover v-if="item.other.length != 0" :width="170" placement="bottom" v-model:visible="item.showPopover" trigger="click">
              <template #reference>
                <i class="el-icon-arrow-right arrowClick"></i>
              </template>
              <div class="more-items-popover" :style="{ color: item.tabColor }">
                <template v-for="operation in item.other" :key="operation.id">
                  <div class="items-popover" @click="handleRequired(operation)">{{ operation.name }}</div>
                </template>
              </div>
            </el-popover>
          </div>
          <div class="page_top_btn_tab_action" :style="{ color: item.tabColor }">
            <div class="page_top_btn_tab_type">业务查询：</div>
            <div v-for="(root, num) in item.search" :key="num">
              <span class="page_top_btn_tab_click" @click="handleRequired(root)">
                {{ root.name }}
              </span>
              <span v-if="num != item.search.length - 1">、</span>
            </div>
            <el-popover v-if="item.any.length != 0" :width="170" placement="bottom" v-model:visible="item.showPopover1" trigger="click">
              <template #reference>
                <i class="el-icon-arrow-right arrowClick"></i>
              </template>
              <div class="more-items-popover" :style="{ color: item.tabColor }">
                <template v-for="operation in item.any" :key="operation.id">
                  <div class="items-popover" @click="handleRequired(operation)">{{ operation.name }}</div>
                </template>
              </div>
            </el-popover>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
export default {
  name: '/lkyptzl/components/meun'
}
</script>
<script setup lang="ts">
import { ref, defineExpose, defineEmits, defineProps, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import baseService from '@/service/baseService'
import { xmIndicatorDataPage } from '@/api/lkyptzl/index'
import { ElMessage } from 'element-plus'

const props = defineProps({
  userInfo: null,
  statType: {
    type: String,
    default: 'xmsl'
  }
})
const store = useStore()
const router = useRouter()
const emits = defineEmits(['changeAppNo', 'yssxInfo'])
const clickTab = ref<any>(0)
const meunList = ref<any[]>([
  {
    name: '需求资源库',
    code: 'XQK',
    unit: '(个)',
    ljName: '累计入库数量',
    ljCode: '0',
    ljCount: '累计入库金额',
    ljValue: '0.00',
    currentName: '当前在库数量',
    currentCode: '0',
    currentCount: '当前在库金额',
    currentValue: '0.00',
    accruedName: '已出库数量',
    accruedCode: '0',
    accruedCount: '已出库金额',
    accruedValue: '0.00',
    otherCont: [
      {
        name: '其中续建结转',
        count: '0',
        value: '0.00',
        code: 'xjjz'
      }
    ],
    color: '#277f7b',
    tabColor: '#30938f',
    tab: [],
    other: [],
    search: [],
    any: [],
    showPopover: false,
    showPopover1: false,
    loading: true
  },
  {
    name: '联合会审',
    code: 'LHHSK',
    unit: '(个)',
    ljName: '累计纳入会审数量',
    ljCode: '0',
    ljCount: '累计纳入会审金额',
    ljValue: '0.00',
    currentName: '当前联合会审数量',
    currentCode: '0',
    currentCount: '当前联合会审金额',
    currentValue: '0.00',
    accruedName: '联合会审通过数量',
    accruedCode: '0',
    accruedCount: '联合会审通过金额',
    accruedValue: '0.00',
    otherCont: [
      {
        name: '其中续建结转',
        count: '0',
        value: '0.00',
        code: 'xjjz'
      },
      {
        name: '跳过会审',
        count: '0',
        value: '0.00',
        code: 'skipHs'
      }
    ],
    color: '#1f7187',
    tabColor: '#2b95b1',
    tab: [],
    other: [],
    search: [],
    any: [],
    showPopover: false,
    showPopover1: false,
    loading: true
  },
  {
    name: '项目储备库',
    code: 'CBK',
    unit: '(个)',
    ljName: '累计入库数量',
    ljCode: '0',
    ljCount: '累计入库金额',
    ljValue: '0.00',
    currentName: '当前在库数量',
    currentCode: '0',
    currentCount: '当前在库金额',
    currentValue: '0.00',
    accruedName: '已出库数量',
    accruedCode: '0',
    accruedCount: '已出库金额',
    accruedValue: '0.00',
    otherCont: [
      {
        name: '其中续建结转',
        count: '0',
        value: '0.00',
        code: 'xjjz'
      }
    ],
    color: '#1c5789',
    tabColor: '#437dae',
    tab: [],
    other: [],
    search: [],
    any: [],
    showPopover: false,
    showPopover1: false,
    loading: true
  }
])

const handleRequired = async (operation: any) => {
  if (props.userInfo) {
    let res = await baseService.get(`/sysMenu/getButtonList?menuCode=${operation.outsideMenu}&spRoleId=${props.userInfo.id}`)
    if (res.success) {
      if (res.success) {
        store.commit('setPermissions', res.data)
      }
    }
  }
  router.push({
    name: operation.url,
    params: { formJsc: '1' }
  })
  meunList.value.forEach((item: any) => {
    item.showPopover = false
    item.showPopover1 = false
  })
}

const cardApi = (params: any) => {
  meunList.value.forEach(async (root: any) => {
    const apiParams = {
      ...params,
      appNo: root.code
    }
    root.loading = true
    let res: any = await xmIndicatorDataPage({ ...apiParams })
    if (res.success && res.data) {
      root.loading = false
      root.ljCode = res.data.ljXmsl
      root.ljValue = Number(res.data.ljAmount).toFixed(2)
      root.currentCode = res.data.currentXmsl
      root.currentValue = Number(res.data.currentAmount).toFixed(2)
      root.accruedCode = res.data.yckXmsl
      root.accruedValue = Number(res.data.yckAmount).toFixed(2)
      if (res.data.xjjzXmsl != undefined) {
        root.otherCont[0].count = res.data.xjjzXmsl
        root.otherCont[0].value = Number(res.data.xjjzAmount).toFixed(2)
      }
      if (res.data.skipHsXmsl != undefined) {
        root.otherCont[1].count = res.data.skipHsXmsl
        root.otherCont[1].value = Number(res.data.skipHsAmount).toFixed(2)
      }
    } else {
      root.loading = false
      ElMessage.error(res.msg)
    }
  })
}

const clickHistroy = (item: any, index: any, val: any) => {
  item.indicatorCode = val
  emits('yssxInfo', item)
}
const clickAppNo = (val: any, index: any) => {
  clickTab.value = index
  emits('changeAppNo', val.code)
}

defineExpose({
  meunList,
  cardApi
})
</script>
<style lang="less" scoped>
.page_top {
  width: 100%;
  height: 230px;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;

  .page_top_btn0 {
    background: url('@/assets/images/xqk.png') no-repeat;
    background-size: 100% 100%;
  }

  .page_top_btn1 {
    background: url('@/assets/images/lhhs.png') no-repeat;
    background-size: 100% 100%;
  }

  .page_top_btn2 {
    background: url('@/assets/images/cbk.png') no-repeat;
    background-size: 100% 100%;
  }

  .page_top_btn:hover {
    margin-top: -10px;
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.2);
  }

  .page_top_btn {
    width: 32%;
    // height: 230px;
    height: 200px;
    border-radius: 8px;
    box-sizing: border-box;

    .page_top_btn_line {
      width: 90%;
      display: flex;
      padding: 10px 0 8px 28%;
      margin: 0 auto;
      border-bottom: 1px dashed #888;
      box-sizing: border-box;
      cursor: pointer;

      .page_top_btn_con {
        .page_top_btn_con_top {
          .page_top_btn_con_top_title {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 5px;
          }
        }

        .page_top_btn_con_other {
          font-size: 14px;
          color: #aaa;
          margin-top: 3px;
        }
      }
    }

    .page_top_btn_tab {
      padding-left: 24px;

      .page_top_btn_tab_action {
        display: flex;
        margin-top: 5px;
        align-items: center;
        position: relative;

        .page_top_btn_tab_type {
          width: 70px;
          font-weight: bold;
        }

        .page_top_btn_tab_click {
          cursor: pointer;
        }

        .page_top_btn_tab_click:hover {
          font-weight: bold;
        }

        .page_top_btn_arrow_click {
          position: relative;
        }
      }
    }
  }
}

.arrowClick {
  cursor: pointer;
}

.items-popover {
  margin-bottom: 10px;
  cursor: pointer;
}

.items-popover:hover {
  font-weight: bold;
}

.countType {
  min-width: 100px;
  max-width: 126px;
  display: inline-block;
  text-align: left;
}
.countTypeOther {
  max-width: 126px;
  display: inline-block;
  text-align: left;
  color: #aaa;
}

.page_top_btn_con_count {
  font-size: 18px;
  margin: 0 5px;
  color: #aaa;
}

.page_top_btn_con_count_unit {
  margin-right: 5px;
  color: #aaa;
}
.page_top_btn_con_count_type {
  color: #aaa;
}
</style>
