import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'
import { computed, inject, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import Decimal from 'decimal.js'
import type { VxeGridProps } from 'vxe-table'
import { exportXmDetailByVersionIds, getXmDetailByVersionIds } from '@/api/targetBudget/provinceTarget'
import type { XmDetailByVersionIdParams, XmDetailByVersionIdRow } from '@/api/targetBudget/provinceTarget'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { apiExportHandle } from '@/utils/export'
import type { RowVO } from '../../types/provinceTarget'

export const useTargetBudgetProjectDetail = () => {
  const store = useStore()
  const currentUserRole = inject<Ref<UserRole>>(CurrentUserRoleInjectionKey)!
  const isShowModal = ref(false)
  const loading = ref(false)
  const exporting = ref(false)
  const selectedVersions = ref<RowVO[]>([])
  const versionCount = computed(() => selectedVersions.value.length)
  const query = ref<Omit<XmDetailByVersionIdParams, 'page' | 'limit'>>()
  const tableData = ref<XmDetailByVersionIdRow[]>([])
  const page = reactive({ page: 1, limit: 20, total: 0 })
  let requestToken = 0

  const amountFormatter = ({ cellValue }: { cellValue: unknown }) => {
    if (cellValue === undefined || cellValue === null || String(cellValue).trim() === '') return '-'
    try {
      return new Decimal(String(cellValue)).toFixed(6)
    } catch {
      return '-'
    }
  }
  const adjustTypeNames: Record<string, string> = { '1': '新增项目预算', '2': '调整项目预算', '3': '取消项目预算' }
  const preArrangeNames: Record<string, string> = { '0': '否', '1': '是' }
  // 与目标值查看中的项目明细清单保持相同字段及金额精度。
  const gridOptions: VxeGridProps<XmDetailByVersionIdRow> = {
    border: true,
    columnConfig: { resizable: true },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: { height: 32 },
    columns: [
      { type: 'seq', title: '序号', width: 70, fixed: 'left' },
      { field: 'versionNo', title: '版本编号', width: 180, fixed: 'left' },
      { field: 'versionName', title: '版本名称', width: 220, fixed: 'left' },
      { field: 'nd', title: '年度', width: 60 },
      {
        field: 'tzlx',
        title: '调整类型',
        width: 110,
        formatter: ({ row, cellValue }) => row.tzlxName || adjustTypeNames[String(cellValue)] || cellValue || '-'
      },
      { field: 'xmmc', title: '项目名称', width: 220 },
      { field: 'xmbm', title: '项目编码', width: 115 },
      { field: 'xmlxName', title: '项目类型', width: 180 },
      { field: 'yjdwName', title: '一级单位', width: 220 },
      { field: 'ejdwName', title: '二级单位', width: 220 },
      { field: 'amount', title: '总预算（不含税）（万元）', width: 220, align: 'right', formatter: amountFormatter },
      { field: 'dnys', title: '当年预算（不含税）（万元）', width: 160, align: 'right', formatter: amountFormatter },
      { field: 'dnysTzh', title: '当年预算（调整后）', width: 190, align: 'right', formatter: amountFormatter },
      { field: 'tzfd', title: '调整幅度', width: 160, align: 'right', formatter: amountFormatter },
      { field: 'tzsm', title: '调整说明', width: 200 },
      { field: 'kypfwh', title: '可研批复文号', width: 220 },
      {
        field: 'sfyap',
        title: '是否预安排',
        width: 140,
        formatter: ({ row, cellValue }) => row.sfyapName || preArrangeNames[String(cellValue)] || cellValue || '-'
      },
      { field: 'xmyxjName', title: '项目优先级', width: 140 }
    ]
  }

  const buildParams = (exportAll = false): XmDetailByVersionIdParams => ({
    ...query.value!,
    page: String(exportAll ? 1 : page.page),
    limit: String(exportAll ? page.total || 99999 : page.limit)
  })

  const loadData = async () => {
    if (!isShowModal.value || !query.value) return
    const token = ++requestToken
    loading.value = true
    tableData.value = []
    try {
      const res = await getXmDetailByVersionIds(buildParams())
      if (token !== requestToken || !isShowModal.value) return
      if (!res.success) throw new Error(res.msg || '项目明细加载失败')
      const records: XmDetailByVersionIdRow[] = Array.isArray(res.data) ? res.data : res.data?.records || res.data?.list || []
      const versions = new Map(selectedVersions.value.map((version) => [String(version.id), version]))
      tableData.value = records.map((row) => {
        const version = versions.get(String(row.versionId))
        return {
          ...row,
          versionName: row.versionName || version?.versionName || '',
          versionNo: row.versionNo || version?.versionNo || ''
        }
      })
      const total = Number(res.data?.total ?? records.length)
      page.total = Number.isFinite(total) ? total : records.length
    } catch (error) {
      if (token !== requestToken || !isShowModal.value) return
      page.total = 0
      ElMessage.error((error as Error).message || '项目明细加载失败')
    } finally {
      if (token === requestToken) loading.value = false
    }
  }

  const acceptParams = (versions: RowVO[]) => {
    selectedVersions.value = versions.map((version) => ({ ...version }))
    const role = currentUserRole.value
    query.value = {
      versionIds: selectedVersions.value.map((version) => String(version.id)),
      bmId: role.bmId,
      dwId: role.dwId,
      roleCode: role.roleCode,
      roleId: role.roleId,
      userId: String(store.getters.getUserMsg?.id || '')
    }
    page.page = 1
    page.limit = 20
    page.total = 0
    isShowModal.value = true
    void loadData()
  }

  const handleClose = () => {
    isShowModal.value = false
    requestToken++
    loading.value = false
    tableData.value = []
    page.total = 0
  }

  const handlePageChange = (value: number) => {
    if (page.page === value) return
    page.page = value
    void loadData()
  }

  const handleLimitChange = (value: number) => {
    page.limit = value
    page.page = 1
    void loadData()
  }

  const handleExport = async () => {
    if (exporting.value || loading.value || !query.value || !page.total) return
    exporting.value = true
    try {
      await apiExportHandle(buildParams(true), '多版本项目明细清单', exportXmDetailByVersionIds)
    } catch (error) {
      ElMessage.error((error as Error).message || '项目明细导出失败')
    } finally {
      exporting.value = false
    }
  }

  return {
    isShowModal,
    loading,
    exporting,
    versionCount,
    tableData,
    page,
    gridOptions,
    acceptParams,
    loadData,
    handleClose,
    handleExport,
    handlePageChange,
    handleLimitChange
  }
}
