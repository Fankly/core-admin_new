<!-- 联合会审项目评审（专家组长使用）-->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="expertName">组长：{{ userInfo?.expertName }}</div>
    <div :style="{ maxHeight: isShowData ? '60vh' : '80vh' }">
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        @search="searchHandle"
        @reset="resetHandle"
        :row-style="rowStyle"
        @row-click="handerClickTable"
        @row-dblclick="handerProjectInfo"
        :request-api="getListPageData"
        :request-auto="false"
        :search-col="4"
        :columns="tableColumns"
        :isShowTable="isShowTable"
      >
        <template #tableHeader="scope">
          <el-button
            v-permission="'ZP'"
            size="mini"
            type="primary"
            plain
            :disabled="scope.selectedListIds.length != 1"
            @click="handleRmark(scope.selectedList)"
          >
            终 评
          </el-button>
          <el-button v-permission="'IMPORT'" size="mini" type="primary" plain @click="unitDescImportHandle"> 导入终评意见 </el-button>
          <el-button v-permission="'PLZP'" size="mini" type="primary" plain :disabled="!scope.isSelected" @click="handleReview(scope.selectedList)">
            批量终评
          </el-button>
          <el-button v-permission="'RETURN'" size="mini" type="primary" plain :disabled="!scope.isSelected" @click="passPro(scope.selectedList)">
            退 回
          </el-button>
          <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
          <el-button v-permission="'FJEXPORT'" size="mini" type="primary" plain :disabled="!scope.isSelected" @click="fileExport(scope.selectedList)">
            附件批量导出
          </el-button>
          <el-button
            v-permission="'XMVIEW'"
            size="mini"
            type="primary"
            plain
            :disabled="scope.selectedListIds.length != 1"
            @click="showProjectInfo(scope.selectedList)"
            >项目信息查看</el-button
          >
          <el-button
            v-permission="'XMLSVIEW'"
            size="mini"
            type="primary"
            plain
            :disabled="scope.selectedListIds.length != 1"
            @click="showHistory(scope.selectedList)"
            >项目历史评审记录查看</el-button
          >
          <el-button v-permission="'XMURGE'" size="mini" type="primary" plain @click="handleUrge"> 评审催办 </el-button>
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
  <CentralizedModification :get-api="'LHHS'" ref="editPageRef" :userInfo="userInfo" :formData="selectData" :flag="'VIEW'" />
  <ImportExcel ref="importRef" />
  <proModel ref="modelForm" :title="'联合会审终评意见'" :label="'专家组长终评意见'" @show-modal="pushMsgHandle" @get-reason="getReason" />
  <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag"></review-modal>
  <history-modal ref="histortRef" :data-list="dataList" />
  <select-modal ref="selectModalRef" @show-modal="showModal" :title="'联合会审终评意见'" />
  <urgeTask ref="urgeTaskRef" />
</template>

<script setup lang="tsx" name="/service/ywpt/projectManifestLeader">
import { ref, reactive, h, nextTick, onMounted } from 'vue'
import {
  pageExpertReviewInfo,
  leaderReviewPageXmInfo,
  pageXmHistoryReviewRecord,
  canLeaderReview,
  saveLeaderReviewRecord,
  saveLeaderReviewRecordNew,
  leaderReviewExportXmInfo,
  exportXmAttach,
  getLeaderReviewRecordImportTemplate,
  importLeaderReviewRecord,
  canLeaderReviewTh,
  leaderReviewTh,
  getExpertReviewReason
} from '@/api/service/jointReview'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { ElMessage, ElNotification } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { formatNumValue } from '@/utils/utils'
import reviewModal from '@/components/yssxTable/reviewModal.vue'
import proModel from '@/views/service/ywpt/components/modelReview.vue'
import urgeTask from '@/views/service/ywpt/components/urgeTask.vue'
import selectModal from '@/views/service/ywpt/components/selectModalPs.vue'
import { getEjdwData, getYjdwData } from '@/api/service/expertinformation'
import expertReview from '@/views/service/ywpt/components/expertReview.vue' //专家评审信息
import historyModal from '@/views/service/ywpt/components/history.vue' //专家评审信息
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { decrypt } from '@/utils/crypto'
import { getButtonList } from '@/api/common'
// 初始化页面
const userDialogRef = ref() // 用户角色
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const importRef = ref() //导入
const proTableRef = ref<any>()
const xmInfoList = ref<any>([]) // 选择的数据
const searchData = ref<any>() //查询条件
const pageDataList = ref<any>([]) //专家评审意见表格数据
var timer: any
const modelForm = ref<any>()
const returnModal = ref()
const selectModalRef = ref<any>()
const isShowTable = ref(true) //显示表格
const isShowData = ref(true)
const histortRef = ref()
const dataList = ref([])
const reason = ref<any[]>([])
const review = ref<any>()
const store = useStore()
const route = useRoute()
const userInfo = ref<any>() // 用户角色
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位

const urgeTaskRef = ref() //催办弹窗

// 方法
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

// 评审催办
const handleUrge = async () => {
  const params = {
    row: {
      meetingId: userInfo.value.meetingId
    },
    getTableList: proTableRef.value?.getTableList
  }
  urgeTaskRef.value.acceptParams(params)
}

