<template>
  <div class="main" v-if="userMsg.isShowPage" v-loading="pageConfig.loading">
    <splitpane :splitSet="pageConfig">
      <template #paneL>
        <div class="panel-left">
          <TemplateTypeTree :data="treeData" @node-click="handleNodeClick" />
        </div>
      </template>
      <template #paneR>
        <div class="panel-right">
          <TemplateFileTable
            :loading="tableLoading"
            :rows="tableData"
            :search-type="searchType"
            :search-type-list="searchTypeList"
            @selection-change="handleSelectionChange"
            @update:search-type="searchType = $event"
            @search-type-change="handleSearchTypeChange"
            @open-upload="handleOpenUpload"
            @open-help="openHelpModal"
          />
        </div>
      </template>
    </splitpane>
  </div>

  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
  <TemplateUploadModal
    v-model="uploadModalVisible"
    :protype-ids="uploadProtypeIds"
    :protype-id="currentUploadProtypeId"
    :single-selection="singleSelection"
  />
</template>

<script setup lang="ts" name="/config/templateFileManager/index">
import { getProtypeTree, getPublicCodeList } from '@/api/common'
import { getChildLeafByParentId } from '@/api/sys/proCategory'
import splitpane from '@/components/ReSplitPane'
import HelpModal from '@/components/HelpModal/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey, UserRole } from '@/components/UserRoleSelector/interface'
import TemplateFileTable from './components/TemplateFileTable.vue'
import TemplateTypeTree from './components/TemplateTypeTree.vue'
import TemplateUploadModal from './components/TemplateUploadModal.vue'
import type { PageConfig, SearchTypeOption, TemplateFileRow, TreeNodeItem } from './types'
import { ElMessage } from 'element-plus'
import { computed, onMounted, provide, reactive, ref } from 'vue'

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const helpModalRef = ref()

const pageConfig = reactive<PageConfig>({
  loading: true,
  minPercent: 20,
  defaultPercent: 20,
  split: 'vertical'
})

const userMsg = reactive({
  isShowPage: false
})

const searchTypeList = ref<SearchTypeOption[]>([])
const treeData = ref<TreeNodeItem[]>([])
const tableData = ref<TemplateFileRow[]>([])
const checkedData = ref<TemplateFileRow[]>([])
const currentNode = ref<TreeNodeItem | null>(null)
const searchType = ref('2')
const xmId = ref('')
const tableLoading = ref(false)
const uploadModalVisible = ref(false)
const uploadProtypeIds = ref('')
const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

const singleSelectedRow = computed<TemplateFileRow | null>(() => {
  return checkedData.value.length === 1 ? checkedData.value[0] : null
})

const singleSelection = computed(() => checkedData.value.length === 1)

const currentUploadProtypeId = computed(() => {
  const rowId = singleSelectedRow.value?.id
  return rowId === undefined || rowId === null ? '' : String(rowId)
})

const initPublicParams = async () => {
  try {
    const res = await getPublicCodeList({ codes: ['XMLB_QUERY_TYPE'] })
    if (!res.success) throw new Error(res.msg)
    searchTypeList.value = res.data?.['XMLB_QUERY_TYPE'] || []
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

const getXmlxData = async () => {
  try {
    pageConfig.loading = true
    const res = await getProtypeTree()
    if (!res.success) throw new Error(res.msg)
    treeData.value = res.data || []
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    pageConfig.loading = false
  }
}

const loadTableData = async (node: TreeNodeItem) => {
  tableLoading.value = true
  try {
    checkedData.value = []
    xmId.value = node.id
    const res = await getChildLeafByParentId(node.id, searchType.value)
    if (!res.success) throw new Error(res.msg)
    tableData.value = res.data || []
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    tableLoading.value = false
  }
}

const handleNodeClick = async (node: TreeNodeItem) => {
  currentNode.value = node
  await loadTableData(node)
}

const handleSearchTypeChange = async () => {
  if (currentNode.value) {
    await loadTableData(currentNode.value)
  }
}

const handleSelectionChange = (rows: TemplateFileRow[]) => {
  checkedData.value = rows
}

const handleOpenUpload = () => {
  if (!xmId.value) {
    ElMessage.warning('请先选择项目类型')
    return
  }

  if (checkedData.value.length === 0) {
    ElMessage.warning('请先选择要上传的记录')
    return
  }

  uploadProtypeIds.value = checkedData.value.map((row) => row.id).join(',')
  uploadModalVisible.value = true
}

const openHelpModal = () => {
  helpModalRef.value.showModal = true
}

const getRoleHandle = async () => {
  pageConfig.loading = false
  const canRender = userRoleSelectorRef.value?.canRender
  if (canRender) {
    userMsg.isShowPage = true
    await getXmlxData()
  }
}

provide('currentUserRole', currentUserRole)
provide(PermissionInjectionKey, {
  get permissions() {
    return userRoleSelectorRef.value?.permissions || []
  },
  get isLoading() {
    return userRoleSelectorRef.value?.loading || false
  }
})

onMounted(() => {
  initPublicParams()
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
.main {
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;

  .panel-left {
    height: 100%;
    padding-right: 6px;
    box-sizing: border-box;
  }

  .panel-right {
    height: 100%;
    padding-left: 6px;
    box-sizing: border-box;
  }
}
</style>
