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
          :label-width="'280px'"
          :import-api="item.importApi"
          :info-api="item.infoApi"
          :user-info="userInfo"
          ref="protableCurdRef"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script setup lang="ts" name="/motivation/MarketingMotivation/index">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProtableCurd from '@/views/motivation/MarketingMotivation/components/ProtableCurd.vue'
import { getEjdw, getYjdw, getPublicData } from '@/api/common' //公共代码
import {
  gdsfwPage,
  gdsfwSave,
  gdsfwRemove,
  gdsfwSubmit,
  gdsfwGetInfo,
  gdsfwGetImportTemplate,
  gdsfwImportExcel,
  gdsfwExportExcel,
  exportExcel,
  getPage,
  importExcel,
  saveData,
  getInfoData,
  getImportTemplate,
  deleteData,
  submitData,
  dnjPage,
  dnjSave,
  dnjRemove,
  dnjSubmit,
  dnjGetInfo,
  dnjGetImportTemplate,
  dnjImportExcel,
  dnjExportExcel,
  znydPage,
  znydSave,
  znydRemove,
  znydSubmit,
  znydGetInfo,
  znydGetImportTemplate,
  znydImportExcel,
  znydExportExcel
} from '@/api/motivation/marketingMotivation/index'
import { decimal2Rules, integerRules, decimal6Rules } from '@/utils/rules'

