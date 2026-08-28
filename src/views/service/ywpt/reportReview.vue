<!-- 项目评审意见-->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <div :style="{ maxHeight: isShowData ? '60vh' : '80vh' }">
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        @search="searchHandle"
        @reset="resetHandle"
        @row-click="handerClickTable"
        @row-dblclick="handerProjectInfo"
        :request-api="getListPageData"
        :request-auto="false"
        :search-col="4"
        :columns="tableColumns"
        :isShowTable="isShowTable"
        @selection-change="selectionChange"
      >
        <!-- 表格 header 按钮 -->
        <template #tableHeader="scope">
          <el-button size="mini" type="primary" plain @click="exportHandle(scope.selectedList)">导 出</el-button>
          <el-button size="mini" type="primary" plain @click="showProjectInfo(scope.selectedList)">项目信息查看</el-button>
        </template>
        <template #headerButton>
          <div style="position: relative">
            <span @click="isShowTable = !isShowTable" style="position: absolute; left: 100px; top: 13px; z-index: 999 !important">
              <i :class="isShowTable ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" style="cursor: pointer"></i>
            </span>
            <el-tabs>
              <el-tab-pane label="项目评审信息" name="0"></el-tab-pane>
            </el-tabs>
          </div>
        </template>
      </proTable>
    </div>
    <div :style="{ maxHeight: isShowTable ? '25vh' : '65vh' }">
      <expertReview @handle-table="handleTable" :pageDataList="pageDataList" />
    </div>
  </div>
  <CentralizedModification :get-api="'LHHS'" ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'"></CentralizedModification>
</template>
<script lang="tsx">
export default {
  name: '/service/ywpt/reportReview'
}
</script>
<script setup lang="tsx">
import { onActivated, ref, reactive, nextTick, watch, onMounted } from 'vue'
import { pageExpertReviewInfo, leaderReviewPageXmInfo, leaderReviewExportXmInfo } from '@/api/service/jointReview'
import { ElNotification, ElMessage } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { formatNumValue } from '@/utils/utils'
import { getEjdwData, getYjdwData } from '@/api/service/expertinformation'
import expertReview from '@/views/service/ywpt/components/expertReview.vue' //专家评审信息
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'

// 初始化页面
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const proTableRef = ref<any>()
const searchData = ref<any>() //查询条件
const pageDataList = ref<any[]>([]) //专家评审意见表格数据
var timer: any
const isShowTable = ref(true) //显示表格
const isShowData = ref(true)
const route = useRoute()

const userInfo = ref<any>()
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位

