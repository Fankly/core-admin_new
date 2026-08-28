<!-- 项目类型页签配置 -->
<template>
  <div class="container tw-flex tw-flex-col tw-h-full tw-p-2.5 tw-box-border tw-overflow-hidden" v-show="isShowPage">
    <div class="cont_btn tw-flex tw-flex-col lg:tw-flex-row tw-gap-2.5 tw-flex-1 tw-min-h-0 tw-w-full">
      <div class="contbtn_left tw-w-full lg:tw-w-[19%] tw-bg-white tw-border tw-border-solid tw-border-gray-200 tw-rounded-lg tw-p-2.5 tw-flex tw-flex-col tw-shadow-sm tw-overflow-hidden tw-h-[350px] lg:tw-h-full">
        <el-input
          placeholder="请输入项目类型名称"
          @clear="selectSearchTree"
          v-model="searchForm"
          clearable
          style="width: 100%"
          class="tw-mb-2.5"
          @keyup.enter="selectSearchTree"
        />
        <div class="pageListCont tw-flex-1 tw-overflow-y-auto">
          <el-tree :highlight-current="true" @node-click="handlerNodeClick" :data="xmlxList" :props="defaultProps" :expand-on-click-node="false" />
        </div>
      </div>
      <div class="conbtn_right tw-w-full lg:tw-flex-1 lg:tw-h-full tw-flex tw-flex-col tw-min-w-0">
        <el-tabs v-model="tabMsg" type="border-card" @tab-click="handleTab" class="tw-flex-1 tw-flex tw-flex-col tw-min-h-0">
          <el-tab-pane label="页签管理" name="1" class="tw-h-full tw-flex tw-flex-col">
            <div v-loading="loading" class="tw-flex-1 tw-flex tw-flex-col tw-min-h-0">
              <div class="operation tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2.5 tw-mb-2.5">
                <div class="left tw-flex tw-flex-wrap tw-gap-2.5">
                  <el-button size="mini" type="primary" plain @click="addMsgHandle">新 增</el-button>
                  <el-button size="mini" type="primary" plain @click="editMsgHandle">编 辑</el-button>
                  <el-button size="mini" type="primary" plain @click="delMsgHandle">删 除</el-button>
                  <el-button size="mini" type="primary" plain @click="copyMsgHandle">复 制</el-button>
                </div>
                <div class="right">
                  <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
                </div>
              </div>
              <div class="table tw-pt-2.5 tw-flex-1 tw-min-w-0 tw-min-h-0">
                <vxe-grid
                  ref="tabGridRef"
                  v-bind="tabGridOptions"
                  :data="pageData"
                  @checkbox-change="handelCheckRow"
                  @checkbox-all="handelCheckRow"
                />
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="属性明细" name="2" v-if="tabList.length === 2" class="tw-h-full tw-flex tw-flex-col">
            <div v-loading="loading" class="tw-flex-1 tw-flex tw-flex-col tw-min-h-0">
              <div class="operation tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2.5 tw-mb-2.5">
                <div class="left tw-flex tw-flex-wrap tw-gap-2.5">
                  <el-button size="mini" type="primary" plain @click="addMasgHandle">新 增</el-button>
                  <el-button size="mini" type="primary" plain @click="saveMsgHandle">保 存</el-button>
                  <el-button size="mini" type="primary" plain @click="delMasgHandle">删 除</el-button>
                  <el-button size="mini" type="primary" plain @click="unitDescImportHandle">导 入</el-button>
                  <el-button size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
                </div>
                <div class="right">
                  <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
                </div>
              </div>
              <div class="table tw-pt-2.5 tw-flex-1 tw-min-w-0 tw-min-h-0">
                <vxe-grid
                  ref="attributeGridRef"
                  v-bind="attributeGridOptions"
                  :data="pageData1"
                  @checkbox-change="handelChooseRow"
                  @checkbox-all="handelChooseRow"
                >
                  <template #label_edit="{ row }">
                    <el-input v-model="row.label" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #prop_edit="{ row }">
                    <el-input v-model="row.prop" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #zdlx_edit="{ row }">
                    <el-input v-model="row.zdlx" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #type_edit="{ row }">
                    <el-input v-model="row.type" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #ggdm_edit="{ row }">
                    <el-input v-model="row.ggdm" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #dyff_edit="{ row }">
                    <el-input v-model="row.dyff" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #dybm_edit="{ row }">
                    <el-input v-model="row.dybm" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #stepId_edit="{ row }">
                    <el-input v-model="row.stepId" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #sortCode_edit="{ row }">
                    <el-input v-model="row.sortCode" clearable :maxlength="10" />
                  </template>
                  <template #required_edit="{ row }">
                    <vxe-select
                      v-model="row.required"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'required', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #disabled_edit="{ row }">
                    <vxe-select
                      v-model="row.disabled"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'disabled', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #hidden_edit="{ row }">
                    <vxe-select
                      v-model="row.hidden"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'hidden', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #defaultValue_edit="{ row }">
                    <el-input v-model="row.defaultValue" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #save_edit="{ row }">
                    <vxe-select
                      v-model="row.save"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'save', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #rows_edit="{ row }">
                    <el-input-number v-model="row.rows" :min="0" :max="99" controls-position="right" style="width: 100%" />
                  </template>
                  <template #span_edit="{ row }">
                    <el-input-number v-model="row.span" :min="0" :max="99" controls-position="right" style="width: 100%" />
                  </template>
                  <template #dependOnColumns_edit="{ row }">
                    <el-input v-model="row.dependOnColumns" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #placeholder_edit="{ row }">
                    <el-input v-model="row.placeholder" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #message_edit="{ row }">
                    <el-input v-model="row.message" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #trigger_edit="{ row }">
                    <el-input v-model="row.trigger" clearable :maxlength="30" show-word-limit />
                  </template>
                  <template #sfmbzd_edit="{ row }">
                    <vxe-select
                      v-model="row.sfmbzd"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'sfmbzd', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #filterable_edit="{ row }">
                    <vxe-select
                      v-model="row.filterable"
                      placeholder="请选择"
                      clearable
                      transfer
                      style="width: 100%"
                      @change="(params:any) => handleBooleanSelectChange(row, 'filterable', params.value)"
                    >
                      <vxe-option v-for="item in options1" :key="`${item.code}`" :label="item.name" :value="item.code" />
                    </vxe-select>
                  </template>
                  <template #zd_edit="{ row }">
                    <el-input v-model="row.zd" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #xzhxyzd_edit="{ row }">
                    <el-input v-model="row.xzhxyzd" clearable :maxlength="120" show-word-limit />
                  </template>
                  <template #fjId_edit="{ row }">
                    <el-input v-model="row.fjId" clearable :maxlength="80" show-word-limit />
                  </template>
                </vxe-grid>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <!-- 新增、编辑 弹窗 -->
    <el-dialog
      ref="dialogFormRef"
      v-model="dialogType.isShow"
      :title="dialogType.title"
      :width="dialogType.type == 'copy' ? 400 : 800"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="commit tw-w-full tw-flex tw-flex-col sm:tw-flex-row tw-flex-wrap tw-justify-evenly tw-items-center tw-gap-2.5 tw-mb-2.5" v-if="dialogType.type == 'copy'">
        <div class="commit_form tw-flex tw-items-center tw-mb-2.5 sm:tw-mb-0">
          <div class="type_name tw-w-[120px] tw-text-right tw-mr-2.5"><span class="tw-text-red-500 tw-mr-2.5">*</span>源项目类型：</div>
          <el-input disabled v-model="copyData.sourceProTypeId" placeholder="请输入源项目类型" class="tw-w-[200px]"></el-input>
        </div>
        <div class="commit_form tw-flex tw-items-center">
          <div class="type_name tw-w-[120px] tw-text-right tw-mr-2.5"><span class="tw-text-red-500 tw-mr-2.5">*</span>目标项目类型：</div>
          <el-cascader
            clearable
            v-model="copyData.targetProTypeId"
            :show-all-levels="false"
            :props="defaultProps1"
            :options="xmlxList"
            popper-class="last-check"
            class="tw-w-[200px]"
          ></el-cascader>
        </div>
      </div>
      <div class="commit tw-w-full" v-else>
        <el-form :rules="rulesForm" label-suffix=":" label-position="right" label-width="130px" :model="formData" class="tw-w-full">
          <el-row :gutter="10">
            <el-col v-for="(item, index) in editSate" :key="index" :span="12" :xs="24" :sm="12">
              <el-form-item :label="item.name" :prop="item.value">
                <el-select
                  v-if="item.type == 'select'"
                  v-model.trim="formData[item.value]"
                  :placeholder="item.placeholder"
                  clearable
                  style="width: 100%"
                >
                  <el-option v-for="item1 in item.options" :key="item1.code" :label="item1.name" :value="item1.code"> </el-option>
                </el-select>
                <el-input
                  :maxlength="30"
                  show-word-limit
                  v-if="item.type == 'input'"
                  v-model="formData[item.value]"
                  clearable
                  :placeholder="item.placeholder"
                  style="width: 100%"
                ></el-input>
                <el-input-number
                  v-if="item.type == 'number'"
                  :placeholder="item.placeholder"
                  v-model="formData.sortCode"
                  style="width: 100%"
                  :min="0"
                  :max="9999999"
                  controls-position="right"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div style="text-align: center">
        <el-button size="mini" type="primary" :disabled="disabled" plain @click="pushMsgHandle">保 存</el-button>
        <el-button size="mini" plain @click="closeHandle1">关 闭</el-button>
      </div>
    </el-dialog>
    <ImportExcel ref="importRef" />
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/service/typezhi/tabConfigure'
}
</script>
<script setup lang="ts">
import { nextTick, onMounted, provide, ref, reactive, watch } from 'vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  saveOrUpdate,
  copyTXmAttributeStep,
  xmAttributeDelete,
  xmAttributegetImportTemplate,
  xmAttributeimportData,
  xmAttributeexportData,
  saveOrUpdateTab,
  getAllProtypeTree,
  getTabList,
  deleteTab,
  getList,
  getSearchAllProType
} from '@/api/service/expertinformation'
import ImportExcel from '@/components/ImportExcel/index.vue' //导入组件
import { getPublicData } from '@/api/common' //公共代码
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
var value = /^[\u4E00-\u9FA5A-Za-z0-9]+$/

