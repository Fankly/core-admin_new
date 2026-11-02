<template>
  <div class="container-main">
    <userDialog ref="userDialogInstance" @loadCompany="loadCompany"></userDialog>
    <template v-if="isShowPage">
      <div v-loading="loading" class="process" element-loading-text="正在从服务器获取数据.....">
        <div class="topBox">
          <div class="title">
            <div class="titleBox">
              <h2>项目台账备注管理</h2>
            </div>
            <div class="searchBox">
              <el-dropdown
                style="margin-right: 30px; cursor: pointer"
                trigger="click"
                :hide-on-click="false"
              >
                <span class="el-dropdown-link">
                  <el-icon class="ep-icon-s-operation">
                    <EpArrowDown />
                  </el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu class="dropdown-max">
                    <el-dropdown-item v-for="item in columns" :key="item.columnKey">
                      <el-checkbox
                        v-model="item.checked"
                        @change="listShow(item.columnKey, item.checked)"
                      >
                        {{ item.columnName }}
                      </el-checkbox>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span class="searchShow" v-if="searchShow === false" @click="showSearch(true)">
                <el-icon class="ep-icon-arrow-down"><EpArrowDown /></el-icon>
              </span>
              <span class="searchShow" @click="showSearch(false)" v-else>
                <el-icon class="ep-icon-arrow-up"><EpArrowUp /></el-icon>
              </span>
              <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
            </div>
          </div>

          <div class="search" v-if="searchShow">
            <el-form
              :inline="true"
              size="small"
              class="formStyle"
              label-position="right"
              :label-width="110"
            >
              <el-row class="rowStyle">
                <el-col :span="6">
                  <el-form-item label="项目名称：">
                    <el-input v-model="formData.xmmc"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="国网项目编码：">
                    <copyTextBox ref="gwxmbm"></copyTextBox>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="项目性质：">
                    <el-select v-model="formData.xmxz" @change="getProjectPackName" multiple>
                      <el-option
                        v-for="(item, index) in searchData.projectNature"
                        :key="index"
                        :label="item.label"
                        :value="item.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="项目类型：">
                    <TreeSelect
                      ref="xmlx"
                      @clearData="clearDataHandle"
                      :is-leaf="false"
                      data-type="id"
                      :default-props="projectTypeProps"
                      @selectChange="getProjectType"
                      style="width: 100%"
                      :data="searchData.projectTypeData"
                      node-key="id"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-form-item label="一级分类：">
                    <el-select
                      v-model="formData.yjfl"
                      @change="() => getLevelData(formData.yjfl, 'ejfl')"
                      clearable
                    >
                      <el-option
                        v-for="(item, index) in searchData.yjfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="二级分类：">
                    <el-select
                      v-model="formData.ejfl"
                      @change="() => getLevelData(formData.ejfl, 'sjfl')"
                      clearable
                    >
                      <el-option
                        v-for="(item, index) in searchData.ejfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="三级分类：">
                    <el-select @change="getProjectPackName" v-model="formData.sjfl" clearable>
                      <el-option
                        v-for="(item, index) in searchData.sjfl"
                        :key="index"
                        :label="item.label"
                        :value="item"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="归口部门：">
                    <TreeSelect
                      ref="dept"
                      :is-leaf="false"
                      data-type="objCode"
                      :is-all="false"
                      :default-props="defaultProps"
                      :data="searchData.departmentData"
                      @selectChange="getChangeDepData"
                      style="width: 100%"
                      node-key="objCode"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="6">
                  <el-form-item label="项目包名称：">
                    <el-select v-model="formData.xmbName" multiple collapse-tags>
                      <el-option
                        v-for="(item, index) in searchData.projectPackName"
                        :key="index"
                        :label="item.name"
                        :value="item.code"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="一二级单位：">
                    <TreeSelect
                      ref="unit"
                      :is-leaf="false"
                      data-type="code"
                      :is-all="true"
                      :default-props="defaultProps"
                      @selectChange="getChangeUnitData"
                      style="width: 100%"
                      :data="searchData.unitData"
                      node-key="objId"
                    ></TreeSelect>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="年度：">
                    <el-date-picker
                      :clearable="false"
                      @change="getProjectPackName"
                      style="width: 100%"
                      v-model="formData.year"
                      type="year"
                      placeholder="选择年"
                    ></el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="6" style="text-align: right; font-size: 12px">
                  <el-button
                    v-permission="'SEARCH'"
                    size="small"
                    v-debounce="[loadData]"
                    type="primary"
                    :icon="EpSearch"
                    >查 询
                  </el-button>
                  <el-button
                    v-permission="'RESET'"
                    size="small"
                    :icon="EpRefreshRight"
                    @click="reset"
                    >重 置
                  </el-button>
                  <el-button
                    v-permission="'EXPORT'"
                    size="small"
                    v-debounce="[exportData]"
                    type="warning"
                    :icon="EpDownload"
                    >导 出
                  </el-button>
                  <el-upload
                    v-permission="'IMPORT'"
                    style="display: inline; padding: 0 0 0 10px"
                    accept=".xlsx,.xls"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="handleChange"
                  >
                    <el-button size="small" type="success" :icon="EpUpload">导 入</el-button>
                  </el-upload>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
        <div class="content_table" ref="contentTables">
          <div class="content_table_center">
            <el-table
              @row-dblclick="updateMaintenancePage"
              ref="tableName"
              stripe
              border
              height="100%"
              :data="example"
              row-key="id"
              style="width: 100%; margin-top: 10px"
              :header-cell-style="{ 'text-align': 'center' }"
            >
              <template v-for="item in columns" :key="item.columnKey">
                <el-table-column
                  :show-overflow-tooltip="true"
                  :prop="item.columnKey"
                  v-if="item.columnKey === 'xmmc' && item.checked"
                  width="200"
                  :label="item.columnName"
                  fixed
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  align="center"
                  v-else-if="item.columnKey === 'gwxmbm' && item.checked"
                  width="200"
                  :label="item.columnName"
                  fixed
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="right"
                  v-else-if="
                    (item.columnKey === 'dnys' || item.columnKey === 'dncwzc') && item.checked
                  "
                  width="200"
                  :label="item.columnName"
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  show-overflow-tooltip
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="center"
                  v-else-if="item.checked && setAlignCenter(item.columnKey)"
                  width="200"
                  :label="item.columnName"
                ></el-table-column>
                <el-table-column
                  :prop="item.columnKey"
                  :formatter="
                    (row, column, cellValue) => formatHandle(row, column, cellValue, item.columnKey)
                  "
                  align="center"
                  v-else-if="item.checked"
                  show-overflow-tooltip
                  width="200"
                  :label="item.columnName"
                ></el-table-column>
              </template>
            </el-table>
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
          <el-dialog
            top="10px"
            width="50%"
            title="项目台账备注维护页面"
            v-model="dialogFormVisible"
          >
            <el-form
              ref="dialogFormRef"
              label-position="right"
              :label-width="120"
              :model="dialogForm"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="国网项目编码：" prop="gwxmbm">
                    <el-input v-model="dialogForm.gwxmbm" :disabled="true"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="项目名称：" prop="xmmc">
                    <el-input v-model="dialogForm.xmmc" :disabled="true"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="业务备注：" prop="zywbz">
                    <el-input v-model="dialogForm.zywbz"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="重点任务：" prop="zzdrw">
                    <el-input v-model="dialogForm.zzdrw"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="备注1：" prop="zbz1">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz1"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注2：" prop="zbz2">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz2"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注3：" prop="zbz3">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz3"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注4：" prop="zbz4">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz4"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注5：" prop="zbz5">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz5"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注6：" prop="zbz6">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz6"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注7：" prop="zbz7">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz7"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注8：" prop="zbz8">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz8"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注9：" prop="zbz9">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz9"
                  maxlength="100"
                ></el-input>
              </el-form-item>
              <el-form-item label="备注10：" prop="zbz10">
                <el-input
                  :rows="2"
                  resize="none"
                  type="textarea"
                  v-model="dialogForm.zbz10"
                  maxlength="100"
                ></el-input>
              </el-form-item>
            </el-form>
            <template #footer>
              <div class="dialog-footer" style="text-align: center">
                <el-button type="primary" @click="updateMsgDataHandle" plain>确 定</el-button>
                <el-button @click="dialogFormVisible = false" type="info" plain>取 消</el-button>
              </div>
            </template>
          </el-dialog>
        </div>
      </div>
    </template>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script setup>
