<template>
  <div class="main" v-if="isShowPage" v-loading="loading">
    <el-tabs v-model="activeName" type="card">
      <el-tab-pane label="需求明细" name="first"></el-tab-pane>
      <el-tab-pane label="待确认需求明细" name="second"></el-tab-pane>
    </el-tabs>
    <div class="opeartion" v-if="activeName === 'first'">
      <el-button plain type="primary" size="mini" v-debounce="[editHandle, `click`, 300]">修 改</el-button>
      <el-button plain type="primary" size="mini" v-debounce="[deleteHandle, `click`, 300]">删 除</el-button>
      <el-button plain type="primary" size="mini" v-debounce="[matterHandle, `click`, 300]">关联事项</el-button>
      <el-button type="primary" size="mini" v-debounce="[submitWorkflowHandle, `click`, 300]">提 交</el-button>
      <el-button plain type="primary" size="mini" v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
      <el-button plain type="primary" size="mini" v-debounce="[processHandle, `click`, 300]">流程履历</el-button>
    </div>
    <div class="opeartion" v-else>
      <el-button plain type="primary" size="mini" v-debounce="[openModal, `click`, 300]">类型确认</el-button>
    </div>
    <div class="search">
      <el-form v-if="activeName === 'first'" ref="formRef" :model="searchDatas" label-position="right" label-width="120px">
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
          <el-col :span="linkLength % 4 === 0 ? 24 : linkLength % 4 === 1 ? 18 : linkLength % 4 === 2 ? 12 : linkLength % 4 === 3 ? 6 : 24">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="searchDataHandle">查 询</el-button>
              <el-button plain size="mini" @click="resetHandle">重 置</el-button>
              <el-button plain type="primary" size="mini" @click="settingHandle">高级设置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <el-form v-else ref="formSecRef" :model="searchSecDatas" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目名称">
              <el-input v-model="searchSecDatas.xmmc" style="width: 100%"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目编码">
              <ReMultipleText v-model="searchSecDatas.xmbm" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div class="operation" style="text-align: right; margin-bottom: 10px">
              <el-button plain type="primary" size="mini" @click="getSecTableData">查 询</el-button>
              <el-button plain size="mini" @click="resetSecHandle">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-grid v-if="activeName === 'first'" ref="gridRef" height="100%" v-bind="gridOptions"></vxe-grid>
      <vxe-grid v-else ref="gridSecRef" height="100%" v-bind="gridSecOptions"></vxe-grid>
    </div>
    <div class="bottom">
      <el-pagination
        :current-page="activeName === 'first' ? page.page : pageSec.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="activeName === 'first' ? page.limit : pageSec.limit"
        :total="activeName === 'first' ? parseInt(page.total + '') : parseInt(pageSec.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
    <DynamicReports @show-modal="showHandle" ref="dynamicReportsRef" :title="title" />
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
</template>

<script lang="ts">
export default {
  name: '/reserve/stockIn/index'
}
</script>
<script setup lang="ts">
import {
  getXqlrPage,
  submitCbxqsh,
  submit,
  getDynamicTableByUser,
  exportXm,
  deleteXm,
  getDynamicSearchColumn,
  getTbcPage
} from '@/api/service/requirement'
import { ref, defineExpose, reactive, onMounted } from 'vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage } from 'element-plus'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { Configs } from '@/views/service/xq/interface'
import VXETable, { VxeGridProps } from 'vxe-table'
import TreeSelect from '@/components/TreeSelect/index.vue'
import baseService from '@/service/baseService'
import Matter from '@/views/service/xq/components/Matter.vue'
import { useProcess } from '@/hooks/useProcess'
import { getAppMenu } from '@/api/menu/menuConfig'
import userDialog from '@/components/select/userDialog.vue'
import { MenuConfig } from '@/views/service/xq/interface'
import DynamicReports from '@/components/DynamicReports/index.vue'
import QueryProTypeModal from '@/views/service/xq/components/QueryProTypeModal.vue'
import { formatNumValue } from '@/utils/utils'

