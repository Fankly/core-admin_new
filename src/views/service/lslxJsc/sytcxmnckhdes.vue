<!-- 市域统筹项目拟出库核定（二上） -->
<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <viewTable
      ref="tableRef"
      :table-type="'NOND'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="pageXmInfoForEs"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <CentralizedModification
    ref="editPageRef"
    :userInfo="userInfo"
    :formData="selectDataInfo"
    :flag="'VIEW'"
  />
</template>
<script lang="tsx">
export default {
  name: '/service/lslxJsc/sytcxmnckhdes'
}
</script>
<script setup lang="tsx">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  getYjdw,
  getEjdw,
  getPublicData,
  getSubProtypeTree,
  getBizOrgTreeNoPermission
} from '@/api/common' //公共代码
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'
import TreeSelect from '@/components/select/TreeSelectLazy.vue'
import {
  pageXmInfoForEs,
  exportXmInfoForEs,
  mbzlslxNckPass,
  mbzlslxNckReject
} from '@/api/lslxJsc/index'
import { formatNumValue } from '@/utils/utils'
import { apiExportHandle } from '@/utils/export'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'

interface pageInfoVO {
  loading: boolean
  isShowPage: boolean
}

const store = useStore()
const route = useRoute()
const pageInfo = reactive<pageInfoVO>({
  loading: false,
  isShowPage: false
})
// 查询选择框数据
const selectData: any = reactive({
  projectType: [],
  DwList: []
})
const selectDataInfo = ref<any>() //弹窗参数
const userDialogRef = ref()
const editPageRef = ref()
const tableRef = ref()
const title = ref<any>('')
const nd = ref<any>(0)
const jhssndList = ref<any[]>([]) //计划实施年度
const yjdwList = ref<any>([]) // 一级单位
const ejdwList = ref<any>([]) // 二级单位
const nckStatus = ref<any[]>([])
const userInfo = ref<any>()
const proTypeRef = ref()
const btnList = ref<any[]>([
  {
    label: 'PROVIEW',
    value: '项目查看',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'PROPASS',
    value: '通 过',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'PROREJECT',
    value: '驳 回',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'PROEXPORT',
    value: '导 出',
    isSelected: false,
    type: 'normal'
  }
])
// 树形结构props类型
const treeProps = reactive({
  projectTypeProps: {
    children: 'children',
    label: 'name'
  }
})

onMounted(async () => {
  var isRoel = await useUser('getLSGlobalInfo')
  pageInfo.loading = true
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getLSGlobalInfo
    initParams()
  } else {
    await userDialogRef.value.getUser()
  }
})

// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
    if (val.type && val.type == 'reset') {
      proTypeRef.value.clearSelect()
      ejdwList.value.length = 0
    }
  } else {
    // ElMessage.error('当前角色没有访问权限！')
    // pageInfo.isShowPage = false
  }
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    title.value = val.value
    nd.value = val.nd
    if (val.label == 'PROVIEW' && val.selectedList.length != 1) {
      return ElMessage.warning('请选择一条数据')
    }
    const isSubmit = val.selectedList.some(
      (itme: any) => itme.lslxNckStatus == '1' || itme.lslxNckStatus == '4'
    )
    if (isSubmit && ['PROPASS', 'PROREJECT'].includes(val.label)) {
      return ElMessage.warning(`存在状态不满足审核要求的数据，请联系专业部门提交。`)
    }
    const isReview = val.selectedList.some((itme: any) => itme.lslxNckStatus == '3')
    if (isReview && ['PROPASS', 'PROREJECT'].includes(val.label)) {
      return ElMessage.warning(`存在需求已审核的数据，无需重复审核。`)
    }
    if (val.label == 'PROEXPORT') {
      try {
        pageInfo.loading = true
        const params = {
          ...tableRef.value.proTableRef.searchParam,
          ...tableRef.value.formData
        }
        const fileName = '市域统筹项目拟出库数据表'
        apiExportHandle(params, fileName, exportXmInfoForEs)
        pageInfo.loading = false
      } catch (e) {
        pageInfo.loading = false
        const error = e as Error
        ElMessage.error(error.message)
      }
    } else if (val.label == 'PROVIEW') {
      selectDataInfo.value = {
        ...val.selectedList[0],
        id: val.selectedList[0].xmId,
        xmlx: val.selectedList[0].proType,
        protypeId: val.selectedList[0].proType
      }
      editPageRef.value.isShowModal = true
    } else {
      const text = val.label == 'PROPASS' ? '通过' : '驳回'
      ElMessageBox.confirm(`是否确定${text}?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          pageInfo.loading = true
          const xmIdList = val.selectedList.map((item: any) => item.xmId)
          const api: any = val.label == 'PROPASS' ? mbzlslxNckPass : mbzlslxNckReject
          let res = await api(xmIdList)
          if (res.success) {
            ElMessage.success(`${text}成功！`)
            closeAll()
          } else {
            pageInfo.loading = false
            ElMessage.error(res.msg)
          }
        })
        .catch((error: any) => {
          console.log(error)
        })
    }
  } catch (error) {
    console.log(error)
  }
}

const initParams = async () => {
  try {
    const yjdwRes = await getYjdw({
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId
    })
    if (yjdwRes.success) {
      yjdwList.value.push(...yjdwRes.data)
    }
    const root: any = await getPublicData('NDCX')
    if (root.success && root.data.length !== 0) {
      jhssndList.value.push(...root.data)
      tableRef.value.formData = {
        dwId: userInfo.value.dwId,
        bmId: userInfo.value.deptId,
        isCwbm: userInfo.value.specialorgcode.includes('BM_CW')
      }
    }
    const nckRes = await getPublicData('LSLX_NCK_STATUS')
    if (nckRes.success) {
      nckStatus.value.push(...nckRes.data)
    }
    await closeAll()
  } catch (error: any) {
    console.log(error)
  }
}
// 关闭
const closeAll = () => {
  tableRef.value.proTableRef.getTableList()
  tableRef.value.proTableRef.clearSelection()
  pageInfo.loading = false
}

// 权限获取
const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value?.userMsg
  if (isQuery) {
    store.commit('setLSGlobalInfo', {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    })
    userInfo.value = store.getters.getLSGlobalInfo
    initParams()
    getProjectData()
    getDwData()
  }
}
const selectChange = async (val: any) => {
  if (tableRef.value) {
    const params = tableRef.value.getParams()
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

// 清空项目类型
const resetProTypeData = () => {
  const $table = tableRef.value
  if (Array.isArray($table.proTableRef.searchParam.protypeIdList)) {
    $table.proTableRef.searchParam.protypeIdList.length = 0
  } else {
    $table.proTableRef.searchParam.protypeIdList = ''
  }
}

// 获取选择的项目类型合集
const selectedData = (value: any, flag: string) => {
  tableRef.value.proTableRef.searchParam[flag] = value
}

// 获取项目类型
const getProjectData = () => {
  pageInfo.loading = true
  getSubProtypeTree().then((res: any) => {
    pageInfo.loading = false
    if (res.success) {
      selectData.projectType = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}
const getDwData = () => {
  pageInfo.loading = true
  getBizOrgTreeNoPermission('-1').then((res: any) => {
    pageInfo.loading = false
    if (res.success) {
      selectData.DwList = res.data
    } else {
      ElMessage.error(res.msg)
    }
  })
}

const tableColumns = reactive([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'lslxNckStatusName', label: '状态', width: '80' },
  {
    prop: 'xmbm',
    label: '项目编码',
    width: '180',
    search: {
      order: 1,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'xmmc',
    label: '项目名称',
    width: '180',
    search: { el: 'input', order: 2 }
  },
  {
    prop: 'jhssnd',
    label: '计划实施年份',
    search: { el: 'select', order: 5, defaultValue: new Date().getFullYear().toString() },
    enum: jhssndList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'protypeIdList',
    label: '项目类型',
    search: {
      order: 6,
      render: () => {
        return (
          <TreeSelect
            onClearData={resetProTypeData}
            is-child-node={false}
            data={selectData.projectType}
            onSelectChange={(value: any) => selectedData(value, 'protypeIdList')}
            is-leaf={false}
            ref={proTypeRef}
            data-type="middleId"
            default-props={treeProps.projectTypeProps}
            node-key="middleId"
          />
        )
      }
    },
    isShow: false
  },
  {
    prop: 'lslxNckStatusList',
    label: '拟出库状态',
    search: {
      el: 'select',
      order: 8,
      defaultValue: ['2'],
      props: { multiple: true, collapseTags: true }
    },
    enum: nckStatus.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  { prop: 'sfgmb', label: '是否规模包', width: '100' },
  { prop: 'gmbbm', label: '规模包编码', width: '120' },
  { prop: 'gmbmc', label: '规模包名称', width: '180' },
  { prop: 'isPack', label: '是否捆项目', width: '100' },
  { prop: 'kypswh', label: '可研评审文号', width: '180' },
  { prop: 'kypfwh', label: '可研批复文号', width: '180' },
  {
    prop: 'amount',
    label: '申报金额（万元）',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.amount
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  { prop: 'proTypeName', label: '项目类型', width: '180' },
  { prop: 'zdtx', label: '重点投向', width: '180' },
  { prop: 'yssxmc', label: '预算事项', width: '180' },
  { prop: 'sjfl', label: '三级分类', width: '180' },
  { prop: 'zgkbm', label: '省归口部门', width: '180' },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: '180',
    search: { el: 'select', props: { onChange: selectChange }, order: 3 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: '180',
    search: { el: 'select', order: 4 },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
  },
  { prop: 'applyCenter', label: '成本中心', width: '180' },
  { prop: 'createTime', label: '创建时间', width: '150' },
  { prop: 'createor', label: '创建人', width: '80' },
  { prop: 'prosource', label: '来源系统', width: '180' }
])
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
}
</style>
