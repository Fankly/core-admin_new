<script lang="ts">
export default {
  name: 'GeneralReport'
}
</script>
<script setup lang="ts">
import DynamicReports from '@/components/DynamicReports/index.vue'
import { getDynamicTableByUser, getDynamicSearchColumn } from '@/api/service/requirement'
import { ref, defineExpose, reactive, onMounted, computed, withDefaults, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { Configs, Params } from '@/views/service/xq/interface'
import { Result, UserInfo, RowVo } from '@/views/service/Storage/interface'
import { VxeGridProps } from 'vxe-table'
import TreeSelect from '@/components/TreeSelect/index.vue'
import baseService from '@/service/baseService'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { useProcess } from '@/hooks/useProcess'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { freezeColumns } from '@/utils/utils'

interface Tab {
  type: string
  name: string
}

interface Props {
  searchCode: string
  searchApi: (params: any) => Promise<Result>
  exportApi: (params: Params) => Promise<Result>
  userInfo: UserInfo
  tab?: Tab
  freezeLeftCount?: number
}

// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<Props>(), {
  freezeLeftCount: 0
})

const formRef = ref()
const helpModalRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const selectData = ref<RowVo>()
const gridRef = ref()
const dynamicReportsRef = ref()
const editPageRef = ref()
const searchCode = computed(() => props.searchCode)
const dynamciSearch = ref<Configs[]>([])
const searchDatas = ref<any>({})
const linkLength = ref(0)
const userInfo = computed(() => props.userInfo)

const checkedData = ref<RowVo[]>([])

const title = '高级设置'

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

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchDataHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchDataHandle()
}

const processData = reactive({
  isShowDialog: false,
  compName: '',
  id: ''
})

const processHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    try {
      loading.value = true
      const records = $grid.getCheckboxRecords()
      useProcess(records, processData)
    } finally {
      loading.value = false
    }
  }
}

const exportHandle = () => {
  const exportApi = props.exportApi
  if (!exportApi) return
  loading.value = true
  const params = {
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: userInfo.value.deptId || '',
    dwId: userInfo.value.dwId || '',
    roleCode: userInfo.value.roleCode || '',
    roleId: userInfo.value.roleId || '',
    searchCode: searchCode.value
  }
  exportApi(params).then((res: any) => {
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

  if (prop === 'yjfl') {
    if (value) {
      const findEjflData: any = dynamciSearch.value.find((search) => search.code === 'ejfl')
      const ejflData = await baseService.post(findEjflData.dyff, {
        bmId: userInfo.value.deptId || '',
        dwId: userInfo.value.dwId || '',
        roleCode: userInfo.value.roleCode || '',
        roleId: userInfo.value.roleId || '',
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

const searchDataHandle = async () => {
  const searchApi = props.searchApi
  if (!searchApi) return
  checkedData.value = []
  loading.value = true
  const getPageData = await searchApi({
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    roleCode: userInfo.value.roleCode || '',
    roleId: userInfo.value.roleId || '',
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

const initParamsData = async (method: any, params: any): Promise<any[]> => {
  const res = await baseService.post(method, params)
  if (res.success) {
    return res.data
  } else {
    ElMessage.error(res.msg)
    return []
  }
}

const viewHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行查看!')
      return
    }
    selectData.value = records[0] as RowVo
    editPageRef.value.isShowModal = true
  }
}

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
    gridOptions.columns = res.data.map((item: any) => ({
      ...item,
      title: item.columnValue,
      field: item.columnKey,
      width: 180
    }))
    gridOptions.columns?.unshift({
      type: 'checkbox',
      width: 80
    })
    freezeColumns(gridOptions.columns as any, props.freezeLeftCount)
  }
}

const showHandle = async () => {
  try {
    loading.value = true
    await searchConfigHandle()
    await getDynamicTable()
    await searchDataHandle()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  showHandle()
})

const showModalHandle = () => {
  searchConfigHandle()
  getDynamicTable()
}

const settingHandle = () => {
  dynamicReportsRef.value.isShowDrawer = true
}

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await gridRef.value.clearCheckboxRow()
  gridRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

const isChecked = computed(() => checkedData.value && checkedData.value.length === 0)
const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}
defineExpose({
  isShowModal,
  loading,
  searchDataHandle
})
</script>

<template>
  <div class="main" v-loading="loading">
    <div class="opeartion">
      <div class="left">
        <el-button v-permission="'VIEW'" plain type="primary" size="mini" @click="viewHandle" :disabled="isChecked">项目信息查看</el-button>
        <slot name="operation" :selected-list="checkedData"></slot>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" @click="exportHandle">导 出</el-button>
        <el-button v-permission="'PROCESS'" plain type="primary" size="mini" @click="processHandle" :disabled="isChecked">流程履历</el-button>
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>

    <div class="search">
      <el-form ref="formRef" :model="searchDatas" label-position="right" label-width="120px">
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

                <!-- <el-input
                  :maxlength="127"
                  v-model="searchDatas[column.code]"
                  v-else-if="column.type === 'inputText'"
                  style="width: 100%"
                /> -->
                <ReMultipleText
                  :placeholder="column.placeholder"
                  :dialog-title="column.name"
                  :tooltip-text="column.name"
                  v-else-if="column.type === 'multipleInput'"
                  v-model="searchDatas[column.code]"
                ></ReMultipleText>
                <el-input :maxlength="127" v-model="searchDatas[column.code]" v-else style="width: 100%" />
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
    <el-tabs v-if="tab">
      <el-tab-pane :label="tab.name"></el-tab-pane>
    </el-tabs>
    <div class="table">
      <vxe-grid
        :checkbox-config="{
          trigger: 'row',
          highlight: true
        }"
        @checkbox-change="checkChangeHandle"
        @checkbox-all="checkChangeAllHandle"
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
  <DynamicReports :search-code="searchCode" :title="title" ref="dynamicReportsRef" @show-modal="showModalHandle"></DynamicReports>
  <CentralizedModification ref="editPageRef" :userInfo="userInfo" :formData="selectData" flag="VIEW"></CentralizedModification>
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
  <HelpModal ref="helpModalRef" />
</template>

<style scoped lang="less">
@import url(./index.less);
</style>