import { useUser } from '@/hooks/useUser'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

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
const userInfo = ref<any>({})
const store = useStore()
const matterRef = ref()
const queryProTypeModalRef = ref()
const dynamicReportsRef = ref()
const formRef = ref()
const isShowModal = ref(false)
const isShowPage = ref(false)
const loading = ref(false)
const selectData = ref<RowVo>()
const selectDatas = ref<RowVo[]>()
const gridRef = ref()
const gridSecRef = ref()
const editPageRef = ref()
const searchCode = ref('XQLR')
const dynamciSearch = ref<Configs[]>([])
const searchDatas = ref<any>({})
const searchSecDatas = ref<any>({})
const linkLength = ref(0)
const flag = ref('EDIT')
const operationBtn = ref<MenuConfig[]>([])
const searchBtn = ref<MenuConfig[]>([])
const title = '高级设置'
const activeName = ref('first')

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

const pageSec = {
  total: 0,
  limit: 20,
  page: 1
}

const secColumns = [
  {
    type: 'checkbox',
    width: 80
  },
  {
    title: '项目编码',
    field: 'xmbm',
    width: 180
  },
  {
    title: '项目名称',
    field: 'xmmc',
    width: 180
  },
  {
    title: '是否打捆',
    field: 'pack',
    width: 180,
    formatter: ({ cellValue }: any) => {
      return cellValue ? '是' : '否'
    }
  },
  {
    title: '申报预算（万元）',
    field: 'amount',
    width: 180,
    align: 'right',
    formatter: ({ cellValue }: any) => {
      return formatNumValue(cellValue, 6)
    }
  },
  {
    title: '一级分类',
    field: 'yjfl',
    width: 180
  },
  {
    title: '二级分类',
    field: 'ejfl',
    width: 180
  },
  {
    title: '三级分类',
    field: 'sjfl',
    width: 180
  },
  {
    title: '一级单位',
    field: 'yjdw',
    width: 180
  },
  {
    title: '二级单位',
    field: 'ejdw',
    width: 180
  },
  {
    title: '成本中心',
    field: 'applyCenter',
    width: 180
  },
  {
    title: '创建部门',
    field: 'createDeptName',
    width: 180
  },
  {
    title: '创建人',
    field: 'creator',
    width: 180
  }
]

const openModal = () => {
  const $grid = gridSecRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行操作!')
      return
    }
    const row = records[0] || {}
    const params = {
      row: row,
      getTableData: getSecTableData,
      getFirstTableData: searchDataHandle
    }
    queryProTypeModalRef.value.acceptParams(params)
  }
}

