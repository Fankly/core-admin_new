<template>
  <div class="main" v-if="isShowPage" v-loading="loading">
    <div class="opeartion">
      <div class="left">
        <el-button v-permission="'ADD'" plain type="primary" size="mini" @click="handlerBtn('add')">新 增</el-button>
        <el-button v-permission="'EDIT'" plain type="primary" size="mini" @click="handlerBtn('edit')">修 改</el-button>
        <el-button v-permission="'VIEW'" plain type="primary" size="mini" @click="handlerBtn('view')">查 看</el-button>
        <el-button v-permission="'DELETE'" plain type="primary" size="mini" @click="delHandler">删 除</el-button>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" @click="exportHandle">导 出</el-button>
        <!-- <el-button v-permission="'XZCZSC'" plain type="primary" size="mini">下载操作手册</el-button> -->
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <!-- 搜索条件区域 -->
    <div class="search">
      <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <template v-for="column in dynamciSearch" :key="column.code">
            <el-col :span="6" v-if="column.link">
              <el-form-item :label="column.name">
                <el-select
                  v-if="column.type === 'select'"
                  collapse-tags
                  style="width: 100%"
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
                  v-else-if="column.type === 'inputText'"
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-model="searchDatas[column.code]"
                />
                <el-input v-else maxlength="127" v-model="searchDatas[column.code]" style="width: 100%"></el-input>
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
    <!-- table表格列表 -->
    <div class="table">
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @cell-click="cellClickHandle"
        ref="gridRef"
        height="100%"
        v-bind="gridOptions"
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
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <!-- 帮助-弹窗 -->
  <HelpModal ref="helpModalRef" />
  <newModal
    ref="newModalRef"
    :title="modalTitle"
    :dialog-state="dialogState"
    :htID="htID"
    :sffpqz-arr="sffpqzArr"
    :sfhm-arr="sfhmArr"
    :sflg-arr="sflgArr"
    :sfnbdw-arr="sfnbdwArr"
    :pcsx-arr="pcsxArr"
    :sl-arr="slArr"
    :user-info="userInfo"
    @show-modal="showModal"
    @input-append-handle="inputAppendHandle"
    @update-ht-id="updateHtId"
  />
  <!-- 维护出租方信息-弹窗 -->
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowTable"
    :destroy-on-close="true"
    :title="vueModel === 'czf' ? '维护出租方信息' : '项目编码信息'"
    width="860"
    :height="700"
    :close-on-press-escape="false"
    @close="closeModal"
  >
    <proTable
      ref="proTableRef"
      :cell-style="columnStyle"
      @cell-click="runTask"
      :data-callback="pageList"
      :request-api="pageMeeting"
      :request-auto="true"
      :columns="vueModel === 'czf' ? tableColumns : xmbmTableColumns"
      :search-col="3"
      :tool-button="['setting', 'search', 'other']"
    >
      <template #tableHeader="scope">
        <el-button plain type="primary" size="mini" :disabled="!scope.isSelected" @click.stop="saveModal(scope.selectedList)">确 定</el-button>
      </template>
    </proTable>
  </vxe-modal>
  <!-- 高级设置-弹窗 -->
  <DynamicReports :search-code="searchCode" @show-modal="showHandle" ref="dynamicReportsRef" :title="title" />
</template>