const searchForm = ref('')
const helpModalRef = ref()
const xmlxList = ref([])
const chooseNode = ref('')
const nodeName = ref('')
const disabled = ref(false)
const defaultProps = {
  children: 'children',
  label: 'name'
}
const defaultProps1 = {
  children: 'children',
  label: 'name',
  value: 'id'
}
const tabMsg = ref('1')
const tabBtn = ref('页签管理')
const tabList = ref<any>([])

const ids = ref<any[]>([]) //选择的id
const sxIds = ref<any[]>([]) //选择的属性id
const checkData = ref<any>([]) //选择的数据

const editSate = ref([
  {
    isShow: 1,
    name: '页签名称',
    type: 'input',
    placeholder: '请输入',
    value: 'stepName'
  },
  {
    isShow: 1,
    name: '是否展示',
    type: 'select',
    placeholder: '请选择',
    value: 'sfzs',
    options: [
      { code: '1', name: '是' },
      { code: '0', name: '否' }
    ]
  },
  {
    isShow: 1,
    name: '页签类型',
    type: 'select',
    placeholder: '请选择',
    value: 'stepType',
    options: [
      { code: '1', name: '普通页签' },
      { code: '2', name: '附件页签' },
      { code: '3', name: '自定义页签' }
    ]
  },
  {
    isShow: 0,
    name: '自定义组件名称',
    type: 'input',
    placeholder: '请输入',
    value: 'stepEnName'
  },
  {
    isShow: 0,
    name: '排序',
    type: 'number',
    placeholder: '请输入',
    value: 'sortCode'
  }
])

