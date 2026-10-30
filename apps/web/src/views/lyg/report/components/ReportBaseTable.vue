<!-- 计划信息查询报表公共组件（物资/服务计划信息查询） -->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      height="100%"
      :pagination="true"
      @search="resetTable"
      @reset="resetHandle"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      ref="proTableRef"
      stripe
      :loading="loading"
    >
      <template #tableHeader>
        <el-button @click="handleExport" v-permission="'EXPORT'" size="small" plain type="primary">导 出</el-button>
      </template>
    </ProTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="tsx">
defineOptions({ name: "ReportBaseTable" })
import { onMounted, ref, reactive, computed, h } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import ProTable from '@/components/ProTablePage/index.vue'
import { apiExportHandle } from '@/utils/export'
import { useStore } from '@/store/business'
import { getPublicData, getDeptData } from '@/api/common'
import { getSubProtypeTreeByXmlx } from '@/api/lyg/index'
import { getSgbm } from '@/api/service/requirement'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import TreeSelect from '@/components/select/TreeSelectLazy.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { ElMessage } from 'element-plus'

// ========== Props ==========
const props = withDefaults(
  defineProps<{
    pageApi: (params: any) => Promise<any>
    exportApi: (params: any) => Promise<any>
    exportFileName: string
    columns: any[]
  }>(),
  {
    columns: () => []
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
const cbzxList = ref<any[]>([])
const projectTypeList = ref<any[]>([])
const cbzxRef = ref()

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

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
}

// 重置
const resetHandle = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  cbzxList.value.length = 0
  cbzxRef.value?.clearSelect()
  proTableRef.value?.clearSelection()
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
  // 项目编码多选，按逗号拆分为数组
  xmxxParams.value.pspidList = restParam.pspid ? restParam.pspid.split(',') : []
  // 实施部门（成本中心）入参，确保为数组
  xmxxParams.value.cbzxList = Array.isArray(applyCenter) ? applyCenter : applyCenter ? [applyCenter] : []
  return props.pageApi({ ...xmxxParams.value })
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      initParamLists('CB')
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

const initParamLists = async (xmlx?: any) => {
  yjdwList.value.length = 0
  const res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
  await getProjectType(xmlx)
}

const getProjectType = async (val?: any) => {
  projectTypeList.value.length = 0
  const res: any = await getSubProtypeTreeByXmlx({ xmlx: val })
  if (!res.success) return ElMessage.error(res.msg)
  projectTypeList.value = res.data
}

// 一级单位变更：清空二级单位、归口部门、实施部门，并按一级单位重新加载
const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  if (params) {
    params.qkjejdw = ''
    params.qkjgkbm = ''
    params.applyCenter = ''
  }
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
  const gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

// 项目大类变更：清空项目类型并重新加载项目类型树
const selectXmlx = async (val?: any) => {
  const params = proTableRef.value?.searchParam
  if (params) params.qkjxmlxbmList = []
  await getProjectType(val)
}

// 二级单位变更：清空实施部门，并按二级单位重新加载成本中心
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

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})

// 查询条件列（不进表格，仅作为搜索项）
const queryColumns = reactive<any[]>([
  {
    prop: 'qkjyjdw',
    label: '一级单位',
    isShow: false,
    search: { el: 'select', props: { onChange: selectChange }, order: 1 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'qkjejdwList',
    label: '二级单位',
    isShow: false,
    search: { el: 'select', order: 2, props: { multiple: true, collapseTags: true, onChange: ejdwChange } },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'applyCenter',
    label: '实施部门',
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
    isShow: false,
    search: { el: 'select', order: 4, props: { multiple: true, collapseTags: true } },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'xmlx',
    label: '项目大类',
    isShow: false,
    search: { el: 'select', order: 5, defaultValue: 'CB', props: { onChange: selectXmlx } },
    enum: () => getPublicData('LYG_ZBXM_ZCBLX_COM'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'qkjxmlxbmList',
    label: '项目类型',
    isShow: false,
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
    }
  },
  {
    prop: 'zyear',
    label: '年度',
    isShow: false,
    search: { el: 'select', order: 7, defaultValue: new Date().getFullYear().toString() },
    enum: () => getPublicData('NDCX'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'pspid',
    label: '项目编码',
    isShow: false,
    search: {
      order: 8,
      render: (scope: any) => {
        return h(ReMultipleText, {
          modelValue: scope.modelValue
        })
      }
    }
  },
  { prop: 'post1', label: '项目名称', isShow: false, search: { el: 'input', order: 9 } },
  { prop: 'htbh', label: '合同编号', isShow: false, search: { el: 'input', order: 10 } },
  { prop: 'lifnrName', label: '供应商名称', isShow: false, search: { el: 'input', order: 11 } },
  { prop: 'zzbpc', label: '计划批次号', isShow: false, search: { el: 'input', order: 12 } },
  { prop: 'zzbpcmc', label: '计划批次名称', isShow: false, search: { el: 'input', order: 13 } }
])

// 查询条件列 + 各页面专属表头列
const tableColumns = computed(() => [...queryColumns, ...props.columns])
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}
</style>