<script lang="ts">
export default {
  name: '/service/xq/ContractLedgerManagement'
}
</script>
<script setup lang="ts">
import {
  searchCsParamList,
  exportXm,
  getDynamicSearchColumn,
  getDynamicTableByUser,
  qryGysData,
  getPageForZlxq,
  htDetail,
  exportCsParam,
  csParamDelete
} from '@/api/service/requirement'
import { save, getEjdwData, getYjdwData, getBm, xmExpertDelete } from '@/api/service/expertinformation'
import { getPublicData } from '@/api/common' //公共代码
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import { useGuide } from '@/hooks/useGuide'
import { useUser } from '@/hooks/useUser'
import baseService from '@/service/baseService'
import { Configs, MenuConfig } from '@/views/service/xq/interface'
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { computed, defineExpose, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { VxeGridProps, VXETable } from 'vxe-table'
import newModal from '@/views/service/xq/components/newModal.vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import DynamicReports from '@/components/DynamicReports/index.vue'

interface RowVo {
  code: string
  name: string
  state: string
  crtsigningdate: string
  vendernumber: string
  vendername: string
  innervender_name: string
  yjdwms: string
  ejdwms: string
  startdate: string
  enddate: string
  leasemonth: string
  totalrenttax: string
  totalrentnottax: string
  npvratend: string
  wbscode: string
  wbsname: string
  fpqz_name: string
  retrntion_name: string
  exemption_name: string
  zlzcsyksynx: string
}

const route = useRoute()
const formRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const helpModalRef = ref()
const selectData = ref<any>([])
const gridRef = ref()
const dynamicReportsRef = ref()
const searchCode = ref('ZLHTGL')
const dynamciSearch = ref<Configs[]>([])
const searchDatas = ref<any>({})
const linkLength = ref(0)
const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  roleId: string
  spRoleId: string
  specialorgcode: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  roleId: '',
  specialorgcode: '',
  spRoleId: ''
})

const title = '高级设置'
const newModalRef = ref<any>() //新增弹窗元素
const modalTitle = ref<any>('') //弹窗标题
const dialogState = ref<any>('') //弹窗状态
const levelOne = ref<any>([]) // 一级单位
const levelTwo = ref<any>([]) // 二级单位
const sffpqzArr = ref<any[]>([]) //是否分批起租
const sfhmArr = ref<any[]>([]) //豁免类型
const sflgArr = ref<any[]>([]) //是否留购
const sfnbdwArr = ref<any[]>([]) //是否为内部单位
const slArr = ref<any[]>([]) //税率
const pcsxArr = ref<any[]>([]) //批次顺序

const vueModel = ref<any>('')
const htID = ref<any>('')
const isShowTable = ref<boolean>(false)
const proTableRef = ref()

