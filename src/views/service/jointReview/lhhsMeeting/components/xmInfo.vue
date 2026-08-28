<!-- 项目展示 -->
<template>
  <vxe-modal ref="dialogFormRef" fullscreen show-zoom v-model="isShowModel" :destroy-on-close="true" :title="props.title" :width="800" :height="750" :close-on-press-escape="false" @close="closeHandle">
    <div class="expertName">组长：{{ meetingInfo?.expertName }}</div>
    <proTable ref="proTableRef" @row-click="handerClickTable" :data-callback="pageList" @search="searchHandle" @reset="resetHandle" :row-style="rowStyle" :request-api="getListPageData" :request-auto="true" :search-col="4" :columns="tableColumns">
      <template #tableHeader="scope">
        <el-button size="mini" type="primary" :disabled="scope.selectedListIds.length != 1" plain @click="handleRmark(scope.selectedList)"> 终 评 </el-button>
        <el-button size="mini" type="primary" plain @click="unitDescImportHandle"> 导入终评意见 </el-button>
        <el-button size="mini" type="primary" plain :disabled="!scope.isSelected" @click="handleReview(scope.selectedList)"> 批量终评 </el-button>
        <el-button size="mini" type="primary" plain :disabled="!scope.isSelected" @click="passPro(scope.selectedList)"> 退 回 </el-button>
      </template>
    </proTable>
  </vxe-modal>
  <ImportExcel ref="importRef" />
  <proModel ref="modelForm" :title="'联合会审终评意见'" :label="'专家组长终评意见'" @show-modal="pushMsgHandle" @get-reason="getReason" />
  <select-modal ref="selectModalRef" @show-modal="showModal" :title="'联合会审终评意见'" :label="'专家组长终评意见'" :options="options" />
  <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag"></review-modal>
</template>
<script lang="tsx">
export default {
  name: 'xmInfo'
}
</script>
<script setup lang="tsx">
import { onActivated, ref, reactive, nextTick } from 'vue'
import { leaderReviewPageXmInfo, canLeaderReview, saveLeaderReviewRecord, saveLeaderReviewRecordNew, getLeaderReviewRecordImportTemplate, importLeaderReviewRecord, canLeaderReviewTh, leaderReviewTh, getExpertReviewReason } from '@/api/service/jointReview'
import { ElMessage } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { formatNumValue } from '@/utils/utils'
import reviewModal from '@/components/yssxTable/reviewModal.vue'
import proModel from '@/views/service/ywpt/components/modelReview.vue'
import selectModal from '@/views/service/ywpt/components/selectModalPs.vue'
import { getEjdwData, getYjdwData } from '@/api/service/expertinformation'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useStore } from 'vuex'

interface meetingVo {
  expertName: string
  expertId: string
  meetingId: string
}

interface propsVo {
  title: string
  pageApi: (params: any) => Promise<any> // 表格接口
  userInfo: any
  meetingInfo: meetingVo
}
const props = defineProps<propsVo>()

// 初始化页面
const isShowModel = ref(false)
const importRef = ref() //导入
const proTableRef = ref<any>()
const xmInfoList = ref<any>([]) // 选择的数据
const expertName = ref('') //专家名字
const searchData = ref<any>() //查询条件
const pageDataList = ref<any>([]) //专家评审意见表格数据
const modelForm = ref<any>()
const returnModal = ref()
const selectModalRef = ref<any>()
const reason = ref<any[]>([])
const review = ref<any>()
const store = useStore()
const options = ref<any[]>([
  {
    name: '通过',
    code: '1'
  },
  {
    name: '不通过',
    code: '0'
  }
])

const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
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

// 方法
// 数据处理回调
const pageList = (val: any) => {
  val.records.forEach((item: any) => {
    item.yjdwName = item.yjdw
    item.ejdwName = item.ejdw
    item.isPackName = item.isPack == '1' ? '是' : '否'
  })
  return val
}
const closeHandle = () => {
  isShowModel.value = false
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
  expertName.value = props.meetingInfo.expertName
  params.meetingId = props.meetingInfo.meetingId
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  searchData.value = params
  return leaderReviewPageXmInfo(searchData.value)
}

// 行样式
const rowStyle = ({ row }: any) => {
  if (row.bhcs >= 3) {
    return 'color:red;'
  }
  if (row.bhcs > 0 && row.bhcs < 3) {
    return 'color:#E6A23C;'
  }
  if (row.sfth == '1') {
    return {
      backgroundColor: 'rgba(232, 234, 236,0.7)'
    }
  }
}

