<template>
  <div class="main" v-if="isShowPage" v-loading="loading">
    <div class="opeartion">
      <div class="left">
        <el-button v-permission="'EDIT'" plain type="primary" size="mini" v-debounce="[editHandle, `click`, 300]">修 改</el-button>
        <el-button v-permission="'DELETE'" plain type="primary" size="mini" v-debounce="[deleteHandle, `click`, 300]">删 除</el-button>
        <el-button v-permission="'SUBMIT'" type="primary" size="mini" v-debounce="[submitWorkflowHandle, `click`, 300]">提 交</el-button>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
        <el-button v-permission="'PROCESS'" plain type="primary" size="mini" v-debounce="[processHandle, `click`, 300]">流程履历</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="130px">
        <el-row :gutter="24">
          <template v-for="column in dynamciSearch" :key="column.code">
            <el-col :span="6" v-if="column.link">
              <el-form-item :label="column.name">
                <el-select
                  collapse-tags
                  style="width: 100%"
                  v-if="column.type === 'select'"
                  v-model="searchDatas[column.code]"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  :clearable="column.clearable !== false"
                  :multiple="column.multiple"
                  :filterable="column.filterable"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                >
                  <el-option
                    v-for="option in column.options"
                    :key="option.code"
                    :label="option.name"
                    :value="option.code"
                    :disabled="option.disabled"
                  />
                </el-select>
                <tree-select
                  v-else-if="column.type === 'treeSelect'"
                  v-model="searchDatas[column.code]"
                  :data="column.options"
                  :props="column.treeProps"
                  :node-key="column.nodeKey || 'id'"
                  :multiple="column.multiple"
                  :clearable="column.clearable !== false"
                  :filterable="column.filterable"
                  :placeholder="column.placeholder"
                  :disabled="column.disabled"
                  @change="handleFieldChange(column.code, searchDatas[column.code], column)"
                ></tree-select>
                <ReMultipleText
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-else-if="column.type === 'inputText'"
                  v-model="searchDatas[column.code]"
                />
                <el-input v-model="searchDatas[column.code]" v-else style="width: 100%"></el-input>
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="spanComp">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="mini" @click="resetHandle">重 置</el-button>
              <el-button plain type="primary" size="mini" @click="settingHandle">高级设置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        ref="gridRef"
        height="100%"
        v-bind="gridOptions"
        @cell-click="({row}:any)=>cellClickHandle(row,'1')"
      ></vxe-grid>
    </div>
    <div class="bottom">
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
    <DynamicReports :search-code="searchCode" @show-modal="showHandle" ref="dynamicReportsRef" :title="title" />
  </div>
  <CentralizedModification
    @saveAfter="searchDataHandle"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="flag"
  ></CentralizedModification>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <Matter @update-table="searchDataHandle" :selectDatas="selectDatas" ref="matterRef"></Matter>
  <QueryProTypeModal ref="queryProTypeModalRef"></QueryProTypeModal>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/service/xq/ZlModificationNew'
}
</script>
<script setup lang="ts">
import {
  deleteXm,
  getDynamicSearchColumn,
  getDynamicTableByUser,
  submit,
  submitZLxqshNew,
  zlxqmxcxExport,
  zlxqszySearchNew,
  getZlDwpz
} from '@/api/service/requirement'
import { getDataByParent } from '@/api/common'
import DynamicReports from '@/components/DynamicReports/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import { useProcess } from '@/hooks/useProcessNew'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { formatNumValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModificationNew.vue'
import Matter from '@/views/service/xq/components/Matter.vue'
import QueryProTypeModal from '@/views/service/xq/components/QueryProTypeModal.vue'
import { Configs } from '@/views/service/xq/interface'
import { ElMessage } from 'element-plus'
import { computed, defineExpose, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import VXETable, { VxeGridProps } from 'vxe-table'

import { getZlxqFlag } from '@/api/service/zlxqszy'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { useUser } from '@/hooks/useUser'
import { useGuide } from '@/hooks/useGuide'
import { getLabel } from '@/utils'

interface RowVo {
  id: string
  ztName: string
  xmbm: string
  xmmc: string
  amount: string
  xmlx: string
  zdtx: string
  yssx: string
  sjflName: string
  gkbm_name: string
  yjdwName: string
  ejdwName: string
  cbzxName: string
  createTime: string
  cjr: string
  lyxt_name: string
  yssx_new_id: string
}
const sfzl = '1'
const route = useRoute()
const userInfo = ref<any>({})
const store = useStore()
const matterRef = ref()
const helpModalRef = ref()
const queryProTypeModalRef = ref()
const dynamicReportsRef = ref()
const formRef = ref()
const isShowModal = ref(false)
const isShowPage = ref(false)
const loading = ref(false)
const selectData = ref<any>({})
const selectDatas = ref<RowVo[]>()
const gridRef = ref()
const editPageRef = ref()
const searchCode = ref('ZLXQLR')
const dynamciSearch = ref<Configs[]>([])
const searchDatas = ref<any>({})
const linkLength = ref(0)
const flag = ref('EDIT')
const title = '高级设置'
const orderParams = ref<any>({})
const wfCode = ref()
const lubmCodeData = shallowRef<Array<any>>([])

const { startGuide } = useGuide({
  moduleKey: 'CentralizedModification',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const spanComp = computed(() =>
  linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24
)

const processData = reactive({
  isShowDialog: false,
  compName: null,
  id: ''
})

const searchData = ref<{
  [key: string]: any
}>({})

const page = {
  total: 0,
  limit: 20,
  page: 1
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchDataHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

const handleFieldChange = async (prop: string, value: any, column: Configs) => {
  if (prop === 'yjdw') {
    if (value) {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
      const ejdwData = await baseService.post(findData.dyff, {
        YJDW: value,
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        parentCode: value
      })
      findData.options = ejdwData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
      findData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
      }
    }
  }

  if (prop === 'yjfl') {
    if (value) {
      const findEjflData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
      const ejflData = await baseService.post(findEjflData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findEjflData.options = ejflData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
      const findSjflData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      findData.options = []
      findSjflData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
        searchDatas.value[findSjflData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
        searchDatas.value[findSjflData.code] = ''
      }
    }
  }

  if (prop === 'ejfl') {
    if (value) {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      const sjflData: any = await baseService.post(findData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        code: column.ggdm,
        parentCode: value
      })
      findData.options = sjflData.data || []
    } else {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'sjfl')
      findData.options = []
      if (Array.isArray(searchDatas.value[findData.code])) {
        searchDatas.value[findData.code] = []
      } else {
        searchDatas.value[findData.code] = ''
      }
    }
  }
}

// 初始化表格数据
const searchDataHandle = async () => {
  loading.value = true
  const getPageData = await zlxqszySearchNew({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    sfzl: sfzl,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    searchCode: searchCode.value
  })
  if (getPageData.success) {
    gridOptions.data = getPageData.data.records
    page.total = getPageData.data.total
    loading.value = false
  } else {
    loading.value = false
  }
}

const settingHandle = () => {
  dynamicReportsRef.value.isShowDrawer = true
}

const searchConfigHandle = async () => {
  loading.value = true
  const searchResData = await getDynamicSearchColumn({
    searchCode: searchCode.value,
    searchType: '1',
    sfzl: sfzl
  })
  if (searchResData.success) {
    linkLength.value = searchResData.data.length
    searchResData.data.forEach((item: Configs) => {
      searchData.value[item.code] = item.link
    })
    const ggdms: any = []
    const codes: any = []
    const customData: any = []
    dynamciSearch.value = searchResData.data.map((item: Configs) => {
      if (item.dyff && item.ggdm && !item.dependOnColumn) {
        ggdms.push(item.ggdm)
        codes.push(item.code)
      }
      if (item.dyff && !item.ggdm && !item.dependOnColumn) {
        customData.push({
          dyff: item.dyff,
          code: item.code
        })
      }
      return {
        ...item,
        nodeKey: 'id',
        placeholder: '请选择' + item.name,
        disabled: false,
        clearable: true,
        filterable: true,
        multiple: item.multiple,
        options: [],
        treeProps: { children: 'children', label: 'name', value: 'id' }
      }
    })
    for (const item of customData) {
      if (item.code !== 'xmlx') {
        const initCustomData = await initParamsData(item.dyff, {
          bmId: userInfo.value.deptId || '',
          dwId: userInfo.value.dwId || ''
        })
        const findData = dynamciSearch.value.find((search) => search.code === item.code)
        if (findData) {
          findData.options = initCustomData
        }
      } else {
        const initCustomData = await baseService.get(item.dyff)
        const findData = dynamciSearch.value.find((search) => search.code === item.code)
        if (findData) {
          findData.options = initCustomData.data
          findData.treeProps = {
            children: 'children',
            label: 'name',
            value: 'id'
          }
        }
      }
    }

    if (ggdms.length > 0) {
      const initData = await initParamsData('/commonCode/getCommonCode', {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        codes: ggdms
      })
      dynamciSearch.value.forEach((item) => {
        const searchDataIndex = codes.findIndex((code: any) => code === item.code)
        const searchData = codes.find((code: any) => code === item.code)
        if (searchDataIndex !== -1 && searchData) {
          item.options = initData[searchDataIndex].codes
        }
      })
    }
    loading.value = false
  }
}

const initParamsData = async (method: any, params: any): Promise<any[]> => {
  const res = await baseService.post(method, params)
  if (res.success) {
    return res.data
  } else {
    ElMessage.error(res.msg)
    return []
  }
}

const editHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行修改!')
      return
    }
    selectData.value = records[0] as RowVo
    if (!selectData.value['yssx_new_id']) {
      ElMessage.warning('当前项目未关联事项，请先关联事项!')
      return
    }
    flag.value = 'EDIT'
    editPageRef.value.isShowModal = true
  }
}

const deleteHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length === 0) {
      ElMessage.warning('请选择至少一条数据进行删除!')
      return
    }
    const type = await VXETable.modal.confirm('确认是否删除?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      let submitListIds = records.map((item: any) => item.id)
      const res = await deleteXm({
        xmIds: submitListIds
      })
      if (res.success) {
        ElMessage.success('删除成功')
        await searchDataHandle()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const submitWorkflowHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    selectData.value = records[0] as RowVo
    if (records && records.length === 0) {
      ElMessage.warning('请选择至少一条数据进行提交!')
      return
    }
    if (records.length > 100) {
      ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
      return
    }
    let workflowFlag = false
    const ctbm = records[0].ctbm
    const sdkzybmId = records[0].sdkzybm_id
    const sgbmId = records[0].sgbm_id
    const xmlx = records[0].xmlx
    const zrzclx = records[0].zrzclb_code
    const xjspbm = records[0].xjspbm_code
    if (records.length !== 1) {
      for (let i = 1; i < records.length; i++) {
        const tableColumns = records[i]
        if (tableColumns.sfgmb === '1') {
          ElMessage.warning('是否规模包为[是],只能单次提交!')
          return
        }
        if (tableColumns.xmlx !== xmlx) {
          ElMessage.warning('项目类型相同的记录才允许合并提交,请检查!')
          return
        }
        if (tableColumns.ctbm !== ctbm) {
          ElMessage.warning('市管部门相同的记录才允许合并提交,请检查!')
          return
        }
        if (tableColumns.sdkzybm_id !== sdkzybmId) {
          ElMessage.warning('省对口专业部门相同的记录才允许合并提交，请检查')
          return
        }
        if (tableColumns.sgbm_id !== sgbmId) {
          ElMessage.warning('省业务归口部门相同的记录才允许合并提交，请检查!')
          return
        }
        if (tableColumns.zrzclb_code !== zrzclx) {
          ElMessage.warning('租入资产类型相同的记录才允许合并提交，请检查!')
          return
        }
        if (tableColumns.xjspbm_code !== xjspbm) {
          ElMessage.warning('市管审批部门相同的记录才允许合并提交，请检查!')
          return
        }
      }
      workflowFlag = true
      // sfxyxqsh 1 是走工作流 2否不走工作流
    } else {
      const record = records[0]
      workflowFlag = true
    }
    wfCode.value = getLabel(records[0].zrzclb_code, lubmCodeData.value)
    const type = await VXETable.modal.confirm('确认是否提交?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      let submitListIds = records.map((item: any) => item.id)
      let submitListIdsStr = submitListIds.join(',')
      let submitListDeptId = records
        .map((item: any) => item['create_dep_id'])
        .filter((createDepId: any) => createDepId != userInfo.value.deptId.toString())
      if (submitListDeptId && submitListDeptId.length !== 0) {
        ElMessage.warning('仅能提交当前登录用户所属部门数据!')
        return
      }
      if (workflowFlag) {
        // 提交工作流
        const getDataRes = await getZlxqFlag(submitListIdsStr, userInfo.value.dwId || '')
        if (getDataRes.success) {
          // 提交工作流
          submitZlxqshWorkflowHandle(submitListIdsStr, getDataRes, ctbm)
        } else {
          ElMessage.error(getDataRes.msg)
        }
      } else {
        const res = await submit(submitListIds)
        if (res.success) {
          ElMessage.success('提交成功')
          await searchDataHandle()
        } else {
          ElMessage.error(res.msg)
        }
      }
    }
  }
}

