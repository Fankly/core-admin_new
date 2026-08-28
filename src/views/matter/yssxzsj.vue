<!--年度预算事项基本信息/预算事项主数据-->
<script lang="ts">
export default {
  name: '/matter/yssxzsj'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import TreeSelect from '@/components/select/TreeSelect.vue'
import { onMounted, reactive, ref, computed } from 'vue'
import { getGkbmInProvince, getSjflList, getSubProtypeTree, getYjflList } from '@/api/common'
import { ElMessage } from 'element-plus'
import { ClassifyData } from '@/views/statistics/interface/CostRelatedItemsInterface'
import {
  deleteAttach,
  deleteMatterBasicData,
  exportMatterBasicData,
  getMatterBasicData,
  getPsydAndfjByYssxId,
  SearchData,
  uploadAttach
} from '@/api/matter/matterBasic'
import MatterBasicOperation from '@/views/matter/components/MatterBasicOperation/index.vue'
import VXETable from 'vxe-table'
import { useGuide } from '@/hooks/useGuide'

interface InitParams {
  [key: string]: string
}

const userDialogRef = ref()
const helpModalRef = ref()
const loading = ref(false)
const isShowPage = ref(false)

const isDisabled = computed(() => loading.value)
const initParams = ref<InitParams>({})

const searchData = reactive<any>({
  zyssxbm: '',
  zyssxmc: '',
  zgkbmId: '',
  yjfl: '',
  xmlxs: [],
  sjfls: [],
  ejfl: '',
  nd: ''
})

const matterBasicMsg = reactive({
  title: '新增',
  opType: 'ADD'
})

const tableDataList = ref()

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

const formRef = ref()
const tableRef = ref()
const proTypeRef = ref()
const matterBasicOperationRef = ref()
const selectedData = ref(null)

const financialBasisModalVisible = ref(false)
const financialBasisLoading = ref(false)
const financialBasisTableRef = ref()
const financialBasisUploadRef = ref()
const financialBasisRows = ref<any[]>([])
const financialBasisRecords = ref<any[]>([])
const financialBasisRecord = ref<any>(null)
let financialBasisUploadTimer: ReturnType<typeof setTimeout> | undefined

const financialBasisFileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', '7z', 'ofd', 'wps', 'et']

const searchList = reactive<any>({
  projectTypeList: [],
  gkbmList: [],
  yjflList: [],
  ejflList: [],
  sjflList: []
})

// 获取项目类型
const getProjectData = () => {
  getSubProtypeTree().then((res: any) => {
    if (res.success) {
      searchList.projectTypeList = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
}

// 获取省归口部门
const getProGkbmData = async () => {
  let res = await getGkbmInProvince()
  if (res.success) {
    searchList.gkbmList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getProjectTypeHandle = (value: string[]) => {
  searchData.xmlxs = value
}

const clearDataHandle = () => {
  if (searchData.xmlxs) searchData.xmlxs.length = 0
}

const getYjflData = async () => {
  const res = await getYjflList('GWXMFL')
  if (res.success) {
    searchList.yjflList = res.data
  } else {
    ElMessage({
      type: 'error',
      message: res.msg
    })
  }
}

const getClassifyDataList = async (flag: string, code: string | number, dataList: ClassifyData[]) => {
  const findData = dataList.find((item) => item.code === code)
  if (findData) {
    const res = await getSjflList(findData.id)
    if (res.success) {
      if (flag === 'EJFL') searchList.ejflList = res.data
      else searchList.sjflList = res.data
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const changeYjflDataHandle = (val: string) => {
  clearableHandle('EJFL')
  if (val) getClassifyDataList('EJFL', val, searchList.yjflList)
}

const changeEjflDataHandle = (val: string) => {
  clearableHandle('SJFL')
  if (val) getClassifyDataList('SJFL', val, searchList.ejflList)
}

const clearableHandle = (flag: string) => {
  if (flag === 'SJFL') {
    searchData.sjfls.length = 0
    searchList.sjflList.length = 0
  }
  if (flag === 'EJFL') {
    searchData.ejfl = ''
    searchData.sjfls.length = 0
    searchList.ejflList.length = 0
    searchList.sjflList.length = 0
  }
}

const resetHandle = () => {
  proTypeRef.value.clearSelect()
  clearDataHandle()
  formRef.value.resetFields()
  searchHandle()
}

const pageChangeHandle = (currentPageNum: number) => {
  page.page = currentPageNum
  searchHandle()
}
const limitChangeHandle = (currentLimitNum: number) => {
  page.page = 1
  page.limit = currentLimitNum
  searchHandle()
}

const searchHandle = async () => {
  loading.value = true
  try {
    const params = {
      ...searchData,
      page: page.page,
      limit: page.limit,
      specialorgid: initParams.value.specialorgid
    } as SearchData
    const res = await getMatterBasicData(params)
    if (res.success) {
      tableDataList.value = res.data.records
      page.total = res.data.total
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = () => {
  loading.value = false
  initParams.value.specialorgid = userDialogRef.value.specialorgid
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    startGuide()
    searchHandle()
  }
}

const addOrEditHandle = (flag: string) => {
  matterBasicMsg.opType = flag
  matterBasicMsg.title = flag === 'ADD' ? '新增' : '编辑'
  if (flag === 'EDIT') {
    const records: any = tableRef.value.getCheckboxRecords()
    if (records && records.length !== 1) {
      ElMessage.warning('请选择一条数据进行编辑!')
      return
    }
    selectedData.value = records[0]
  }

  matterBasicOperationRef.value.isShowModal = true
}

const deleteHandle = async () => {
  const records = tableRef.value.getCheckboxRecords()
  if (records && records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除!')
    return
  }
  const ids = records.map((item: any) => item.id)
  const type = await VXETable.modal.confirm('您确定要删除吗？')
  if (type === 'confirm') {
    const res = await deleteMatterBasicData(ids)
    if (res.success) {
      ElMessage.success('删除成功!')
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  }
}

const normalizeFinancialBasisRows = (data: any): any[] => {
  const rows =
    data?.attachLists ||
    data?.attachments ||
    data?.attachmentList ||
    data?.fjList ||
    data?.fj ||
    data?.attachList ||
    data?.list ||
    data?.records ||
    data?.data ||
    data
  return Array.isArray(rows) ? rows : []
}

const getFinancialBasisFileName = (row: any) => row.fjmc || row.fileName || row.attachName || row.name || '未命名附件'

const getFinancialBasisFileType = (row: any) => {
  const fileName = getFinancialBasisFileName(row)
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.trim().toLowerCase() : ''
  if (!extension) return '-'

  const typeMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    txt: 'TXT',
    zip: '压缩包',
    rar: '压缩包',
    '7z': '压缩包',
    ofd: 'OFD',
    wps: 'WPS',
    et: 'ET'
  }
  return typeMap[extension] || extension.toUpperCase()
}

const loadFinancialBasisRows = async () => {
  if (financialBasisRecords.value.length !== 1) {
    financialBasisRows.value = []
    return
  }

  const yssxId = financialBasisRecord.value?.id
  if (!yssxId) return

  financialBasisLoading.value = true
  try {
    const res = await getPsydAndfjByYssxId(String(yssxId))
    if (!res.success) throw new Error(res.msg || '附件查询失败')
    financialBasisRows.value = normalizeFinancialBasisRows(res.data)
  } catch (e: any) {
    financialBasisRows.value = []
    ElMessage.error(e.message || '附件查询失败')
  } finally {
    financialBasisLoading.value = false
  }
}

const financialBasisHandle = async () => {
  const records = tableRef.value.getCheckboxRecords()
  if (!records || records.length === 0) {
    ElMessage.warning('请至少选择一条数据进行财务审核依据管理!')
    return
  }

  financialBasisRecords.value = records
  financialBasisRecord.value = records.length === 1 ? records[0] : null
  financialBasisRows.value = []
  financialBasisModalVisible.value = true
  if (records.length === 1) await loadFinancialBasisRows()
}

const processFinancialBasisUploads = async (uploadFiles: any[]) => {
  const files = uploadFiles.map((item) => item?.raw || item).filter(Boolean)
  const yssxIds = financialBasisRecords.value
    .map((item) => item?.id)
    .filter(Boolean)
    .map(String)
  if (files.length === 0 || yssxIds.length === 0) return

  for (const file of files) {
    const extension = file.name?.split('.').pop()?.toLowerCase()
    if (!extension || !financialBasisFileTypes.includes(extension)) {
      ElMessage.error(`不支持上传该文件类型，请上传 ${financialBasisFileTypes.join('、')} 格式文件`)
      financialBasisUploadRef.value?.clearFiles?.()
      return
    }
    if (file.size / 1024 / 1024 > 50) {
      ElMessage.error(`文件“${file.name}”大小不能超过 50MB`)
      financialBasisUploadRef.value?.clearFiles?.()
      return
    }
  }

  financialBasisLoading.value = true
  try {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const res = await uploadAttach({
      fileNames: files.map((file) => file.name),
      yssxIds,
      formData
    })
    if (!res.success) throw new Error(res.msg || '附件上传失败')
    ElMessage.success(files.length > 1 ? `已上传 ${files.length} 个附件` : '附件上传成功')
    await loadFinancialBasisRows()
  } catch (e: any) {
    ElMessage.error(e.message || '附件上传失败')
  } finally {
    financialBasisLoading.value = false
    financialBasisUploadRef.value?.clearFiles?.()
  }
}

const uploadFinancialBasis = (_uploadFile: any, uploadFiles: any[] = []) => {
  if (financialBasisUploadTimer) clearTimeout(financialBasisUploadTimer)
  financialBasisUploadTimer = setTimeout(() => {
    financialBasisUploadTimer = undefined
    void processFinancialBasisUploads(uploadFiles)
  }, 0)
}

const deleteFinancialBasis = async () => {
  if (financialBasisRecords.value.length !== 1) {
    ElMessage.warning('请单选预算事项后删除附件')
    return
  }

  const records = financialBasisTableRef.value?.getCheckboxRecords?.() || []
  if (records.length === 0) {
    ElMessage.warning('请选择要删除的附件')
    return
  }

  const ids = records
    .map((row: any) => row.id)
    .filter(Boolean)
    .map(String)
  if (ids.length === 0) {
    ElMessage.warning('未获取到附件id，无法删除')
    return
  }

  const type = await VXETable.modal.confirm('确认删除选中的附件吗？', '提示', { status: 'warning' })
  if (type !== 'confirm') return

  financialBasisLoading.value = true
  try {
    const res = await deleteAttach({ ids })
    if (!res.success) throw new Error(res.msg || '附件删除失败')
    ElMessage.success('附件删除成功')
    await loadFinancialBasisRows()
  } catch (e: any) {
    ElMessage.error(e.message || '附件删除失败')
  } finally {
    financialBasisLoading.value = false
  }
}

const closeFinancialBasisModal = () => {
  if (financialBasisUploadTimer) {
    clearTimeout(financialBasisUploadTimer)
    financialBasisUploadTimer = undefined
  }
  financialBasisModalVisible.value = false
  financialBasisRecords.value = []
  financialBasisRecord.value = null
  financialBasisRows.value = []
}

const exportHandle = async () => {
  try {
    loading.value = true
    const params = {
      ...searchData,
      page: page.page,
      specialorgid: initParams.value.specialorgid
    } as any
    let res = await exportMatterBasicData(params)
    const blob: any = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = '预算事项基础数据.xlxs'
    if (res && res.headers) {
      filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    }
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    loading.value = false
  } catch (e) {
    console.error(e)
  }
}

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const { startGuide } = useGuide({
  moduleKey: 'CentralizedModification',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})

onMounted(() => {
  userDialogRef.value.getUser()
  getProjectData()
  getProGkbmData()
  getYjflData()
})
</script>

<template>
  <div class="container" v-show="isShowPage">
    <div class="opertion" v-if="isShowPage">
      <div class="left">
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" @click="addOrEditHandle('ADD')" v-permission="'ADD'"
          >新 增</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" @click="addOrEditHandle('EDIT')" v-permission="'EDIT'"
          >修 改</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" v-permission="'DELETE'" @click="deleteHandle()"
          >删 除</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" v-permission="'EXPORT'" @click="exportHandle"
          >导 出</el-button
        >
        <el-button :loading="loading" :disabled="isDisabled" plain size="mini" type="primary" @click="financialBasisHandle"
          >财务审核依据管理</el-button
        >
      </div>
      <div class="right">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
    <div class="search">
      <el-form ref="formRef" :model="searchData" label-position="right" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="年度：" prop="nd">
              <el-date-picker
                placeholder="请选择"
                clearable
                format="YYYY"
                value-format="YYYY"
                style="width: 100%"
                v-model="searchData.nd"
                type="year"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="预算事项编码：" prop="zyssxbm">
              <el-input maxlength="80" v-model="searchData.zyssxbm"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="预算事项名称：" prop="zyssxmc">
              <el-input maxlength="80" v-model="searchData.zyssxmc"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目类型：" prop="xmlxs">
              <TreeSelect
                @clearData="clearDataHandle"
                ref="proTypeRef"
                :is-leaf="false"
                @selectChange="getProjectTypeHandle"
                :default-props="{ children: 'children', label: 'name', value: 'id' }"
                :data="searchList.projectTypeList"
                :is-child-node="false"
                node-key="id"
                data-type="id"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="省归口部门：" prop="zgkbmId">
              <el-select collapse-tags clearable style="width: 100%" v-model="searchData.zgkbmId" placeholder="请选择">
                <template v-for="item in searchList.gkbmList" :key="item.code">
                  <el-option :label="item.name" :value="item.code"></el-option>
                </template>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="一级分类：" prop="yjfl">
              <el-select style="width: 100%" v-model="searchData.yjfl" @change="changeYjflDataHandle" clearable>
                <el-option v-for="(item, index) in searchList.yjflList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="二级分类：" prop="ejfl">
              <el-select style="width: 100%" v-model="searchData.ejfl" @change="changeEjflDataHandle" clearable>
                <el-option v-for="(item, index) in searchList.ejflList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="三级分类：" prop="sjfls">
              <el-select multiple collapse-tags style="width: 100%" v-model="searchData.sjfls" clearable>
                <el-option v-for="(item, index) in searchList.sjflList" :key="index" :label="item.name" :value="item.code"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <div class="operation" style="text-align: right">
              <el-button :loading="loading" type="primary" size="mini" plain @click="resetHandle">重 置</el-button>
              <el-button :loading="loading" type="primary" size="mini" plain @click="searchHandle">查 询</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="table">
      <vxe-table
        resizable
        ref="tableRef"
        border
        stripe
        show-overflow
        align="center"
        header-align="center"
        :row-config="{
          height: 32
        }"
        :data="tableDataList"
        height="100%"
        :loading="loading"
      >
        <vxe-column width="50" type="checkbox"></vxe-column>
        <vxe-column field="id" width="180" title="ID"></vxe-column>
        <vxe-column field="nd" width="80" title="年度"></vxe-column>
        <vxe-column field="zyssxbm" width="180" title="预算事项编码"></vxe-column>
        <vxe-column field="zyssxmc" width="180" title="预算事项名称"></vxe-column>
        <vxe-column field="xmlxName" width="180" title="项目类型"></vxe-column>
        <vxe-column field="yslyName" width="180" title="预算来源"></vxe-column>
        <vxe-column field="zgkbmName" width="180" title="省归口部门"></vxe-column>
        <vxe-column field="yslxctName" width="180" title="重点投向"></vxe-column>
        <vxe-column field="yjflName" width="180" title="一级分类"></vxe-column>
        <vxe-column field="ejflName" width="180" title="二级分类"></vxe-column>
        <vxe-column field="sjflName" width="180" title="三级分类"></vxe-column>
        <vxe-column field="sfaqscName" width="120" title="是否安全生产"></vxe-column>
        <vxe-column field="aqscfylxName" width="220" title="安全生产费用类型"></vxe-column>
        <vxe-column field="zyfjftrtjfwName" width="120" title="研发投入统计范围"></vxe-column>
        <vxe-column field="isDispatchName" width="120" title="是否调度端"></vxe-column>
        <vxe-column field="sfxysgkspName" width="150" title="是否需要省归口审批"></vxe-column>
        <vxe-column field="cwpsyd" width="220" title="财务评审要点"></vxe-column>
        <vxe-column field="jhlxName" width="120" title="计划类型"></vxe-column>
        <vxe-column field="gkcsName" width="180" title="省公司归口处室"></vxe-column>
        <vxe-column field="statusName" width="120" title="状态"></vxe-column>
        <vxe-column field="remark" width="220" title="预算事项说明"></vxe-column>
        <vxe-column field="createTime" width="180" title="创建时间"></vxe-column>
        <vxe-column field="fjNum" width="100" title="附件数量"></vxe-column>
      </vxe-table>
    </div>
    <div class="pager">
      <el-pagination
        :current-page="page.page"
        background
        align="center"
        :page-sizes="[10, 20, 50, 100, 500]"
        :page-size="page.limit"
        :total="parseInt(page.total + '')"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="limitChangeHandle"
        @current-change="pageChangeHandle"
      ></el-pagination>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <MatterBasicOperation @save-data="searchHandle" :selectedData="selectedData" :matterBasicMsg="matterBasicMsg" ref="matterBasicOperationRef" />
  <HelpModal ref="helpModalRef" />
  <vxe-modal
    v-model="financialBasisModalVisible"
    class-name="financial-basis-modal-dialog"
    title="财务审核依据管理"
    width="820"
    height="520"
    show-zoom
    resize
    destroy-on-close
    @close="closeFinancialBasisModal"
  >
    <div v-loading="financialBasisLoading" class="financial-basis-modal">
      <div class="financial-basis-toolbar">
        <el-upload
          ref="financialBasisUploadRef"
          class="financial-basis-upload"
          multiple
          :auto-upload="false"
          :show-file-list="false"
          :on-change="uploadFinancialBasis"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.ofd,.wps,.et"
        >
          <el-button class="financial-basis-action" type="primary" plain size="mini" :disabled="financialBasisLoading">上传附件</el-button>
        </el-upload>
        <el-button
          class="financial-basis-action financial-basis-action--danger"
          type="danger"
          plain
          size="mini"
          :disabled="financialBasisLoading"
          @click="deleteFinancialBasis"
          >删除附件</el-button
        >
        <span v-if="financialBasisRecord" class="financial-basis-hint" :title="financialBasisRecord.zyssxmc || financialBasisRecord.zyssxbm"
          >预算事项：{{ financialBasisRecord.zyssxmc || financialBasisRecord.zyssxbm }}</span
        >
      </div>
      <div class="financial-basis-table">
        <vxe-table
          ref="financialBasisTableRef"
          border
          stripe
          show-overflow
          height="100%"
          empty-text="暂无财务审核依据附件"
          :data="financialBasisRows"
          :row-config="{ height: 32 }"
        >
          <vxe-column type="checkbox" width="50" />
          <vxe-column type="seq" title="序号" width="60" />
          <vxe-column title="附件名称" min-width="280">
            <template #default="{ row }">{{ getFinancialBasisFileName(row) }}</template>
          </vxe-column>
          <!-- <vxe-column title="附件类型" width="140">
            <template #default="{ row }">{{ getFinancialBasisFileType(row) }}</template>
          </vxe-column> -->
        </vxe-table>
      </div>
    </div>
  </vxe-modal>
</template>

<style scoped lang="less">
:global(.financial-basis-modal-dialog) {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #fcffff;
}

:global(.financial-basis-modal-dialog .vxe-modal--box) {
  overflow: hidden;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  background: #f5fbfb !important;
  box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12) !important;
}

:global(.financial-basis-modal-dialog .vxe-modal--header) {
  min-height: 48px !important;
  padding: 10px 16px !important;
  color: #1e293b !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  background: #fcffff !important;
  border-bottom: 1px solid #eef2f6 !important;
}

:global(.financial-basis-modal-dialog .vxe-modal--header-title) {
  color: #1e293b !important;
  font-weight: 700 !important;
}

:global(.financial-basis-modal-dialog .vxe-modal--close-btn) {
  color: #64748b !important;

  &:hover {
    color: #00706b !important;
  }
}

:global(.financial-basis-modal-dialog .vxe-modal--body),
:global(.financial-basis-modal-dialog .vxe-modal--content) {
  overflow: hidden;
  background: #f5fbfb !important;
}

:global(.financial-basis-modal-dialog .vxe-modal--content) {
  padding: 10px !important;
}

.container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  .opertion {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .operation {
    margin-bottom: 10px;
  }
  .table {
    flex-grow: 1;
  }
}

.financial-basis-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
}

.financial-basis-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
  flex-wrap: nowrap;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-bottom-color: #b8ddd9;
  border-radius: 6px;
  box-sizing: border-box;
  margin-bottom: 10px;
  min-height: 44px;

  :deep(.financial-basis-upload) {
    display: inline-flex;
    flex: 0 0 auto;
    width: auto;
    white-space: nowrap;
  }

  .financial-basis-action {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  :deep(.el-button) {
    height: 28px;
    min-height: 28px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
  }

  :deep(.el-button--primary) {
    color: #00706b;
    background: #f2f9f8;
    border-color: #b8ddd9;
  }

  :deep(.el-button--primary:hover),
  :deep(.el-button--primary:focus) {
    color: #00706b;
    background: #e6f4f3;
    border-color: #00706b;
  }

  :deep(.el-button--danger) {
    color: #f56c6c;
    background: #ffffff;
    border-color: #f56c6c;
  }

  :deep(.el-button--danger:hover),
  :deep(.el-button--danger:focus) {
    color: #f56c6c;
    background: #fff5f5;
    border-color: #f56c6c;
  }
}

.financial-basis-hint {
  margin-left: auto;
  max-width: 360px;
  overflow: hidden;
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.financial-basis-table {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;

  :deep(.vxe-table) {
    width: 100%;
    height: 100% !important;
    color: #475569;
    font-size: 13px;
    --vxe-font-color: #475569;
    --vxe-table-header-font-color: #00706b;
    --vxe-table-header-background-color: #dff3f0;
    --vxe-table-border-color: #e2e8f0;
    --vxe-table-row-hover-background-color: #e6f4f3;
    --vxe-table-row-striped-background-color: #f7fcfb;
    --vxe-table-row-current-background-color: #d8efec;
    background-color: #ffffff;
  }

  :deep(.vxe-header--column) {
    height: 44px;
    color: #00706b;
    font-size: 13px;
    font-weight: 600;
    background-color: #dff3f0 !important;
  }

  :deep(.vxe-body--column) {
    height: 32px;
    color: #475569;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: #f7fcfb !important;
  }

  :deep(.vxe-body--row.row--checked),
  :deep(.vxe-body--row.row--current) {
    background-color: #d8efec !important;
  }

  :deep(.vxe-body--row.row--hover) {
    background-color: #e6f4f3 !important;
  }

  :deep(.vxe-cell--checkbox .vxe-checkbox--checked-icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--indeterminate-icon) {
    color: #00706b;
  }
}
</style>
