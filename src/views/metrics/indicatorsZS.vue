<!-- 成本性项目预算结算率统计指标确认 -->
<template>
  <div class="container" v-show="isShowPage">
    <el-date-picker
      @change="changeDateHandle"
      :clearable="false"
      format="YYYY-MM"
      value-format="YYYY-MM"
      :default-value="new Date()"
      v-model="currentYearMonth"
      type="month"
      style="position: absolute; right: 80px; top: 15px; z-index: 999; width: 130px"
    />
    <el-tabs v-model="tabMsg" type="border-card" v-loading="loading">
      <el-tab-pane label="单位统计" name="1" v-if="JSON.stringify(tabList).includes('单位统计')">
        <div style="height: 80vh">
          <proTable ref="tableDWRef" :pagination="false" :data="tableDataDW" :columns="DWColumns">
            <template #tableHeader="scope">
              <el-button type="primary" size="mini" plain @click="handlerBtn(scope.selectedList)">导 出</el-button>
            </template>
          </proTable>
        </div>
      </el-tab-pane>
      <el-tab-pane label="类型统计" name="2" v-if="JSON.stringify(tabList).includes('类型统计')">
        <div style="height: 80vh">
          <proTable ref="tableLXRef" :pagination="false" :data="tableDataLX" :columns="XMColumns">
            <template #tableHeader="scope">
              <el-button type="primary" size="mini" plain @click="handlerBtn(scope.selectedList)">导 出</el-button>
            </template>
          </proTable>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="tsx">
export default {
  name: '/metrics/indicatorsZS'
}
</script>
<script setup lang="tsx">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import proTable from '@/components/ProTable/index.vue' //表格组件
import { onMounted, ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { getOfficialData } from '@/api/metrics/index'
import { getPublicData } from '@/api/common' //公共代码
import { exportXlsx } from '@/utils/export'

const userDialogRef = ref() // 用户角色
const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
const tabList = ref<any>([])
const fromParms = reactive<any>({ nd: '', yd: '' }) //接口入参
const currentYearMonth = ref<any>('') //当前年月
const tabMsg = ref('1') //当前页签位置
const tableDWRef = ref() //按单位ref
const tableLXRef = ref() //按项目类型ref
const tableDataDW = ref<any[]>([]) //按单位数据
const tableDataLX = ref<any[]>([]) //按项目类型数据
// 方法
onMounted(async () => {
  currentYearMonth.value = getCurrentMonth()
  await getDataApi()
  await userDialogRef.value.getUser()
})
const getCurrentMonth = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  return `${year}-${month.toString().padStart(2, '0')}`
}
// 按钮点击事件
const handlerBtn = async (selectedList: any) => {
  const text: any = tabMsg.value == '1' ? '按单位' : '按类型'
  //导出的数据
  const dataList: any = (tabMsg.value == '1' ? tableDataDW.value : tableDataLX.value).map(({ statItem, wcz, statValue, lastStatValue }: any) => ({
    statItem,
    wcz,
    statValue,
    lastStatValue
  }))
  // 导出的表头
  const headerList = (tabMsg.value == '1' ? DWColumns : XMColumns).map(({ label }: any) => label)
  exportXlsx(headerList, dataList, `${text}成本性项目预算结算率统计指标表.xlsx`)
}
// 日期选择
const changeDateHandle = async (val: any) => {
  await getDataApi()
}

// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      isShowPage.value = true
      initParamLists()
    }
  } catch (e) {
    console.error(e)
  }
}
// 按单位列表项
const DWColumns = reactive<any>([
  { prop: 'statItem', label: '单位', width: '280' },
  {
    prop: 'wcz',
    label: '完成值(万元)',
    align: 'right',
    headerAlign: 'center',
    width: '120'
  },
  { prop: 'statValue', label: '当年结算率(%)', width: '180' },
  { prop: 'lastStatValue', label: '同期结算率(%)', width: '180' }
])
// 按类型列表项
const XMColumns = reactive<any>([
  { prop: 'statItem', label: '项目类型', width: '280' },
  {
    prop: 'wcz',
    label: '完成值(万元)',
    align: 'right',
    headerAlign: 'center',
    width: '120'
  },
  { prop: 'statValue', label: '当年结算率(%)', width: '180' },
  { prop: 'lastStatValue', label: '同期结算率(%)', width: '180' }
])
const initParamLists = async () => {
  // 获取公共代码
  const res = await getPublicData('JSL_YQ')
  if (res.success) {
    tabList.value = res.data
  }
}

// 数据接口调用
const getDataApi = async () => {
  loading.value = true
  if (currentYearMonth.value != '') {
    const yearAndMonth: any = currentYearMonth.value.split('-')
    fromParms.nd = yearAndMonth[0]
    fromParms.yd = Number(yearAndMonth[1])
    let res: any = await getOfficialData({ ...fromParms, statType: '1' })
    let root: any = await getOfficialData({ ...fromParms, statType: '2' })
    if (res.success && root.success) {
      loading.value = false
      numReturn(res.data)
      numReturn(root.data)
      tableDataDW.value = res.data
      tableDataLX.value = root.data
    } else {
      loading.value = false
      ElMessage.error(res.msg)
      ElMessage.error(root.msg)
    }
  }
}
// 数值转换
const numReturn = (array: any[]) => {
  const tableData = array ? array : []
  tableData.forEach((item: any) => {
    item.statValue = item.statValue != null ? Number(item.statValue).toFixed(2) : '-'
    item.lastStatValue = item.lastStatValue != null ? Number(item.lastStatValue).toFixed(2) : '-'
    item.wcz = item.wcz != null ? Number(item.wcz).toFixed(4) : '-'
  })
}
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  position: relative;
}
</style>
