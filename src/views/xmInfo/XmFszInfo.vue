<template>
  <div class="container-main">
    <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
    <template v-if="userInfo.isShowPage">
      <div v-loading="loading" class="process" element-loading-text="正在从服务器获取数据.....">
        <div class="topBox">
          <div class="title">
            <div class="titleBox">
              <el-button size="mini" plain type="primary" @click="saveHandle" v-permission="'SAVE'">保 存</el-button>
              <el-button size="mini" plain type="primary" @click="importHandle" v-permission="'IMPORT'">导 入</el-button>
              <el-button size="mini" plain type="primary" @click="exportHandle" v-permission="'EXPORT'">导 出</el-button>
            </div>
            <div class="searchBox">
              <div class="tool-button">
                <el-tooltip content="列设置" placement="top" style="margin-right: 10px">
                  <span @click="openColSetting" style="cursor: pointer" class="el-icon-s-operation"></span>
                </el-tooltip>
                <el-tooltip content="隐藏/展示查询" placement="top" style="margin-right: 10px">
                  <span @click="isShowSearchHandle">
                    <i :class="isShowSearch ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" style="cursor: pointer"></i>
                  </span>
                </el-tooltip>
                <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
              </div>
            </div>
          </div>
        </div>
        <div class="form-table">
          <div class="search" v-if="isShowSearch">
            <el-form :model="formData" label-width="110px" label-position="right">
              <el-row :gutter="24">
                <el-col :span="6">
                  <el-form-item label="项目名称：">
                    <el-input v-model="formData.xmmc"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="国网项目编码：">
                    <copyTextBox class="formWidth" ref="gwxmbmRef"></copyTextBox>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="一级单位：">
                    <el-select clearable style="width: 100%" @change="getEjdwData" v-model="formData.yjdw">
                      <el-option v-for="item in selectData.yjdwListData" :key="item.code" :label="item.name" :value="item.code">
                        {{ item.name }}
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="二级单位：">
                    <el-select clearable style="width: 100%" v-model="formData.ejdw">
                      <el-option v-for="item in selectData.ejdwListData" :key="item.code" :label="item.name" :value="item.code">
                        {{ item.name }}
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="6">
                  <el-form-item label="年度：">
                    <el-date-picker
                      @change="searchTreeAndTableHandle"
                      value-format="YYYY"
                      :clearable="false"
                      style="width: 100%"
                      v-model="formData.nd"
                      type="year"
                      placeholder="选择年"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="项目类型：">
                    <TreeSelect
                      @clearData="clearDataHandle"
                      ref="proTypeRef"
                      :is-leaf="false"
                      @selectChange="getProjectType"
                      :default-props="treeProps.projectTypeProps"
                      :data="selectData.projectType"
                      :is-child-node="false"
                      node-key="id"
                      data-type="id"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6"> </el-col>
                <el-col :span="6" style="text-align: right">
                  <el-button plain type="primary" size="mini" @click="searchData">查 询</el-button>
                  <el-button plain type="info" size="mini" @click="resetData">重 置</el-button>
                </el-col>
              </el-row>
            </el-form>
          </div>
          <div class="content_table" ref="contentTables">
            <div ref="contentRef" class="content_table_center">
              <vxe-table
                show-header-overflow
                show-overflow
                keep-source
                height="100%"
                ref="tableRef"
                :border="true"
                :column-config="{ resizable: true }"
                :data="tableInfo.tableData"
                :edit-config="tableInfo.editConfig"
              >
                <template v-for="item in tableInfo.columns">
                  <vxe-column
                    v-if="item.isEdit && item.isShow"
                    :key="item.prop"
                    :formatter="(tableInfo:any) => formatterHandle(item.isFormatter,tableInfo)"
                    header-align="center"
                    :width="item.width"
                    :align="item.align"
                    :field="item.prop"
                    :title="item.label"
                    :edit-render="{}"
                    :fixed="item.prop === 'xmmc' || item.prop === 'gwxmbm' ? 'left' : ''"
                  >
                    <template #edit="{ row }">
                      <el-input v-model="row[item.prop]" maxlength="20" :oninput="(input: any) => inputSxysHandle(input)" />
                    </template>
                  </vxe-column>
                  <vxe-column
                    :fixed="item.prop === 'xmmc' || item.prop === 'gwxmbm' ? 'left' : ''"
                    :key="item.prop"
                    v-if="!item.isEdit && item.isShow"
                    :formatter="(tableInfo:any) => formatterHandle(item.isFormatter,tableInfo)"
                    header-align="center"
                    :width="item.width"
                    :align="item.align"
                    :field="item.prop"
                    :title="item.label"
                  >
                  </vxe-column>
                </template>
              </vxe-table>
            </div>
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
        <!-- 列设置 -->
        <ColSetting ref="colRef" v-model:col-setting="colSetting" />
        <ImportExcel ref="importRef" />
      </div>
    </template>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/xmInfo/XmFszInfo'
}
</script>
<script lang="ts" setup>
// 是否显示搜索模块
import { onMounted, reactive, ref, watch } from 'vue'
import ColSetting from '@/components/ProTable/components/ColSetting.vue'
import userDialog from '@/components/select/userDialog.vue'
import copyTextBox from '@/components/select/copyTextBox.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { ElMessage } from 'element-plus'
import { getProTypeTreeNode } from '@/api/process'
import { getEjdwList, getYjdwList } from '@/api/matter'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { VxeColumnPropTypes, VXETable, VxeTablePropTypes } from 'vxe-table'
import { exportXmFszInfo, getXmFszInfo, getXmFszInfoTemplate, importXmFszInfo, saveXmFszInfo } from '@/api/xmInfo'
import ImportExcel from '@/components/ImportExcel/index.vue'
import Decimal from 'decimal.js'