const rulesForm = reactive({
  stepName: [{ required: true, message: '请输入页签名称', trigger: ['input'] }],
  sfzs: [{ required: true, message: '请选择是否展示', trigger: ['change'] }],
  stepType: [{ required: true, message: '请选择页签类型', trigger: ['change'] }]
})

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const loading = ref(false)
const isShowPage = ref(false) //未选择角色前不展示页面
// 弹框标题，类型，显示
const dialogType = reactive({
  title: '页签管理',
  type: '新增',
  isShow: false
})

const options1 = ref([
  { code: true, name: '是' },
  { code: false, name: '否' }
])

// 报表内容
const formData = reactive<any>({
  stepName: '',
  stepType: '',
  sfzs: '',
  sortCode: ''
})
// 复制内容
const copyData = reactive({
  sourceProTypeId: '',
  targetProTypeId: ''
})
const dialogFormRef = ref('')

const pageData = ref([]) //表格数据
const pageData1 = ref<any[]>([]) //表格数据
const copyList = ref<any>() //表格数据
const tabGridRef = ref<VxeGridInstance>()
const attributeGridRef = ref<VxeGridInstance>()

const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

provide('currentUserRole', currentUserRole)

const gridBaseOptions: VxeGridProps<any> = {
  border: true,
  stripe: true,
  showOverflow: true,
  showHeaderOverflow: true,
  headerAlign: 'center',
  align: 'center',
  columnConfig: {
    resizable: true
  },
  rowConfig: {
    height: 32
  },
  checkboxConfig: {
    highlight: true
  }
}

