<!-- 人工机械库数据填报 -->
<template>
  <div class="container-main">
    <el-tabs v-model="tabData" v-show="isShowPage">
      <el-tab-pane :key="item.name" v-for="item in tables" :label="item.label" :name="item.name">
        <ProtableCurd
          v-if="isShowPage"
          :export-api="item.exportApi"
          :get-table-list="item.getTableList"
          :delete-api="item.deleteApi"
          :modal-title="item.modalTitle"
          :import-title="item.importTitle"
          :save-api="item.saveApi"
          :temp-api="item.tempApi"
          :table-columns="item.tableColumns"
          :form-fields="item.formFields"
          :import-api="item.importApi"
          :label-width="'180px'"
          :info-api="item.infoApi"
          :user-info="userInfo"
          ref="protableCurdRef"
          :cjr="cjr"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script setup lang="ts" name="/motivation/rgjxPage/index">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProtableCurd from '@/views/motivation/MarketingMotivation/components/ProtableCurdV.vue'
import { getPublicData } from '@/api/common' //公共代码
import {
  glyfwxxPage,
  glyfwxxRemove,
  glyfwxxSave,
  glyfwxxGetInfo,
  glyfwxxGetImportTemplate,
  glyfwxxImportExcel,
  glyfwxxExportExcel,
  cnxxPage,
  cnxxRemove,
  cnxxSave,
  cnxxGetInfo,
  cnxxGetImportTemplate,
  cnxxImportExcel,
  cnxxExportExcel,
  debzxxPage,
  debzxxRemove,
  debzxxSave,
  debzxxGetInfo,
  debzxxGetImportTemplate,
  debzxxImportExcel,
  debzxxExportExcel
} from '@/api/motivation/rgjxApi'
import { decimal2Rules } from '@/utils/rules'
import { useStore } from 'vuex'
import { formatNumValue } from '@/utils/utils'

const userDialogRef = ref<any>()
const tabData = ref('1')
const protableCurdRef = ref<any>()
const isShowPage = ref(false)
const cjr = ref<string>('')
const store = useStore()
const countInfo = ref<any>()

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
})

//  获取权限
const getRoleHandle = () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    userInfo.value = {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    }
    isShowPage.value = true
  }
}