const pageChangeHandle = (currentPageNum: number) => {
  if (activeName.value === 'first') {
    page.page = currentPageNum
    searchDataHandle()
  } else {
    pageSec.page = currentPageNum
    getSecTableData()
  }
}
const limitChangeHandle = (currentLimitNum: number) => {
  if (activeName.value === 'first') {
    page.page = 1
    page.limit = currentLimitNum
    searchDataHandle()
  } else {
    pageSec.page = 1
    pageSec.limit = currentLimitNum
    getSecTableData()
  }
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
  const getPageData = await getXqlrPage({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
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
  linkLength.value = 0
  loading.value = true
  const searchResData = await getDynamicSearchColumn({
    searchCode: searchCode.value,
    searchType: '1'
  })
  if (searchResData.success) {
    searchResData.data.forEach((item: Configs) => {
      if (item.link) linkLength.value++
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

const matterHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length === 0) {
      ElMessage.warning('请选择至少一条数据进行事项关联!')
      return
    }
    const lyxt = records.filter((item: any) => item.lyxt === '98')
    if (lyxt.length !== 0) {
      ElMessage.warning('请选择外围系统项目进行事项关联!')
      return
    }
    const type = await VXETable.modal.confirm('确认是否进行事项关联?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type === 'confirm') {
      if (records && records.length > 0) {
        const xmlx = records.filter((item: any) => item.xmlx !== records[0].xmlx)
        if (xmlx.length !== 0) {
          ElMessage.warning('不同项目类型项目不能进行事项关联!')
          return
        }
        selectDatas.value = records
        matterRef.value.isShowModal = true
      }
    }
  }
}

const submitWorkflowHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length === 0) {
      ElMessage.warning('请选择至少一条数据进行提交!')
      return
    }
    if (records && records.length > 100) {
      ElMessage.warning('系统最多支持提交100条数据,建议您分批操作!')
      return
    }
    let workflowFlag = false
    if (records.length !== 1) {
      const xmlx = records[0].xmlx
      const someType = records.some((item: any) => item.xmlx !== xmlx)
      if (someType) {
        ElMessage.warning('提交数据的项目类型必须一致,请检查!')
        return
      }
      const someWorkflowStatus = records.every((item: any) => Number(item.sfxyxqsh) === 1)
      if (someWorkflowStatus) workflowFlag = true
      else workflowFlag = false
      // sfxyxqsh 1 是走工作流 2否不走工作流
    } else {
      const record = records[0]
      if (Number(record['sfxyxqsh']) === 1) workflowFlag = true
      else workflowFlag = false
    }

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
        submitCbxqshWorkflowHandle(submitListIdsStr)
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

const resetSecHandle = () => {
  for (let valueKey in searchSecDatas.value) {
    let data = searchSecDatas.value[valueKey]
    if (Array.isArray(data)) {
      searchSecDatas.value[valueKey].length = 0
    } else {
      searchSecDatas.value[valueKey] = ''
    }
  }
  getSecTableData()
}

const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
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
        store.commit('setXqGlobalInfo', {
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
        const xqGlobalInfo = store.getters.getXqGlobalInfo
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

const submitCbxqshWorkflowHandle = (submitListIds: any) => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || ''
  }

  wfParam.value.XMIDS = submitListIds
  wfParam.value.FQZZ = userInfo.value.fqzzFlag //市县 CITY OR COUNTY
  wfParam.value.FQBM = userInfo.value.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB' //CWB

  loading.value = true
  submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_NEWCBXQSHLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.deptId || '',
    spRoleId: userInfo.value.spRoleId || '',
    wfCode: 'WF_NEWCBXQSHLC',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitCbxqsh({
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
    searchCode: searchCode.value
  }
  exportXm(params).then((res: any) => {
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
  columns: []
})

const gridSecOptions = reactive<VxeGridProps<RowVo>>({
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
  columns: []
})

const getDynamicTable = async () => {
  const res = await getDynamicTableByUser({
    searchCode: searchCode.value
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

const getSecTableData = async () => {
  try {
    loading.value = true
    const res = await getTbcPage({
      bmId: userInfo.value.deptId || '',
      dwId: userInfo.value.dwId || '',
      ...searchSecDatas.value,
      ...pageSec
    })
    if (res.success) {
      gridSecOptions.data = res.data.records
      pageSec.total = res.data.total
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const showHandle = async () => {
  gridSecOptions.columns = secColumns
  await getSecTableData()
  await getDynamicTable()
  await searchDataHandle()
  await searchConfigHandle()
}

onMounted(async () => {
  var isRoel = await useUser()

  if (isRoel) {
    const xqGlobalInfo = store.getters.getXqGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(xqGlobalInfo as any)
    }
    showHandle()
  } else {
    const operationRes = await getAppMenu({
      appNo: 'XQK',
      label: '1'
    })
    const searchRes = await getAppMenu({
      appNo: 'XQK',
      label: '2'
    })
    if (operationRes.success && searchRes.success) {
      operationBtn.value = operationRes.data
      searchBtn.value = searchRes.data
    }
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
    padding-bottom: 10px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