const textEditRender = {
  name: 'input',
  autofocus: '.el-input__inner',
  autoselect: true
}

const selectEditRender = {
  autofocus: '.vxe-input--inner'
}

const numberEditRender = {
  autofocus: '.el-input__inner'
}

const formatStepType = (value: any) => {
  const type: any = { '1': '普通页签', '2': '附件页签', '3': '自定义页签' }
  const key = value === undefined || value === null ? '' : `${value}`.trim()
  return key ? type[key] || '-' : '-'
}

const formatBooleanValue = (value: any) => {
  if (value === true || value === 1 || value === '1' || value === 'true') return '是'
  if (value === false || value === 0 || value === '0' || value === 'false') return '否'
  return ''
}

const booleanFormatter = ({ cellValue }: any) => formatBooleanValue(cellValue)

const handleBooleanSelectChange = (row: any, field: string, value: boolean | null | undefined) => {
  row[field] = value
}

const editableFields = [
  'label',
  'prop',
  'zdlx',
  'type',
  'ggdm',
  'dyff',
  'dybm',
  'stepId',
  'sortCode',
  'required',
  'disabled',
  'hidden',
  'defaultValue',
  'save',
  'rows',
  'span',
  'dependOnColumns',
  'placeholder',
  'message',
  'trigger',
  'sfmbzd',
  'filterable',
  'zd',
  'xzhxyzd',
  'fjId'
]

const createTextEditColumn = (field: string, title: string, width = 180, maxWidth?: number) => ({
  field,
  title,
  width,
  editRender: textEditRender,
  slots: { edit: `${field}_edit` },
  params: { maxWidth }
})

const createBooleanEditColumn = (field: string, title: string) => ({
  field,
  title,
  width: 180,
  formatter: booleanFormatter,
  editRender: selectEditRender,
  slots: { edit: `${field}_edit` }
})

const tabGridOptions = reactive<VxeGridProps<any>>({
  ...gridBaseOptions,
  height: '100%',
  columns: [
    { type: 'checkbox', width: 55 },
    { field: 'id', title: '页签ID', minWidth: 120 },
    { field: 'protypeId', title: '项目类型ID', minWidth: 120 },
    { field: 'stepName', title: '页签名称', minWidth: 140 },
    { field: 'stepType', title: '页签类型', minWidth: 120, formatter: ({ cellValue }: any) => formatStepType(cellValue) },
    { field: 'stepEnName', title: '自定义组件名称', minWidth: 160 },
    { field: 'sfzsName', title: '是否展示', minWidth: 100 },
    { field: 'sortCode', title: '排序', minWidth: 100 }
  ]
})

