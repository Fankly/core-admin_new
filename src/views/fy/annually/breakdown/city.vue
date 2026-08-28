<template>
  <div class="container" v-show="isShowPage" v-loading="pageLoading">
    <FyHeader
      @change-xsws="changeXswsHandle"
      @changeNd="changeNdHandle"
      ref="headerRef"
      :dwName="userInfo.orgName"
    />
    <el-tabs type="border-card" v-model="tabInfo.kmlx" @tab-click="tabClickHandle">
      <el-tab-pane label="其他运营费用-主业" name="1"></el-tab-pane>
      <el-tab-pane v-if="isHidenTab" label="其他运营费用-农电" name="2"></el-tab-pane>
      <AnnuallyLayout
        :exportForDw="exportForDw"
        :exportForKm="exportForKm"
        v-if="isShowPage"
        :getDynamicColumnByKm="getDynamicColumnByKm"
        :getDataListByKm="getDataListByKm"
        hasChildField="leaf"
        ref="annuallyLayoutRef"
        :init-params="initParams"
        :request-api="getDataList"
        :dynamicColumnApi="getDynamicColumn"
        :userInfo="userInfo"
      >
        <template #opeartion>
          <el-button
            type="primary"
            plain
            @click="unitDescHandle('edit')"
            :disabled="isDisabled"
            v-permission="'BREAKDOWN'"
            >分 解
          </el-button>
          <el-button type="primary" plain @click="unitDescHandle('view')">分解查看</el-button>
          <el-button type="primary" plain v-permission="'EXPORT'" @click="exportDataHandle"
            >导 出</el-button
          >
          <el-button
            :disabled="isWfId"
            type="primary"
            plain
            @click="openTodoTaskDesc"
            v-permission="'VIEWWORKFLOW'"
          >
            查看流转过程
          </el-button>
        </template>
      </AnnuallyLayout>
    </el-tabs>
    <unitDesc
      opeartionFlag="city"
      :flag="unitDescInfo.flag"
      ref="unitDescRef"
      hasChildField="leaf"
      :userInfo="initParams"
      :requestApi="getDataListByDw"
      :dynamicColumnApi="getDynamicColumnByDw"
      show-zoom
      resize
      position="center"
      width="70%"
      height="800"
      :title="unitDescInfo.title"
      @modalClose="modalCloseHandle"
      :isShowDec="unitDescInfo.isShowDec"
    >
      <template #opTypeLeft>
        <el-button v-if="unitDescInfo.flag === 'edit'" type="primary" plain @click="saveDataHandle"
          >保 存</el-button
        >
        <el-button v-if="unitDescInfo.flag === 'edit'" type="primary" plain @click="releaseHandle"
          >分解下达</el-button
        >
        <el-button
          v-if="unitDescInfo.flag === 'edit'"
          type="primary"
          plain
          @click="unitDescImportHandle"
          >导 入</el-button
        >
        <el-button type="primary" plain @click="unitDescExportHandle">导 出</el-button>
      </template>
      <template #opTypeRight>
        <el-form :inline="true">
          <el-form-item label="单位：">
            <span class="font-style">{{ userInfo.orgName }}</span>
          </el-form-item>
        </el-form>
      </template>
    </unitDesc>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <ImportExcel ref="importRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/annually/breakdown/city'
}
</script>
<script setup lang="ts">
import unitDesc from '../components/unitDec.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import AnnuallyLayout from '@/views/fy/annually/components/AnnuallyLayout.vue'
import FyHeader from '@/views/fy/components/Header.vue'
import {
  getDataList,
  getImportTemplate,
  importData,
  exportForDw,
  exportForKm,
  save,
  getDynamicColumn,
  getFormStatus,
  getDynamicColumnByDw,
  getDataListByDw,
  xd,
  getDataListByKm,
  getDynamicColumnByKm,
  exportData
} from '@/api/fy/annually/breakdown/city'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { isNullOrUndefined } from '@/utils/utils'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { useStore } from 'vuex'
import { startYapCityWf } from '@/api/workflow/fy'
import { containsNd } from '@/api/fy/common'
import { getWfTracking } from '@/api/workflow'

const userDialogRef = ref()
const headerRef = ref()
const annuallyLayoutRef = ref()
const unitDescRef = ref()
const importRef = ref()

