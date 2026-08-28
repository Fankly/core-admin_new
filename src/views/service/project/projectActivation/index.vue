<template>
  <div v-if="isShowPage" class="container">
    <div class="operation">
      <div class="left">
        <el-dropdown class="drop-button" style="margin-right: 10px">
          <el-button v-permission="'XMGBDK'" :disabled="disabled" type="primary" plain>
            项目关闭打开
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleProjectClose">关 闭</el-dropdown-item>
              <el-dropdown-item @click="handleProjectReject">重新打开</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-permission="'EXPORT'" :disabled="disabled" type="primary" plain @click="handleExportData">导 出 </el-button>
        <el-button v-permission="'PROCESS'" :disabled="disabled" type="primary" plain @click="handleViewProcess">流程履历 </el-button>
        <el-button v-permission="'CLJL'" :disabled="disabled" type="primary" plain @click="handleDealHistory">处理记录 </el-button>
        <el-button v-permission="'YCCL'" :disabled="disabled" type="primary" plain @click="handleAbnormalDealData">异常处理 </el-button>
      </div>
      <div class="right">
        <div class="tool-button">
          <el-tooltip content="列设置" placement="top">
            <span @click="openColSetting" style="cursor: pointer; font-size: 18px" class="el-icon-s-operation"></span>
          </el-tooltip>
          <el-tooltip content="隐藏/展示查询" placement="top">
            <span style="cursor: pointer; font-size: 18px; margin: 0 10px" @click="handleIsShowSearch">
              <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
            </span>
          </el-tooltip>
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="table">
      <vxe-grid class="mytable-style" @cell-click="cellClickHandle" ref="gridRef" v-bind="gridOptions">
        <template #xmmc_item="{ data }">
          <el-input v-model="data.xmmc" type="text"></el-input>
        </template>
        <template #xmbm_item="{ data }">
          <ReMultipleText v-model="data.xmbm" type="text"></ReMultipleText>
        </template>
        <template #gwxmbm_item="{ data }">
          <ReMultipleText v-model="data.gwxmbm" type="text"></ReMultipleText>
        </template>
        <template #xmbmc_item="{ data }">
          <el-input v-model="data.xmbmc" type="text"></el-input>
        </template>
        <template #dw_item="{ data }">
          <ElTreeSelect
            :showAllCheckedNodes="true"
            ref="dwTreeRef"
            @change="handleDwClick"
            v-model="data.dw"
            :props="{
              children: 'children',
              label: 'text',
              value: 'objCode'
            }"
            :multiple="true"
            :showCheckbox="true"
            :checkOnClickNode="false"
            :collapseTags="true"
            node-key="objCode"
            :data="dwList"
            :clearable="false"
          ></ElTreeSelect>
        </template>
        <template #yjfl_item="{ data }">
          <el-select @change="getClassificationTwo" class="select_style" v-model="data.yjflObj" clearable>
            <el-option v-for="(item, index) in classificationOne" :key="index" :label="item.label" :value="item"></el-option>
          </el-select>
        </template>
        <template #ejfl_item="{ data }">
          <el-select class="select_style" v-model="data.ejflObj" @change="getClassificationThree" clearable>
            <el-option v-for="(item, index) in classificationTwo" :key="index" :label="item.label" :value="item"></el-option>
          </el-select>
        </template>
        <template #sjfl_item="{ data }">
          <el-select class="select_style" v-model="data.sjfl" clearable>
            <el-option v-for="(item, index) in classificationThree" :key="index" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </template>
        <template #xmlx_id_item="{ data }">
          <ElTreeSelect
            ref="xmlxRef"
            @change="changeXmlxHandle"
            v-model="data.xmlx_ids"
            :props="{
              label: 'name',
              children: 'children',
              value: 'code'
            }"
            :multiple="true"
            :showCheckbox="true"
            :checkOnClickNode="false"
            :collapseTags="true"
            node-key="code"
            :data="projectTypeList"
            :clearable="false"
          ></ElTreeSelect>
        </template>
        <template #xmxz_item="{ data }">
          <el-select multiple collapse-tags @change="getXmxzData" class="select_style" v-model="data.xmxzs" clearable>
            <el-option v-for="(item, index) in xmxzList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>
        <template #ispack_item="{ data }">
          <el-select class="select_style" v-model="data.ispack" clearable>
            <el-option v-for="(item, index) in sfList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>
        <template #dydj_item="{ data }">
          <el-select class="select_style" v-model="data.dydj" clearable>
            <el-option v-for="(item, index) in dydjList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>

        <template #ndyswcl_start_qj_item="{ data }">
          <div class="dobule-form-item">
            <div class="left">
              <el-select @change="ndyswclStartQjChange" class="select_style" v-model="data.ndyswcl_start_qj" clearable>
                <el-option v-for="(item, index) in wclList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </div>
            <div class="right">
              <input class="number-input" v-number-input="2" v-model="data.ndyswcl_start_num" type="text" />
            </div>
          </div>
        </template>
        <template #ndyswcl_end_qj_item="{ data }">
          <div class="dobule-form-item">
            <div class="left">
              <el-select :disabled="ndyswclDisabled" class="select_style" v-model="data.ndyswcl_end_qj" clearable>
                <el-option v-for="(item, index) in ndyswclEndWclList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </div>
            <div class="right">
              <input class="number-input" v-number-input="2" :disabled="ndyswclDisabled" v-model="data.ndyswcl_end_num" type="text" />
            </div>
          </div>
        </template>
        <template #xmljwcl_start_qj_item="{ data }">
          <div class="dobule-form-item">
            <div class="left">
              <el-select @change="xmljwclStartQjChange" class="select_style" v-model="data.xmljwcl_start_qj" clearable>
                <el-option v-for="(item, index) in wclList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </div>
            <div class="right">
              <input class="number-input" v-number-input="2" v-model="data.xmljwcl_start_num" type="text" />
            </div>
          </div>
        </template>
        <template #xmljwcl_end_qj_item="{ data }">
          <div class="dobule-form-item">
            <div class="left">
              <el-select :disabled="xmljwclDisabled" class="select_style" v-model="data.xmljwcl_end_qj" clearable>
                <el-option v-for="(item, index) in xmljwclEndWclList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </div>
            <div class="right">
              <input class="number-input" v-number-input="2" :disabled="xmljwclDisabled" v-model="data.xmljwcl_end_num" type="text" />
            </div>
          </div>
        </template>
        <template #ysqj_start_item="{ data }">
          <el-date-picker @change="startChangeDateHandle" class="select_style" :clearable="false" v-model="data.ysqj_start" type="date"></el-date-picker>
        </template>
        <template #ysqj_end_item="{ data }">
          <el-date-picker @change="endChangeDateHandle" class="select_style" :clearable="false" v-model="data.ysqj_end" type="date"></el-date-picker>
        </template>
        <template #publisetime_start_item="{ data }">
          <el-date-picker :disabled-date="disabledStartDate" class="select_style" v-model="data.publisetime_start" value-format="YYYY-MM-DD" format="YYYY-MM-DD" type="date"></el-date-picker>
        </template>
        <template #publisetime_end_item="{ data }">
          <el-date-picker :disabled-date="disabledEndDate" class="select_style" v-model="data.publisetime_end" value-format="YYYY-MM-DD" format="YYYY-MM-DD" type="date"></el-date-picker>
        </template>
        <template #circul_status_item="{ data }">
          <el-select class="select_style" v-model="data.circul_status" clearable>
            <el-option v-for="(item, index) in xmzxStatusList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>
        <template #yssfzt_item="{ data }">
          <el-select class="select_style" v-model="data.yssfzt" clearable>
            <el-option v-for="(item, index) in yssfStatusList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>
        <template #gbdk_status_item="{ data }">
          <el-select class="select_style" v-model="data.gbdk_status" clearable>
            <el-option v-for="(item, index) in gbdkStatusList" :key="index" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </template>
        <template #operate_item>
          <el-button type="primary" size="mini" plain @click="handleSearchPageData">查 询 </el-button>
          <el-button size="mini" plain @click="handleResetFormData">重 置</el-button>
        </template>
      </vxe-grid>
    </div>
    <div class="page">
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <!-- 权限 -->
  <UserDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <!-- 关闭/打开 -->
  <OperationModal ref="operationModalRef" />
  <!-- 操作记录 -->
  <HistoryModal ref="historyModalRef" />
  <HelpModal ref="helpModalRef" />
  <!-- 列设置 -->
  <ColSetting :gridRef="gridRef" ref="colRef" :col-setting="colSetting" />
  <!-- 流程履历 -->
  <component @closeDialog="processData.isShowDialog = false" :isShowDialog="processData.isShowDialog" :id="processData.id" :is="(processData.compName as string)"></component>