//历史记录
const showHistory = async (list: any) => {
  if (list.length != 1) {
    return ElMessage.warning('请选择一条数据')
  }
  let res: any = await pageXmHistoryReviewRecord({
    originXmId: list[0].originXmId,
    meetingId: userInfo.value.meetingId,
    isPack: list[0].isPack
  })
  if (res.success) {
    dataList.value = res.data.records
    if (dataList.value.length != 0) {
      histortRef.value.isShowModal = true
      histortRef.value.chooseDataPrj = list[0]
    } else {
      ElMessage.warning('暂无历史记录')
    }
  } else {
    ElMessage.error(res.msg)
  }
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
// 点击行查看点击项目专家的评审信息
const handerClickTable = async (val: any) => {
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
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
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
  loading.value = true
  const params = {
    meetingId: userInfo.value.meetingId,
    xmId: xmInfoList.value[0].xmId
  }
  if (review.value) {
    reason.value.push(review.value)
  }
  const res: any = await getExpertReviewReason(params)
  if (res.success) {
    loading.value = false
    res.data.forEach((item: any) => {
      reason.value.push(`${item.major}：${item.reasonList.join(';')}`)
    })
    modelForm.value.rmarkData.reason = reason.value.join('\n')
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

//保存
const pushMsgHandle = (val: any) => {
  loading.value = true
  saveLeaderReviewRecord({
    ...val,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    xmInfoList: xmInfoList.value
  }).then((res: any) => {
    if (res.success) {
      loading.value = false
      modelForm.value?.closeHandle()
      ElMessage({ type: 'success', message: '保存成功' })
      proTableRef.value?.getTableList()
      proTableRef.value?.clearSelection()
    } else {
      loading.value = false
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

// 导出
const exportHandle = () => {
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
//批量保存
const showModal = (val: any) => {
  loading.value = true
  saveLeaderReviewRecordNew({
    reviewOpinion: val,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    xmInfoList: xmInfoList.value
  }).then((res: any) => {
    if (res.success) {
      loading.value = false
      selectModalRef.value.isShowModel = false
      ElMessage({ type: 'success', message: '保存成功' })
      proTableRef.value?.getTableList()
      proTableRef.value?.clearSelection()
    } else {
      loading.value = false
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

// 退回意见
const returnMag = async (val: any) => {
  loading.value = true
  const params = {
    ...val,
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    xmInfoList: xmInfoList.value,
    spRoleId: userInfo.value.spRoleId,
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId
  }
  let thList: any[] = xmInfoList.value.map((element: any) => ({
    id: element.originXmId,
    thyj: val?.reason,
    thsbys: element.amount
  }))
  let res: any = await leaderReviewTh(params)
  let thRes = await saveOrUpdateTXmThxxb({ list: thList })
  console.log(thRes)
  if (res.success) {
    ElMessage.success('退回成功！')
    returnModal.value?.closeHandle()
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
    loading.value = false
  } else {
    ElMessage.error(res.msg)
    loading.value = false
  }
}

// 退回
const passPro = async (selectedList: any) => {
  // 获取选中的数据
  xmInfoList.value = selectedList.map(({ xmId, xmbm, xmmc, originXmId, amount }: any) => ({
    xmId,
    xmbm,
    xmmc,
    originXmId,
    amount
  }))
  let res: any = await canLeaderReviewTh({
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
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
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
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
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId
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
    specialorgid: userInfo.value.deptId
  }
  importRef.value.acceptParams(params)
  proTableRef.value?.reset()
  proTableRef.value?.clearSelection()
}

// 附件批量导出
const fileExport = (selectedList: any) => {
  if (selectedList.length == 0) {
    ElMessage({
      type: 'warning',
      message: '请选择导出附件的项目'
    })
    return
  }
  let params: any = []
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  selectedList.forEach((item: any) => {
    params.push({
      proTypeId: item.pro_type_id,
      xmId: item.xmId,
      xmbm: item.xmbm,
      xmmc: item.xmmc
    })
  })
  loading.value = true
  exportXmAttach({ xmInfoList: params }).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '项目附件.zip'
    if (res.headers && res.headers['content-disposition']) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    proTableRef.value?.getTableList()
    proTableRef.value?.clearSelection()
    loading.value = false
  })
}
// 页面初始化
onMounted(async () => {
  await initParamLists()
})

// 获取公共代码
const initParamLists = async () => {
  isShowPage.value = false
  userInfo.value = JSON.parse(decrypt(route.query.meetingParams as string))
  userInfo.value.expertName = decodeURIComponent(userInfo.value.expertName as string)
  pageDataList.value.length = 0
  isShowData.value = true
  isShowTable.value = true
  // 按钮权限
  const btn = await getButtonList('XQC-LHHSZZZP', userInfo.value.spRoleId)
  if (btn.success) {
    store.commit('setPermissions', btn.data)
  } else {
    ElMessage.error(btn.msg)
  }
  //
  // 一级单位
  levelOne.value.length = 0 //清空单位
  const res = await getYjdwData()
  if (res.success && res.data.length != 0) {
    isShowPage.value = true
    levelOne.value.push(...res.data)
    nextTick(() => {
      proTableRef.value?.getTableList()
      proTableRef.value?.clearSelection()
    })
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
  { prop: 'review_time', label: '专家组长评审时间', width: '150' },
  { prop: 'sfthName', label: '是否退回', width: '80' },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '180',
    search: {
      order: 1,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    width: '180',
    search: { el: 'input', order: 2 }
  },
  {
    prop: 'expertAccount',
    label: '专家账号',
    width: '180',
    isShow: false,
    search: { el: 'input', order: 7 }
  },
  // { prop: 'sfgmb', label: '是否规模包', width: '100' },
  // { prop: 'gmbbm', label: '规模包编码', width: '180' },
  // { prop: 'gmbmc', label: '规模包名称', width: '200' },
  { prop: 'pro_type_name', label: '项目类型', width: '150' },
  {
    prop: 'yjdw',
    label: '一级单位',
    search: { el: 'select', props: { onChange: selectChange }, order: 3 },
    enum: levelOne.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '180',
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    search: { el: 'select', order: 4 },
    enum: levelTwo.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '180',
    render: ({ row }: any) => {
      return row.ejdw
    }
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
