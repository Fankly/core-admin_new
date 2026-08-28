<!-- 项目全过程信息 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      height="100%"
      :pagination="true"
      @search="resetTable"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      :show-source="showSourceRow"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
      :cell-style="columnStyle"
      @cell-click="handleCellClick"
    >
      <template #tableHeader>
        <div style="display: flex">
          <el-button @click="handleExport" v-permission="'EXPORT'" size="mini" type="primary">导 出</el-button>
          <div style="margin-left: auto">
            <el-button @click="showSourceRow = !showSourceRow" size="mini" :type="showSourceRow ? 'primary' : 'default'">字段来源</el-button>
            <el-radio-group v-model="amountUnit" size="mini" style="margin-left: 12px">
              <el-radio-button label="yuan">元</el-radio-button>
              <el-radio-button label="wan">万元</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <!-- <el-button @click="handleSync" v-permission="'SYNC'" size="mini" type="primary">同步数据</el-button> -->
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <xmProcess ref="xmProcessRef" />
</template>

<script setup lang="tsx" name="/lyg/project/proInfo/index">
import { onMounted, ref, reactive, nextTick, h, toRefs, watch } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTablesource/index.vue'
import { xmqgcInfoPage, xmqgcInfoExport, getSubProtypeTreeByXmlx } from '@/api/lyg/index'
import { apiExportHandle } from '@/utils/export'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { usePage } from '@/hooks/useUser'
import { getPublicData, getSubProtypeTree, getDeptData } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import { formatNumValue } from '@/utils/utils'
import Decimal from 'decimal.js'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import TreeSelect from '@/components/select/TreeSelectLazy.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import xmProcess from '@/views/lyg/components/xmProcess.vue'
import { ElMessage } from 'element-plus'
const xmProcessRef = ref()
const userDialogRef = ref()
const isShowPage = ref(false)
// 金额单位：yuan=元，wan=万元
const amountUnit = ref<'yuan' | 'wan'>('yuan')
// 字段来源说明行显示开关（默认显示）
const showSourceRow = ref(false)
// 金额字段统一渲染：根据当前单位换算，万元=元÷10000保留6位小数，元保留2位小数
const renderAmount = (raw: any) => {
  if (raw === undefined || raw === null || raw === '') return '-'
  if (!Decimal.isDecimal(raw) && isNaN(Number(raw))) return raw
  let val = new Decimal(raw)
  if (amountUnit.value === 'wan') {
    val = val.div(10000)
    return formatNumValue(val.toString(), 6)
  }
  return formatNumValue(val.toString(), 2)
}
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const store = useStore()
const route = useRoute()
const xmxxParams = ref()
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const cbzxList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
// 成本中心树形结构props
const cbzxProps = {
  children: 'children',
  label: 'text'
}
const cbzxRef = ref()
// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}

