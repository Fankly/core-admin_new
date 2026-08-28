<template>
  <vxe-modal
    @show="showHandle"
    :destroy-on-close="true"
    show-zoom
    resize
    fullscreen
    title="租赁需求提报"
    position="center"
    width="80%"
    height="800"
    v-model="isShowModal"
    :loading="loading"
    class-name="myCart"
  >
    <div class="main">
      <div class="opeartion">
        <el-button v-permission="'EDIT'" plain type="primary" size="mini" v-debounce="[editHandle, `click`, 300]">修 改</el-button>
        <el-button v-permission="'DELETE'" plain type="danger" size="mini" v-debounce="[deleteHandle, `click`, 300]">删 除</el-button>
        <el-button v-permission="'SUBMIT'" plain type="primary" size="mini" v-debounce="[submitWorkflowHandle, `click`, 300]">提 交</el-button>
        <el-button v-permission="'EXPORT'" plain type="primary" size="mini" v-debounce="[exportHandle, `click`, 300]">导 出</el-button>
        <el-button v-permission="'PROCESS'" plain type="primary" size="mini" v-debounce="[processHandle, `click`, 300]">流程履历</el-button>
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
                <el-button plain type="primary" size="mini" @click="resetHandle">重 置</el-button>
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
        <DynamicReports :search-code="searchCode" @show-modal="showHandle" ref="dynamicReportsRef" :title="title" />
      </div>
    </div>
  </vxe-modal>
  <QueryProTypeModal ref="queryProTypeModalRef"></QueryProTypeModal>
  <CentralizedModification
    @saveAfter="searchDataHandle"
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectData"
    :flag="flag"
  ></CentralizedModification>
  <Matter @update-table="searchDataHandle" :selectDatas="selectDatas" ref="matterRef" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :id="processData.id"
    :is="processData.compName"
  ></component>
</template>

<script lang="ts">
export default {
  name: 'ZlMyCart'
}
</script>
<script setup lang="ts">
import {
  deleteXm,
  getDynamicSearchColumn,
  getDynamicTableByUser,
  submit,
  submitZLxqsh,
  zlxqmxcxExport,
  zlxqszySearch
} from '@/api/service/requirement'
import { getZlxqFlag } from '@/api/service/zlxqszy'
import DynamicReports from '@/components/DynamicReports/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import TreeSelect from '@/components/TreeSelect/index.vue'
import { useProcess } from '@/hooks/useProcess'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { formatNumValue } from '@/utils/utils'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import Matter from '@/views/service/xq/components/Matter.vue'
import QueryProTypeModal from '@/views/service/xq/components/QueryProTypeModal.vue'
import { Configs } from '@/views/service/xq/interface'
import { ElMessage } from 'element-plus'
import { computed, defineExpose, defineProps, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import VXETable, { VxeGridProps } from 'vxe-table'

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

const props = defineProps({
  userInfo: {
    type: Object as any,
    required: true
  }
})
const sfzl = '1'
const store = useStore()
const formRef = ref()
const matterRef = ref()
const dynamicReportsRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const selectData = ref<RowVo>()
const selectDatas = ref<RowVo[]>()
const gridRef = ref()
const editPageRef = ref()
const queryProTypeModalRef = ref()
const searchCode = ref('ZLXQLR')
const dynamciSearch = ref<Configs[]>([])
const searchDatas = ref<any>({})
const linkLength = ref(0)
const flag = ref('EDIT')
const title = '高级设置'

const spanComp = computed(() =>
  linkLength.value % 4 === 0 ? 24 : linkLength.value % 4 === 1 ? 18 : linkLength.value % 4 === 2 ? 12 : linkLength.value % 4 === 3 ? 6 : 24
)

const processData = reactive<any>({
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

const settingHandle = () => {
  dynamicReportsRef.value.isShowDrawer = true
}

const handleFieldChange = async (prop: string, value: any, column: Configs) => {
  if (prop === 'yjdw') {
    if (value) {
      const findData: any = dynamciSearch.value.find((search) => search.code === 'ejdw')
      const ejdwData = await baseService.post(findData.dyff, {
        YJDW: value,
        bmId: props.userInfo.deptId || '',
        dwId: props.userInfo.dwId || '',
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
        bmId: props.userInfo.deptId || '',
        dwId: props.userInfo.dwId || '',
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
        bmId: props.userInfo.deptId || '',
        dwId: props.userInfo.dwId || '',
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
  loading.value = true
  const getPageData = await zlxqszySearch({
    ...searchDatas.value,
    sfzl: sfzl,
    limit: page.limit,
    page: page.page,
    bmId: props.userInfo.deptId || '',
    dwId: props.userInfo.dwId || '',
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
        xmIds: submitListIds,
        sfzl: sfzl
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

const submitWorkflowHandle = async () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
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
      }
      workflowFlag = true
    } else {
      const record = records[0]
      workflowFlag = true
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
        .filter((createDepId: any) => createDepId != props.userInfo.deptId.toString())
      if (submitListDeptId && submitListDeptId.length !== 0) {
        ElMessage.warning('仅能提交当前登录用户所属部门数据!')
        return
      }
      if (workflowFlag) {
        const getDataRes = await getZlxqFlag(submitListIdsStr, props.userInfo.dwId || '')
        if (getDataRes.success) {
          // 提交工作流
          submitCbxqshWorkflowHandle(submitListIdsStr, getDataRes, ctbm)
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
  FQBM: ''
})

const submitCbxqshWorkflowHandle = (submitListIds: any, getDataRes: any, ctbm: string) => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: props.userInfo.deptId || '',
    spRoleId: props.userInfo.spRoleId || ''
  }

  wfParam.value.XMIDS = submitListIds
  wfParam.value.FQZZ = props.userInfo.fqzzFlag //市县 CITY OR COUNTY
  wfParam.value.FQBM = props.userInfo.specialorgcode === 'BM_CWZC' ? 'CWB' : 'YWB' //CWB
  wfParam.value.DWLX = getDataRes.data.DWLX || ''
  wfParam.value.CTBM = ctbm || ''
  wfParam.value.SDKZYBM = getDataRes.data.SDKZYBM || ''
  wfParam.value.SYWGKBM = getDataRes.data.SYWGKBM || ''
  loading.value = true
  submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_ZLXQSHLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: props.userInfo.deptId || '',
    spRoleId: props.userInfo.spRoleId || '',
    wfCode: 'WF_ZLXQSHLC',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitZLxqsh({
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
          bmId: props.userInfo.deptId || '',
          dwId: props.userInfo.dwId || ''
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
        bmId: props.userInfo.deptId || '',
        dwId: props.userInfo.dwId || '',
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

const exportHandle = () => {
  loading.value = true
  const params = {
    ...searchDatas.value,
    limit: page.limit,
    page: page.page,
    bmId: props.userInfo.deptId || '',
    dwId: props.userInfo.dwId || '',
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

const processHandle = () => {
  const $grid = gridRef.value
  if ($grid) {
    const records = $grid.getCheckboxRecords()
    useProcess(records, processData)
  }
}

const cellClickHandle = async (row: any, flag: string) => {
  const compRef = gridRef
  await compRef.value.clearCheckboxRow()
  compRef.value.setCheckboxRow(row, true)
}

const showHandle = async () => {
  await getDynamicTable()
  await searchDataHandle()
  await searchConfigHandle()
}

defineExpose({
  isShowModal,
  loading
})
</script>

<style scoped lang="less">
.main {
  height: 100%;
  display: flex;
  flex-direction: column;

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