// 维护评审意见
const handleRmark = async (selectedList: any) => {
  // 获取选中的数据
  xmInfoList.value.length = 0
  review.value = selectedList[0].review_reason
  selectedList.forEach((item: any) => {
    xmInfoList.value.push({
      originXmId: item.originXmId,
      xmId: item.xmId,
      xmbm: item.xmbm,
      xmmc: item.xmmc
    })
  })
  let res: any = await canLeaderReview({
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value
  })
  if (res.data.success) {
    modelForm.value.isShowModel = true
    modelForm.value.rmarkData.reason = selectedList[0].review_reason
  } else {
    let msg = res.data.msg.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

// 获取专家评审意见
const getReason = async () => {
  reason.value.length = 0
  const params = {
    meetingId: props.meetingInfo.meetingId,
    xmId: xmInfoList.value[0].xmId
  }
  if (review.value) {
    reason.value.push(review.value)
  }
  const res: any = await getExpertReviewReason(params)
  if (res.success) {
    res.data.forEach((item: any) => {
      reason.value.push(`${item.major}：${item.reasonList.join(';')}`)
    })
    modelForm.value.rmarkData.reason = reason.value.join('\n')
  } else {
    ElMessage.error(res.msg)
  }
}

//保存
const pushMsgHandle = (val: any) => {
  saveLeaderReviewRecord({
    ...val,
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value
  }).then((res: any) => {
    if (res.success) {
      modelForm.value?.closeHandle()
      ElMessage({ type: 'success', message: '保存成功' })
      proTableRef.value?.getTableList()
      proTableRef.value?.clearSelection()
    } else {
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

//批量保存
const showModal = (val: any) => {
  saveLeaderReviewRecordNew({
    reviewOpinion: val,
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value
  }).then((res: any) => {
    if (res.success) {
      selectModalRef.value.isShowModel = false
      ElMessage({ type: 'success', message: '保存成功' })
      proTableRef.value?.getTableList()
      proTableRef.value?.clearSelection()
    } else {
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

// 退回意见
const returnMag = async (val: any) => {
  const params = {
    ...val,
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value,
    spRoleId: props.userInfo.spRoleId,
    userId: store.getters.getUserMsg.id,
    spOrgId: props.userInfo.deptId
  }
  let res: any = await leaderReviewTh(params)
  if (res.success) {
    ElMessage.success('退回成功！')
    returnModal.value?.closeHandle()
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
  } else {
    ElMessage.error(res.msg)
  }
}

// 退回
const passPro = async (selectedList: any) => {
  // 获取选中的数据
  xmInfoList.value = selectedList.map(({ xmId, xmbm, xmmc, originXmId }: any) => ({
    xmId,
    xmbm,
    xmmc,
    originXmId
  }))
  let res: any = await canLeaderReviewTh({
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value
  })
  if (res.data.success) {
    returnModal.value.isShowModel = true
  } else {
    let msg = res.data.msg.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

// 组长批量终评
const handleReview = async (selectedList: any) => {
  // 获取选中的数据
  xmInfoList.value.length = 0
  selectedList.forEach((item: any) => {
    xmInfoList.value.push({
      originXmId: item.originXmId,
      xmId: item.xmId,
      xmbm: item.xmbm,
      xmmc: item.xmmc
    })
  })
  let res: any = await canLeaderReview({
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId,
    xmInfoList: xmInfoList.value,
    reasonRequired: true
  })
  if (res.data.success) {
    selectModalRef.value.isShowModel = true
  } else {
    let msg = res.data.msg.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}
//导入终评意见
const unitDescImportHandle = () => {
  let newParmas = {
    expertId: props.meetingInfo.expertId,
    meetingId: props.meetingInfo.meetingId
  }

  let tempApi: any = getLeaderReviewRecordImportTemplate
  let importApi: any = importLeaderReviewRecord
  if (!importApi) return
  let params = {
    title: '终评意见表',
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: proTableRef.value?.getTableList,
    specialorgid: props.userInfo.deptId
  }
  importRef.value.acceptParams(params)
  proTableRef.value?.reset()
  proTableRef.value?.clearSelection()
}
// 点击行查看点击项目专家的评审信息
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 页面初始化
onActivated(() => {
  showpages()
  initParamLists()
})
const showpages = () => {
  pageDataList.value.length = 0
}

// 获取公共代码
const initParamLists = async () => {
  // 一级单位
  levelOne.value.length = 0 //清空单位
  const res = await getYjdwData()
  if (res.success && res.data.length != 0) {
    levelOne.value.push(...res.data)
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
  }
}

const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'review_expert_name', label: '专家组长', width: '80' },
  {
    prop: 'review_opinion',
    label: '专家组长终评意见',
    width: '120'
  },
  { prop: 'review_reason', label: '专家组长终评意见说明', width: '200' },
  { prop: 'sfthName', label: '是否退回', width: '100' },
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
    width: '280',
    search: { el: 'input', order: 2 }
  },
  { prop: 'sfgmb', label: '是否规模包', width: '100' },
  { prop: 'gmbbm', label: '规模包编码', width: '180' },
  { prop: 'gmbmc', label: '规模包名称', width: '200' },
  { prop: "isPackName", label: "是否打捆项目", width: "100" },
  { prop: 'pro_type_name', label: '项目类型', width: '280' },
  {
    prop: 'yjdw',
    label: '一级单位',
    isShow: false,
    search: { el: 'select', props: { onChange: selectChange }, order: 3 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    isShow: false,
    search: { el: 'select', order: 4 },
    enum: levelTwo.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'yjdwName',
    label: '一级单位',
    width: '180'
  },
  {
    prop: 'ejdwName',
    label: '二级单位',
    width: '180'
  },
  {
    prop: 'expertReviewStatus',
    label: '是否已专家评审',
    isShow: false,
    search: { el: 'select', order: 5 },
    enum: [
      { code: '1', name: '已专家评审' },
      { code: '0', name: '未专家评审' }
    ],
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'leaderReviewStatus',
    label: '是否已组长终评',
    isShow: false,
    search: { el: 'select', order: 6 },
    enum: [
      { code: '1', name: '已组长评审' },
      { code: '0', name: '未组长评审' }
    ],
    fieldNames: { label: 'name', value: 'code' }
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
defineExpose({
  isShowModel
})
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  position: relative;
  overflow: hidden;
  overflow-y: auto;
}
</style>
