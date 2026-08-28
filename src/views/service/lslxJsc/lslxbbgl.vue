<!-- 两上两下版本管理 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <viewTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="pageForProvince"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <viewModal ref="modalRef" @show-modal="showModal" :title="title" :nd="nd" />
  <viewEntity
    ref="entityRef"
    :title="ModelTitle"
    :specialorgid="specialorgid"
    :table-api="getApi.tableApi"
    :tree-api="getApi.treeApi"
    :save-api="getApi.saveApi"
    :remove-api="getApi.removeApi"
    :order-api="getApi.orderApi"
  />
  <lxTree ref="lxTreeRef" @choose-data="saveTree" :tree-api="treeParams.treeApi" />
  <lxTreeBb ref="lxTreeRefBb" @choose-data="saveTreeBb" :tree-api="treeParams.treeApi" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/lslxbbgl'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import viewEntity from '@/views/service/lslxJsc/components/entity.vue' //单位管理组件
import lxTree from '@/views/service/lslxJsc/components/lxTree.vue' //项目类型组件
import lxTreeBb from '@/views/service/lslxJsc/components/lxTreeBb.vue' //项目类型组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPublicData } from '@/api/common' //公共代码
import {
  remove,
  add,
  edit,
  issue,
  getProtypeTree,
  getProtypeSave,
  excludegetProtypeTree,
  excludeSave,
  pageForProvince,
  pageDwYs,
  getDwTreeYs,
  saveDwYs,
  removeDwYs,
  updateDispOrderYs,
  getProtypeTreeVer,
  getProtypeSaveVer,
  excludegetProtypeTreeVer,
  excludeSaveVer
} from '@/api/lslxJsc/index'
import { issueZgkbm, pageZgkbm, saveZgkbm, removeZgkbm } from '@/api/lslxJsc/szyBmApi'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'
import { pageInfoVO, apiVo } from '@/views/service/lslxJsc/interface/index'
const treeParams = reactive<apiVo>({
  treeApi: getProtypeTree
})
const store = useStore()
const route = useRoute()
const userDialogRef = ref()
const pageInfo = reactive<pageInfoVO>({
  loading: false,
  isShowPage: false
})
const ModelTitle = ref('')
const getApi = reactive<{
  tableApi: (params: any) => Promise<any>
  treeApi: (params: any) => Promise<any>
  saveApi: (params: any) => Promise<any>
  removeApi: (params: any) => Promise<any>
  orderApi: (params: any) => Promise<any>
}>({
  tableApi: `''`,
  treeApi: `''`,
  saveApi: `''`,
  removeApi: `''`,
  orderApi: `''`
})
const tableRef = ref()
const modalRef = ref()
const entityRef = ref()
const lxTreeRef = ref()
const lxTreeRefBb = ref()
const title = ref<any>('')
const nd = ref<any>(0)
const specialorgid = ref<any>() //单位id
const lslxStatus = ref<any[]>([])
const userInfo = ref<any>()
const btnList = ref<any[]>([
  {
    label: 'VERSION',
    value: '版本管理',
    isSelected: false,
    type: 'children',
    children: [
      {
        label: 'ADD',
        value: '版本创建',
        isSelected: false,
        type: 'normal'
      },
      {
        label: 'EDIT',
        value: '版本修改',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'DELETE',
        value: '版本删除',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'ALLOTSDW',
        value: '版本下达至各单位',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'ALLOTSBM',
        value: '版本下达至省专业部门',
        isSelected: true,
        type: 'normal'
      }
    ]
  },
  {
    label: 'ALLOCATION',
    value: '配置管理',
    isSelected: false,
    type: 'children',
    children: [
      {
        label: 'EXCLUDELX',
        value: '全局类型排除配置',
        isSelected: false,
        type: 'normal'
      },
      {
        label: 'LXCONTROL',
        value: '全局一上类型配置',
        isSelected: false,
        type: 'normal'
      },
      {
        label: 'BBEXCLUDELX',
        value: '版本类型排除配置',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'BBLXCONTROL',
        value: '版本一上类型配置',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'DWCONTROL',
        value: '版本下发单位配置',
        isSelected: true,
        type: 'normal'
      },
      {
        label: 'BMCONTROL',
        value: '版本下发省专业部门配置',
        isSelected: true,
        type: 'normal'
      }
    ]
  }
])