const attributeGridOptions = reactive<VxeGridProps<any>>({
  ...gridBaseOptions,
  height: '100%',
  keepSource: true,
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    beforeEditMethod: ({ column }: any) => editableFields.includes(column.field)
  },
  columns: [
    { type: 'checkbox', width: 55 },
    { field: 'id', title: '组件ID', width: 180 },
    { field: 'protypeId', title: '项目类型ID', width: 180 },
    createTextEditColumn('label', '字段名称', 240, 30),
    createTextEditColumn('prop', '字段编码', 240, 30),
    createTextEditColumn('zdlx', '字段类型', 180, 30),
    createTextEditColumn('type', '控件类型', 180, 30),
    createTextEditColumn('ggdm', '公共代码', 180, 120),
    createTextEditColumn('dyff', '调用方法', 180, 120),
    createTextEditColumn('dybm', '表名', 180, 120),
    createTextEditColumn('stepId', '页签ID', 180, 30),
    createTextEditColumn('sortCode', '排序序号', 180, 10),
    createBooleanEditColumn('required', '是否必填'),
    createBooleanEditColumn('disabled', '是否只读'),
    createBooleanEditColumn('hidden', '是否隐藏'),
    createTextEditColumn('defaultValue', '默认值', 180, 30),
    createBooleanEditColumn('save', '是否需要存库'),
    {
      field: 'rows',
      title: '占用行数',
      width: 180,
      editRender: numberEditRender,
      slots: { edit: 'rows_edit' }
    },
    {
      field: 'span',
      title: '占用列数',
      width: 180,
      editRender: numberEditRender,
      slots: { edit: 'span_edit' }
    },
    createTextEditColumn('dependOnColumns', '依赖项', 180, 120),
    createTextEditColumn('placeholder', '未输入时提示', 180, 30),
    createTextEditColumn('message', '校验提示', 180, 30),
    createTextEditColumn('trigger', '校验时间点(鼠标移出等)', 180, 30),
    createBooleanEditColumn('sfmbzd', '是否导出模板字段'),
    createBooleanEditColumn('filterable', '是否需要过滤'),
    createTextEditColumn('zd', '新增回显源表', 180, 120),
    createTextEditColumn('xzhxyzd', '新增回显源字段', 180, 120),
    createTextEditColumn('fjId', '附件id', 180, 80)
  ]
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

onMounted(async () => {
  await userRoleSelectorRef.value?.getUser()
})
// 点击树
const handlerNodeClick = async (data: any) => {
  if (data.children.length == 0) {
    loading.value = true
    chooseNode.value = data.id
    nodeName.value = data.name
    copyData.sourceProTypeId = data.name
    await searchDataHandle()
    await searchDataHandle1()
  }
}
// 查询树
const selectSearchTree = async () => {
  await selectSearchTree1(searchForm.value)
}
const selectSearchTree1 = async (val: any) => {
  xmlxList.value = []
  if (val.trim() != '') {
    const publicCodeList = await getSearchAllProType(val.trim())
    if (publicCodeList.success && publicCodeList.data.length !== 0) {
      xmlxList.value = publicCodeList.data
    }
  } else {
    await initParamLists()
  }
}
//新增
const addMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  dialogType.title = `${tabBtn.value}-新增`
  dialogType.type = 'add'
  dialogType.isShow = true
}
//编辑
const editMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  if (ids.value.length != 1) {
    ElMessage({
      type: 'warning',
      message: '请选择一条要编辑的数据'
    })
    return
  }

  dialogType.title = `${tabBtn.value}-编辑`
  dialogType.type = 'edit'
  dialogType.isShow = true
  formData.stepName = checkData.value[0].stepName.trim()
  formData.stepType = checkData.value[0].stepType.trim()
  formData.stepEnName = checkData.value[0].stepEnName // 自定义组件名称
  formData.sfzs = checkData.value[0].sfzs
  formData.sortCode = parseInt(checkData.value[0].sortCode)
}

//复制
const copyMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  dialogType.title = `${tabBtn.value}-复制`
  dialogType.type = 'copy'
  dialogType.isShow = true
}
// 多选
const handelCheckRow = () => {
  const val = tabGridRef.value?.getCheckboxRecords?.() || []
  ids.value.length = 0
  ids.value = val.map((row: any) => row.id)
  checkData.value = val
}

const handelChooseRow = () => {
  const val = attributeGridRef.value?.getCheckboxRecords?.() || []
  sxIds.value.length = 0
  sxIds.value = val.map((row: any) => row.id)
}

// 属性明细新增
const addMasgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  pageData1.value.push({
    id: '',
    protypeId: chooseNode.value
    // addId:''
  })
}

// 属性明细删除
const delMasgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage.warning('请选择一个项目类型')
    return
  }
  // 判断是否选中
  if (sxIds.value.length == 0) {
    ElMessage({
      type: 'warning',
      message: '请选择要删除的数据'
    })
    return
  }
  ElMessageBox.confirm('删除后无法恢复，请确认', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      loading.value = true
      const res: any = await xmAttributeDelete(sxIds.value)
      if (res.success) {
        loading.value = false
        ElMessage.success('删除成功')
        searchDataHandle1()
      } else {
        loading.value = false
        ElMessage.error(res.msg)
      }
    })
    .catch((error: any) => {
      ElMessage.error(error)
      loading.value = false
    })
}