const { startGuide } = useGuide({
  moduleKey: 'RequireDetailSearch',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

const store = useStore()
const userInfOther = ref<any>()
const userDialogRef = ref()
const defaultValueProp = ref<any>({})

const searchData = ref<{
  [key: string]: any
}>({})
const page = {
  total: 0,
  limit: 20,
  page: 1
}

const spanComp = computed(() =>
  linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24
)

const isShowPage = ref(false)

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchDataHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

// 按钮-导出
const exportHandle = () => {
  loading.value = true
  const params = {
    ...searchDatas.value,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || ''
  }
  exportCsParam(params).then((res: any) => {
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
}

// 按钮-查询
const searchDataHandle = async () => {
  loading.value = true
  const getPageData = await searchCsParamList({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || ''
    // searchCode: searchCode.value
  })
  if (getPageData.success) {
    gridOptions.data = getPageData.data.records
    page.total = getPageData.data.total
    loading.value = false
  } else {
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

// 按钮-新增、修改、查看
const handlerBtn = async (val: any) => {
  await initParamLists()
  const $grid = gridRef.value
  dialogState.value = val
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (['view', 'edit'].includes(val)) {
      selectData.value = records
      if (records && records.length !== 1) {
        ElMessage.warning(val === 'edit' ? '请选择一条数据进行修改!' : '请选择一条数据进行查看!')
        return
      }
      modalTitle.value = val == 'edit' ? '修改' : '查看'
      newModalRef.value.isShowModel = true
      getDetail(records[0].id)
    } else if (['add'].includes(val)) {
      modalTitle.value = '新增'
      htID.value = ''
      newModalRef.value.isShowModel = true
      newModalRef.value.rmarkData = {}
      newModalRef.value.levelOne = levelOne.value
      newModalRef.value.rmarkData.fpqz = '0'
      newModalRef.value.rmarkData.exemption = 'N'
      newModalRef.value.rmarkData.yjdw = levelOne.value[0].code
      newModalRef.value.rmarkData.yjdwms = levelOne.value[0].name

      let item = levelOne.value.find((item: any) => item.code == levelOne.value[0].code)
      // const res: any = await getEjdwData(item ? item.id : '')
      const res: any = await baseService.post('/bizOrgTree/getEjdw', {
        YJDW: item ? item.code : '',
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        parentCode: item ? item.code : ''
      })
      if (res.success && res.data.length !== 0) {
        newModalRef.value.levelTwo = res.data
        newModalRef.value.rmarkData.ejdw = res.data[0].code
        newModalRef.value.rmarkData.ejdwms = res.data[0].name
      }
      // const root: any = await getBm(parseInt(levelOne.value[0].code))
      // if (root.success && root.data.length !== 0) {
      //   newModalRef.value.levelThree = root.data
      // }
    }
  }
}

// 查询基本信息
const getDetail = async (ID: any) => {
  const dataList = await htDetail({
    page: page.page,
    limit: page.limit,
    ID
  })
  if (dataList.success) {
    newModalRef.value.rmarkData = dataList.data || {}
    newModalRef.value.levelOne = levelOne.value
    htID.value = newModalRef.value.rmarkData.id

    newModalRef.value.rmarkData.crtSigningDate = getDate(dataList.data.crtSigningDate) // 合同签订日期
    newModalRef.value.rmarkData.startDate = getDate(dataList.data.startDate) // 租赁期实际开始日
    newModalRef.value.rmarkData.endDate = getDate(dataList.data.endDate) // 租赁期实际结束日

    if (newModalRef.value.rmarkData.retrntion === 'N') {
      // 判断是否留购为 否 时
      newModalRef.value.rules.zlzcsyksynx[0].required = false
      newModalRef.value.rmarkData.zlzcsyksynx = ''
    } else {
      newModalRef.value.rules.zlzcsyksynx[0].required = true
    }

    let item = levelOne.value.find((item: any) => item.code == selectData.value[0].yjdw)
    // const res: any = await getEjdwData(item ? item.id : '')
    const res: any = await baseService.post('/bizOrgTree/getEjdw', {
      YJDW: item ? item.code : '',
      bmId: userInfo.value.deptId || '',
      dwId: userInfo.value.dwId || '',
      parentCode: item ? item.code : ''
    })
    if (res.success && res.data.length !== 0) {
      newModalRef.value.levelTwo = res.data
    }
    // const root: any = await getBm(parseInt(selectData.value[0].ejdw))
    // if (root.success && root.data.length !== 0) {
    //   newModalRef.value.levelThree = root.data
    // }

    // 获取一级单位和二级单位名称
    let itemTwo = newModalRef.value.levelTwo.find((item: any) => item.code == selectData.value[0].ejdw)
    newModalRef.value.rmarkData.yjdwms = item ? item.name : ''
    newModalRef.value.rmarkData.ejdwms = itemTwo ? itemTwo.name : ''

    // 根据合同签订日期判断项目编码和项目名称是否必填
    if (
      newModalRef.value.rmarkData.crtSigningDate &&
      new Date(newModalRef.value.rmarkData.crtSigningDate).getTime() >= new Date('2025-06-01').getTime()
    ) {
      newModalRef.value.rules.wbsCode[0].required = true
      newModalRef.value.rules.wbsName[0].required = true
    } else {
      newModalRef.value.rules.wbsCode[0].required = false
      newModalRef.value.ruleFormRef.clearValidate('wbsCode')

      newModalRef.value.rules.wbsName[0].required = false
      newModalRef.value.ruleFormRef.clearValidate('wbsName')
    }
  }
}

// 删除
const delHandler = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    selectData.value = records

    if (selectData.value.length == 0) {
      ElMessage.warning('请选择数据！')
      return
    }
    const ids = selectData.value.map(({ id }: any) => id)
    ElMessageBox.confirm('是否确定删除所选数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res: any = await csParamDelete({ ID: ids.join(',') })
        if (res.success) {
          ElMessage.success('删除成功')
          searchDataHandle()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}

// 更新合同ID
const updateHtId = (val: any) => {
  console.log('====更新合同ID====', val)
  htID.value = val
}

// 保存
const showModal = (val: any) => {
  if (val === '0') {
    searchDataHandle()
  } else if (val === '1') {
    searchDataHandle()
    newModalRef.value.closeHandle()
  }
}

// 公共代码
const initParamLists = async () => {
  levelOne.value.length = 0 //清空单位
  // 获取公共代码
  // 一级单位
  // const res = await getYjdwData()
  // if (res.success && res.data.length !== 0) {
  //   levelOne.value.push(...res.data)
  // }
  const yjdwOpt = dynamciSearch.value.find((item: any) => item.code === 'yjdw')
  if (yjdwOpt) {
    levelOne.value.push(...yjdwOpt.options)
  }
  // 是否分批起租
  const fpqzCodeList = await getPublicData('SFFPQZ')
  if (fpqzCodeList.success && fpqzCodeList.data.length !== 0) {
    sffpqzArr.value = fpqzCodeList.data
  }
  // 豁免类型
  const sfhmCodeList = await getPublicData('SFHM')
  if (sfhmCodeList.success && sfhmCodeList.data.length !== 0) {
    sfhmArr.value = sfhmCodeList.data
  }
  // 是否留购
  const sflgCodeList = await getPublicData('SFLG')
  if (sflgCodeList.success && sflgCodeList.data.length !== 0) {
    sflgArr.value = sflgCodeList.data
  }
  // 是否为内部单位
  const sfnbdwCodeList = await getPublicData('ZLYS_CZFSX')
  if (sfnbdwCodeList.success && sfnbdwCodeList.data.length !== 0) {
    sfnbdwArr.value = sfnbdwCodeList.data
  }
}

// 按钮- 重置
const resetHandle = () => {
  dynamciSearch.value.forEach((item) => {
    if (item.dependOnColumn) {
      if (item.options && Array.isArray(item.options)) {
        item.options = []
      }
    }
  })
  for (let valueKey in searchDatas.value) {
    let data = searchDatas.value[valueKey]
    if (Array.isArray(data)) {
      if (defaultValueProp.value[valueKey]) {
        searchDatas.value[valueKey] = defaultValueProp.value[valueKey]
      } else {
        searchDatas.value[valueKey].length = 0
      }
    } else {
      if (defaultValueProp.value[valueKey]) {
        searchDatas.value[valueKey] = defaultValueProp.value[valueKey]
      } else {
        searchDatas.value[valueKey] = ''
      }
    }
  }
  searchDataHandle()
}

const searchConfigHandle = async () => {
  loading.value = true
  const searchResData = await getDynamicSearchColumn({
    searchCode: searchCode.value
  })
  if (searchResData.success) {
    linkLength.value = searchResData.data.length
    searchResData.data.forEach((item: Configs) => {
      if (item.defaultValue) {
        if (item.multiple) {
          const defaultValue = item.defaultValue.split(',')
          defaultValueProp.value[item.code] = defaultValue
          searchDatas.value[item.code] = defaultValue
        } else {
          searchDatas.value[item.code] = item.defaultValue
          defaultValueProp.value[item.code] = item.defaultValue
        }
      }
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

const getDynamicTable = async () => {
  const res = await getDynamicTableByUser({
    searchCode: searchCode.value
  })
  if (res.success) {
    gridOptions.columns = res.data.map((item: any) => {
      if (item.columnKey === 'xmmc') {
        item['width'] = 280
      } else {
        item['width'] = 180
      }
      return {
        ...item,
        title: item.columnValue,
        field: item.columnKey
      }
    })
    gridOptions.columns?.unshift({
      type: 'checkbox',
      width: 80
    })
  }
}

const getDate = (value: any) => {
  var nowDate = value ? new Date(value) : new Date()
  var y = nowDate.getFullYear()
  var m: any = nowDate.getMonth() + 1
  var d: any = nowDate.getDate()
  if (m < 10) {
    m = '0' + m
  }
  if (d < 10) {
    d = '0' + d
  }
  return y + '-' + m + '-' + d
}

const showHandle = async () => {
  await searchConfigHandle()
  await getDynamicTable()
  await searchDataHandle()
  startGuide()
}

// Dialog弹出框 loadCompany 事件
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfOther.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        store.commit('setXqGlobalInfo', {
          deptId: userInfOther.value.specialorgid,
          deptName: userInfOther.value.specialorgname,
          dwId: userInfOther.value.org_id,
          dwName: userInfOther.value.org_name,
          roleId: userInfOther.value.role_id,
          roleCode: userInfOther.value.code,
          spRoleId: userInfOther.value.id,
          specialorgcode: userInfOther.value.specialorgcode,
          fqzzFlag: flagData.data
        })
        const xqGlobalInfo = store.getters.getXqGlobalInfo
        if (xqGlobalInfo && Object.keys(xqGlobalInfo).length > 0) {
          isShowPage.value = true
          userInfo.value = {
            ...(xqGlobalInfo as any)
          }
          showHandle()
        }
      }
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await userDialogRef.value.getUser()
})

// 高级设置
const settingHandle = () => {
  dynamicReportsRef.value.isShowDrawer = true
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value.clearCheckboxRow()
  gridRef.value.setCheckboxRow(row, true)
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

// 数据回调
const pageList = (val: any) => {
  if (val && val.records) {
    val.records.forEach((item: any, index: any) => {
      item.id = index
    })
  }
  return val
}

// 列表查询
const pageMeeting = (params: any) => {
  if (vueModel.value === 'czf') {
    params = { ...params, comCode: 'YSSX_COM' }
    return qryGysData(params)
  } else {
    params = {
      ...params,
      zts: ['Q60'],
      searchCode: 'ZLXQ_SCW',
      fqzzFlag: 'PROVINCE',
      bmId: userInfo.value.deptId || '',
      dwId: userInfo.value.dwId || '',
      deptId: userInfo.value.deptId || '',
      deptName: userInfo.value.deptName || '',
      dwName: userInfo.value.dwName || '',
      roleId: userInfo.value.roleId || '',
      roleCode: userInfo.value.roleCode || '',
      spRoleId: userInfo.value.spRoleId || '',
      specialorgcode: userInfo.value.specialorgcode || '',
      htejdw: newModalRef.value.rmarkData.ejdw
    }
    return getPageForZlxq(params)
  }
}

// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  return 'cursor: pointer;'
}

const runTask = async (row: any, column: any) => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.element.toggleRowSelection(row)
}

const tableColumns = reactive<any>([
  { type: 'selection', label: '', width: '50' },
  { type: 'index', label: '序号', width: '50' },
  {
    prop: 'lifnr',
    label: '出租方编码',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'name',
    label: '出租方名称',
    search: { el: 'input', order: 2 }
  }
])

const xmbmTableColumns = reactive<any>([
  { type: 'selection', label: '', width: '50' },
  { type: 'index', label: '序号', width: '50' },
  {
    prop: 'xmbm',
    label: '项目编码',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    search: { el: 'input', order: 2 }
  }
])

// 点击出租方名称或项目编码-打开弹窗
const inputAppendHandle = (val: any) => {
  vueModel.value = val
  isShowTable.value = true
}

// 关闭出租方名称或项目编码弹窗
const closeModal = () => {
  isShowTable.value = false
}

// 出租方名称或/项目编码弹窗确定“保存数据”
const saveModal = (selectedList: any) => {
  if (selectedList.length == 1) {
    if (vueModel.value === 'czf') {
      newModalRef.value.rmarkData.venderName = selectedList[0].name
      newModalRef.value.rmarkData.venderNumber = selectedList[0].lifnr
      newModalRef.value.rmarkData.innerVender = selectedList[0].innreflag
      isShowTable.value = false
    } else {
      newModalRef.value.rmarkData.wbsCode = selectedList[0].xmbm
      newModalRef.value.rmarkData.wbsName = selectedList[0].xmmc
      isShowTable.value = false
    }
  } else {
    ElMessage.warning('请选择一条数据')
  }
}

defineExpose({
  isShowModal,
  loading,
  inputAppendHandle,
  // closeModal,
  // saveModal,
  // runTask,
  columnStyle,
  pageList,
  pageMeeting,
  tableColumns
})
</script>

<style scoped lang="less">
.opeartion {
  display: flex;
  min-width: 0;
  min-height: 0;

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
    padding: 10px;
  }

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