const resetHandle = () => {
  for (let valueKey in searchDatas.value) {
    let data = searchDatas.value[valueKey]
    if (Array.isArray(data)) {
      searchDatas.value[valueKey].length = 0
    } else {
      searchDatas.value[valueKey] = ''
    }
  }
  searchDataHandle()
}

const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
  CTBM: '',
  FQBM: ''
})

const userDialogRef = ref()
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        flag.value = flagData.data
        store.commit('setZlGlobalInfo', {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flag.value
        })
        const xqGlobalInfo = store.getters.getZlGlobalInfo
        userInfo.value = {
          ...(xqGlobalInfo as any)
        }
        showHandle()
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const getZlDwpzData = async (deptId: any) => {
  const zlDwpzData = await getZlDwpz(deptId)
  if (zlDwpzData.success) {
    orderParams.value = {
      SX: zlDwpzData.data.sx, // 属性
      SFZYDW: zlDwpzData.data.sfzydw, // 是否主业单位
      SFSGS: zlDwpzData.data.sfsgs, // 是否市公司
      SFWZBM: zlDwpzData.data.sfwzbm, // 是否物资部门
      SFSJCY: zlDwpzData.data.sfsjcy, // 是否市公司产业单位
      SFBGS: zlDwpzData.data.sfbgs, // 是否办公室
      CITYCY: zlDwpzData.data.citycy, // 市产业
      COUNTYCY: zlDwpzData.data.countycy, // 县产业
      COUNTYGD: zlDwpzData.data.countygd, // 县供电
      CITYGD: zlDwpzData.data.citygd, // 市供电
      PROYWBM: zlDwpzData.data.provinceCybId,
      SGS_CYDW_AUDIT: zlDwpzData.data.sgsCydwAudit, // 是否需要市级产业单位审核
      XGS_GDDW_AUDIT: zlDwpzData.data.xgsGddwAudit, // 是否需要县级供电单位审核
      SGS_GDDW_AUDIT: zlDwpzData.data.sgsGddwAudit, // 是否需要市级供电单位审核
      FQBM_UNICODE: zlDwpzData.data.bmUnicode, // 发起部门性质
      FQDWSX: zlDwpzData.data.sx, // 发起单位产业单位属性
      FQDWID: zlDwpzData.data.dwId // 发起单位ID
    }
  }
}