// 属性明细保存
const saveMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage.warning('请选择一个项目类型')
    return
  }
  const changlist: any = []
  pageData1.value.forEach((item: any, index: any) => {
    if (item.id == '') {
      changlist.push(item)
    } else {
      const data = copyList.value?.find((root: any) => item.id == root.id)
      if (!data) {
        changlist.push(item)
        return
      }
      for (var key in data) {
        if (data[key] != item[key]) {
          changlist.push(item)
        }
      }
    }
  })
  const setList: any = [...new Set(changlist)]
  if (setList.length == 0) {
    return ElMessage.warning('当前没有编辑的数据')
  }
  loading.value = true
  saveOrUpdate(setList).then((res: any) => {
    if (res.success) {
      loading.value = false
      ElMessage({ type: 'success', message: '保存成功' })
      searchDataHandle1()
    } else {
      loading.value = false
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

//保存
const pushMsgHandle = async () => {
  if (['add', 'edit'].includes(dialogType.type)) {
    if (formData.stepName == null || formData.stepName.trim() == '' || !value.test(formData.stepName)) {
      return ElMessage.warning('页签名称不能为空且不能包含特殊字符')
    }
    if (formData.sfzs == null || formData.sfzs == '') {
      return ElMessage.warning('是否展示不能为空')
    }
    if (formData.stepType == null || formData.stepType.trim() == '') {
      return ElMessage.warning('页签类型不能为空')
    }
  } else {
    if (copyData.sourceProTypeId == null || copyData.sourceProTypeId.trim() == '') {
      return ElMessage.warning('目标项目类型不能为空')
    }
  }
  loading.value = true
  if (dialogType.type == 'add') {
    disabled.value = true
    saveOrUpdateTab({
      ...formData,
      protypeId: chooseNode.value,
      sfzsName: formData.sfzsName == '1' ? '是' : '否',
      stepTypeName: formData.stepType == '1' ? '普通页签' : formData.stepType == '2' ? '附件页签' : '自定义页签'
    }).then((res: any) => {
      if (res.success) {
        loading.value = false
        disabled.value = false
        ElMessage({ type: 'success', message: '新增成功' })
        searchDataHandle()
      } else {
        disabled.value = true
        loading.value = false
        ElMessage({ type: 'error', message: res.msg })
      }
    })
  } else if (dialogType.type == 'edit') {
    ElMessageBox.confirm('请确定编辑内容', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        saveOrUpdateTab({
          ...formData,
          id: ids.value[0],
          protypeId: chooseNode.value,
          sfzsName: formData.sfzsName == '1' ? '是' : '否',
          stepTypeName: formData.stepType == '1' ? '普通页签' : formData.stepType == '2' ? '附件页签' : '自定义页签'
        }).then((res: any) => {
          if (res.success) {
            loading.value = false
            ElMessage({ type: 'success', message: '编辑成功' })
            searchDataHandle()
          } else {
            loading.value = false
            ElMessage({ type: 'error', message: res.msg })
          }
        })
      })
      .catch(() => {
        loading.value = false
      })
  } else {
    const res: any = await copyTXmAttributeStep(chooseNode.value, copyData.targetProTypeId.slice(-1)[0])
    if (res.success) {
      loading.value = false
      ElMessage.success('复制成功')
      closeHandle()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

// 查询
const searchDataHandle = async () => {
  try {
    loading.value = true
    const res = await getTabList(chooseNode.value)
    if (res.success) {
      pageData.value = res.data
      loading.value = false
      closeHandle()
    } else {
      ElMessage.success(res.msg)
      loading.value = false
    }
  } catch (e) {
    loading.value = false
    console.error(e)
  }
}
const searchDataHandle1 = async () => {
  try {
    loading.value = true
    const res = await getList(chooseNode.value)
    if (res.success) {
      pageData1.value = res.data
      copyList.value = JSON.parse(JSON.stringify(res.data || []))
      loading.value = false
      await nextTick()
      clearAttributeSelection()
    } else {
      ElMessage.success(res.msg)
      loading.value = false
    }
  } catch (e) {
    loading.value = false
    console.error(e)
  }
}

// 页签删除
const delMsgHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  // 判断是否选中
  if (ids.value.length === 0) {
    ElMessage({
      type: 'warning',
      message: '请选择要删除的数据'
    })
    return
  }

  // 增加comfirm
  ElMessageBox.confirm('删除后无法恢复，请确认', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      loading.value = true
      deleteTab(ids.value).then((res: any) => {
        if (res.success) {
          loading.value = false
          ElMessage({
            type: 'success',
            message: '删除成功'
          })
          searchDataHandle()
        } else {
          loading.value = false
          ElMessage({
            type: 'error',
            message: res.msg
          })
        }
      })
    })
    .catch(() => {
      loading.value = false
    })
}
const handleTab = ({ props }: any) => {
  tabBtn.value = props.label
}

const importRef = ref()
// 导入
const unitDescImportHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  let newParmas = {
    protypeId: parseInt(chooseNode.value)
  }
  let importApi: any = xmAttributeimportData
  let params = {
    title: `${nodeName.value}-属性明细表-`,
    protypeId: parseInt(chooseNode.value),
    tempApi: xmAttributegetImportTemplate,
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: searchDataHandle1
  }
  importRef.value.acceptParams(params)
}
// 导出
const exportHandle = () => {
  if (chooseNode.value == '') {
    ElMessage({
      type: 'warning',
      message: '请选择一个项目类型'
    })
    return
  }
  loading.value = true
  xmAttributeexportData(chooseNode.value).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = `${nodeName.value}-属性明细表.xlsx`
    if (res.headers && res.headers['content-disposition']) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  })
}