</template>

<script setup lang="ts" name="/service/project/projectActivation/index">
import UserDialog from '@/components/select/userDialog.vue' //登陆权限
import ColSetting from '@/views/service/project/projectActivation/components/ColSetting.vue'
import OperationModal from '@/views/service/project/projectActivation/components/OperationModal.vue'
import HistoryModal from '@/views/service/project/projectActivation/components/HistoryModal.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ElTreeSelect from '@/components/ElTreeSelect'
import { PublicCode, useCommon } from '@/views/service/project/projectActivation/hooks/useCommon'
import { useClassification } from '@/views/service/project/projectActivation/hooks/useClassification'
import { useService } from '@/views/service/project/projectActivation/hooks/useService'
import { VxeGridInstance } from 'vxe-table'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { SearchForm } from '@/views/service/project/projectActivation/interface'
import { getPageData, exportPageData } from '@/api/service/xmgbdk'
import { ElMessage } from 'element-plus'

const helpModalRef = ref<InstanceType<typeof HelpModal>>()
const userDialogRef = ref<InstanceType<typeof UserDialog>>()
const operationModalRef = ref<InstanceType<typeof OperationModal>>()
const historyModalRef = ref<InstanceType<typeof HistoryModal>>()
const dwTreeRef = ref()
const isShowSearch = ref(true)
const collapsed = ref(false)
const gridRef = ref<VxeGridInstance<SearchForm>>()
const userInfo = reactive<{
  dwId: string
  bmId: string
  specialorgcode: string
  id: string
}>({
  dwId: '',
  bmId: '',
  specialorgcode: '',
  id: ''
})
const ndyswclDisabled = ref(true)
const isShowPage = ref(false)
const xmljwclDisabled = ref(true)
const ndyswclEndWclList = ref<PublicCode[]>([])
const xmljwclEndWclList = ref<PublicCode[]>([])