const submitZlxqshWorkflowHandle = (submitListIds: any, getDataRes: any, ctbm: string) => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || ''
  }

  wfParam.value.XMIDS = submitListIds
  wfParam.value.FQZZ = userInfo.value.fqzzFlag //市县 CITY OR COUNTY
  wfParam.value.FQBM = userInfo.value.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB' //CWB
  wfParam.value.DWLX = getDataRes.data.DWLX || ''
  wfParam.value.CTBM = ctbm || ''
  wfParam.value.SDKZYBM = getDataRes.data.SDKZYBM || ''
  wfParam.value.SYWGKBM = getDataRes.data.SYWGKBM || ''
  wfParam.value.SFZYDW = orderParams.value.SFZYDW // 是否主业单位
  wfParam.value.SFSGS = orderParams.value.SFSGS // 是否市公司
  wfParam.value.SFWZBM = orderParams.value.SFWZBM // 是否物资部门
  wfParam.value.SFSJCY = orderParams.value.SFSJCY // 是否市公司产业单位
  wfParam.value.SFBGS = orderParams.value.SFBGS // 是否办公室
  wfParam.value.CITYCY = orderParams.value.CITYCY // 市产业
  wfParam.value.COUNTYCY = orderParams.value.COUNTYCY // 县产业
  wfParam.value.COUNTYGD = orderParams.value.COUNTYGD // 县供电
  wfParam.value.SGS_CYDW_AUDIT = orderParams.value.SGS_CYDW_AUDIT // 是否需要市级产业单位审核
  wfParam.value.XGS_GDDW_AUDIT = orderParams.value.XGS_GDDW_AUDIT // 是否需要县级供电单位审核
  wfParam.value.SGS_GDDW_AUDIT = orderParams.value.SGS_GDDW_AUDIT // 是否需要市级供电单位审核
  wfParam.value.CITYGD = orderParams.value.CITYGD // 市供电
  wfParam.value.FQBM_UNICODE = orderParams.value.FQBM_UNICODE // 发起部门性质
  wfParam.value.FQDWSX = orderParams.value.FQDWSX // 发起单位产业单位属性
  wfParam.value.FQDWID = orderParams.value.FQDWID // 发起单位ID

  wfParam.value.PROYWBM = selectData.value.sdkzybm_id // 省对口专业部门
  wfParam.value.CITYZYBM = selectData.value.xjspbm_code // 市专业部门(下级审批部门)
  wfParam.value.ZRZCLB = selectData.value.zrzclb_code // 租入资产类型

  loading.value = true
  submitWorkflow(store.getters.getUserMsg.systemCode, wfCode.value, '', wfUserInfo, wfParam.value, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || '',
    wfCode: wfCode.value,
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitZLxqshNew({
    ...spfrom
  })
  if (res.success) {
    loading.value = false
    ElMessage.success('提交成功')
    await searchDataHandle()
  } else {
    loading.value = false
    let msg = res.msg.split('|').join('<br/>')
    ElMessage.error({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}

const exportHandle = () => {
  loading.value = true
  const params = {
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    searchCode: searchCode.value,
    sfzl: sfzl
  }
  zlxqmxcxExport(params).then((res: any) => {
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
    loading.value = false
  })
}

const processHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    useProcess(records, processData)
  }
}

const gridOptions = reactive<VxeGridProps<RowVo>>({
  border: true,
  columnConfig: {
    resizable: true
  },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: {
    height: 32
  },
  columns: [],
  rowStyle: ({ row, rowIndex }: any) => {
    if (['Q01', 'Q02'].includes(row['zt'])) {
      return { color: 'red' }
    }
  }
})

const getDynamicTable = async () => {
  const res = await getDynamicTableByUser({
    searchCode: searchCode.value,
    sfzl: sfzl
  })
  if (res.success) {
    gridOptions.columns = res.data.map((item: any) => {
      if (item.columnKey === 'amount') {
        item.align = 'right'
        item.headerAlign = 'center'
        item.formatter = ({ cellValue }: any) => {
          return formatNumValue(cellValue, 6)
        }
      }
      return {
        ...item,
        title: item.columnValue,
        field: item.columnKey,
        width: 180
      }
    })
    gridOptions.columns?.unshift({
      type: 'checkbox',
      width: 80
    })
  }
}

const showHandle = async () => {
  await getDynamicTable()
  await searchDataHandle()
  await searchConfigHandle()
  startGuide()
}

const cellClickHandle = async (row: any, flag: string) => {
  const compRef = gridRef
  await compRef.value.clearCheckboxRow()
  compRef.value.setCheckboxRow(row, true)
}

// 通过配置公共代码，获取相关流程对应的wfCode
const getPublicCode = async () => {
  try {
    const res = await getDataByParent('ZRZCLB_COM')
    if (res.success) {
      lubmCodeData.value = res.data
    } else {
      throw new Error(res.msg)
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }
}

watch(
  () => store.getters.getZlGlobalInfo,
  (newVal) => {
    if (newVal && newVal.deptId) {
      getZlDwpzData(newVal.deptId)
    }
  },
  {
    deep: true
  }
)

onMounted(async () => {
  getPublicCode()
  const isRoel = await useUser('getZlGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const xqGlobalInfo = store.getters.getZlGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    await showHandle()
  } else {
    await userDialogRef.value.getUser()
  }
})

defineExpose({
  isShowModal,
  loading
})
</script>

<style scoped lang="less">
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  height: auto !important;
  min-height: 32px;
}

:deep(.el-select__tags) {
  height: auto !important;
  max-height: none !important;
  flex-wrap: wrap;
  padding: 2px 0;
  .el-select__input {
    max-width: 110px !important;
  }
}

:deep(.el-input__wrapper) {
  height: auto !important;
}
.main {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;

  .opeartion {
    display: flex;
    min-width: 0;
    min-height: 0;
    margin-bottom: 10px;
    .left {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
    .right {
      min-width: 0;
      min-height: 0;
    }
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
