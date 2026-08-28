<template>
  <vxe-modal
    @close="closeHandle"
    :loading="loading"
    :destroy-on-close="true"
    v-model="modalVisible"
    width="70%"
    height="820"
    resize
    position="center"
    show-zoom
    :title="modalProps.title"
  >
    <ProTable
      @row-click="rowClick"
      row-key="expertId"
      title-msg="已纳入会审专家清单"
      @search="clearSelectRow"
      @reset="clearSelect"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="false"
      :search-col="4"
      :columns="expertColumns"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button v-show="isShowBtn('ADD')" size="mini" type="primary" plain @click="handleAddPendingTrial('添加')">添 加</el-button>
        <el-button
          :disabled="!scope['isSelected']"
          v-show="isShowBtn('DELETE')"
          size="mini"
          type="primary"
          plain
          @click="handleDeleteData(scope['selectedList'])"
          >删 除</el-button
        >
        <el-button v-show="isShowBtn('EXPORT')" size="mini" type="primary" plain @click="handleExport">导 出</el-button>
      </template>
      <template #headerButton>
        <div
          v-if="tabList.length"
          class="tw-mb-0 tw-flex tw-items-center tw-gap-1 tw-bg-gray-100 tw-p-1.5 tw-rounded-t-lg tw-border tw-border-gray-200 tw-border-b-0 tw-w-fit"
        >
          <button
            v-for="item in tabList"
            :key="item.code"
            type="button"
            class="tw-border tw-border-transparent tw-px-6 tw-py-1.5 tw-text-sm tw-font-medium tw-transition-all tw-duration-300 tw-cursor-pointer tw-rounded-md tw-select-none tw-focus:outline-none tw-focus-visible:tw-ring-2 tw-focus-visible:tw-ring-[var(--color-primary)] tw-focus-visible:tw-ring-offset-1"
            :class="
              activeTab === item.code
                ? 'tw-bg-[var(--color-primary)] tw-text-white tw-shadow-[0_4px_16px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] tw-scale-105'
                : 'tw-text-gray-500 hover:tw-text-[var(--color-primary)] hover:tw-bg-[var(--color-primary-light)]'
            "
            @click="handleTabClick(item.code)"
          >
            {{ item.name }}
            <span>（{{ item.expertCount ?? 0 }}人）</span>
          </button>
        </div>
      </template>
    </ProTable>
  </vxe-modal>
  <PendingTrialModal @includeInReview="handleExpertDataChanged" ref="pendingTrialModalRef" />
</template>

<script setup lang="tsx" name="reViewExpertProModal">
import { nextTick, ref, reactive } from 'vue'
import {
  deleteYnrzjWhenPsz,
  deleteYnrzj,
  exportYnrzj,
  getYnrhszjListNum,
  getYnrhszjPage,
  YnrhszjPage
} from '@/api/service/IhhsMeeting/approval/cityLhhsMeeting'
import { ElMessage } from 'element-plus'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { getPublicData } from '@/api/common'
import PendingTrialModal from '@/views/service/approval/cityLhhsMeeting/components/PendingTrialModal/pendingTrialExpertModal.vue'
import { VXETable } from 'vxe-table'
import { downloadExportBlob } from '@/views/service/approval/cityLhhsMeeting/utils/download'
import { buildRoleRequestParams, appendRoleRequestParams } from '@/views/service/approval/cityLhhsMeeting/utils/roleParams'

interface ModalProps {
  search?: () => void
  title: string
  pageFlag: string
  isView: boolean
  row: Partial<any>
  btnPermissions: string[]
  bmId?: string
  roleId?: string
  roleCode?: string
  dwId?: string
}

interface ReviewExpertTabItem {
  code: string
  name: string
  expertCount: number
  [key: string]: any
}

const proTableRef = ref()
const pendingTrialModalRef = ref()
const modalVisible = ref(false)

const pszyListData: any = ref([])
const tabList = ref<ReviewExpertTabItem[]>([])
const activeTab = ref('')
let tabCountRequestId = 0

const TAB_PUBLIC_CODE = 'SJTC_LHHS_PSZY'

const modalProps = ref<ModalProps>({
  isView: false,
  title: '',
  pageFlag: '',
  row: {},
  btnPermissions: [],
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: ''
})

const isShowBtn = (opType: string) => {
  return modalProps.value.btnPermissions.includes(opType)
}
const rowClick = (row: any) => {
  clearSelectRow()
  proTableRef.value?.element.toggleRowSelection(row)
}

const loading = ref(false)

const getModalRoleRequestParams = () => buildRoleRequestParams(modalProps.value)

const resetModalState = () => {
  pszyListData.value.length = 0
  tabList.value.length = 0
  activeTab.value = ''
  tabCountRequestId += 1
}

const closeHandle = () => {
  resetModalState()
}

const searchTableHandle = () => {
  proTableRef.value?.getTableList()
}

const getPublicCode = async () => {
  pszyListData.value.length = 0
  let list = await getPublicData('MAJOR_COM')
  if (list.success) {
    pszyListData.value.push(...list.data)
  } else {
    ElMessage.error(list.msg)
  }
}

const resolveExpertCount = (data: unknown) => {
  if (Array.isArray(data)) return data.length
  const count = Number(data)
  return Number.isFinite(count) ? count : 0
}