const disabled = computed(() => gridOptions.loading)

const { gridOptions, dwList, wclList, xmxzList, dydjList, xmzxStatusList, yssfStatusList, gbdkStatusList, sfList, projectTypeList, initParams, resetFormParams, setFormParams, getFormParams, getFormData, resetFormData } = useCommon()

const { classificationOne, classificationTwo, classificationThree, getClassificationOne, getClassificationTwo, getClassificationThree, clearAllClassification } = useClassification(resetFormParams, setFormParams, getFormParams)

// 列设置 ==> 需要过滤掉不需要设置的列
const colRef = ref()

const colSetting = gridOptions.columns!.filter((item: any) => {
  return item.visible
})
const openColSetting = () => {
  colRef.value.openColSetting()
}

const handleIsShowSearch = () => {
  isShowSearch.value = !isShowSearch.value
  if (gridOptions.formConfig) {
    gridOptions.formConfig.enabled = isShowSearch.value
    gridRef.value?.refreshColumn()
  }
}

// 获取帮助信息
const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const ndyswclStartQjChange = (val: string) => {
  if (!val) {
    xmljwclDisabled.value = true
    resetFormParams('ndyswcl_start_num')
    resetFormParams('ndyswcl_end_qj')
    resetFormParams('ndyswcl_end_num')
  }
  if ('>' === val || '>=' === val || '<' === val || '<=' === val) {
    ndyswclDisabled.value = false
    if ('>' === val || '>=' === val) {
      ndyswclEndWclList.value = wclList.value.filter((item) => item.code === '<' || item.code === '<=' || item.code === '')
    } else {
      ndyswclEndWclList.value = wclList.value.filter((item) => item.code === '>' || item.code === '>=' || item.code === '')
    }
  } else {
    ndyswclDisabled.value = true
    resetFormParams('ndyswcl_end_qj')
    resetFormParams('ndyswcl_end_num')
  }
}