const store = useStore()

const tabInfo = reactive({
  kmlx: '1',
  nd: new Date().getFullYear().toString()
})

const isShowPage = ref(false)
const isHidenTab = ref(false)

const isCity = ref(true)

const initParams = reactive({
  dwId: '',
  orgName: '',
  busiType: 'ND',
  nd: '',
  xsws: '',
  kmlx: '',
  parentId: ''
})

const pageLoading = ref(false)

const isWfId = computed(() => userInfo.formStatus && !userInfo.formStatus.wfId)

const userInfo = reactive<any>({
  orgName: '',
  orgId: '',
  status: '',
  statusInfo: '',
  detailId: '',
  formStatus: {
    fjStatus: '',
    wfId: null
  }
})

const unitDescInfo = reactive({
  isShowDec: false,
  flag: '',
  title: ''
})

const isDisabled = computed(
  () =>
    (annuallyLayoutRef.value ? annuallyLayoutRef.value.tableInfo.loading : true) ||
    userInfo.status !== '4' ||
    userInfo.formStatus.fjStatus === '2'
)

// 是否隐藏tab
const isHideTab = async (dwId: string) => {
  let res = await containsNd(dwId)
  if (res.success) {
    isHidenTab.value = res.data
  }
}

const getRoleHandle = async () => {
  // 初始化请求
  initParams.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  initParams.xsws = headerRef.value.formParams.xsws || '2'
  await initFormStatus()
  initParams.parentId = initParams.nd
  initParams.dwId = userInfo.orgId
  initParams.orgName = userInfo.orgName
  initParams.kmlx = tabInfo.kmlx
  isHideTab(userInfo.orgId)
  const isQuery = userDialogRef.value.isQuery
  if (isQuery && isCity.value) {
    isShowPage.value = true
  }
}

const initFormStatus = async () => {
  let res = await getFormStatus({
    busiType: 'ND',
    dwId: userDialogRef.value.userMsg.org_id,
    kmlx: tabInfo.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws
  })
  if (res.success) {
    userInfo.orgName = res.data.dwName
    userInfo.orgId = res.data.dwId
    userInfo.detailId = res.data.id
    userInfo.status = res.data.status
    userInfo.statusInfo = res.data.statusInfo
    userInfo.formStatus = { ...res.data }
    isCity.value = true
  } else {
    isCity.value = false
    ElMessage.error(res.msg)
  }
}

const unitDescHandle = (flag: string) => {
  unitDescInfo.isShowDec = true
  unitDescInfo.flag = flag
  unitDescInfo.title = flag === 'edit' ? '市年度预算分解' : '市年度预算分解-查看'
}

const exportDataHandle = () => {
  pageLoading.value = true
  exportData({
    busiType: 'ND',
    kmlx: tabInfo.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws,
    dwId: userInfo.orgId,
    parentId: '-1'
  }).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    pageLoading.value = false
  })
}

const modalCloseHandle = (val: boolean) => {
  unitDescInfo.isShowDec = val
}

const tabClickHandle = () => {
  initParams.kmlx = tabInfo.kmlx
  initFormStatus()
  annuallyLayoutRef.value.initTableData()
}

const changeNdHandle = (val: string) => {
  initParams.nd = val
  initParams.parentId = initParams.nd
  annuallyLayoutRef.value.initTableData()
  initFormStatus()
}

const changeXswsHandle = (val: string) => {
  initParams.xsws = val
  annuallyLayoutRef.value.initTableData()
  initFormStatus()
}

