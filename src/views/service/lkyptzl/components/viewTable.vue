<!--项目信息展示列表 -->
<template>
  <div v-show="isCity" class="container_table" v-loading="loading">
    <proTable
      ref="proTableRef"
      :data-callback="pageList"
      :toolButton="['other']"
      :request-api="pageMeeting"
      :request-auto="false"
      :search-col="4"
      :columns="tableColumns"
      @row-click="handleClickRow"
    >
      <template #tableHeader="scope">
        <el-button
          size="mini"
          :disabled="scope.selectedList.length != 1"
          type="primary"
          plain
          @click="handleInfom(scope.selectedList)"
        >
          项目信息查看
        </el-button>
        <el-button size="mini" type="primary" plain @click="handleExport(scope.selectedList)">
          导 出
        </el-button>
      </template>
    </proTable>
  </div>
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="'VIEW'"
  />
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick, defineEmits, defineExpose } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import {
  pageXmInfo,
  exportXmInfo,
  pageXmInfoByYssx,
  exportXmInfoByYssx,
  pageXmInfoByYssxForCard,
  exportXmInfoByYssxForCard
} from '@/api/lkyptzl/index'
import { formatNumValue } from '@/utils/utils'
import { ElNotification } from 'element-plus'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'

defineProps({
  isCity: {
    type: Boolean,
    default: false
  }
})
// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const loading = ref<boolean>(false)
const proTableRef = ref() // 初始化页面
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const userInfo = ref<any>() // 用户角色

// 列表查询
const pageMeeting = (params: any) => {
  loading.value = true

  const api: any =
    formData.value.isClick == '2'
      ? pageXmInfo
      : formData.value.isClick == '3'
      ? pageXmInfoByYssxForCard
      : pageXmInfoByYssx
  params = { ...params, ...formData.value }
  return api(params)
}
// 数据回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
const handleInfom = (val: any) => {
  selectData.value.id = val[0].xmId
  selectData.value.xmlx = val[0].proType
  editPageRef.value.isShowModal = true
}
// 单击行选中当前行
const handleClickRow = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 导出
const handleExport = (val: any) => {
  loading.value = true
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const api: any =
    formData.value.isClick == '2'
      ? exportXmInfo
      : formData.value.isClick == '3'
      ? exportXmInfoByYssxForCard
      : exportXmInfoByYssx
  api(formData.value).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    let filename = '项目明细表.xlsx' // 获取文件名
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: '50' },
  { prop: 'flowStatus', label: '流程状态', width: '180' },
  { prop: 'jhssnd', label: '计划实施年度', width: '120' },
  { prop: 'xmbm', label: '项目编码', width: '180' },
  { prop: 'xmmc', label: '项目名称', width: '280' },
  { prop: 'sfgmb', label: '是否规模包', width: '100' },
  // { prop: "gmbbm", label: "规模包编码", width: "180" },
  // { prop: "gmbmc", label: "规模包名称", width: "200" },
  // { prop: "isPackName", label: "是否打捆项目", width: "100" },
  { prop: 'proTypeName', label: '项目类型', width: '200' },
  { prop: 'yjdw', label: '一级单位', width: '280' },
  { prop: 'ejdw', label: '二级单位', width: '280' },
  // { prop: "apply_center", label: "成本中心", width: "280" },
  {
    prop: 'amount',
    label: '申报金额（万元）',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  // { prop: "jhssnd", label: "计划实施年份", width: "140" },
  { prop: 'zdtx', label: '重点投向', width: '180' },
  { prop: 'zgkbm', label: '省归口部门', width: '180' },
  { prop: 'yssxmc', label: '预算事项名称', width: '200' },
  // { prop: "yssx_remark", label: "预算事项说明", width: "280" },
  // { prop: "yjfl", label: "一级分类", width: "140" },
  // { prop: "ejfl", label: "二级分类", width: "140" },
  { prop: 'sjfl', label: '三级分类', width: '140' }
  // { prop: "ssbm", label: "实施部门", width: "180" },
  // { prop: "xmssr", label: "项目实施人", width: "180" },
  // { prop: "zyfjftrtjfw", label: "研发投入统计范围", width: "180" },
  // { prop: "zyqcg", label: "预期成果", width: "180" },
  // { prop: "jryftrbfb", label: "研发投入百分比", width: "180" },
  // { prop: "bfbjsfssm", label: "百分比说明", width: "180" },
  // { prop: "sfaqsc", label: "是否安全生产", width: "140" },
  // { prop: "aqscfylx", label: "安全生产费用类型", width: "180" },
  // { prop: "xllx", label: "线路类型", width: "140" },
  // { prop: "dydj", label: "电压等级", width: "140" },
  // { prop: "ssnr", label: "项目实施内容", width: "280" },
  // { prop: "fj1", label: "项目建议书（数量）", width: "140" },
  // { prop: "fj2", label: "可研（数量）", width: "140" },
  // { prop: "fj3", label: "批复文件（数量）", width: "140" }
])

//

defineExpose({
  proTableRef,
  formData
})
</script>
<style scoped lang="less">
.container_table {
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
</style>
