<!-- 安监部数据填报 -->
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
          :submit-api="item.submitApi"
          :import-title="item.importTitle"
          :save-api="item.saveApi"
          :temp-api="item.tempApi"
          :table-columns="item.tableColumns"
          :form-fields="item.formFields"
          :import-api="item.importApi"
          :info-api="item.infoApi"
          :label-width="item.width"
          :user-info="userInfo"
          ref="protableCurdRef"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script setup lang="ts" name="/motivation/SecurityMotivation/index">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProtableCurd from '@/views/motivation/MarketingMotivation/components/ProtableCurd.vue'
import { getEjdw, getYjdw, getPublicData } from '@/api/common' //公共代码
import {
  fkffxxPage,
  fkffxxRemove,
  fkffxxSubmit,
  fkffxxSave,
  fkffxxGetInfo,
  fkffxxGetImportTemplate,
  fkffxxImportExcel,
  fkffxxExportExcel,
  zzbdxxPage,
  zzbdxxRemove,
  zzbdxxSubmit,
  zzbdxxSave,
  zzbdxxGetInfo,
  zzbdxxGetImportTemplate,
  zzbdxxImportExcel,
  zzbdxxExportExcel
} from '@/api/motivation/SecurityMotivation/index'
import { decimal2Rules, integerRules } from '@/utils/rules'

const userDialogRef = ref<InstanceType<typeof userDialog>>()
const tabData = ref('1')
const protableCurdRef = ref<InstanceType<typeof ProtableCurd>>()
const isShowPage = ref(false)
const bdType = ref<any[]>([]) //保电类型
const stationType = ref<any[]>([]) //涉及站点类型
const lineType = ref<any[]>([]) //涉及线路类型
const statusType = ref<any[]>([]) //数据状态

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
  const isQuery = userDialogRef.value?.isQuery
  const userInfOther = userDialogRef.value?.userMsg
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
    getYjdwData()
  }
}

const yjdwList = ref<
  {
    code: string
    name: string
  }[]
>([]) // 一级单位
const ejdwList = ref<
  {
    code: string
    name: string
  }[]
>([]) // 二级单位

const getYjdwData = async () => {
  const yjdwRes = await getYjdw({
    dwId: userInfo.value.dwId,
    bmId: userInfo.value.deptId
  })
  if (yjdwRes.success) {
    yjdwList.value.push(...yjdwRes.data)
  }
  const bdTypeRes = await getPublicData('DY_BDLX_COM')
  if (bdTypeRes.success) {
    bdType.value.push(...bdTypeRes.data)
  }
  const stationRefs = await getPublicData('DY_SJZDLX_COM')
  if (stationRefs.success) {
    stationType.value.push(...stationRefs.data)
  }
  const lineRes = await getPublicData('DY_SJXLLX_COM')
  if (lineRes.success) {
    lineType.value.push(...lineRes.data)
  }
  const statusRes = await getPublicData('DY_STATUS_COM')
  if (statusRes.success) {
    statusType.value.push(...statusRes.data)
  }
}

const selectYjdwChange = async (val: any) => {
  if (protableCurdRef.value) {
    const params = protableCurdRef.value.getParams()
    params.ejdw = ''
    ejdwList.value.length = 0
    const ejdwRes = await getEjdw({
      YJDW: val,
      parentCode: val,
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId
    })
    if (ejdwRes.success && ejdwRes.data.length !== 0) {
      ejdwList.value.push(...ejdwRes.data)
    }
  }
}