const tables = ref([
  {
    label: '人工',
    name: '1',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'rgname',
        label: '人工名称',
        width: '280',
        search: { el: 'input', order: 1 }
      },
      {
        prop: 'rgcode',
        label: '人工名称编码',
        width: '150'
      },
      {
        prop: 'rgunitprice',
        label: '人工单价（元/工日）',
        width: '150'
      },
      {
        prop: 'rgpricesource',
        label: '价格来源',
        width: '150',
        search: { el: 'select', order: 3 },
        enum: () => getPublicData('PRICESOURCE_COM'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'sfyxjyj',
        label: '是否有询价依据',
        width: '150',
        search: { el: 'select', order: 4 },
        enum: () => getPublicData('GY_SF'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'lyzy',
        label: '来源专业',
        width: '150',
        search: { el: 'select', order: 5 },
        enum: () => getPublicData('SOURCEZY_COM'),
        fieldNames: { label: 'name', value: 'code' }
      },
      { prop: 'lyxmmc', label: '来源项目名称', width: '300' },
      { prop: 'lydy', label: '来源动因', width: '150' },
      { prop: 'bz', label: '备注', width: '150' }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'rgname',
        label: '人工名称',
        type: 'input',
        required: true
      },
      // {
      //   prop: 'rgcode',
      //   label: '人工名称编码',
      //   type: 'input',
      //   required: true
      // },
      {
        prop: 'rgunitprice',
        label: '人工单价（元/工日）',
        type: 'input',
        rules: decimal2Rules(),
        required: true
      },
      {
        prop: 'rgpricesource',
        label: '价格来源',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'PRICESOURCE_COM' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'sfyxjyj',
        label: '是否有询价依据',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'GY_SF' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'lyzy',
        label: '来源专业',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'SOURCEZY_COM' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'lyxmmc',
        label: '来源项目名称',
        type: 'input'
      },
      {
        prop: 'lydy',
        label: '来源动因',
        type: 'input'
      },
      {
        prop: 'bz',
        label: '备注',
        type: 'input'
      }
    ],
    importTitle: '人工',
    modalTitle: '人工',
    getTableList: glyfwxxPage,
    deleteApi: glyfwxxRemove,
    saveApi: glyfwxxSave,
    infoApi: glyfwxxGetInfo,
    tempApi: glyfwxxGetImportTemplate,
    importApi: glyfwxxImportExcel,
    exportApi: glyfwxxExportExcel
  },
  {
    label: '机械',
    name: '2',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'jxname',
        label: '机械名称',
        width: '280',
        search: { el: 'input', order: 1 }
      },
      {
        prop: 'jxcode',
        label: '机械名称编码',
        width: '150'
      },
      {
        prop: 'jxunitprice',
        label: '机械单价（元/工日）',
        width: '150'
      },
      {
        prop: 'jxpricesource',
        label: '价格来源',
        width: '150',
        search: { el: 'select', order: 3 },
        enum: () => getPublicData('PRICESOURCE_COM'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'sfyxjyj',
        label: '是否有询价依据',
        width: '150',
        search: { el: 'select', order: 4 },
        enum: () => getPublicData('GY_SF'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'lyzy',
        label: '来源专业',
        width: '150',
        search: { el: 'select', order: 5 },
        enum: () => getPublicData('SOURCEZY_COM'),
        fieldNames: { label: 'name', value: 'code' }
      },
      { prop: 'lyxmmc', label: '来源项目名称', width: '300' },
      { prop: 'lydy', label: '来源动因', width: '150' },
      { prop: 'bz', label: '备注', width: '150' }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'jxname',
        label: '机械名称',
        type: 'input',
        required: true
      },
      // {
      //   prop: 'jxcode',
      //   label: '机械名称编码',
      //   type: 'input',
      //   required: true
      // },
      {
        prop: 'jxunitprice',
        label: '机械单价（元/工日）',
        type: 'input',
        rules: decimal2Rules(),
        required: true
      },
      {
        prop: 'jxpricesource',
        label: '价格来源',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'PRICESOURCE_COM' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'sfyxjyj',
        label: '是否有询价依据',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'GY_SF' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'lyzy',
        label: '来源专业',
        type: 'select',
        apiConfig: {
          method: 'get',
          url: 'commonCode/getData',
          params: { code: 'SOURCEZY_COM' },
          valueField: 'code',
          labelField: 'name'
        },
        required: true
      },
      {
        prop: 'lyxmmc',
        label: '来源项目名称',
        type: 'input'
      },
      {
        prop: 'lydy',
        label: '来源动因',
        type: 'input'
      },
      {
        prop: 'bz',
        label: '备注',
        type: 'input'
      }
    ],
    importTitle: '机械',
    modalTitle: '机械',
    getTableList: cnxxPage,
    deleteApi: cnxxRemove,
    saveApi: cnxxSave,
    infoApi: cnxxGetInfo,
    tempApi: cnxxGetImportTemplate,
    importApi: cnxxImportExcel,
    exportApi: cnxxExportExcel
  },
  {
    label: '定额标准库',
    name: '3',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      { prop: 'zytx', label: '专业投向', width: '180', search: { el: 'input', order: 1 } },
      { prop: 'xmfl', label: '项目分类', width: '150', search: { el: 'input', order: 2 } },
      { prop: 'yssx', label: '预算事项', width: '150', search: { el: 'input', order: 3 } },
      { prop: 'xmmc', label: '项目名称', width: '300', search: { el: 'input', order: 4 } },
      { prop: 'dy', label: '动因', width: '150', search: { el: 'input', order: 5 } },
      { prop: 'dw', label: '单位', width: '150' },
      {
        prop: 'bzcb',
        label: '标准成本(元)',
        width: '150',
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => {
          if (typeof row.bzcb === 'undefined' || row.bzcb === null || row.bzcb === '' || row.bzcb == '0') return '-'
          return formatNumValue(row.bzcb.toString(), 2)
        }
      },
      {
        prop: 'lscb',
        label: '历史成本(元)',
        width: '150',
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => {
          if (typeof row.lscb === 'undefined' || row.lscb === null || row.lscb === '' || row.lscb == '0') return '-'
          return formatNumValue(row.lscb.toString(), 2)
        }
      },
      {
        prop: 'hyck',
        label: '行业参考(元)',
        width: '150',
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => {
          if (typeof row.hyck === 'undefined' || row.hyck === null || row.hyck === '' || row.hyck == '0') return '-'
          return formatNumValue(row.hyck.toString(), 2)
        }
      },
      { prop: 'cjr', label: '创建人', width: '100' },
      { prop: 'cjsj', label: '创建时间', width: '150' }
    ],
    formFields: [
      { prop: 'id', label: 'ID', type: 'hidden' },
      { prop: 'zytx', label: '专业投向', type: 'input', required: true },

      { prop: 'xmfl', label: '项目分类', type: 'input', required: true },
      { prop: 'yssx', label: '预算事项', type: 'input', required: true },
      { prop: 'xmmc', label: '项目名称', type: 'input', required: true },
      { prop: 'dy', label: '动因', type: 'input', required: true },
      { prop: 'dw', label: '单位', type: 'input', required: true },
      { prop: 'bzcb', label: '标准成本(元)', type: 'input', required: true, rules: decimal2Rules() },
      { prop: 'lscb', label: '历史成本(元)', type: 'input', required: true, rules: decimal2Rules() },
      { prop: 'hyck', label: '行业参考(元)', type: 'input', required: true, rules: decimal2Rules() }
    ],
    importTitle: '定额标准库',
    modalTitle: '定额标准库',
    getTableList: debzxxPage,
    deleteApi: debzxxRemove,
    saveApi: debzxxSave,
    infoApi: debzxxGetInfo,
    tempApi: debzxxGetImportTemplate,
    importApi: debzxxImportExcel,
    exportApi: debzxxExportExcel
  }
])

const getPublicCodeData = () => {}

const initParams = () => {
  getPublicCodeData()
}

onMounted(async () => {
  initParams()
  countInfo.value = { ...store.getters.getUserMsg }
  cjr.value = countInfo.value?.name || ''

  await userDialogRef.value?.getUser()
})
</script>

<style scoped lang="less">
.container-main {
  height: 100%;
  padding: 10px;
  :deep(.el-tabs) {
    height: 100%;
    .el-tabs__content {
      height: calc(100% - 40px);
    }
  }
  :deep(.el-tab-pane) {
    height: 100%;
  }
}
</style>