onMounted(async () => {
  await initParamLists()
})
// 获取公共代码
const initParamLists = async () => {
  isShowPage.value = false
  userInfo.value = JSON.parse(decrypt(route.query.Meetingparams as string))
  isShowData.value = true
  isShowTable.value = true
  levelOne.value.length = 0 //清空单位
  pageDataList.value.length = 0
  proTableRef.value?.clearSelection()
  // 一级单位
  const res = await getYjdwData()
  if (res.success && res.data.length != 0) {
    isShowPage.value = true
    levelOne.value.push(...res.data)
    proTableRef.value?.getTableList()
  }
}
const selectChange = (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  levelTwo.value.length = 0
  const { id }: any = levelOne.value.find((item: any) => item.code === val)
  getEjdwData(id).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      levelTwo.value.push(...res.data)
    }
  })
}
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  return val
}
const handleTable = (val: any) => {
  isShowData.value = val.value
}
// 重置
const resetHandle = () => {
  levelTwo.value.length = 0
  pageDataList.value.length = 0
  proTableRef.value?.clearSelection()
}
// 搜索
const searchHandle = (val: any) => {
  pageDataList.value.length = 0
  proTableRef.value?.clearSelection()
}
// 列表查询回调
const getListPageData = async (params: any) => {
  params.meetingId = userInfo.value.meetingId
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  if (params['xmbmList'].length > 1000) {
    return ElMessage.error('项目编码最大支持1000条！')
  }
  searchData.value = params
  loading.value = true
  return leaderReviewPageXmInfo(searchData.value)
}
// 双击行
const handerProjectInfo = async (val: any) => {
  clearTimeout(timer)
  selectData.value.id = val.xmId
  selectData.value.xmlx = val.pro_type_id
  editPageRef.value.isShowModal = true
}
//项目信息查看
const showProjectInfo = async (selectedList: any) => {
  if (selectedList.length != 1) {
    ElMessage({
      type: 'warning',
      message: '请选择一条数据'
    })
    return
  }
  let val = selectedList[0]
  selectData.value.id = val.xmId
  selectData.value.xmlx = val.pro_type_id
  editPageRef.value.isShowModal = true
}
// 单选
const selectionChange = (selection: any) => {
  if (selection.length > 1) {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
// 点击行查看点击项目专家的评审信息
const handerClickTable = (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
  clearTimeout(timer)
  timer = setTimeout(async () => {
    let params: any = {
      xmId: val.xmId,
      limit: 100,
      page: 1,
      meetingId: userInfo.value.meetingId,
      isPack: val.isPack
    }
    let res: any = await pageExpertReviewInfo(params)
    if (res.success) {
      pageDataList.value = res.data.records
    }
  }, 300)
}

// 导出
const exportHandle = (selectedList: any) => {
  loading.value = true
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  leaderReviewExportXmInfo(searchData.value).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '联合会审项目清单表.xlsx'
    if (res.headers && res.headers['content-disposition']) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
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
  { type: 'index', width: 50, label: '序号' },
  { prop: 'review_expert_name', label: '专家组长', width: '80' },
  {
    prop: 'review_opinion',
    label: '终评意见',
    width: '120'
  },
  { prop: 'review_reason', label: '终评意见说明', width: '200' },
  { prop: 'review_time', label: '终评时间', width: '150' },
  { prop: 'sfthName', label: '是否退回', width: '80' },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '180',
    search: {
      order: 1,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    width: '180',
    search: { el: 'input', order: 2 }
  },
  { prop: 'sfgmb', label: '是否规模包', width: '100' },
  { prop: 'gmbbm', label: '规模包编码', width: '180' },
  { prop: 'gmbmc', label: '规模包名称', width: '200' },
  { prop: 'pro_type_name', label: '项目类型', width: '280' },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: selectChange }, order: 3 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    search: { el: 'select', order: 4 },
    enum: levelTwo.value,
    width: '180',
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
  },
  { prop: 'apply_center', label: '成本中心', width: '280' },
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
  { prop: 'jhssnd', label: '计划实施年份', width: '140' },
  { prop: 'zdtx', label: '重点投向', width: '180' },
  { prop: 'zgkbm', label: '省归口部门', width: '180' },
  { prop: 'yssxmc', label: '预算事项名称', width: '200' },
  { prop: 'yssx_remark', label: '预算事项说明', width: '280' },
  { prop: 'yjfl', label: '一级分类', width: '140' },
  { prop: 'ejfl', label: '二级分类', width: '140' },
  { prop: 'sjfl', label: '三级分类', width: '140' },
  { prop: 'ssbm', label: '实施部门', width: '180' },
  { prop: 'xmssr', label: '项目实施人', width: '180' },
  { prop: 'zyfjftrtjfw', label: '研发投入统计范围', width: '180' },
  { prop: 'zyqcg', label: '预期成果', width: '180' },
  { prop: 'jryftrbfb', label: '研发投入百分比', width: '180' },
  { prop: 'bfbjsfssm', label: '百分比说明', width: '180' },
  { prop: 'sfaqsc', label: '是否安全生产', width: '140' },
  { prop: 'aqscfylx', label: '安全生产费用类型', width: '180' },
  { prop: 'xllx', label: '线路类型', width: '140' },
  { prop: 'dydj', label: '电压等级', width: '140' },
  { prop: 'ssnr', label: '项目实施内容', width: '280' },
  { prop: 'fj1', label: '项目建议书（数量）', width: '140' },
  { prop: 'fj2', label: '可研（数量）', width: '140' },
  { prop: 'fj3', label: '批复文件（数量）', width: '140' }
])
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  overflow: hidden;
  overflow-y: auto;
  .table {
    padding-top: 10px;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .opeartion {
    margin-bottom: 10px;
  }
  .searchBox {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
.commit {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: start;

  .commit_form {
    display: flex;
    margin-bottom: 30px;
    .type_name {
      width: 150px;
      text-align: right;
      margin: 0 10px 0 0;
      .isRed {
        color: red;
        margin-right: 5px;
      }
    }
  }
}
</style>