const xmljwclStartQjChange = (val: string) => {
  if (!val) {
    xmljwclDisabled.value = true
    resetFormParams('xmljwcl_start_num')
    resetFormParams('xmljwcl_end_qj')
    resetFormParams('xmljwcl_end_num')
  }
  if ('>' === val || '>=' === val || '<' === val || '<=' === val) {
    xmljwclDisabled.value = false
    if ('>' === val || '>=' === val) {
      xmljwclEndWclList.value = wclList.value.filter((item) => item.code === '<' || item.code === '<=' || item.code === '')
    } else {
      xmljwclEndWclList.value = wclList.value.filter((item) => item.code === '>' || item.code === '>=' || item.code === '')
    }
  } else {
    xmljwclDisabled.value = true
    resetFormParams('xmljwcl_end_qj')
    resetFormParams('xmljwcl_end_num')
  }
}

const changeXmlxHandle = (val: string[]) => {
  setFormParams('xmlx_id', val.join(','))
}
const getXmxzData = (val: string[]) => {
  if (Array.isArray(val)) setFormParams('xmxz', val.join(','))
  else setFormParams('xmxz', val)
}

const handleDwClick = (data: any[], datalist: any) => {
  resetFormParams('yjdw')
  resetFormParams('ejdw')
  datalist.forEach((item: any) => {
    if (item.level == '1') {
      const yjdw = getFormParams('yjdw') + item.objCode + ','
      setFormParams('yjdw', yjdw)
    } else if (item.level == '2') {
      const ejdw = getFormParams('ejdw') + item.objCode + ','
      setFormParams('ejdw', ejdw)
    }
  })
  setFormParams('yjdw', getFormParams('yjdw').substring(0, getFormParams('yjdw').length - 1))
  setFormParams('ejdw', getFormParams('ejdw').substring(0, getFormParams('ejdw').length - 1))
}

const startChangeDateHandle = (val: Date) => {
  // 如果设置val的年份和结束时间的年份不一致，就把结束时间设置为和开始时间一样的年份，把月份设置为12月，日期设置为31号
  const ysqjEnd = getFormParams('ysqj_end')
  if (ysqjEnd) {
    const endDate = new Date(ysqjEnd)
    if (val.getFullYear() !== endDate.getFullYear()) {
      endDate.setFullYear(val.getFullYear())
      endDate.setMonth(11)
      endDate.setDate(31)
      setFormParams('ysqj_end', endDate)
      // 设置年度
      setFormParams('nd', val.getFullYear())
    }
  }
}

const endChangeDateHandle = (val: Date) => {
  // 如果设置val的年份和开始时间的年份不一致，就把开始时间设置为和结束时间一样的年份，把月份设置为1月，日期设置为1号
  const ysqjStart = getFormParams('ysqj_start')
  if (ysqjStart) {
    const startDate = new Date(ysqjStart)
    if (val.getFullYear() !== startDate.getFullYear()) {
      startDate.setFullYear(val.getFullYear())
      startDate.setMonth(0)
      startDate.setDate(1)
      setFormParams('ysqj_start', startDate)
      // 设置年度
      setFormParams('nd', val.getFullYear())
    }
  }
}