const tables = ref([
  {
    label: '反恐防范信息',
    name: '1',
    width: '300px',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'statusName',
        label: '状态',
        width: '80'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'yjdwName',
        label: '一级单位（市）',
        width: '180'
      },
      {
        prop: 'ejdwName',
        label: '二级单位（县）',
        width: '180'
      },
      {
        prop: 'gdldyzxs',
        label: '国家和区域级（含备调）电力调度中心数（个）',
        width: '180'
      },
      {
        prop: 'hlz',
        label: '750千伏及以上变电站、换流站（座）',
        width: '180'
      },
      {
        prop: 'kgz',
        label: '直接为党政军国家机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        width: '180'
      },
      {
        prop: 'sdldyzxs',
        label: '省级（含备调）电力调度中心数（个）',
        width: '180'
      },
      {
        prop: 'kqks',
        label: '330千伏以上、750千伏以下跨省跨区变电站、换流站（座）',
        width: '180'
      },
      {
        prop: 'zzq',
        label:
          '直接为省（自治区、直辖市）级党委政府和军事机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        width: '180'
      },
      {
        prop: 'sdz',
        label:
          '直接为市（地、州）级党委政府和军事机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        width: '180'
      },
      {
        prop: 'dlsjzx',
        label: '独立数据中心(个）',
        width: '180'
      },
      {
        prop: 'bdyw',
        label: '变电运维班驻点变电站(座）',
        width: '180'
      },
      {
        prop: 'tsyq',
        label: '特殊要求-行政村驻村工作（个）',
        width: '180'
      }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        type: 'select',
        required: true,
        options: yjdwList.value as any
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        type: 'select',
        required: true,
        dependsOn: 'yjdw',
        optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
          const response = await getEjdw({
            YJDW: yjdwValue,
            parentCode: yjdwValue,
            dwId: userInfo.value.dwId,
            bmId: userInfo.value.deptId
          })
          return response.data.map((ejdw: any) => ({
            label: ejdw.name,
            value: ejdw.code
          }))
        }
      },
      {
        prop: 'gdldyzxs',
        label: '国家和区域级（含备调）电力调度中心数（个）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'hlz',
        label: '750千伏及以上变电站、换流站（座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'kgz',
        label: '直接为党政军国家机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'sdldyzxs',
        label: '省级（含备调）电力调度中心数（个）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'kqks',
        label: '330千伏以上、750千伏以下跨省跨区变电站、换流站（座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zzq',
        label:
          '直接为省（自治区、直辖市）级党委政府和军事机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'sdz',
        label:
          '直接为市（地、州）级党委政府和军事机关、新闻媒体和科研机构等一级重要用户供电的变电站、开关站（座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dlsjzx',
        label: '独立数据中心(个）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'bdyw',
        label: '变电运维班驻点变电站(座）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'tsyq',
        label: '特殊要求-行政村驻村工作（个）',
        type: 'input',
        rules: integerRules()
      }
    ],
    importTitle: '反恐防范信息',
    modalTitle: '反恐防范信息',
    getTableList: fkffxxPage,
    deleteApi: fkffxxRemove,
    submitApi: fkffxxSubmit,
    saveApi: fkffxxSave,
    tempApi: fkffxxGetImportTemplate,
    importApi: fkffxxImportExcel,
    infoApi: fkffxxGetInfo,
    exportApi: fkffxxExportExcel
  },
  {
    label: '政治保电信息',
    name: '2',
    width: '180px',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'statusName',
        label: '状态',
        width: '80'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'yjdwName',
        label: '一级单位（市）',
        width: '180'
      },
      {
        prop: 'ejdwName',
        label: '二级单位（县）',
        width: '180'
      },
      {
        prop: 'bdlx',
        label: '保电类型',
        width: '180'
      },
      {
        prop: 'sjzdlx',
        label: '涉及站点类型',
        width: '180'
      },
      {
        prop: 'zdgs',
        label: '站点个数',
        width: '80'
      },
      {
        prop: 'sjxllx',
        label: '涉及线路类型',
        width: '180'
      },
      {
        prop: 'xlts',
        label: '线路条数',
        width: '80'
      },
      {
        prop: 'xlcd',
        label: '线路长度（km)',
        width: '130'
      },
      {
        prop: 'pdzfgs',
        label: '配电站房个数',
        width: '100'
      },
      {
        prop: 'sbgs',
        label: '网络信息系统及设备个数',
        width: '180'
      }
    ],
    formFields: [
      {
        prop: 'id',
        label: 'ID',
        type: 'hidden'
      },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        type: 'select',
        required: true,
        options: yjdwList.value as any
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        type: 'select',
        required: true,
        dependsOn: 'yjdw',
        optionsLoader: async (yjdwValue: string, formData: Record<string, any>) => {
          const response = await getEjdw({
            YJDW: yjdwValue,
            parentCode: yjdwValue,
            dwId: userInfo.value.dwId,
            bmId: userInfo.value.deptId
          })
          return response.data.map((ejdw: any) => ({
            label: ejdw.name,
            value: ejdw.code
          }))
        }
      },
      {
        prop: 'bdlx',
        label: '保电类型',
        type: 'select',
        options: bdType.value as any
      },
      {
        prop: 'sjzdlx',
        label: '涉及站点类型',
        type: 'select',
        options: stationType.value as any
      },
      {
        prop: 'zdgs',
        label: '站点个数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'sjxllx',
        label: '涉及线路类型',
        type: 'select',
        options: lineType.value as any
      },
      {
        prop: 'xlts',
        label: '线路条数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xlcd',
        label: '线路长度(km)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'pdzfgs',
        label: '配电站房个数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'sbgs',
        label: '网络信息系统及设备个数',
        type: 'input',
        rules: integerRules()
      }
    ],
    importTitle: '政治保电信息',
    modalTitle: '政治保电信息',
    getTableList: zzbdxxPage,
    deleteApi: zzbdxxRemove,
    submitApi: zzbdxxSubmit,
    saveApi: zzbdxxSave,
    infoApi: zzbdxxGetInfo,
    tempApi: zzbdxxGetImportTemplate,
    importApi: zzbdxxImportExcel,
    exportApi: zzbdxxExportExcel
  }
])

const getPublicCodeData = () => {}

const initParams = () => {
  getPublicCodeData()
}

onMounted(async () => {
  initParams()
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