const page = {
  total: 0,
  limit: 10,
  page: 1,
  current: '1'
}
const colRef = ref()
const userDialogRef = ref()
const helpModalRef = ref()
const contentRef = ref()
const contentTables = ref()
const importRef = ref()
const tableRef = ref()
const gwxmbmRef = ref()
const proTypeRef = ref()
const openColSetting = () => colRef.value.openColSetting()

const isShowSearch = ref(true)
const loading = ref(false)
const userInfo = reactive({
  specialOrgId: '',
  isShowPage: false
})

const selectData = reactive<{
  yjdwListData: {
    name: string
    code: string
  }[]
  ejdwListData: {
    name: string
    code: string
  }[]
  projectType: any
}>({
  yjdwListData: [],
  ejdwListData: [],
  projectType: []
})

const treeProps = reactive({
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

const formData = reactive<{
  xmmc: string
  gwxmbm: string[]
  yjdw: string
  ejdw: string
  xmlx: string[]
  nd: string
  [key: string]: any
}>({
  xmmc: '',
  gwxmbm: [],
  yjdw: '',
  ejdw: '',
  xmlx: [],
  nd: ''
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const tableInfo = reactive<{
  columns: {
    label: string
    prop: string
    width: number
    align: VxeColumnPropTypes.Align
    isFormatter: boolean
    isEdit?: boolean
    isShow: boolean
    sortable: boolean
    fixed?: string
  }[]
  tableData: any[]
  editConfig: VxeTablePropTypes.EditConfig
}>({
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true
  },
  tableData: [],
  columns: [
    {
      label: '项目名称',
      prop: 'xmmc',
      width: 280,
      align: 'left',
      isFormatter: false,
      isShow: true,
      sortable: false,
      fixed: 'left'
    },
    {
      label: '国网项目编码',
      prop: 'gwxmbm',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false,
      fixed: 'left'
    },
    {
      label: '年度',
      prop: 'nd',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '项目类型',
      prop: 'proType',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '项目包名称',
      prop: 'xmbName',
      width: 280,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '一级单位',
      prop: 'yjdw',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '二级单位',
      prop: 'ejdw',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '项目性质',
      prop: 'xmxz',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '立项时间',
      prop: 'saptime',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '当年预算（含税）（万元）',
      prop: 'dnysTax',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '当年预算（不含税）（万元）',
      prop: 'dnys',
      width: 180,
      align: 'center',
      isFormatter: false,
      isShow: true,
      sortable: false
    },
    {
      label: '累计税金（万元）',
      prop: 'ljsj',
      width: 180,
      align: 'right',
      isFormatter: true,
      isEdit: true,
      isShow: true,
      sortable: false
    },
    {
      label: '累计结算（万元）',
      prop: 'ljfsz',
      width: 180,
      align: 'right',
      isFormatter: true,
      isEdit: true,
      isShow: true,
      sortable: false
    },
    {
      label: '累计结算（含税）（万元）',
      prop: 'ljwcz',
      width: 220,
      align: 'right',
      isFormatter: true,
      isShow: true,
      sortable: false
    },
    {
      label: '当年结算（万元）',
      prop: 'dncwzc',
      width: 180,
      align: 'right',
      isFormatter: true,
      isEdit: true,
      isShow: true,
      sortable: false
    },
    {
      label: '当年税金（万元）',
      prop: 'dnsj',
      width: 180,
      align: 'right',
      isFormatter: true,
      isEdit: true,
      isShow: true,
      sortable: false
    },
    {
      label: '当年结算（含税）（万元）',
      prop: 'dnwcz',
      width: 180,
      align: 'right',
      isFormatter: true,
      isShow: true,
      sortable: false
    }
  ]
})

watch(
  () => tableInfo.columns,
  () => {
    console.log(tableInfo.columns)
  },
  {
    deep: true
  }
)

const formatterHandle = (isFormmater: boolean, { column, cellValue }: any) => {
  if (!isFormmater) {
    return cellValue
  }
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return new Decimal(cellValue).toFixed(6)
}

// 获取项目类型
const getProjectData = () => {
  loading.value = true
  const params = {
    parentId: '0',
    startDate: formData.nd
  }
  getProTypeTreeNode(params).then((res) => {
    if (res.success) {
      loading.value = false
      selectData.projectType = res.data
    } else {
      loading.value = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

const clearDataHandle = () => {
  formData.xmlx.length = 0
}

const inputSxysHandle = (event: any) => {
  event.target.value = '' + event.target.value
  event.target.value =
    event.target.value
      .replace(/[^\d^.-]+/g, '') // 包括负号的匹配
      .replace(/^0+(\d)/, '$1')
      .replace(/^\./, '0.')
      .match(/^[-]?\d{0,12}(?:\.\d{0,6})?/)[0] || ''
}

const getProjectType = (value: any) => {
  formData.xmlx = value
}

const getYjdwEnum = async () => {
  let res: any = await getYjdwList(userInfo.specialOrgId)
  if (res.success) {
    selectData.yjdwListData.push(...res.data)
  }
}

const getEjdwData = async () => {
  let res: any = await getEjdwList({
    parentId: formData.yjdw,
    specialorgid: userInfo.specialOrgId
  })
  if (res.success) {
    selectData.ejdwListData.length = 0
    formData.ejdw = ''
    selectData.ejdwListData.push(...res.data)
  }
}

const selectRolesHandle = () => {
  loading.value = true
  userDialogRef.value.getUser()
}

const getRoleHandle = () => {
  loading.value = false
  userInfo.specialOrgId = userDialogRef.value.specialorgid
  getProjectData()
  getYjdwEnum()
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    userInfo.isShowPage = true
    searchData()
  }
}

const exportHandle = () => {
  loading.value = true
  exportXmFszInfo({
    ...formData,
    specialorgid: userInfo.specialOrgId,
    page: page.page,
    limit: page.limit
  }).then((res) => {
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
    loading.value = false
  })
}

const saveHandle = async () => {
  const $table = tableRef.value.getUpdateRecords()
  if ($table.length === 0) {
    ElMessage.warning('未进行修改操作,请修改后再进行保存！')
    return
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    if ($table) {
      let params = $table.map((item: any) => {
        return {
          dncwzc: item.dncwzc,
          dnsj: item.dnsj,
          id: item.id,
          ljfsz: item.ljfsz,
          ljsj: item.ljsj,
          xmid: item.xmid
        }
      })
      let res = await saveXmFszInfo(params)
      if (res.success) {
        ElMessage.success('保存成功！')
        searchData()
      } else {
        ElMessage.error(res.msg)
      }
    }
  }
}

// 导入
const importHandle = () => {
  let params = {
    title: '数据',
    tempApi: getXmFszInfoTemplate,
    importApi: importXmFszInfo,
    specialorgid: userInfo.specialOrgId,
    getTableList: searchData
  }
  importRef.value.acceptParams(params)
}

const searchTreeAndTableHandle = (ndValue: string) => {
  formData.nd = ndValue
  getProjectData()
}

const searchData = async () => {
  loading.value = true
  if (gwxmbmRef.value) formData.gwxmbm = gwxmbmRef.value.array
  let res = await getXmFszInfo({
    ...formData,
    page: page.page,
    limit: page.limit,
    specialorgid: userInfo.specialOrgId
  })
  if (res.success) {
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    ElMessage.error('请重新再试！')
  }
  loading.value = false
}

const resetData = () => {
  formData.xmmc = ''
  formData.yjdw = ''
  formData.ejdw = ''
  formData.xmlx.length = 0
  formData.nd = new Date().getFullYear().toString()
  gwxmbmRef.value.clear()
  formData.gwxmbm.length = 0
  proTypeRef.value.clearSelect()
  selectData.ejdwListData.length = 0
  searchData()
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchData()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchData()
}

const colSetting = tableInfo.columns.filter((item) => {
  const { prop, isShow } = item
  return prop !== 'operation' && isShow
})

const isShowSearchHandle = () => {
  isShowSearch.value = !isShowSearch.value
  if (isShowSearch.value) {
    contentTables.value.style.height = 'calc(100% - 100px)'
    contentRef.value.style.height = 'calc(100% - 40px)'
  } else {
    contentTables.value.style.height = '100%'
  }
}

const initData = () => {
  formData.nd = new Date().getFullYear().toString()
  selectRolesHandle()
}

onMounted(initData)
</script>

<style lang="less" scoped>
.process {
  width: 100%;
  height: calc(100vh - 130px);
  padding: 10px;

  .form-table {
    height: calc(100vh - 170px);

    .search {
      height: 100px;
    }

    .content_table {
      height: calc(100% - 100px);

      .content_table_center {
        height: calc(100% - 40px);
      }
    }
  }

  .topBox {
    .title {
      width: 100%;
      color: #00706b;
      display: flex;
      margin-bottom: 10px;

      .titleBox {
        width: 50%;
      }

      .searchBox {
        width: 50%;
        text-align: right;

        .searchShow {
          cursor: pointer;
          color: #00706b;
        }
      }
    }
  }
}
</style>
