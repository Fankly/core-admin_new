<!-- 联合会审项目清单 -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <div class="expertName">评审专家：{{ userInfo?.expertName }}</div>
    <div :style="{ maxHeight: isShowData ? '60vh' : '80vh' }">
      <proTable
        ref="proTableRef"
        @row-click="handerClickTable"
        @row-dblclick="handerProjectInfo"
        :data-callback="pageList"
        :row-style="rowStyle"
        @search="searchHandle"
        @reset="resetHandle"
        :request-api="getListPageData"
        :request-auto="false"
        :search-col="5"
        :columns="tableColumns"
        :isShowTable="isShowTable"
      >
        <!-- 表格 header 按钮 -->
        <template #tableHeader="scope">
          <el-button
            v-if="!isViewMode"
            v-permission="'WHPSYJ'"
            :disabled="!scope.isSelected"
            size="mini"
            type="primary"
            plain
            @click="handleRmark(scope.selectedList)"
            >维护评审意见</el-button
          >
          <el-button v-if="!isViewMode" v-permission="'PLWH'" size="mini" type="primary" plain @click="unitDescImportHandle"> 批量维护 </el-button>
          <el-button
            v-if="!isViewMode"
            v-permission="'RETURN'"
            :disabled="!scope.isSelected"
            size="mini"
            type="primary"
            plain
            @click="passPro(scope.selectedList)"
          >
            退 回
          </el-button>
          <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
          <el-button v-permission="'FJEXPORT'" :disabled="!scope.isSelected" size="mini" type="primary" plain @click="fileExport(scope.selectedList)">
            附件批量导出
          </el-button>
          <el-button
            v-permission="'XMVIEW'"
            :disabled="!scope.isSelected || scope.selectedList.length != 1"
            size="mini"
            type="primary"
            plain
            @click="showProjectInfo(scope.selectedList)"
          >
            项目信息查看
          </el-button>
          <el-button
            v-permission="'XMLSVIEW'"
            :disabled="!scope.isSelected || scope.selectedList.length != 1"
            size="mini"
            type="primary"
            plain
            @click="showHistory(scope.selectedList)"
            >项目历史评审记录查看</el-button
          >
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
  <ImportExcel ref="importRef" />
  <history-modal ref="histortRef" :data-list="dataList" />
  <proModel ref="modelForm" :title="'联合会审意见'" @show-modal="pushMsgHandle"></proModel>
  <review-modal ref="returnModal" :title="'退回意见'" :label="'退回意见'" @show-modal="returnMag"></review-modal>
</template>
<script lang="tsx">
export default {
  name: '/service/ywpt/projectManifest'
}
</script>
<script setup lang="tsx">
import { computed, nextTick, ref, reactive, onMounted, h } from 'vue'
import {
  pageExpertReviewInfo,
  pageXmInfo,
  canExpertReview,
  saveExpertReviewRecord,
  pageXmHistoryReviewRecord,
  getExpertReviewRecordImportTemplate,
  importExpertReviewRecord,
  exportXmInfo,
  exportXmAttach,
  canExpertReviewTh,
  expertReviewTh
} from '@/api/service/jointReview'
import { saveOrUpdateTXmThxxb } from '@/api/workflow/xm'
import { ElMessage, ElNotification } from 'element-plus'
import proTable from '@/components/ProTable/index.vue' //表格组件
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { formatNumValue } from '@/utils/utils'
import proModel from '@/views/service/ywpt/components/modelReview.vue'
import reviewModal from '@/components/yssxTable/reviewModal.vue'
import { useStore } from 'vuex'
import { getEjdwData, getYjdwData } from '@/api/service/expertinformation'
import historyModal from '@/views/service/ywpt/components/history.vue' //专家评审信息
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { apiExportHandle } from '@/utils/export'
import { decrypt } from '@/utils/crypto'
import { useRoute } from 'vue-router'
import { getButtonList } from '@/api/common'
import expertReview from '@/views/service/ywpt/components/expertReview.vue' //专家评审信息

var timer: any

// 初始化页面
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const selectData = ref<any>({}) //弹窗参数
const editPageRef = ref() //弹窗元素
const importRef = ref() //导入
const proTableRef = ref<any>()
const xmInfoList = ref<any>([]) // 选择的数据
const searchData = ref<any>() //查询条件
const modelForm = ref<any>()
const returnModal = ref()
const histortRef = ref()
const dataList = ref([])
const store = useStore()
const route = useRoute()
const userInfo = ref<any>() // 用户角色
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
const isShowTable = ref(true) //显示表格
const isShowData = ref(true)
const pageDataList = ref<any>([]) //专家评审意见表格数据
const isViewMode = computed(() => userInfo.value?.tag === 'view')