const disabledStartDate = (date: Date) => {
  const publisetimeEnd = getFormParams('publisetime_end')
  if (!publisetimeEnd) return false
  return date.getTime() > new Date(publisetimeEnd).getTime()
}

const disabledEndDate = (date: Date) => {
  const publisetimeStart = getFormParams('publisetime_start')
  if (!publisetimeStart) return false
  return date.getTime() < new Date(publisetimeStart).getTime()
}

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  handleSearchPageData()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  handleSearchPageData()
}

const handleResetFormData = () => {
  clearAllClassification()
  resetFormData()
  handleSearchPageData()
}

const handleCollapsed = () => {
  collapsed.value = !collapsed.value
  if (gridOptions.formConfig && gridOptions.formConfig.items) {
    const fileds = ['xmmc', 'xmbm', 'gwxmbm']
    for (let i = 0; i < gridOptions.formConfig.items.length; i++) {
      const formItems = gridOptions.formConfig.items[i]
      if (formItems.field && !fileds.includes(formItems.field)) {
        formItems.visible = false
      }
    }
    gridRef.value?.refreshColumn()
  }
}

const cellClickHandle = async ({ row, column }: any) => {
  if (gridRef.value) {
    if (column.type === 'checkbox') return
    await gridRef.value.clearCheckboxRow()
    gridRef.value.setCheckboxRow(row, true)
  }
}

// 查询
const handleSearchPageData = async () => {
  try {
    gridOptions.loading = true
    const ysqjStart = getFormParams('ysqj_start')
    const startDate = new Date(ysqjStart)
    const ysqjEnd = getFormParams('ysqj_end')
    const endDate = new Date(ysqjEnd)
    // 设置年度
    setFormParams('nd', startDate.getFullYear())
    setFormParams('yd_start', startDate.getMonth() + 1)
    setFormParams('yd_end', endDate.getMonth() + 1)
    const formParams = {
      ...getFormData(),
      ...userInfo,
      ...page
    }
    const res = await getPageData(formParams)
    if (!res.success) throw new Error(res.msg)
    gridOptions.data = res.data.records
    page.total = res.data.total
    gridOptions.loading = false
  } catch (error) {
    ElMessage.error((error as Error).message)
    gridOptions.loading = false
  }
}

// 导出
const handleExportData = () => {
  gridOptions.loading = true
  const ysqjStart = getFormParams('ysqj_start')
  const startDate = new Date(ysqjStart)
  const ysqjEnd = getFormParams('ysqj_end')
  const endDate = new Date(ysqjEnd)
  // 设置年度
  setFormParams('nd', startDate.getFullYear())
  setFormParams('yd_start', startDate.getMonth() + 1)
  setFormParams('yd_end', endDate.getMonth() + 1)
  const formParams = {
    ...getFormData(),
    ...userInfo,
    ...page
  }
  exportPageData(formParams).then((res: any) => {
    const blob: any = res
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
    gridOptions.loading = false
  })
}

const { handleProjectClose, setUserInfo, handleProjectReject, handleViewProcess, processData, handleDealHistory, handleAbnormalDealData } = useService(gridRef, operationModalRef, historyModalRef, handleSearchPageData, gridOptions)

// 权限获取
const getRoleHandle = async () => {
  if (userDialogRef.value) {
    const isQuery = userDialogRef.value.isQuery
    if (isQuery) {
      const user: any = userDialogRef.value.userMsg
      userInfo.bmId = user.specialorgid
      userInfo.dwId = user.org_id
      userInfo.id = user.id
      userInfo.specialorgcode = user.specialorgcode
      setUserInfo(userInfo)
      handleSearchPageData()
      isShowPage.value = true
    }
  }
}

onMounted(() => {
  initParams()
  getClassificationOne()
  if (userDialogRef.value) userDialogRef.value.getUser()
})
</script>

<style scoped lang="less">
@import url(./css/index.less);
</style>