const saveDataHandle = async () => {
  const tableMsg = unitDescRef.value.tableInfo
  const $table = unitDescRef.value.treeTableRef
  if ($table) {
    let resultData: any = []
    // 获取表格录入的数据
    const records: any[] = $table.getUpdateRecords()
    const updateRecords = records.filter((item) => !item.leaf && item.id)
    if (updateRecords.length === 0) {
      ElMessage.warning('未进行修改操作,请修改后再进行保存！')
      return
    }
    const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      let columnKeys = tableMsg.columns?.filter((item: any) => item.eidt)
      updateRecords.forEach((rowData) => {
        let res = columnKeys?.map((item: any) => {
          if (!isNullOrUndefined(rowData[item.columnKey])) {
            return {
              yskmId: rowData.id,
              detailId: rowData['_' + item.columnKey] ? rowData['_' + item.columnKey] : '',
              dwId: item.columnKey,
              je: rowData[item.columnKey]
            }
          }
          return ''
        })
        resultData.push(res)
      })
      let mxList = resultData.flat().filter(Boolean)
      let params = {
        dwDetailId: userInfo.detailId,
        mxList: mxList
      }
      let res = await save(params)
      if (res.success) {
        // 重置刷新树
        ElMessage.success('保存成功')
        unitDescRef.value.initTableData()
        await initFormStatus()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const openTodoTaskDesc = () => {
  if (userInfo.formStatus.wfId) {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(userInfo.formStatus.wfId).then((res: any) => {
      if (res.success) {
        window.open(
          res.data,
          '_blank',
          `width=${width},height=${height},top=${pageTop},left=${pageWidth}`
        )
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

const releaseHandle = async () => {
  if (
    userInfo.formStatus &&
    (userInfo.formStatus.fjStatus === null || userInfo.formStatus.fjStatus === '')
  ) {
    ElMessage.warning('请先保存后,再进行分解下达！')
    return
  }
  const type = await VXETable.modal.confirm('确定是否分解下达？', '提示')
  if (type === 'confirm') {
    // 判断是否走工作流
    let paramFLag = '0' //0走工作流  1不走工作流
    let isWorkFlowRes = await baseService.get(
      '/workflow/declare/getParamValue?paramKey=ND_CITY_FJ_WORKFLOW'
    )
    if (isWorkFlowRes.success) {
      let wfUserInfo: WFUserInfo = {
        userId: store.getters.getUserMsg.id,
        spOrgId: userDialogRef.value.userMsg.specialorgid,
        spRoleId: userDialogRef.value.userMsg.id
      }
      let wfParam: WFParam = {
        KMLX: initParams.kmlx,
        ND: initParams.nd,
        DWID: initParams.dwId,
        BUSITYPE: 'ND',
        DWNAME: initParams.orgName
      }
      let res = null
      paramFLag = isWorkFlowRes.data
      switch (paramFLag) {
        case '0':
          submitWorkflow(
            store.getters.getUserMsg.systemCode,
            'WF_NDCITYFJ',
            '',
            wfUserInfo,
            wfParam,
            {},
            submitWFCallback
          )
          break
        case '1':
          res = await xd(userInfo.detailId)
          if (res.success) {
            ElMessage.success('下达成功！')
            unitDescInfo.isShowDec = false
            await initFormStatus()
            annuallyLayoutRef.value.initTableData()
          } else {
            ElMessage.error(res.msg)
          }
          break
      }
    }
  }
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
  const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
  let obj: any = {}
  list.forEach((item) => {
    obj[item.DataCode] = item.DataValue
  })
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userDialogRef.value.userMsg.specialorgid,
    spRoleId: userDialogRef.value.userMsg.id,
    wfCode: 'WF_NDCITYFJ',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startYapCityWf({
    ...spfrom
  })
  if (res.success) {
    ElMessage.success('提交成功')
    unitDescInfo.isShowDec = false
    await initFormStatus()
  } else {
    ElMessage.error(res.msg)
  }
}

const unitDescExportHandle = () => {
  exportForDw({
    busiType: 'ND',
    kmlx: tabInfo.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws,
    dwId: userInfo.orgId,
    parentId: '-1'
  }).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  })
}

const unitDescImportHandle = () => {
  let newParmas = {
    busiType: 'ND',
    dwId: userInfo.orgId,
    kmlx: tabInfo.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws,
    parentId: '-1'
  }
  let tempApi: any = getImportTemplate
  let importApi: any = importData

  if (!tempApi && !importApi) return
  let params = {
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
    specialorgid: userInfo.orgId,
    getTableList: unitDescRef.value.initTableData
  }
  importRef.value.acceptParams(params)
}

const initData = async () => {
  await userDialogRef.value.getUser()
}

onMounted(() => {
  initData()
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      padding: 10px;
      height: calc(100% - 39px);

      .operation {
        margin-bottom: 10px;
        display: flex;
        align-items: center;

        &-left,
        &-right {
          width: 50%;
        }

        &-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          .toolbar {
            margin-left: 10px;
          }
        }
      }
    }
  }
}
</style>