// function
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
const handerClickTable = async (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
  clearTimeout(timer)
  timer = setTimeout(async () => {
    let params: any = {
      xmId: row.xmId,
      limit: 100,
      page: 1,
      meetingId: userInfo.value.meetingId,
      isPack: row.isPack
    }
    let res: any = await pageExpertReviewInfo(params)
    if (res.success) {
      pageDataList.value = res.data.records
    }
  }, 300)
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
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  return val
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
  params.expertId = userInfo.value.expertId
  params.meetingId = userInfo.value.meetingId
  params.specialorgid = userInfo.value.deptId
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  if (params['xmbmList'].length > 1000) {
    return ElMessage.error('项目编码最大支持1000条！')
  }
  searchData.value = params
  loading.value = true
  return pageXmInfo(searchData.value)
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
    ElMessage.warning('请选择一条数据')
    return
  }
  let val = selectedList[0]
  selectData.value.id = val.xmId
  selectData.value.xmlx = val.pro_type_id
  editPageRef.value.isShowModal = true
}
// 维护评审意见
const handleRmark = async (selectedList: any) => {
  // 获取选中的数据
  xmInfoList.value = selectedList.map(({ xmId, xmbm, xmmc }: any) => ({ xmId, xmbm, xmmc }))
  let res: any = await canExpertReview({
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId,
    xmInfoList: xmInfoList.value
  })
  if (res.data.success) {
    modelForm.value.isShowModel = true
  } else {
    let msg = res.data.msg.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

const handleTable = (val: any) => {
  isShowData.value = val.value
}

//保存
const pushMsgHandle = (val: any) => {
  loading.value = true
  saveExpertReviewRecord({
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
  let res: any = await expertReviewTh(params)
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
  let res: any = await canExpertReviewTh({
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

// 导入  批量维护
const unitDescImportHandle = () => {
  let newParmas = {
    expertId: userInfo.value.expertId,
    meetingId: userInfo.value.meetingId
  }
  let tempApi: any = getExpertReviewRecordImportTemplate
  let importApi: any = importExpertReviewRecord
  if (!importApi) return
  let params = {
    title: '评审意见表',
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
// 导出
const exportHandle = () => {
  try {
    loading.value = true
    const params = {
      ...searchData.value
    }
    const fileName = '联合会审项目清单表'
    apiExportHandle(params, fileName, exportXmInfo)
    loading.value = false
  } catch (e) {
    loading.value = false
    const error = e as Error
    ElMessage.error(error.message)
  }
}
// 附件批量导出
const fileExport = (selectedList: any) => {
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  let params: any = []
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
  try {
    isShowPage.value = false
    userInfo.value = JSON.parse(decrypt(route.query.meetingParams as string))
    userInfo.value.expertName = decodeURIComponent(userInfo.value.expertName as string)
    levelOne.value.length = 0 //清空单位
    isShowTable.value = true
    isShowData.value = true

    // 按钮权限
    const btn = await getButtonList('XQC-LHHSXMQD', userInfo.value.spRoleId)
    if (btn.success) {
      store.commit('setPermissions', btn.data)
    } else {
      ElMessage.error(btn.msg)
    }
    // 一级单位
    const res = await getYjdwData()
    if (res.success && res.data.length != 0) {
      isShowPage.value = true
      levelOne.value.push(...res.data)
      nextTick(() => {
        proTableRef.value?.getTableList()
        proTableRef.value?.clearSelection()
      })
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message)
  }
}

const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'review_expert_name', label: '专家姓名', width: '80' },
  {
    prop: 'review_opinion',
    label: '专家评审意见',
    width: '100'
  },
  { prop: 'review_reason', label: '专家评审意见说明', width: '200' },
  { prop: 'review_time', label: '专家评审时间', width: '150' },
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
  // { prop: 'sfgmb', label: '是否规模包', width: '100' },
  // { prop: 'gmbbm', label: '规模包编码', width: '180' },
  // { prop: 'gmbmc', label: '规模包名称', width: '200' },
  { prop: 'pro_type_name', label: '项目类型', width: '200' },
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
}
</style>