//重置
const resetHandle = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  cbzxList.value.length = 0
  cbzxRef.value?.clearSelect()
  proTableRef.value?.clearSelection()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (param: any) => {
  loading.value = true
  const { applyCenter, ...restParam } = param
  xmxxParams.value = {
    ...restParam,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code
  }
  xmxxParams.value.pspidList = restParam.pspid ? restParam.pspid.split(',') : []
  // 实施部门（成本中心）入参，确保为数组
  xmxxParams.value.cbzxList = Array.isArray(applyCenter) ? applyCenter : applyCenter ? [applyCenter] : []
  return xmqgcInfoPage({ ...xmxxParams.value })
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// 导出
const handleExport = () => {
  const fileName = '项目全过程信息表'
  apiExportHandle({ ...xmxxParams.value }, fileName, xmqgcInfoExport)
}

const initParamLists = async (xmlx?: any) => {
  yjdwList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
  await getProjectType(xmlx)
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.qkjejdw = ''
  params.qkjgkbm = ''
  params.applyCenter = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  cbzxList.value.length = 0
  cbzxRef.value?.clearSelect()
  const param = {
    YJDW: val,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    parentCode: val
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
  let gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

const getProjectType = async (val?: any) => {
  projectTypeList.value.length = 0
  const res: any = await getSubProtypeTreeByXmlx({ xmlx: val })
  if (!res.success) return ElMessage.error(res.msg)
  projectTypeList.value = res.data
}

const selectXmlx = async (val?: any) => {
  const params = proTableRef.value?.searchParam
  if (params) params.qkjxmlxbmList = []
  await getProjectType(val)
}

// 选择二级单位联动成本中心（实施部门）
const ejdwChange = (val: any) => {
  const params = proTableRef.value?.searchParam
  if (params) params.applyCenter = ''
  cbzxList.value.length = 0
  cbzxRef.value?.clearSelect()
  const codes = Array.isArray(val) ? val : val ? [val] : []
  if (codes.length === 0) return
  Promise.all(codes.map((code: string) => getDeptData({ parentCode: 'CBZX', rootCode: code, objId: -1, level: 0 }))).then((results: any[]) => {
    results.forEach((res: any) => {
      if (res.success && res.data && res.data.length !== 0) {
        cbzxList.value.push(...res.data)
      }
    })
  })
}

// 根据一级单位加载二级单位、归口部门（不清空已选值，用于路由回显）
const loadByYjdw = async (yjdwVal: string) => {
  if (!yjdwVal) return
  const param = {
    YJDW: yjdwVal,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    parentCode: yjdwVal
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
  const gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

// 根据二级单位加载成本中心（不清空已选值，用于路由回显）
const loadByEjdw = (ejdwVal: string | string[]) => {
  const codes = Array.isArray(ejdwVal) ? ejdwVal : ejdwVal ? [ejdwVal] : []
  if (codes.length === 0) return
  Promise.all(codes.map((code: string) => getDeptData({ parentCode: 'CBZX', rootCode: code, objId: -1, level: 0 }))).then((results: any[]) => {
    results.forEach((res: any) => {
      if (res.success && res.data && res.data.length !== 0) {
        cbzxList.value.push(...res.data)
      }
    })
  })
}

// ========== 生命周期 ==========
const initByRouteParams = async () => {
  isShowPage.value = false
  if (JSON.stringify(route.params) === '{}') return
  const { roleId, specialorgid, spRoleId, status, roleCode, dwId, xmlx, zyear, qkjgkbmList, qkjxmlxbmList, applyCenter, qkjyjdw, qkjejdwList }: any =
    route.params
  const isRoel = await usePage(roleId, specialorgid, spRoleId, store as any)
  if (isRoel) {
    isShowPage.value = true
    await nextTick()
    userInfo.value = {
      role_id: roleId,
      code: roleCode,
      org_id: dwId,
      specialorgid: specialorgid
    }
    if (proTableRef.value) {
      // 1. 回填基本参数
      proTableRef.value.searchParam.projectProgressList = status.split(',') || []
      if (qkjyjdw) proTableRef.value.searchParam.qkjyjdw = qkjyjdw
      if (xmlx) proTableRef.value.searchParam.xmlx = xmlx
      if (zyear) proTableRef.value.searchParam.zyear = zyear
      let ejdwArr: any[] = []
      try {
        if (qkjejdwList) {
          ejdwArr = JSON.parse(qkjejdwList)
          proTableRef.value.searchParam.qkjejdwList = ejdwArr
        }
        if (qkjgkbmList) proTableRef.value.searchParam.qkjgkbmList = JSON.parse(qkjgkbmList)
        if (qkjxmlxbmList) proTableRef.value.searchParam.qkjxmlxbmList = JSON.parse(qkjxmlxbmList)
        if (applyCenter) proTableRef.value.searchParam.applyCenter = JSON.parse(applyCenter)
      } catch (e) {
        console.error('解析筛选参数失败', e)
      }
      // 2. 加载基础列表（一级单位）+ 项目类型树（若 xmlx 有值则带参加载）
      await initParamLists(xmlx)
      // 3. 按依赖顺序加载联动下拉（不清空已回填的值）
      if (qkjyjdw) await loadByYjdw(qkjyjdw)
      if (ejdwArr.length) loadByEjdw(ejdwArr)
      // 4. 最后触发搜索
      proTableRef.value.search()
    }
  } else {
    await userDialogRef.value?.getUser()
  }
}

onMounted(async () => {
  if (JSON.stringify(route.params) != '{}') {
    await initByRouteParams()
  } else {
    isShowPage.value = false
    await userDialogRef.value?.getUser()
  }
})

watch(
  () => route.params,
  (newParams, oldParams) => {
    if (JSON.stringify(newParams) === '{}') return
    if (JSON.stringify(newParams) === JSON.stringify(oldParams)) return
    initByRouteParams()
  },
  { deep: true }
)

const handleCellClick = (row: any, column: any) => {
  if (['项目编码'].includes(column.label)) {
    const id = row.pspid
    xmProcessRef.value.acceptParams({ ...row })
  }
}

// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (['项目编码'].includes(column.label)) {
    return {
      cursor: 'pointer',
      color: 'var(--color-primary, #00857c)'
    }
  }
}
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50, fixed: 'left' },
  { type: 'index', width: 50, label: '序号', fixed: 'left' },
  {
    prop: 'pspid',
    label: '项目编码',
    width: 150,
    source: '项目过程管控平台项目编码',
    search: {
      order: 9,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    },
    fixed: 'left'
  },
  { prop: 'post1', label: '项目名称', width: 180, source: '项目过程管控平台项目名称', search: { el: 'input', order: 10 }, fixed: 'left' },
  {
    prop: 'yj',
    label: '基本信息',
    _children: [
      {
        prop: 'zyear',
        label: '年度',
        width: 80,
        source: '项目过程管控平台预算年度',
        search: { el: 'select', order: 7 },
        enum: () => getPublicData('NDCX'),
        fieldNames: { label: 'name', value: 'code' }
      },
      {
        prop: 'xmlx',
        label: '项目大类',
        width: 80,
        search: { el: 'select', order: 5, props: { onChange: selectXmlx } },
        enum: () => getPublicData('LYG_ZBXM_ZCBLX_COM'),
        fieldNames: { label: 'name', value: 'code' },
        isShow: false
      },
      {
        prop: 'qkjxmlxbmList',
        label: '项目类型',
        width: 150,
        source: '项目过程管控平台项目类型',
        search: {
          order: 6,
          render: (scope: any) => {
            return (
              <ElTreeSelect
                showCheckbox
                collapseTags
                clearable
                data={projectTypeList.value}
                props={proTypeProps}
                nodeKey={'middleId'}
                modelValue={scope.modelValue}
              />
            )
          }
        },
        render: ({ row }: any) => {
          return row.qkjxmlxmc
        }
      },
      {
        prop: 'qkjyjdw',
        label: '一级单位',
        source: '项目过程管控平台项目一级单位',
        width: 150,
        search: { el: 'select', props: { onChange: selectChange }, order: 1 },
        enum: yjdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        render: ({ row }: any) => {
          return row.qkjyjdwName
        }
      },
      {
        prop: 'qkjejdwList',
        label: '二级单位',
        source: '项目过程管控平台项目二级单位',
        width: 150,
        search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true, onChange: ejdwChange } },
        enum: ejdwList.value,
        fieldNames: { label: 'name', value: 'code' },
        render: ({ row }: any) => {
          return row.qkjejdwName
        }
      },
      { prop: 'applyCenterName', label: '实施部门', source: '项目过程管控平台实施部门', width: 150 },
      { prop: 'xmbName', label: '项目包名称', source: '项目过程管控平台项目项目包名称', width: 150 },
      { prop: 'xmbType', label: '项目包类型', source: '项目过程管控平台项目项目包类型', width: 150 },
      { prop: 'zyssxmc', label: '预算事项名称', source: '项目过程管控平台项目预算事项名称', width: 150 },
      {
        prop: 'applyCenter',
        label: '实施部门',
        width: 150,
        isShow: false,
        search: {
          order: 3,
          render: () => {
            return (
              <TreeSelect
                onClearData={() => {
                  const params = proTableRef.value?.searchParam
                  if (!params) return
                  if (Array.isArray(params.applyCenter)) {
                    params.applyCenter = []
                  } else {
                    params.applyCenter = ''
                  }
                }}
                is-child-node={false}
                data={cbzxList.value}
                onSelectChange={(value: any) => {
                  if (proTableRef.value?.searchParam) {
                    proTableRef.value.searchParam.applyCenter = value
                  }
                }}
                is-leaf={false}
                ref={cbzxRef}
                data-type="objCode"
                default-props={cbzxProps}
                node-key="objCode"
                default-expand-all={true}
              />
            )
          }
        }
      },
      {
        prop: 'qkjgkbmList',
        label: '项目归口部门',
        source: '项目过程管控平台项目项目归口部门',
        width: 150,
        search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true } },
        enum: gkbmList.value,
        fieldNames: { label: 'name', value: 'code' },
        render: ({ row }: any) => {
          return row.qkjgkbmName
        }
      },
      {
        prop: 'erpjdys',
        label: '总预算',
        source: 'ERP系统项目总预算',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.erpjdys)
      },
      {
        prop: 'erpztys',
        label: '年度预算',
        source: 'ERP系统项目年度预算',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.erpztys)
      },
      { prop: 'projectManagerId', label: '责任人账号', source: '项目过程管控平台责任人账号', width: 150 },
      { prop: 'projectManagerName', label: '责任人名称', source: '项目过程管控平台责任人名称', width: 150 },
      { prop: 'directorId', label: '项目负责主任账号', source: '项目过程管控平台项目负责主任账号', width: 150 },
      { prop: 'directorName', label: '项目负责主任名称', source: '项目过程管控平台项目负责主任姓名', width: 150, search: { el: 'input', order: 8 } },
      { prop: 'serviceBidType', label: '服务招标-类型', source: '项目过程管控平台服务招标-类型', width: 150 },
      { prop: 'materialBidType', label: '物资招标-类型', source: '项目过程管控平台物资招标-类型', width: 150 },
      { prop: 'jsfs', label: '结算方式', source: '项目过程管控平台结算方式', width: 150 },
      { prop: 'wzzbpcName', label: '物资招标批次', source: '项目过程管控平台物资招标批次', width: 150 },
      { prop: 'fwzbpcName', label: '服务招标批次', source: '项目过程管控平台服务招标批次', width: 150 },
      {
        prop: 'projectProgressList',
        label: '项目执行进度',
        width: 150,
        search: { el: 'select', order: 11, props: { multiple: true, collapseTags: true } },
        enum: () => getPublicData('LYG_XMQGC_INFO_PROJECT_PROGRESS_COM'),
        fieldNames: { label: 'name', value: 'code' },
        render: ({ row }: any) => {
          return row.projectProgress
        }
      }
    ]
  },
  {
    prop: 'yj',
    label: '已立项',
    _children: [
      { prop: 'xmckrq', label: '项目出库日期', source: '项目过程管控平台项目出库日期', width: 150 },
      { prop: 'erdat', label: '立项日期', source: 'ERP系统项目创建日期', width: 150 },
      { prop: 'lxsfcq', label: '立项是否超期', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '已报招',
    _children: [
      { prop: 'firstPlanSubmitDate', label: '首笔计划提报时间', source: 'ERP系统项目下首次的计划提报时间', width: 150 },
      { prop: 'lastPlanSubmitDate', label: '最近计划提报时间', source: 'ERP系统项目最近的计划提报时间', width: 150 },
      { prop: 'wzjhjzyj', label: '物资计划截止预警', width: 150 },
      { prop: 'fwjhjzyj', label: '服务计划截止预警', width: 150 },
      { prop: 'firstPlanApproveDate', label: '首笔计划审批通过时间', source: 'ERP系统项目首笔计划审批通过时间', width: 150 },
      { prop: 'materialApproveQty', label: '物资计划审批通过数量', source: 'ERP系统项目下审批完成的物资采购申请行数', width: 150 },
      { prop: 'serviceApproveQty', label: '服务计划审批通过数量', source: 'ERP系统项目下审批完成的服务采购申请行数', width: 150 },
      {
        prop: 'materialBidAmt',
        label: '物资招标金额',
        source: 'ERP系统项目下审批完成的物资采购申请中招标金额求和',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.materialBidAmt)
      },
      {
        prop: 'serviceBidAmt',
        label: '服务招标金额',
        source: 'ERP系统项目下审批完成的服务采购申请中招标金额求和',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.serviceBidAmt)
      },
      { prop: 'lastBidSubmitDate', label: '最近报招时间', source: 'ERP系统项目下审批完成的服务采购申请中招标金额求和', width: 150 },
      { prop: 'jhtbsfcq', label: '计划提报是否超期', source: 'ERP系统项目最近的计划审批通过时间', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '中标结果',
    _children: [
      {
        prop: 'firstWinBidDate',
        label: '首笔中标时间',
        source: 'ERP系统项目下首笔物资或服务中标时间，由电子商务平台通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'firstMatWinBidDate',
        label: '首笔物资中标时间',
        source: 'ERP系统项目下首笔物资中标时间，由电子商务平台通过接口传入ERP系统',
        width: 150
      },
      { prop: 'materialWinQty', label: '物资中标数量', source: 'ERP系统项目下已中标物资采购申请数量，由电子商务平台通过接口传入ERP系统', width: 150 },
      {
        prop: 'materialWinAmt',
        label: '物资中标金额',
        source: 'ERP系统项目下已中标物资采购申请金额求和，由电子商务平台通过接口传入ERP系统',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.materialWinAmt)
      },
      {
        prop: 'firstSvcWinBidDate',
        label: '首笔服务中标时间',
        source: 'ERP系统项目下首笔服务中标时间，由电子商务平台通过接口传入ERP系统',
        width: 150
      },
      { prop: 'serviceWinQty', label: '服务中标数量', source: 'ERP系统项目下已中标服务采购申请数量，由电子商务平台通过接口传入ERP系统', width: 150 },
      {
        prop: 'serviceWinAmt',
        label: '服务中标金额',
        source: 'ERP系统项目下已中标服务采购申请金额求和，由电子商务平台通过接口传入ERP系统',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.serviceWinAmt)
      },
      {
        prop: 'lastWinBidDate',
        label: '最近中标时间',
        source: 'ERP系统项目下最近的物资或服务中标时间，由电子商务平台通过接口传入ERP系统',
        width: 150
      }
    ]
  },
  {
    prop: 'yj',
    label: '合同签订',
    _children: [
      {
        prop: 'firstContractDate',
        label: '首笔合同签订时间',
        source: 'ERP系统项目下首笔物资或服务合同签订时间，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'firstMatContractDate',
        label: '首笔物资合同签订时间',
        source: 'ERP系统项目下首笔物资合同签订时间，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'materialContractQty',
        label: '物资合同数量',
        source: 'ERP系统项目下物资合同数量，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'materialContractAmt',
        label: '物资合同金额',
        source: 'ERP系统项目下物资合同金额求和，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.materialContractAmt)
      },
      {
        prop: 'firstSvcContractDate',
        label: '首笔服务合同签订时间',
        source: 'ERP系统项目下首笔服务合同签订时间，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'serviceContractQty',
        label: '服务合同数量',
        source: 'ERP系统项目下服务合同数量，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      {
        prop: 'serviceContractAmt',
        label: '服务合同金额',
        source: 'ERP系统项目下服务合同金额求和，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.serviceContractAmt)
      },
      {
        prop: 'lastContractDate',
        label: '最近合同签订日期',
        source: 'ERP系统项目下最近的物资或服务合同签订时间，由经济法律管理业务系统通过接口传入ERP系统',
        width: 150
      },
      { prop: 'htqdsfcq', label: '合同签订是否超期', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '实施中（现场施工）',
    _children: [
      {
        prop: 'planStartDate',
        label: '项目计划开工时间',
        source: 'ERP系统项目计划开工时间，由国网项目中台、江苏计划统计系统、项目过程管控平台传如ERP系统。',
        width: 150
      },
      {
        prop: 'planEndDate',
        label: '项目计划完工时间',
        source: 'ERP系统项目计划完工时间，由国网项目中台、江苏计划统计系统、项目过程管控平台传如ERP系统。',
        width: 150
      },
      { prop: 'actualStartDate', label: '项目开工时间', source: 'ERP系统项目实际开工时间时间，由PMS3.0传入ERP系统或者用户手动维护。', width: 150 },
      { prop: 'actualEndDate', label: '项目竣工时间', source: 'ERP系统项目实际竣工时间，由PMS3.0传入ERP系统或者用户手动维护。', width: 150 },
      {
        prop: 'materialNeedAmt',
        label: '物资需求金额',
        source: 'ERP系统项目物资计划或者工单物资领用需求金额求和。',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.materialNeedAmt)
      },
      { prop: 'firstMaterialUseDate', label: '首笔物资领用时间', source: 'ERP系统项目首笔物资领用时间', width: 150 },
      { prop: 'fwsfjs', label: '服务是否结算', width: 150 },
      {
        prop: 'materialUseAmt',
        label: '物资领用金额',
        source: 'ERP系统项目首笔物资金额求和',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.materialUseAmt)
      },
      {
        prop: 'materialUseRate',
        label: '物资领用完成率（金额）(%)',
        width: 120,
        render: ({ row }: any) => {
          if (typeof row.materialUseRate === 'undefined' || row.materialUseRate === null || row.materialUseRate === '') return '-'
          return formatNumValue(Number(row.materialUseRate * 100).toString(), 2)
        }
      },
      { prop: 'lastMaterialUseDate', label: '最近物资领用时间', source: 'ERP系统项目最近物资领用时间', width: 150 }
    ]
  },
  {
    prop: 'xmsj',
    label: '项目审计',
    _children: [
      { prop: 'scssrq', label: '首次送审时间', source: '项目审计管理系统项目首次送审时间', width: 150 },
      {
        prop: 'ljssje',
        label: '累计送审金额',
        source: '项目审计管理系统项目送审金额求和',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.ljssje)
      },
      { prop: 'scsdrq', label: '首次审定时间', source: '项目审计管理系统项目首次审定时间', width: 150 },
      {
        prop: 'ljsdje',
        label: '累计审定金额',
        source: '项目审计管理系统项目审定金额求和',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.ljsdje)
      },
      { prop: 'sssfcq', label: '送审是否超期', width: 150 },
      { prop: 'sdsfcq', label: '审定是否超期', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '结算',
    _children: [
      {
        prop: 'settlementProgress',
        label: '结算进度(%)',
        source: '累计结算金额/项目总预算',
        width: 120,
        render: ({ row }: any) => {
          if (typeof row.settlementProgress === 'undefined' || row.settlementProgress === null || row.settlementProgress === '') return '-'
          return formatNumValue(Number(row.settlementProgress * 100).toString(), 2)
        }
      },
      { prop: 'firstSettlementDate', label: '首次结算日期', source: 'ERP系统项目首笔项目成本入账日期', width: 150 },
      { prop: 'lastSettlementDate', label: '最后结算日期', source: 'ERP系统项目最近的项目成本入账日期', width: 150 },
      {
        prop: 'settlementAmt',
        label: '年度结算金额',
        source: 'ERP系统项目年度已入账金额',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.settlementAmt)
      },
      {
        prop: 'ljjsje',
        label: '累计结算金额',
        source: 'ERP系统项目累计已入账金额',
        width: 150,
        align: 'right',
        headerAlign: 'center',
        render: ({ row }: any) => renderAmount(row.ljjsje)
      }
    ]
  },
  {
    prop: 'yj',
    label: '关闭',
    _children: [
      { prop: 'closeStatus', label: '项目关闭状态', source: 'ERP系统项目状态', width: 100 },
      { prop: 'closeDate', label: '关闭时间', source: 'ERP系统项目关闭时间', width: 150 },
      { prop: 'xmgbsfcq', label: '项目关闭是否超期', width: 150 }
    ]
  },
  { prop: 'sjscsj', label: '数据生成时间', width: 150 }
])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
