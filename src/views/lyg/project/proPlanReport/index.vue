<!-- 项目计划合同信息报表 -->
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
      <template #tableHeader>
        <el-button @click="handleExport" v-permission="'EXPORT'" size="mini" type="primary">导 出</el-button>
        <!-- <el-button @click="handleSync" v-permission="'SYNC'" size="mini" type="primary">同步数据</el-button> -->
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx" name="/lyg/project/proInfo/index">
import { onMounted, ref, reactive, nextTick, h, toRefs } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { xmqgcInfoPage, xmqgcInfoExport } from '@/api/lyg/index'
import { apiExportHandle } from '@/utils/export'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { usePage } from '@/hooks/useUser'
import { getPublicData, getSubProtypeTree } from '@/api/common'
import { getSgbm } from '@/api/service/requirement'
import { formatNumValue } from '@/utils/utils'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)
const userInfo = ref<any>()
const store = useStore()
const route = useRoute()
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
  isShowPage.value = false
  if (JSON.stringify(route.params) != '{}') {
    const { roleId, specialorgid, spRoleId, status, roleCode, dwId }: any = route.params
    const isRoel = await usePage(roleId, specialorgid, spRoleId)
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
        proTableRef.value.searchParam.projectProgressList = [status]
        proTableRef.value.search()
        initParamLists()
      }
    } else {
      await userDialogRef.value?.getUser()
    }
  } else {
    await userDialogRef.value?.getUser()
  }
})

const tableColumns = reactive<any[]>([
  {
    prop: 'yj',
    label: '招标计划',
    _children: [
      { prop: 'xmckrq', label: '计划类型', width: 150 },
      { prop: 'erdat', label: '招标类型', width: 150 },
      { prop: 'lxsfcq', label: '需求唯一码', width: 150 },
      { prop: 'lxsfcq', label: '采购申请', width: 150 },
      { prop: 'lxsfcq', label: '行项目', width: 150 },
      { prop: 'lxsfcq', label: '申请数量', width: 150 },
      { prop: 'lxsfcq', label: '申请金额', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '中标结果',
    _children: [
      { prop: 'xmckrq', label: '中标日期', width: 150 },
      { prop: 'erdat', label: '中标金额', width: 150 },
      { prop: 'lxsfcq', label: '中标供应商', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '合同签订',
    _children: [
      { prop: 'xmckrq', label: '采购订单', width: 150 },
      { prop: 'erdat', label: '订单行项目', width: 150 },
      { prop: 'lxsfcq', label: '经法合同编号', width: 150 },
      { prop: 'lxsfcq', label: '合同金额', width: 150 },
      { prop: 'lxsfcq', label: '签订日期', width: 150 }
    ]
  },
  {
    prop: 'yj',
    label: '项目信息',
    _children: [
      { prop: 'xmckrq', label: '项目编码', width: 150 },
      { prop: 'erdat', label: '项目名称', width: 150 },
      { prop: 'lxsfcq', label: 'WBS元素', width: 150 },
      { prop: 'lxsfcq', label: 'WBS名称', width: 150 }
    ]
  }
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