const userDialogRef = ref<InstanceType<typeof userDialog>>()
const tabData = ref('1')
const protableCurdRef = ref<InstanceType<typeof ProtableCurd>>()
const isShowPage = ref(false)
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
const statusType = ref<any[]>([]) //数据状态
const houseType = ref<any[]>([]) //营业厅等级
const sfType = ref<any[]>([]) //是否
const dhjNd = ref<any[]>([]) //填写年份

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
  const houseRes = await getPublicData('DY_YYTDJ_COM')
  if (houseRes.success) {
    houseType.value.push(...houseRes.data)
  }

  const sfRes = await getPublicData('GY_SF')
  if (sfRes.success) {
    sfType.value.push(...sfRes.data)
  }
  const dhjNdRes = await getPublicData('DY_DNJ_NF_COM')
  if (dhjNdRes.success) {
    dhjNd.value.push(...dhjNdRes.data)
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
    label: '供电所房屋信息',
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
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
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
        prop: 'gdsmc',
        label: '供电所名称',
        width: '180'
      },
      {
        prop: 'fwmc',
        label: '房屋名称',
        width: '180'
      },
      {
        prop: 'addr',
        label: '地址',
        width: '180'
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        width: '180'
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        width: '180'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        width: '180'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡片号',
        width: '180'
      },
      {
        prop: 'yz',
        label: '原值（万元）',
        width: '180'
      },
      {
        prop: 'jz',
        label: '净值（万元）',
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
        prop: 'gdsmc',
        label: '供电所名称',
        type: 'input',
        required: true
      },
      {
        prop: 'fwmc',
        label: '房屋名称',
        type: 'input',
        required: true
      },
      {
        prop: 'addr',
        label: '地址',
        type: 'input'
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        type: 'input'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        type: 'input'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡片号',
        type: 'input'
      },
      {
        prop: 'yz',
        label: '原值（万元）',
        type: 'input',
        rules: decimal6Rules()
      },
      {
        prop: 'jz',
        label: '净值（万元）',
        type: 'input',
        rules: decimal6Rules()
      }
    ],
    importTitle: '供电所房屋信息',
    modalTitle: '供电所房屋信息',
    getTableList: gdsfwPage,
    tempApi: gdsfwGetImportTemplate,
    importApi: gdsfwImportExcel,
    infoApi: gdsfwGetInfo,
    exportApi: gdsfwExportExcel,
    deleteApi: gdsfwRemove,
    submitApi: gdsfwSubmit,
    saveApi: gdsfwSave
  },
  {
    label: '营业厅信息',
    name: '2',
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
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
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
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'yytmc',
        label: '营业厅名称',
        width: '180'
      },
      {
        prop: 'yytdjName',
        label: '营业厅等级',
        width: '180'
      },
      {
        prop: 'sfzwzxName',
        label: '是否政务中心',
        width: '180'
      },
      {
        prop: 'dassl',
        label: '档案室数量',
        width: '180'
      },
      {
        prop: 'mjjsl',
        label: '密集架数量',
        width: '180'
      },
      {
        prop: 'addr',
        label: '地址',
        width: '180'
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        width: '180'
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        width: '180'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        width: '180'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡片号',
        width: '180'
      },
      {
        prop: 'yz',
        label: '原值（万元）',
        width: '180'
      },
      {
        prop: 'jz',
        label: '净值（万元）',
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
        prop: 'yytmc',
        label: '营业厅名称',
        type: 'input',
        required: true
      },
      {
        prop: 'yytdj',
        label: '营业厅等级',
        type: 'select',
        options: houseType.value as any
      },
      {
        prop: 'sfzwzx',
        label: '是否政务中心',
        type: 'select',
        options: sfType.value as any
      },
      {
        prop: 'dassl',
        label: '档案室数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'mjjsl',
        label: '密集架数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'addr',
        label: '地址',
        type: 'input'
      },
      {
        prop: 'jzmj',
        label: '建筑面积(㎡)',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'cqzh',
        label: '产权证号',
        type: 'input'
      },
      {
        prop: 'tdzh',
        label: '土地证号',
        type: 'input'
      },
      {
        prop: 'gdzckph',
        label: '固定资产卡片号',
        type: 'input'
      },
      {
        prop: 'yz',
        label: '原值（万元）',
        type: 'input',
        rules: decimal6Rules()
      },
      {
        prop: 'jz',
        label: '净值（万元）',
        type: 'input',
        rules: decimal6Rules()
      }
    ],
    importTitle: '营业厅信息',
    modalTitle: '营业厅信息',
    getTableList: getPage,
    tempApi: getImportTemplate,
    importApi: importExcel,
    infoApi: getInfoData,
    exportApi: exportExcel,
    deleteApi: deleteData,
    submitApi: submitData,
    saveApi: saveData
  },
  {
    label: '电能计量信息填写',
    name: '3',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 1 },
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 2 },
        enum: ejdwList.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'statusName',
        label: '状态',
        width: '80'
      },
      {
        prop: 'nfName',
        label: '年份',
        width: '80'
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
        prop: 'xzDxdnbsl',
        label: '新增单相电能表数量',
        width: '180'
      },
      {
        prop: 'xzJmdxdnbsl',
        label: '新增居民单相电能表数量',
        width: '180'
      },
      {
        prop: 'zyxDxdnbsl',
        label: '在运行单相电能表数量',
        width: '180'
      },
      {
        prop: 'zyxJmdxdnbsl',
        label: '在运行居民单相电能表数量',
        width: '180'
      },
      {
        prop: 'ddnxxghDxbsl',
        label: '达到年限需更换的单相表数量',
        width: '180'
      },
      {
        prop: 'ddnxxghJmdxbsl',
        label: '达到年限需更换的居民单相表数量',
        width: '220'
      },
      {
        prop: 'xzSxdnbsl',
        label: '新增三相电能表数量',
        width: '140'
      },
      {
        prop: 'xzSxdnbslSbjcps',
        label: `新增三相电能表数量（仅设备检测配送）`,
        width: '140'
      },
      {
        prop: 'xzJmsxdnbslBhsbjc',
        label: '新增居民三相电能表数量（不含设备检测）',
        width: '160'
      },
      {
        prop: 'xzJmxzdnbsl',
        label: '新增居民三相电能表数量',
        width: '180'
      },
      {
        prop: 'zyxSxdnbsl',
        label: '在运行三相电能表数量',
        width: '180'
      },
      {
        prop: 'zyxSxdnbslSbjcps',
        label: '在运行三相电能表数量（仅设备检测配送）',
        width: '160'
      },
      {
        prop: 'zyxJmsxdnbsl',
        label: '在运行居民三相电能表数量',
        width: '180'
      },
      {
        prop: 'zyxJmsxdnbslBhsbjc',
        label: '在运行居民三相电能表数量(不含设备检测）',
        width: '180'
      },
      {
        prop: 'ddnxxghSxbsl',
        label: '达到年限需更换的三相表数量',
        width: '180'
      },
      {
        prop: 'ddnxxghSxbslSbjcps',
        label: '达到年限需更换的三相表数量（仅设备检测配送）',
        width: '180'
      },
      {
        prop: 'ddnxxghJmsxbslBhsbjc',
        label: '达到年限需更换的居民三相表数量（不含设备检测）',
        width: '220'
      },
      {
        prop: 'ddnxxghJmsxbsl',
        label: '达到年限需更换的居民三相表数量',
        width: '220'
      },
      {
        prop: 'dyyhs',
        label: '低压用户数',
        width: '180'
      },
      {
        prop: 'zyxJmdxyhs',
        label: '在运行居民单相用户数',
        width: '180'
      },
      {
        prop: 'zyxJmsxyhs',
        label: '在运行居民三相用户数',
        width: '180'
      },
      {
        prop: 'gyyhs',
        label: '高压用户数',
        width: '180'
      },
      {
        prop: 'dlyhs',
        label: '电力用户数',
        width: '180'
      },
      {
        prop: 'jmyhs',
        label: '居民用户数',
        width: '180'
      },
      {
        prop: 'dlyhzzl',
        label: '电力用户增长率%',
        width: '180'
      },
      {
        prop: 'bksl',
        label: '表库数量',
        width: '180'
      },
      {
        prop: 'zzgsl',
        label: '周转柜数量',
        width: '180'
      },
      {
        prop: 'sjjlzxsl',
        label: '省级计量中心数量',
        width: '180'
      },
      {
        prop: 'sjsjzxts',
        label: '省级计量中心检定检测装置等套数',
        width: '220'
      },
      {
        prop: 'gwjlxzts',
        label: '国网计量中心技术服务、支撑等套数',
        width: '240'
      },
      {
        prop: 'dssyssbsl',
        label: '地市实验室设备数量',
        width: '180'
      },
      {
        prop: 'xccssbsl',
        label: '现场测试设备数量',
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
        prop: 'nf',
        label: '年份',
        type: 'select',
        required: true,
        options: dhjNd.value as any
      },
      {
        prop: 'xzDxdnbsl',
        label: '新增单相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzJmdxdnbsl',
        label: '新增居民单相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxDxdnbsl',
        label: '在运行单相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxJmdxdnbsl',
        label: '在运行居民单相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghDxbsl',
        label: '达到年限需更换的单相表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghJmdxbsl',
        label: '达到年限需更换的居民单相表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzSxdnbsl',
        label: '新增三相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzSxdnbslSbjcps',
        label: '新增三相电能表（仅设备检测配送）数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzJmsxdnbslBhsbjc',
        label: '新增居民三相电能表(不含设备检测）数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'xzJmxzdnbsl',
        label: '新增居民三相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxSxdnbsl',
        label: '在运行三相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxSxdnbslSbjcps',
        label: '房屋在运行三相电能表数量（仅设备检测配送）名称',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxJmsxdnbsl',
        label: '在运行居民三相电能表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxJmsxdnbslBhsbjc',
        label: '在运行居民三相电能表数量(不含设备检测）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghSxbsl',
        label: '达到年限需更换的三相表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghSxbslSbjcps',
        label: '达到年限需更换的三相表数量（仅设备检测配送）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghJmsxbslBhsbjc',
        label: '达到年限需更换的居民三相表数量(不含设备检测）',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'ddnxxghJmsxbsl',
        label: '达到年限需更换的居民三相表数量',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dyyhs',
        label: '低压用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxJmdxyhs',
        label: '在运行居民单相用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'zyxJmsxyhs',
        label: '在运行居民三相用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'gyyhs',
        label: '高压用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dlyhs',
        label: '电力用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'jmyhs',
        label: '居民用户数',
        type: 'input',
        rules: integerRules()
      },
      {
        prop: 'dlyhzzl',
        label: '电力用户增长率%',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'bksl',
        label: '表库数量',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'zzgsl',
        label: '周转柜数量',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'sjjlzxsl',
        label: '省级计量中心数量',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'sjsjzxts',
        label: '省级计量中心检定检测装置等套数',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'gwjlxzts',
        label: '国网计量中心技术服务、支撑等套数',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'dssyssbsl',
        label: '地市实验室设备数量',
        type: 'input',
        rules: decimal2Rules()
      },
      {
        prop: 'xccssbsl',
        label: '现场测试设备数量',
        type: 'input',
        rules: decimal2Rules()
      }
    ],
    importTitle: '电能计量信息填写',
    modalTitle: '电能计量信息填写',
    getTableList: dnjPage,
    tempApi: dnjGetImportTemplate,
    infoApi: dnjGetInfo,
    importApi: dnjImportExcel,
    exportApi: dnjExportExcel,
    deleteApi: dnjRemove,
    submitApi: dnjSubmit,
    saveApi: dnjSave
  },
  {
    label: '智能用电与市场能效信息',
    name: '4',
    tableColumns: [
      { type: 'selection', width: 50 },
      { type: 'index', width: 50, label: '序号' },
      {
        prop: 'yjdw',
        label: '一级单位（市）',
        search: { el: 'select', props: { onChange: selectYjdwChange }, order: 2 },
        isShow: false,
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'ejdw',
        label: '二级单位（县）',
        search: { el: 'select', order: 3 },
        enum: ejdwList.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'status',
        label: '状态',
        search: { el: 'select', order: 3 },
        enum: statusType.value,
        isShow: false,
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'statusName',
        label: '状态',
        width: '80'
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
        prop: 'gjzlcdzslZbw',
        label: '公交直流充电桩（质保外）数量',
        width: '200'
      },
      {
        prop: 'gjzlcdzslZbn',
        label: '公交直流充电桩（质保内）数量',
        width: '200'
      },
      {
        prop: 'cszlcdzslZbw',
        label: '城市直流充电桩（质保外）数量',
        width: '200'
      },
      {
        prop: 'cszlcdzslZbn',
        label: '城市直流充电桩（质保内）数量',
        width: '200'
      },
      {
        prop: 'gszlcdzslZbw',
        label: '高速直流充电桩（质保外）数量',
        width: '200'
      },
      {
        prop: 'gszlcdzslZbn',
        label: '高速直流充电桩（质保内）数量',
        width: '200'
      },
      {
        prop: 'jlzslZbw',
        label: '交流桩数量（质保外）',
        width: '180'
      },
      {
        prop: 'jlzslZbn',
        label: '交流桩数量（质保内）',
        width: '180'
      },
      {
        prop: 'gjhdgwsl',
        label: '公交换电工位数量',
        width: '180'
      },
      {
        prop: 'cshdgwsl',
        label: '城市换电工位数量',
        width: '180'
      },
      {
        prop: 'dqadzslZbw',
        label: '单枪岸电桩数量（质保外）',
        width: '180'
      },
      {
        prop: 'dqadzslZbn',
        label: '单枪岸电桩数量（质保内）',
        width: '180'
      },
      {
        prop: 'sqjysadzslZbw',
        label: '双枪及以上岸电桩数量（质保外）',
        width: '220'
      },
      {
        prop: 'sqjysadzslZbn',
        label: '双枪及以上岸电桩数量（质保内）',
        width: '220'
      },
      {
        prop: 'gyadzslZbw',
        label: '高压岸电桩数量（质保外）',
        width: '180'
      },
      {
        prop: 'gyadzslZbn',
        label: '高压岸电桩数量（质保内）',
        width: '180'
      },
      {
        prop: 'hgadsssl',
        label: '海港岸电设施数量',
        width: '160'
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
        prop: 'gjzlcdzslZbw',
        label: '公交直流充电桩（质保外）数量',
        type: 'input'
      },
      {
        prop: 'gjzlcdzslZbn',
        label: '公交直流充电桩（质保内）数量',
        type: 'input'
      },
      {
        prop: 'cszlcdzslZbw',
        label: '城市直流充电桩（质保外）数量',
        type: 'input'
      },
      {
        prop: 'cszlcdzslZbn',
        label: '城市直流充电桩（质保内）数量',
        type: 'input'
      },
      {
        prop: 'gszlcdzslZbw',
        label: '高速直流充电桩（质保外）数量',
        type: 'input'
      },
      {
        prop: 'gszlcdzslZbn',
        label: '高速直流充电桩（质保内）数量',
        type: 'input'
      },
      {
        prop: 'jlzslZbw',
        label: '交流桩数量（质保外）',
        type: 'input'
      },
      {
        prop: 'jlzslZbn',
        label: '交流桩数量（质保内）',
        type: 'input'
      },
      {
        prop: 'gjhdgwsl',
        label: '公交换电工位数量',
        type: 'input'
      },
      {
        prop: 'cshdgwsl',
        label: '城市换电工位数量',
        type: 'input'
      },
      {
        prop: 'dqadzslZbw',
        label: '单枪岸电桩数量（质保外）',
        type: 'input'
      },
      {
        prop: 'dqadzslZbn',
        label: '单枪岸电桩数量（质保内）',
        type: 'input'
      },
      {
        prop: 'sqjysadzslZbw',
        label: '双枪及以上岸电桩数量（质保外）',
        type: 'input'
      },
      {
        prop: 'sqjysadzslZbn',
        label: '双枪及以上岸电桩数量（质保内）',
        type: 'input'
      },
      {
        prop: 'gyadzslZbw',
        label: '高压岸电桩数量（质保外）',
        type: 'input'
      },
      {
        prop: 'gyadzslZbn',
        label: '高压岸电桩数量（质保内）',
        type: 'input'
      },
      {
        prop: 'hgadsssl',
        label: '海港岸电设施数量',
        type: 'input'
      }
    ],
    importTitle: '智能用电与市场能效信息',
    modalTitle: '智能用电与市场能效信息',
    getTableList: znydPage,
    tempApi: znydGetImportTemplate,
    infoApi: znydGetInfo,
    importApi: znydImportExcel,
    exportApi: znydExportExcel,
    deleteApi: znydRemove,
    submitApi: znydSubmit,
    saveApi: znydSave
  }
])

const getPublicCodeData = () => {}

const initParams = () => {
  getPublicCodeData()
}

onMounted(async () => {
  initParams()
  await userDialogRef.value.getUser()
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
