<!--组织部数据填报 -->
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
          :label-width="'280px'"
          :user-info="userInfo"
          ref="protableCurdRef"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script setup lang="ts" name="/motivation/TissueMotivTation/index">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProtableCurd from '@/views/motivation/MarketingMotivation/components/ProtableCurd.vue'
import { getEjdw, getYjdw, getPublicData } from '@/api/common' //公共代码
import {
  ryhgzxxPage,
  ryhgzxxRemove,
  ryhgzxxSubmit,
  ryhgzxxSave,
  ryhgzxxGetInfo,
  ryhgzxxGetImportTemplate,
  ryhgzxxImportExcel,
  ryhgzxxExportExcel
} from '@/api/motivation/TissueMotivTation/index'
import { decimal2Rules, integerRules } from '@/utils/rules'

const userDialogRef = ref<InstanceType<typeof userDialog>>()
const tabData = ref('1')
const protableCurdRef = ref<InstanceType<typeof ProtableCurd>>()
const isShowPage = ref(false)
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
    label: '人员和工资信息',
    name: '1',
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
        prop: 'zszgNum',
        label: '正式职工人数',
        width: '180'
      },
      {
        prop: 'wpryNum',
        label: '外聘人员数量',
        width: '180'
      },
      {
        prop: 'dbryNum',
        label: '定编人数',
        width: '180'
      },
      {
        prop: 'ndgNum',
        label: '农电工人数',
        width: '180'
      },
      {
        prop: 'ndgAvgSalary',
        label: '农电工平均工资水平（元）',
        width: '180'
      },
      {
        prop: 'ddshAvgSalary',
        label: '当地社会人均工资水平（元）',
        width: '180'
      },
      {
        prop: 'zszgqbNum',
        label: '正式职工缺编人数',
        width: '180'
      },
      {
        prop: 'totalSalary',
        label: '当年工资总额（元）',
        width: '180'
      },
      {
        prop: 'lastTotalSalary',
        label: '上年度职工工资总额（元）',
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
        prop: 'zszgNum',
        label: '正式职工人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'wpryNum',
        label: '外聘人员数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dbryNum',
        label: '定编人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ndgNum',
        label: '农电工人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ndgAvgSalary',
        label: '农电工平均工资水平（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'ddshAvgSalary',
        label: '当地社会人均工资水平（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'zszgqbNum',
        label: '正式职工缺编人数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'totalSalary',
        label: '当年工资总额（元）',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'lastTotalSalary',
        label: '上年度职工工资总额（元）',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '人员和工资信息',
    modalTitle: '人员和工资信息',
    getTableList: ryhgzxxPage,
    deleteApi: ryhgzxxRemove,
    submitApi: ryhgzxxSubmit,
    saveApi: ryhgzxxSave,
    infoApi: ryhgzxxGetInfo,
    tempApi: ryhgzxxGetImportTemplate,
    importApi: ryhgzxxImportExcel,
    exportApi: ryhgzxxExportExcel
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