// 选择角色
const getRoleHandle = async () => {
  try {
    if (currentUserRole.value.bmId) {
      await initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}
const initParamLists = async () => {
  // 获取公共代码
  //  评审专业
  const publicCodeList = await getAllProtypeTree()
  if (publicCodeList.success && publicCodeList.data.length !== 0) {
    xmlxList.value = publicCodeList.data
  }
  const res = await getPublicData('XMYQSXPZ_CODE')
  if (res.success) {
    tabList.value = res.data
  }
}
// 关闭
const closeHandle = () => {
  ids.value.length = 0
  sxIds.value.length = 0
  checkData.value = []
  clearTabSelection()
  clearAttributeSelection()
  for (let key in formData) {
    formData[key] = null
  }
  copyData.targetProTypeId = ''
  dialogType.isShow = false
}

// 新增/编辑/复制 关闭
const closeHandle1 = () => {
  ids.value.length = 0
  checkData.value = []
  clearTabSelection()
  for (let key in formData) {
    formData[key] = null
  }
  copyData.targetProTypeId = ''
  searchDataHandle()
  dialogType.isShow = false
}

const clearTabSelection = () => {
  tabGridRef.value?.clearCheckboxRow?.()
}

const clearAttributeSelection = () => {
  attributeGridRef.value?.clearCheckboxRow?.()
  attributeGridRef.value?.clearEdit?.()
}

watch(
  () => searchForm.value,
  (newValue) => {
    selectSearchTree1(newValue)
  }
)
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;

  .table {
    padding-top: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;

    :deep(.vxe-grid) {
      flex: 1;
      min-height: 0;
    }
  }
}

.pageName {
  margin-bottom: 10px;
  font-size: 20px;
  letter-spacing: 2px;
  font-weight: bold;
}

.cont_btn {
  width: 100%;
  display: flex;
  min-height: 0;
}

.contbtn_left {
  box-sizing: border-box;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;

  .pageListCont {
    width: 100%;
  }
}

.conbtn_right {
  box-sizing: border-box;
  border-radius: 8px;
  flex: 1;
  min-width: 0;

  :deep(.el-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;

    .el-tabs__content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 10px;
      overflow: hidden;

      .el-tab-pane {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
    }
  }

  .operation {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .btnList {
    width: 320px;
    display: flex;
    justify-content: space-between;
  }
}

.commit {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  .commit_form {
    display: flex;
    align-items: center;

    .type_name {
      width: 120px;
      text-align: right;
      margin: 0 10px 0 0;

      .isRed {
        color: red;
        margin-right: 10px;
      }
    }
  }
}
</style>