onMounted(async () => {
  var isRoel = await useUser('getLSGlobalInfo')
  pageInfo.loading = true
  if (isRoel && route.params.formJsc) {
    const lSGlobalInfo = store.getters.getLSGlobalInfo
    userInfo.value = lSGlobalInfo.deptId
    isPass(userInfo.value.org_id)
  } else {
    await userDialogRef.value.getUser()
  }
})

//新增编辑回调
const showModal = async (val: any) => {
  pageInfo.loading = true
  const api: any = val.title == '版本创建' ? add : edit
  let res: any = await api({ ...val.rmarkData })
  if (res.success) {
    ElMessage.success(`${val.title}成功`)
    closeAll()
  } else {
    pageInfo.loading = false
    ElMessage.error(res.msg)
  }
}
// 版本类型保存
const saveTreeBb  = async (val: any) => {
  let api: any  = title.value == '版本一上类型配置' ? getProtypeSaveVer : excludeSaveVer
  let res: any = await api(val)
  if (res.success) {
    ElMessage.success('保存成功！')
    nextTick(() => {
      lxTreeRefBb.value.closeModalHandle()
    })
  } else {
    ElMessage.error(res.msg)
  }
}
// 全局类型保存
const saveTree = async (val: any) => {
  let api: any  = title.value == '全局一上类型配置' ? getProtypeSave : excludeSave
  let res: any = await api(val)
  if (res.success) {
    ElMessage.success('保存成功！')
    nextTick(() => {
      lxTreeRef.value.closeModalHandle()
    })
  } else {
    ElMessage.error(res.msg)
  }
}
// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error('仅限省公司访问')
    pageInfo.isShowPage = false
  }
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    title.value = val.value
    lxTreeRef.value.nd = nd.value = val.nd
    if (!['ADD', 'LXCONTROL', 'EXCLUDELX'].includes(val.label)) {
      if (val.selectedList.length != 1) {
        return ElMessage.warning('请选择一条数据')
      }
      if (val.selectedList[0].status != '1' && !['ALLOTSBM', 'BMCONTROL'].includes(val.label)) {
        return ElMessage.warning(`非草稿状态,无法${val.value}`)
      }
      if (val.selectedList[0].zgkbmIssueStatus == '1' && ['ALLOTSBM', 'BMCONTROL'].includes(val.label)) {
        return ElMessage.warning(`已下发,无法${val.value}`)
      }
    }
    if (['DELETE', 'ALLOTSDW', 'ALLOTSBM'].includes(val.label)) {
      ElMessageBox.confirm(`是否确定${val.value}？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          pageInfo.loading = true
          const paramsDel: any = val.selectedList[0].versionId
          const paramsIssue: any = {
            spOrgId: userInfo.value.specialorgid,
            spRoleId: userInfo.value.id,
            userId: store.getters.getUserMsg.id,
            versionId: val.selectedList[0].versionId
          }
          const api: any =
            val.label == 'DELETE' ? remove : val.label == 'ALLOTSDW' ? issue : issueZgkbm
          let res = await api(val.label == 'DELETE' ? paramsDel : paramsIssue)
          if (res.success) {
            ElMessage.success(`${val.value}成功`)
            closeAll()
          } else {
            pageInfo.loading = false
            ElMessage.error(res.msg)
          }
        })
        .catch((error: any) => {
          console.log(error)
        })
    } else if (['DWCONTROL', 'BMCONTROL'].includes(val.label)) {
      entityRef.value.versionStatus = val.selectedList[0]
      if (entityRef.value.versionStatus) {
        const apiType = val.label == 'DWCONTROL'
        entityRef.value.btnName = apiType ? '选择下发单位' : '选择下发省专业部门'
        getApi.tableApi = apiType ? pageDwYs : pageZgkbm
        getApi.treeApi = apiType ? getDwTreeYs : getPublicData
        getApi.saveApi = apiType ? saveDwYs : saveZgkbm
        getApi.removeApi = apiType ? removeDwYs : removeZgkbm
        getApi.orderApi = apiType ? updateDispOrderYs : updateDispOrderYs
        ModelTitle.value = val.value
        nextTick(() => {
          entityRef.value.pageMeeting()
          entityRef.value.isShowModel = true
        })
      }
    } else if (['LXCONTROL', 'EXCLUDELX'].includes(val.label)) {
      const api = val.label == 'LXCONTROL' ? getProtypeTree : excludegetProtypeTree
      treeParams.treeApi = api
      let res: any = await api(nd.value)
      if (res.success) {
        lxTreeRef.value.title = title.value
        lxTreeRef.value.treeModal = true
        lxTreeRef.value.treeDataList = res.data.treeData
        lxTreeRef.value.checkedKeys = res.data.checkedIdList ? res.data.checkedIdList : []
      }
    } else if (['BBLXCONTROL', 'BBEXCLUDELX'].includes(val.label)) {
      const api = val.label == 'BBLXCONTROL' ? getProtypeTreeVer : excludegetProtypeTreeVer
      treeParams.treeApi = api
      let res: any = await api(val.selectedList[0].versionId)
      if (res.success) {
        lxTreeRefBb.value.title = title.value
        lxTreeRefBb.value.versionId = val.selectedList[0].versionId
        lxTreeRefBb.value.treeModal = true
        lxTreeRefBb.value.treeDataList = res.data.treeData
        lxTreeRefBb.value.checkedKeys = res.data.checkedIdList ? res.data.checkedIdList : []
      }
    } else {
      modalRef.value.rmarkData =
        val.value == '版本创建'
          ? {}
          : {
              versionId: val.selectedList[0]?.versionId,
              versionName: val.selectedList[0]?.versionName,
              remake: val.selectedList[0]?.remake
            }
      modalRef.value.isShowModel = true
    }
  } catch (error) {
    console.log(error)
  }
}

const isPass = async (val: any) => {
  try {
    if (val) {
      const root: any = await getPublicData('NDCX')
      if (root.success && root.data.length !== 0) {
        tableRef.value.formData = {
          nd: new Date().getFullYear().toString(),
          specialorgid: userInfo.value.org_id
        }
        lxTreeRef.value.ndList = tableRef.value.ndList = root.data
        closeAll()
      }
      const item: any = await getPublicData('MBZLSLX_VERSION_STATUS')
      lslxStatus.value.length = 0
      if (item.success && item.data.length !== 0) {
        lslxStatus.value.push(...item.data)
      }
    }
  } catch (error: any) {
    console.log(error)
  }
}
// 关闭
const closeAll = () => {
  modalRef.value?.closeHandle()
  tableRef.value.proTableRef?.getTableList()
  tableRef.value.proTableRef?.clearSelection()
  pageInfo.loading = false
}

// 权限获取
const getRoleHandle = () => {
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.value.org_id
    isPass(userInfo.value.org_id)
  }
}

const tableColumns = reactive([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'nd', label: '年度', width: '80' },
  { prop: 'versionNo', label: '版本编号', width: '130' },
  {
    prop: 'versionName',
    label: '版本名称',
    width: '300',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'status',
    label: '版本状态',
    search: { el: 'select', order: 2 },
    enum: lslxStatus.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '200'
  },
  {
    prop: 'zgkbmIssueStatus',
    label: '省专业版本下发状态',
    width: '160',
    render:({row}:any)=>{
      const val = row.zgkbmIssueStatus == '1'?'已下发':'未下发'
      return val
    }
  },
  { prop: 'createDate', label: '创建日期', width: '180' },
  { prop: 'creatorName', label: '创建人', width: '80' },
  { prop: 'remake', label: '备注' }
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
