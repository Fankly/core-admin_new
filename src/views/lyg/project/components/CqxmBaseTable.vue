<!-- 超期项目明细公共组件 -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="rangeId"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader="scope">
        <el-button @click="handleEarly(scope.selectedList, '1', '取消预警')" plain v-permission="'CANCEL'" size="mini" type="primary"
          >取消预警</el-button
        >
        <el-button @click="handleEarly(scope.selectedList, '0', '恢复预警')" plain v-permission="'CONFIRM'" size="mini" type="primary"
          >恢复预警</el-button
        >
        <el-button @click="handleSend(scope.selectedList)" v-permission="'SEND'" plain size="mini" type="primary">发送确认</el-button>
        <el-button @click="handleExport" v-permission="'EXPORT'" size="mini" plain type="primary">导 出</el-button>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx" name="CqxmBaseTable">
import { onMounted, ref, reactive, nextTick, h } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { apiExportHandle } from '@/utils/export'
import { useStore } from 'vuex'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { VXETable } from 'vxe-table'
import { ElMessage } from 'element-plus'
import { submit, changeSfqxyj } from '@/api/lyg/index'

// ========== Props ==========
const props = withDefaults(
  defineProps<{
    pageApi: (params: any) => Promise<any>
    exportApi: (params: any) => Promise<any>
    sendEarly: (params: any) => Promise<any>
    submitApi: string
    extraColumn?: Record<string, any>
    nextColumn?: Record<string, any>
    exportFileName?: string
  }>(),
  {
    extraColumn: () => ({}),
    nextColumn: () => ({}),
    exportFileName: '项目全过程信息表'
  }
)

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const store = useStore()
const xmxxParams = ref()

const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}

//重置
const resetHandle = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  proTableRef.value?.clearSelection()
}

const updateTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
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
  xmxxParams.value = {
    ...param,
    userId: store.getters.getUserMsg.id,
    bmId: userInfo.value.specialorgid,
    dwId: userInfo.value.org_id,
    roleId: userInfo.value.role_id,
    roleCode: userInfo.value.code
  }
  xmxxParams.value.pspidList = param.pspid ? param.pspid.split(',') : []
  return props.pageApi({ ...xmxxParams.value })
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
  apiExportHandle({ ...xmxxParams.value }, props.exportFileName, props.exportApi)
}

//取消预警OR恢复预警
const handleEarly = async (selectedList: any, isTry: string, text: string) => {
  if (selectedList.length === 0) return ElMessage.warning('请选择数据！')
  const type = await VXETable.modal.confirm(`是否${text}，请确定！`, '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return ElMessage.info('已取消')
  const ids = selectedList.map(({ id }: any) => id)
  const params = {
    yjBizCode: props.submitApi,
    xmIdList: ids,
    sfqxyj: isTry
  }
  const res: any = await changeSfqxyj({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success(`${text}成功`)
  updateTable()
}

// 发送确认
const handleSend = async (selectedList: any) => {
  if (selectedList.length === 0) return ElMessage.warning('请选择数据！')
  const type = await VXETable.modal.confirm(`是否发送确认，请确定！`, '提示', {
    status: 'warning'
  })
  if (type !== 'confirm') return ElMessage.info('已取消')
  const ids = selectedList.map(({ id }: any) => id)
  const params = {
    yjBizCode: props.submitApi,
    xmIdList: ids
  }
  const res: any = await submit({ ...params })
  if (!res.success) return ElMessage.error(res.msg)
  if (res.data) {
    let msg = res.data.replace(/\n/g, '<br/>')
    ElMessage({
      type: 'success',
      dangerouslyUseHTMLString: true,
      message: msg
    })
    updateTable()
  } else {
    ElMessage.warning('项目流转中、没有责任人或不需要流程审核，请核查！')
  }
}

const initParamLists = async () => {
  yjdwList.value.length = 0
  projectTypeList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }

  let xmlx = await getSubProtypeTree()
  if (xmlx.success && xmlx.data.length !== 0) {
    projectTypeList.value.push(...xmlx.data)
  }
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.qkjejdw = ''
  params.qkjgkbm = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
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

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'zyear',
    label: '年度',
    width: 80,
    search: { el: 'select', order: 5 },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'pspid',
    label: '项目编码',
    width: 150,
    search: {
      order: 7,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    }
  },
  { prop: 'post1', label: '项目名称', width: 180, search: { el: 'input', order: 8 } },
  {
    prop: 'qkjxmlxbmList',
    label: '项目类型',
    width: 150,
    search: {
      order: 3,
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
    width: 150,
    search: { el: 'select', props: { onChange: selectChange }, order: 1 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjyjdw
    }
  },
  {
    prop: 'qkjejdwList',
    label: '二级单位',
    width: 150,
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true } },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjejdw
    }
  },
  {
    prop: 'qkjgkbmList',
    label: '项目归口部门',
    width: 150,
    search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true } },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.qkjgkbm
    }
  },
  { prop: 'projectManagerName', label: '责任人', width: 150, search: { el: 'input', order: 6 } },
  { prop: 'projectProgress', label: '项目阶段', width: 150 },
  { prop: 'yjlx', label: '预警类型', width: 150 },
  ...(props.extraColumn && Object.keys(props.extraColumn).length ? [props.extraColumn] : []),
  ...(props.nextColumn && Object.keys(props.nextColumn).length ? [props.nextColumn] : []),
  { prop: 'cqts', label: '超期天数', width: 120 },
  {
    prop: 'sfqxyj',
    label: '是否取消预警',
    width: 120,
    search: { el: 'select', order: 7 },
    enum: () => getPublicData('GY_SF'),
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.sfqxyj
    }
  },
  { prop: 'yjfqsj', label: '预警发起时间', width: 150 },
  { prop: 'yjlcwcsj', label: '预警流程完成时间', width: 150 },
  { prop: 'reason', label: '原因说明', width: 200, align: 'left', headerAlign: 'center' }
])

// // 提交工作流
// const submitCbxqshWorkflowHandle = async (ids: string[]) => {
//   const wfUserInfo: WFUserInfo = {
//     userId: store.getters.getUserMsg.id,
//     spOrgId: '',
//     spRoleId: ''
//   }
//   const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
//   if (!flagData.success) return ElMessage.error(flagData.msg)
//   wfParam.value.DW_ID = userInfo.value.org_id || ''
//   wfParam.value.XMIDS = ids.join(',')
//   wfParam.value.FQZZ = flagData.data
//   wfParam.value.FQBM = userInfo.value.specialorgid || ''
//   submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_FXYSBZSHLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
// }

// const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
//   const spfrom = {
//     userId: store.getters.getUserMsg.id,
//     spOrgId: userInfo.value.specialorgid || '',
//     spRoleId: userInfo.value.spRoleId || '',
//     wfCode: 'WF_FXYSBZSHLC',
//     wfData: wfParam.value,
//     nextPersonAndPath: nextPersonAndPath
//   }
//   const res = await props.submitApi({
//     ...spfrom
//   })
//   if (!res.success) return ElMessage.error(res.msg)
//   ElMessage.success('提交成功')
//   updateTable()
// }
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