const loadTabExpertCounts = async (tabs: ReviewExpertTabItem[] = tabList.value) => {
  const meetingId = modalProps.value.row['meetingId']
  if (!meetingId || tabs.length === 0) return

  const currentRequestId = ++tabCountRequestId
  const responses = await Promise.allSettled(
    tabs.map((item) =>
      getYnrhszjListNum({
        meetingId,
        pszyType: item.code,
        ...getModalRoleRequestParams()
      })
    )
  )

  if (currentRequestId !== tabCountRequestId) return

  let hasError = false
  tabList.value = tabs.map((item, index) => {
    const response = responses[index]
    if (response.status !== 'fulfilled' || !response.value.success) {
      hasError = true
      return {
        ...item,
        expertCount: 0
      }
    }
    return {
      ...item,
      expertCount: resolveExpertCount(response.value.data)
    }
  })

  if (hasError) {
    ElMessage.warning('部分评审专业人数加载失败')
  }
}

const getTabList = async () => {
  tabList.value.length = 0
  const res = await getPublicData(TAB_PUBLIC_CODE)
  if (res.success) {
    const tabs = (res.data || []).map((item: any) => ({
      ...item,
      expertCount: 0
    }))
    tabList.value.push(...tabs)
    activeTab.value = tabList.value[0]?.code ?? ''
    await loadTabExpertCounts(tabs)
  } else {
    ElMessage.error(res.msg)
  }
}

const clearSelect = () => {
  clearSelectRow()
}

const handleExpertDataChanged = () => {
  clearSelect()
  void loadTabExpertCounts()
  modalProps.value.search?.()
}

const clearSelectRow = () => {
  proTableRef.value?.clearSelection()
}

const handleTabChange = () => {
  clearSelectRow()
  proTableRef.value?.search()
}

const handleTabClick = (tabCode: string) => {
  if (activeTab.value === tabCode) return
  activeTab.value = tabCode
  handleTabChange()
}

const expertColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'majorName',
    label: '专家专业',
    width: '120'
  },
  {
    prop: 'major',
    label: '专家专业',
    isShow: false,
    search: {
      el: 'select',
      order: 5
    },
    enum: pszyListData.value,
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'expertName',
    label: '专家姓名',
    width: '80',
    search: {
      order: 3,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'sex',
    label: '专家性别',
    width: '80'
  },
  {
    prop: 'account',
    label: '统一权限账号',
    width: '110',
    search: {
      order: 4,
      render: (scope: any) => {
        return <ReMultipleText modelValue={scope.modelValue} />
      }
    }
  },
  {
    prop: 'phoneNo',
    label: '联系方式',
    width: '110'
  },
  {
    prop: 'mail',
    label: '邮箱',
    width: '180'
  },
  {
    prop: 'yjdwName',
    label: '一级单位',
    width: '180'
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    isShow: false
  },
  {
    prop: 'ejdwName',
    label: '二级单位',
    width: '180'
  },
  {
    prop: 'deptName',
    label: '所属部门',
    width: '180'
  },
  {
    prop: 'remark',
    label: '备注',
    width: '180',
    search: {
      el: 'input',
      order: 6
    }
  }
])

const handleAddPendingTrial = (title: string) => {
  const params = {
    title,
    pageFlag: modalProps.value.pageFlag,
    isView: title === '查看',
    isPsz: modalProps.value.isView,
    pszyType: activeTab.value,
    row: { ...modalProps.value.row },
    getTableList: proTableRef.value?.getTableList,
    ...getModalRoleRequestParams()
  }
  pendingTrialModalRef.value?.acceptParams(params)
}

const handleDeleteData = async (selectedList: any[]) => {
  const type = await VXETable.modal.confirm('确认是否删除？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let ids = selectedList.map((item) => item.expertId)
      const api = modalProps.value.isView ? deleteYnrzj : deleteYnrzjWhenPsz
      const res = await api({
        pszyType: activeTab.value,
        ids: ids,
        meetingId: modalProps.value.row['meetingId'],
        ...getModalRoleRequestParams()
      })
      if (!res.success) throw new Error(res.msg)
      handleExpertDataChanged()
      proTableRef.value?.getTableList()
      ElMessage.success('删除成功!')
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }
}

const handleExport = async () => {
  loading.value = true
  let params = {
    ...proTableRef.value?.searchParam
  }
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  params['pszyType'] = activeTab.value
  appendRoleRequestParams(params, getModalRoleRequestParams())
  try {
    const api = exportYnrzj
    const blob: any = await api(params)
    downloadExportBlob(blob, '已纳入会审专家清单.xlsx')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const getPageList = (params: YnrhszjPage) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['meetingId'] = modalProps.value.row['meetingId']
  params['expertNames'] = params['expertName'] ? params['expertName'].split(',') : []
  params['accounts'] = params['account'] ? params['account'].split(',') : []
  params['pszyType'] = activeTab.value
  appendRoleRequestParams(params, getModalRoleRequestParams())
  return getYnrhszjPage(params).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (val: any) => {
  return val
}

const acceptParams = async (params: ModalProps) => {
  resetModalState()
  modalProps.value = { ...modalProps.value, ...params }
  modalVisible.value = true
  void Promise.all([getPublicCode(), getTabList()]).finally(async () => {
    await nextTick()
    if (activeTab.value) {
      searchTableHandle()
    }
  })
}

defineExpose({
  acceptParams
})
</script>