import {
  ArrowDown as EpArrowDown,
  ArrowUp as EpArrowUp,
  Download as EpDownload,
  RefreshRight as EpRefreshRight,
  Search as EpSearch,
  Upload as EpUpload
} from '@element-plus/icons-vue'
import {
  markRaw as markElementIconRaw,
  reactive,
  ref,
  toRef,
  reactive as reactiveLocal,
  toRefs,
  watch,
  onMounted,
  useTemplateRef
} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import copyTextBox from '@/components/select/copyTextBox.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useStore } from '@/store/business'
import TreeSelect from '@/components/select/TreeSelect.vue'
import baseService from '@/service/baseService'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
defineOptions({
  name: '/budget-process/process-43'
})
const helpModalRefRef = useTemplateRef('helpModalRef')
const deptRef = useTemplateRef('dept')
const userDialogRef = useTemplateRef('userDialogInstance')
const contentTablesRef = useTemplateRef('contentTables')
const gwxmbmRef = useTemplateRef('gwxmbm')
const xmlxRef = useTemplateRef('xmlx')
const unitRef = useTemplateRef('unit')
const store = useStore()
const dialogFormRef = ref('')
// 只能输入中文、英文、数字,可以为空
const checkInput = (rule, value, callback) => {
  if (value === '') {
    callback()
  } else {
    const reg = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
    if (!reg.test(value)) {
      callback(new Error('只能输入中文、英文、数字'))
    } else {
      callback()
    }
  }
}
const setupState = reactive({
  EpArrowDown: markElementIconRaw(EpArrowDown),
  EpArrowUp: markElementIconRaw(EpArrowUp),
  EpDownload: markElementIconRaw(EpDownload),
  EpRefreshRight: markElementIconRaw(EpRefreshRight),
  EpSearch: markElementIconRaw(EpSearch),
  EpUpload: markElementIconRaw(EpUpload),
  store,
  dialogFormRef,
  page: {
    total: 0,
    limit: 10,
    page: 1,
    current: 1
  },
  isShowPage: false,
  dialogUpload: true,
  checkInput,
  dialogFormRules: {
    zywbz: [
      {
        validator: checkInput,
        trigger: 'blur'
      }
    ],
    zzdrw: [
      {
        validator: checkInput,
        trigger: 'blur'
      }
    ]
  },
  dialogFormVisible: false,
  isQuery: false,
  searchShow: true,
  segment: [],
  example: [],
  loading: false,
  userCode: '',
  userId: '',
  specialorgid: '',
  searchData: {
    projectTypeData: [],
    unitData: [],
    yjfl: [],
    ejfl: [],
    sjfl: [],
    projectPackName: [],
    projectNature: [],
    departmentData: []
  },
  dialogForm: {
    zywbz: '',
    zzdrw: '',
    xmmc: '',
    gwxmbm: '',
    zbz1: '',
    zbz2: '',
    zbz3: '',
    zbz4: '',
    zbz5: '',
    zbz6: '',
    zbz7: '',
    zbz8: '',
    zbz9: '',
    zbz10: ''
  },
  formData: {
    yjfl: [],
    ejfl: [],
    sjfl: [],
    yjdw: [],
    ejdw: [],
    xmxz: [],
    xmlx: '',
    xmmc: '',
    gkbm: [],
    xmbName: [],
    year: new Date().getFullYear().toString()
  },
  columns: [
    {
      columnKey: 'xmmc',
      columnName: '项目名称',
      checked: true
    },
    {
      columnKey: 'gwxmbm',
      columnName: '国网项目编码',
      checked: true
    },
    {
      columnKey: 'zywbz',
      columnName: '业务备注',
      checked: true
    },
    {
      columnKey: 'zzdrw',
      columnName: '重点任务',
      checked: true
    },
    {
      columnKey: 'zbz1',
      columnName: '备注1',
      checked: true
    },
    {
      columnKey: 'zbz2',
      columnName: '备注2',
      checked: true
    },
    {
      columnKey: 'zbz3',
      columnName: '备注3',
      checked: true
    },
    {
      columnKey: 'zbz4',
      columnName: '备注4',
      checked: true
    },
    {
      columnKey: 'zbz5',
      columnName: '备注5',
      checked: true
    },
    {
      columnKey: 'zbz6',
      columnName: '备注6',
      checked: true
    },
    {
      columnKey: 'zbz7',
      columnName: '备注7',
      checked: true
    },
    {
      columnKey: 'zbz8',
      columnName: '备注8',
      checked: true
    },
    {
      columnKey: 'zbz9',
      columnName: '备注9',
      checked: true
    },
    {
      columnKey: 'zbz10',
      columnName: '备注10',
      checked: true
    },
    {
      columnKey: 'proType',
      columnName: '项目类型',
      checked: true
    },
    {
      columnKey: 'xmbName',
      columnName: '项目包名称',
      checked: true
    },
    {
      columnKey: 'nd',
      columnName: '年度',
      checked: true
    },
    {
      columnKey: 'yjdw',
      columnName: '一级单位',
      checked: true
    },
    {
      columnKey: 'ejdw',
      columnName: '二级单位',
      checked: true
    },
    {
      columnKey: 'gkbm',
      columnName: '归口部门',
      checked: true
    },
    {
      columnKey: 'dnys',
      columnName: '当年预算（万元）',
      checked: true
    },
    {
      columnKey: 'dncwzc',
      columnName: '当年结算(不含税)(万元)',
      checked: true
    },
    {
      columnKey: 'xmxz',
      columnName: '项目性质',
      checked: true
    },
    {
      columnKey: 'saptime',
      columnName: '立项时间',
      checked: true
    },
    {
      columnKey: 'yjfl',
      columnName: '一级分类',
      checked: true
    },
    {
      columnKey: 'ejfl',
      columnName: '二级分类',
      checked: true
    },
    {
      columnKey: 'sjfl',
      columnName: '三级分类',
      checked: true
    },
    {
      columnKey: 'ztimestamp',
      columnName: '更新时间',
      checked: true
    }
  ],
  defaultProps: {
    children: 'children',
    label: 'text'
  },
  projectTypeProps: {
    children: 'children',
    label: 'name'
  },
  fileList: [
    {
      name: 'food.jpeg',
      url: 'https://jsonplaceholder.typicode.com/posts/'
    }
  ]
})
const page = toRef(setupState, 'page')
const isShowPage = toRef(setupState, 'isShowPage')
const dialogUpload = toRef(setupState, 'dialogUpload')
const dialogFormRules = toRef(setupState, 'dialogFormRules')
const dialogFormVisible = toRef(setupState, 'dialogFormVisible')
const isQuery = toRef(setupState, 'isQuery')
const searchShow = toRef(setupState, 'searchShow')
const segment = toRef(setupState, 'segment')
const example = toRef(setupState, 'example')
const loading = toRef(setupState, 'loading')
const userCode = toRef(setupState, 'userCode')
const userId = toRef(setupState, 'userId')
const specialorgid = toRef(setupState, 'specialorgid')
const searchData = toRef(setupState, 'searchData')
const dialogForm = toRef(setupState, 'dialogForm')
const formData = toRef(setupState, 'formData')
const columns = toRef(setupState, 'columns')
const defaultProps = toRef(setupState, 'defaultProps')
const projectTypeProps = toRef(setupState, 'projectTypeProps')
const fileList = toRef(setupState, 'fileList')
const componentData = reactiveLocal({})
componentData.roleCode = undefined
const roleCode = toRef(componentData, 'roleCode')
function getHelpMessageHandle() {
  helpModalRefRef.value.showModal = true
}
function clearDataHandle() {
  if (Array.isArray(setupState.formData.xmlx)) {
    setupState.formData.xmlx.length = 0
  } else {
    setupState.formData.xmlx = ''
  }
}
function lazyHandle(node, resolve) {
  if (node.level === 0) {
    const params = {
      parentCode: null,
      rootCode: 'childtree:CBZX',
      objId: -1,
      level: 0
    }
    if (node.data.rootCode) {
      params.rootCode = node.data.rootCode
      params.parentCode = 'CBZX'
    }
    baseService.post('process40/getTreeNode/', params).then((res) => {
      if (res.success) {
        resolve(res.data)
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  } else if (node.level >= 1) {
    const params = {
      parentCode: null,
      rootCode: 'childtree:CBZX',
      objId: node.data.objId,
      level: node.level
    }
    baseService.post('process40/getTreeNode/', params).then((res) => {
      if (res.success) {
        res.data ? resolve(res.data) : resolve([])
      } else {
        ElMessage({
          type: 'error',
          message: res.msg
        })
      }
    })
  } else {
    resolve([])
  }
}
function getDeptData(ejdw) {
  const params = {
    parentCode: null,
    rootCode: 'childtree:CBZX',
    objId: -1,
    level: 0
  }
  if (ejdw) {
    params.rootCode = ejdw
    params.parentCode = 'CBZX'
  }
  baseService.post('process40/getTreeNodeCbzx/', params).then((res) => {
    if (res.success) {
      setupState.searchData.departmentData = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function uploadExcelFile(file, uuid) {
  setupState.loading = true
  const formData = new FormData()
  formData.append('file', file.raw)
  formData.append('uuid', uuid)
  baseService.post('process41/import/', formData).then((res) => {
    if (res.success) {
      setupState.loading = false
      ElMessage({
        type: 'success',
        message: '导入成功'
      })
      loadData()
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function handleChange(file) {
  if (!file.raw.type.includes('.sheet') && !file.raw.type.includes('.ms-excel')) {
    ElMessage.error('请上传Excel文件!')
    return
  }
  // 实现excel导入
  const formData = new FormData()
  formData.append('file', file.raw)
  baseService.post('process41/importCheck/', formData).then((res) => {
    if (res.success) {
      if (res.data.pass) {
        uploadExcelFile(file, res.data.uuid)
      } else {
        ElMessageBox.confirm('Excel文件中有存在未填写情况, 是否继续导入?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            uploadExcelFile(file, res.data.uuid)
          })
          .catch(() => {
            ElMessage({
              type: 'info',
              message: '取消导入'
            })
          })
      }
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function updateLedgeHandle() {
  const params = setupState.dialogForm
  delete params.xmmc
  baseService.post('process41/updateTZ/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      loadData()
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function updateMsgDataHandle() {
  /*this.$refs.dialogFormRef.validate((valid) => {
    if (valid) {
      // 提交数据
      this.updateLedgeHandle();
      this.dialogFormVisible = false;
    } else {
      return false;
    }
  });*/
  updateLedgeHandle()
  setupState.dialogFormVisible = false
}
function setAlignCenter(columnkey) {
  const arr = ['yjdw', 'ejdw', 'yjfl', 'ejfl', 'sjfl']
  return arr.includes(columnkey)
}
function formatHandle(row, column, cellValue, columnKey) {
  if (columnKey === 'dnys' || columnKey === 'dncwzc') {
    return cellValue ? parseFloat(cellValue).toFixed(4) : '0.0000'
  } else if (cellValue === null || cellValue === '') {
    return '-'
  }
  return cellValue
}
// 归口部门
function getChangeDepData(value) {
  setupState.formData.gkbm = value
}
function getComboData(flag, code) {
  // 判断是否是数组
  code = Array.isArray(code) ? code : [code]
  const params = {
    codes: code
  }
  baseService.post('process40/getComCodeByCode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      res.data[code[0]].map((item) => {
        setupState.searchData[flag].push({
          value: item.code,
          label: item.name
        })
      })
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getProjectPackName() {
  setupState.formData.xmbName = []
  setupState.loading = true
  let xmxzValue = ''
  let sjflValue = ''
  let xmlx = ''
  if (setupState.formData.xmxz && setupState.formData.xmxz.length > 0) {
    xmxzValue = setupState.formData.xmxz.join(',')
  }
  if (setupState.formData.sjfl) {
    sjflValue = setupState.formData.sjfl.value
  }
  if (setupState.formData.year) {
    // Wed Jan 01 2025 00:00:00 GMT+0800 (中国标准时间)获取年份
    setupState.formData.year = new Date(setupState.formData.year).getFullYear().toString()
  }
  if (setupState.formData.xmlx) {
    xmlx = setupState.formData.xmlx.join(',')
  }
  const params = {
    year: setupState.formData.year,
    xmlx: xmlx,
    xmblx: '',
    xmxz: xmxzValue,
    sjfl: sjflValue,
    xmbid: ''
  }
  baseService.post('process40/getXmbArr/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchData.projectPackName = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getLevelData(levelValue, flag) {
  if (flag === 'ejfl') {
    setupState.searchData.ejfl = []
    setupState.searchData.sjfl = []
    setupState.formData.ejfl = ''
    setupState.formData.sjfl = ''
  } else if (flag === 'sjfl') {
    setupState.searchData.sjfl = []
    setupState.formData.sjfl = ''
  }
  if (!levelValue) {
    return
  }
  setupState.loading = true
  const params = {
    parentId: levelValue.id
  }
  baseService.post('process40/getComCodeByParent/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      res.data.forEach((item) => {
        setupState.searchData[flag].push({
          value: item.code,
          label: item.name,
          id: item.id
        })
      })
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getFirstLevelData() {
  setupState.loading = true
  const params = {
    rootCode: 'GWXMFL'
  }
  baseService.post('process40/getRootComCode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      res.data.forEach((item) => {
        setupState.searchData.yjfl.push({
          value: item.code,
          label: item.name,
          id: item.id
        })
      })
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function updateMaintenancePage(row) {
  setupState.dialogFormVisible = true
  /*     this.dialogForm.gwxmbm = row.gwxmbm;
  this.dialogForm.xmmc = row.xmmc;
  this.dialogForm.zywbz = row.zywbz;
  this.dialogForm.zzdrw = row.zzdrw; */
  for (const key in setupState.dialogForm) {
    setupState.dialogForm[key] = row[key]
  }
}
function getChangeUnitData(value) {
  // 设置一级单位和二级单位清空
  setupState.formData.yjdw = []
  setupState.formData.ejdw = []
  let ejdw = ''
  value.forEach((item) => {
    if (item.level === 1) {
      setupState.formData.yjdw.push(item.objCode)
    } else if (item.level === 2) {
      setupState.formData.ejdw.push(item.objCode)
      ejdw += item.objCode + ','
    }
  })
  ejdw = ejdw.substring(0, ejdw.length - 1)
  deptRef.value.clearSelect()
  getDeptData(ejdw)
  /*this.lazyHandle({ level: 0, data: { rootCode: ejdw } }, (res) => {
    this.searchData.departmentData = res;
  });*/
}
function getUnitData() {
  setupState.loading = true
  const params = {
    parentCode: null,
    rootCode: 'childtree:DW_COM',
    objId: -1,
    level: 0
  }
  baseService.post('process40/getTreeNode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchData.unitData = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getProjectTypeData() {
  let startDate = new Date().getFullYear()
  if (setupState.searchData.ND) {
    startDate = setupState.searchData.ND
  }
  setupState.loading = true
  const params = {
    parentId: '0',
    startDate: startDate
  }
  baseService.post('process40/getProTypeTreeNode/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.searchData.projectTypeData = res.data
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
function getProjectType(value) {
  setupState.formData.xmlx = value
  getProjectPackName()
}
function pageChangeHandle(currentPageNum) {
  setupState.page.page = currentPageNum
  loadData()
}
function limitChangeHandle(currentLimitNum) {
  setupState.page.page = 1
  setupState.page.limit = currentLimitNum
  loadData()
}
function loadCompany() {
  setupState.loading = false
  setupState.specialorgid = parseInt(userDialogRef.value.specialorgid)
  componentData.roleCode = parseInt(userDialogRef.value.roleCode)
  setupState.isQuery = userDialogRef.value.isQuery
  if (setupState.isQuery) {
    setTimeout(() => {
      setupState.isShowPage = true
    }, 500)
  }
}
//项目环节
function listShow(value, checked) {
  setupState.columns.forEach((item) => {
    if (item.columnKey === value) {
      item.checked = checked
    }
  })
}
function setTableHeight() {
  if (setupState.searchShow) {
    contentTablesRef.value.style.height = 'calc(100% - 116px)'
  } else {
    contentTablesRef.value.style.height = 'calc(100% - 17px)'
  }
}
//搜索按钮
function loadData() {
  setupState.loading = true
  const params = {
    specialorgid: setupState.specialorgid,
    roleCode: componentData.roleCode,
    page: setupState.page.page,
    limit: setupState.page.limit,
    yjfl: setupState.formData.yjfl ? setupState.formData.yjfl.value : '',
    ejfl: setupState.formData.ejfl ? setupState.formData.ejfl.value : '',
    sjfl: setupState.formData.sjfl ? setupState.formData.sjfl.value : '',
    yjdw: setupState.formData.yjdw ? setupState.formData.yjdw : [],
    ejdw: setupState.formData.ejdw ? setupState.formData.ejdw : [],
    xmxz: setupState.formData.xmxz ? setupState.formData.xmxz : '',
    xmlx: setupState.formData.xmlx ? setupState.formData.xmlx : [],
    xmmc: setupState.formData.xmmc ? setupState.formData.xmmc : '',
    gkbm: setupState.formData.gkbm ? setupState.formData.gkbm : [],
    nd: setupState.formData.year ? setupState.formData.year : new Date().getFullYear().toString(),
    gwxmbm: gwxmbmRef.value.array ? gwxmbmRef.value.array : '',
    xmbName: setupState.formData.xmbName ? setupState.formData.xmbName : []
  }
  baseService.post('process41/getList/', params).then((res) => {
    if (res.success) {
      setupState.loading = false
      setupState.page.total = res.data.total
      setupState.example = res.data.records
    } else {
      setupState.loading = false
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
//重置按钮
function reset() {
  setupState.formData.yjfl = ''
  setupState.formData.ejfl = ''
  setupState.formData.sjfl = ''
  setupState.formData.yjdw = ''
  setupState.formData.ejdw = ''
  setupState.formData.xmxz = []
  setupState.formData.xmlx = ''
  setupState.formData.year = new Date().getFullYear().toString()
  setupState.formData.xmmc = ''
  setupState.formData.xmbName = []
  gwxmbmRef.value.clear()
  xmlxRef.value.clearSelect()
  unitRef.value.clearSelect()
  deptRef.value.clearSelect()
  setupState.searchData.ejfl = []
  setupState.searchData.sjfl = []
  // 调用项目包名称
  getProjectPackName()
}
//搜索展示与隐藏
function showSearch(i) {
  setupState.searchShow = i
  setTableHeight()
}
// 数据导出
function exportData() {
  setupState.loading = true
  loadData()
  const params = {
    specialorgid: setupState.specialorgid,
    roleCode: componentData.roleCode,
    page: setupState.page.page,
    limit: setupState.page.limit,
    yjfl: setupState.formData.yjfl ? setupState.formData.yjfl.value : '',
    ejfl: setupState.formData.ejfl ? setupState.formData.ejfl.value : '',
    sjfl: setupState.formData.sjfl ? setupState.formData.sjfl.value : '',
    yjdw: setupState.formData.yjdw ? setupState.formData.yjdw : [],
    ejdw: setupState.formData.ejdw ? setupState.formData.ejdw : [],
    xmxz: setupState.formData.xmxz ? setupState.formData.xmxz : '',
    xmlx: setupState.formData.xmlx ? setupState.formData.xmlx : [],
    xmmc: setupState.formData.xmmc ? setupState.formData.xmmc : '',
    gkbm: setupState.formData.gkbm ? setupState.formData.gkbm : [],
    nd: setupState.formData.year ? setupState.formData.year : new Date().getFullYear().toString(),
    gwxmbm: gwxmbmRef.value.array ? gwxmbmRef.value.array : '',
    xmbName: setupState.formData.xmbName ? setupState.formData.xmbName : ''
  }
  baseService.export('/process41/export', params).then((res) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = '战略预算-项目台账备注管理清单.xlsx'
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    setupState.loading = false
  })
}
watch(
  () => setupState.formData.sjfl,
  function (val) {
    if (!val) {
      // 清空项目包名称
      setupState.formData.xmbName = []
      // 调用项目包名称
      getProjectPackName()
    }
  },
  {}
)
onMounted(() => {
  userDialogRef.value.getUser(setupState.userId, setupState.userCode)
  getDeptData()
  getProjectTypeData()
  getUnitData()
  getFirstLevelData()
  getProjectPackName()
  getComboData('projectNature', 'XMXZ')
})
defineExpose({
  EpArrowDown,
  EpArrowUp,
  EpDownload,
  EpRefreshRight,
  EpSearch,
  EpUpload,
  store,
  dialogFormRef,
  page,
  isShowPage,
  dialogUpload,
  checkInput,
  dialogFormRules,
  dialogFormVisible,
  isQuery,
  searchShow,
  segment,
  example,
  loading,
  userCode,
  userId,
  specialorgid,
  searchData,
  dialogForm,
  formData,
  columns,
  defaultProps,
  projectTypeProps,
  fileList,
  getHelpMessageHandle,
  clearDataHandle,
  lazyHandle,
  getDeptData,
  uploadExcelFile,
  handleChange,
  updateLedgeHandle,
  updateMsgDataHandle,
  setAlignCenter,
  formatHandle,
  getChangeDepData,
  getComboData,
  getProjectPackName,
  getLevelData,
  getFirstLevelData,
  updateMaintenancePage,
  getChangeUnitData,
  getUnitData,
  getProjectTypeData,
  getProjectType,
  pageChangeHandle,
  limitChangeHandle,
  loadCompany,
  listShow,
  setTableHeight,
  loadData,
  reset,
  showSearch,
  exportData,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.process_43 {
  display: none;
}

.setstyle {
  height: auto;
  padding: 0 0 10px 0 !important;
  margin: 0;
  cursor: default !important;
}

.date_width {
  width: 100% !important;

  :deep(.el-date-editor) {
    width: 100%;
  }
}

.process {
  height: calc(100vh - 130px);
  padding: 10px;

  .completion {
    :deep(.el-form-item__content) {
      display: flex;

      .el-select {
        width: 80% !important;
        padding-right: 10px;
      }
    }
  }

  .budgetPeriod {
    :deep(.el-input) {
      width: 100%;
    }
  }

  .cacelDel {
    :deep(.el-select-dropdown__wrap) {
      max-height: 500px !important;
    }

    :deep(.el-tag__close) {
      display: none;
    }
  }

  .formStyle {
    .el-form-item {
      width: 100%;
      margin-bottom: 4px;

      :deep(.el-form-item__label) {
        font-size: 13px;
      }

      .el-select {
        width: 100%;
      }
    }
  }

  .content_table {
    height: calc(100% - 116px);
    overflow: hidden;

    .content_table_center {
      height: calc(100% - 60px);
    }
  }

  .topBox {
    .title {
      width: 100%;
      color: #00706b;
      display: flex;

      .titleBox {
        width: 50%;
        text-align: right;

        h2 {
          font-size: 16px;
          margin: 0 0 4px 0;
        }
      }

      .searchBox {
        width: 50%;
        text-align: right;

        .searchShow {
          cursor: pointer;
          color: #00706b;
          margin-right: 18px;
        }
      }
    }
  }
}
</style>
