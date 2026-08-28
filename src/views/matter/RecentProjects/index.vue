<template>
  <div class="container" v-loading="loading" element-loading-text="正在加载..." v-show="isShowPage">
    <div class="header">
      <div class="header-actions">
        <div class="left" v-if="isShowPage">
          <el-button v-permission="'REFRESH'" type="primary" plain @click="handleRefreshData"
            >刷新待维护数据
          </el-button>
          <el-button
            v-permission="'DELETE'"
            @click="handleDeleteData"
            :disabled="loading || hasSelectedProjects"
            type="primary"
            plain
            >删 除
          </el-button>
          <el-button v-permission="'EDIT'" type="primary" plain @click="handleEditData"
            >编 辑
          </el-button>
          <el-button
            v-permission="'SAVE'"
            :disabled="loading || !editConfig.enabled"
            type="primary"
            plain
            @click="handleSaveData"
            >保 存
          </el-button>
          <el-button
            v-permission="'SUBMIT'"
            @click="handleSubmitData"
            :disabled="loading || hasSelectedProjects"
            type="primary"
            plain
            >提 交
          </el-button>
          <el-button
            v-permission="'BACK'"
            @click="handleBackData"
            :disabled="loading || hasSelectedProjects"
            type="primary"
            plain
            >驳 回
          </el-button>
          <el-button v-permission="'IMPORT'" type="primary" plain @click="handleImportData"
            >导 入</el-button
          >
          <el-button v-permission="'EXPORT'" type="primary" plain @click="handleExportData"
            >导 出</el-button
          >
        </div>
        <div class="right">
          <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
        </div>
      </div>
    </div>
    <div class="content">
      <splitpane :splitSet="settingLR">
        <template #paneL>
          <div class="tree">
            <div class="tree-data">
              <el-tree
                :current-node-key="currentKey"
                lazy
                :load="loadTreeData"
                :expand-on-click-node="false"
                highlight-current
                ref="treeRef"
                :props="defaultProps"
                node-key="id"
                @node-click="handleNodeClick"
              ></el-tree>
            </div>
          </div>
        </template>
        <template #paneR>
          <div class="main">
            <div class="main-search">
              <el-form
                ref="searchRef"
                label-position="right"
                :label-width="120"
                :model="searchForm"
              >
                <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
                  <GridItem>
                    <el-form-item prop="yjdw">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `一级单位` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select
                          @change="(val:string)=>handleFieldChange(val,'yjdw')"
                          clearable
                          collapse-tags
                          v-model="searchForm.yjdw"
                        >
                          <el-option
                            v-for="item in searchList.yjdwList"
                            :key="item.code"
                            :label="item.name"
                            :value="item.code"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="ejdw">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `二级单位` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-select
                          @change="(val:string)=>handleFieldChange(val,'ejdw')"
                          clearable
                          collapse-tags
                          v-model="searchForm.ejdw"
                        >
                          <el-option
                            v-for="item in searchList.ejdwList"
                            :key="item.code"
                            :label="item.name"
                            :value="item.code"
                          ></el-option>
                        </el-select>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="yssxbm">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `预算事项编码` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <ReMultipleText v-model="searchForm.yssxbm" />
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem>
                    <el-form-item prop="yssxmc">
                      <template #label>
                        <el-space :size="4">
                          <span>{{ `预算事项名称` }}</span>
                        </el-space>
                        <span>&nbsp;：</span>
                      </template>
                      <div class="form">
                        <el-input v-model="searchForm.yssxmc"> </el-input>
                      </div>
                    </el-form-item>
                  </GridItem>
                  <GridItem></GridItem>
                  <GridItem></GridItem>
                  <GridItem></GridItem>
                  <GridItem>
                    <div class="operation">
                      <el-button type="primary" size="mini" plain @click="loadData"
                        >查 询</el-button
                      >
                      <el-button type="primary" size="mini" plain @click="resetHandle"
                        >重 置</el-button
                      >
                    </div>
                  </GridItem>
                </Grid>
              </el-form>
            </div>
            <div class="main-table">
              <vxe-table
                :checkbox-config="{
                  trigger: 'row',
                  highlight: true
                }"
                keep-source
                :edit-config="editConfig"
                ref="tableRef"
                :row-config="{ height: 32, keyField: 'id' }"
                align="center"
                show-overflow
                show-header-overflow
                header-align="center"
                border
                resizable
                stripe
                :data="tableData"
                height="auto"
                max-height="100%"
                @cell-click="cellClickHandle"
                @checkbox-change="checkChangeHandle"
                @checkbox-all="checkChangeAllHandle"
              >
                <vxe-column width="55" type="checkbox"></vxe-column>
                <template v-for="item in columns" :key="item.columnKey">
                  <vxe-column
                    width="180"
                    v-if="item.eidt && item.dataType === '0'"
                    header-align="center"
                    align="center"
                    :field="item.columnKey"
                    :title="item.columnValue"
                    :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }"
                  >
                    <template v-if="!isLink" #edit="{ row }">
                      <input class="my-sbsm" v-model="row[item.columnKey]" />
                    </template>
                    <template v-else #default="{ row }">
                      <div
                        class="link"
                        @click="() => handleLinkData(row[item.columnKey], item.columnKey)"
                        >{{ row[item.columnKey] }}</div
                      >
                    </template>
                  </vxe-column>
                  <vxe-column
                    width="180"
                    v-else-if="item.eidt && item.dataType === '1'"
                    header-align="center"
                    align="right"
                    :field="item.columnKey"
                    :title="item.columnValue"
                    :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
                  >
                    <template #edit="{ row }">
                      <input v-number-input="6" v-model="row[item.columnKey]" class="my-input" />
                    </template>
                  </vxe-column>
                  <vxe-column
                    v-else
                    :title="item.columnValue"
                    :field="item.columnKey"
                    min-width="150"
                  ></vxe-column>
                </template>
              </vxe-table>
            </div>
            <div class="main-pagination">
              <el-pagination
                :current-page="childrenCurrentPage"
                background
                align="center"
                :page-sizes="[20, 50, 100, 200]"
                :page-size="childrenPageSize"
                :total="parseInt(totalProjects + '')"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleChildrenSizeChange"
                @current-change="handleChildrenCurrentChange"
              ></el-pagination>
            </div>
          </div>
        </template>
      </splitpane>
    </div>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <HelpModal ref="helpModalRef" />
  <ImportExcel ref="importRef" />
</template>

<script lang="ts" setup name="/matter/RecentProjects/index">
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import Grid from '@/components/Grid/index.vue'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import splitpane, { ContextProps } from '@/components/ReSplitPane'
import { ElMessage } from 'element-plus'
import userDialog from '@/components/select/userDialog.vue'
import ImportExcel from '@/components/ImportExcel/index.vue' //导入组件

import type Node from 'element-plus/es/el-tree/src/model/node'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { Project, PublicCode, PublicParams, RowVo, Tree } from './interface'
import { useGuide } from '@/hooks/useGuide'
import baseService from '@/service/baseService'

import {
  getProtypeTreeYearCb,
  getRecords,
  exportData,
  refreshData,
  deleteData,
  saveData,
  submitData,
  importData,
  getImportTemplate,
  backData
} from '@/api/matter/recentProjects/index'
import VXETable from 'vxe-table'
import { useRouter } from 'vue-router'

const router = useRouter()
const importRef = ref<any>() //导入类名

const isShowPage = ref<boolean>(false)
const isLink = ref<boolean>(true)
const currentKey = ref<string>(new Date().getFullYear().toString())
const settingLR: ContextProps = reactive({
  minPercent: 15,
  defaultPercent: 15,
  split: 'vertical'
})

const activeCellMethod = ({ row }: any) => {
  return row['zt'] === '1'
}

const editConfig = reactive({
  trigger: 'click',
  mode: 'cell',
  showStatus: true,
  enabled: false,
  beforeEditMethod: activeCellMethod
})

const { startGuide } = useGuide({
  moduleKey: 'RecentProjects',
  tragetSelector: '.toolbar-guide-icon',
  onKnow: () => {},
  onNoMoreRemind: () => {}
})
const treeRef = ref()
const tableRef = ref()
const helpModalRef = ref()
const tableData = ref<RowVo[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const defaultProps = reactive({
  children: 'children',
  label: 'name',
  isLeaf: 'leaf',
  id: 'id'
})
const searchList = reactive<{
  yjdwList: PublicCode[]
  ejdwList: PublicCode[]
}>({
  yjdwList: [],
  ejdwList: []
})
const userDialogRef = ref()
const searchRef = ref()
const publicParams = reactive<PublicParams>({
  bmId: '',
  nd: '',
  protypeId: '',
  dwId: '',
  userId: '',
  specialorgcode: '',
  spRoleId: ''
})

const columns = ref<any[]>([])

const searchForm = reactive<Project>({})

const childrenCurrentPage = ref<number>(1)
const childrenPageSize = ref<number>(20)
const checkedData = ref<RowVo[]>([])

const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)

const totalProjectsCount = ref<number>(0)

const apiService = {
  async getProjectsWithGroups(
    page: number,
    pageSize: number
  ): Promise<{ data: RowVo[]; total: number }> {
    try {
      let yssxbm: string[] = []
      if (searchForm.yssxbm && !Array.isArray(searchForm.yssxbm)) {
        yssxbm = searchForm.yssxbm.split(',')
      }
      const groupsRes = await getRecords({
        ...searchForm,
        yssxbm: yssxbm,
        page: page,
        limit: pageSize,
        ...publicParams
      })
      let totalProjects = groupsRes.data.total || 0
      return {
        data: groupsRes.data.records,
        total: totalProjects
      }
    } catch (error) {
      console.error('获取项目分组及子项目数据失败', error)
      throw new Error('获取项目分组及子项目数据失败')
    }
  },
  async exportDataPages(): Promise<boolean> {
    try {
      const res = await exportData({
        ...searchForm,
        ...publicParams
      })
      const blob: any = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      throw new Error('导出数据失败')
    }
  }
}

const handleLinkData = (xmbm: string, columnKey: string) => {
  const strArr = columnKey.split('_')
  if (strArr.length === 2) {
    router.push({
      name: '/budget-process/process-42',
      query: {
        xmbm: xmbm,
        specialorgid: publicParams.bmId,
        roleCode: publicParams.roleCode,
        nd: strArr[1]
      }
    })
  }
}

const checkChangeHandle = ({ records }: any) => {
  checkedData.value = records
}
const checkChangeAllHandle = ({ records }: any) => {
  checkedData.value = records
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  checkedData.value = []
  await tableRef.value.clearCheckboxRow()
  tableRef.value.setCheckboxRow(row, true)
  checkedData.value.push(row)
}

// 删除
const handleDeleteData = async () => {
  // 增加校验
  const isDel = checkedData.value.some((item) => item.zt !== '1')
  if (isDel) {
    ElMessage.warning('存在已提交的数据,请检查后,再进行删除操作!')
    return
  }
  try {
    const type = await VXETable.modal.confirm('确认删除数据？', '温馨提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      loading.value = true
      const ids = checkedData.value.map((item) => item.id)
      const res = await deleteData({
        ids: ids
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('删除成功!')
      await loadData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleRefreshData = async () => {
  try {
    const type = await VXETable.modal.confirm('确认刷新待维护数据？', '温馨提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      loading.value = true
      const res = await refreshData({
        dwId: publicParams.dwId,
        nd: publicParams.nd
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('刷新成功!')
      await searchData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleEditData = async () => {
  if (editConfig.enabled) {
    ElMessage.warning('已开启编辑模式!')
    return
  }
  const type = await VXETable.modal.confirm('确认开启编辑？', '温馨提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    editConfig.enabled = true
    isLink.value = false
  }
}

const paramsSet = (updateRecords: any[]) => {
  const updateParams: any[] = []
  const columnKeyArr = editColumns.value
  updateRecords.forEach((item) => {
    const obj: any = {
      id: item.id,
      saveValues: {}
    }
    for (const key of columnKeyArr) {
      if (item[key]) {
        obj.saveValues[key] = item[key]
      } else {
        obj.saveValues[key] = ''
      }
    }
    updateParams.push(obj)
  })
  return updateParams
}

const handleSaveData = async () => {
  try {
    const { updateRecords } = tableRef.value.getRecordset()
    // 获取修改数据
    if (updateRecords.length === 0) {
      ElMessage.warning('请编辑后,再进行保存!')
      return
    }
    const type = await VXETable.modal.confirm('确认保存数据？', '温馨提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const updateParams = paramsSet(updateRecords)
      loading.value = true
      // 确认是否保存数据
      const res = await saveData(updateParams)
      if (!res.success) throw new Error(res.msg)
      updateParams.length = 0
      ElMessage.success('保存成功!')
      await searchData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const editColumns = ref<string[]>([])

const searchData = async () => {
  try {
    error.value = null
    checkedData.value = []
    columns.value = []
    await tableRef.value.clearCheckboxRow()
    const { data, total } = await apiService.getProjectsWithGroups(
      childrenCurrentPage.value,
      childrenPageSize.value
    )
    const dynamicColumnData = await initParamsData('/yssxLinkXm/getDynamicColumn')
    columns.value = dynamicColumnData
    editColumns.value = dynamicColumnData.filter((item) => item.eidt).map((item) => item.columnKey)
    tableData.value = data
    totalProjectsCount.value = total
    isLink.value = true
    editConfig.enabled = false
  } catch (e) {
    handleError(e as Error, '加载项目数据失败')
  }
}

const handleSubmitData = async () => {
  if (!isLink.value) {
    ElMessage.warning('请保存后,再进行提交操作!')
    return
  }
  // 增加校验
  const isSubmit = checkedData.value.some((item) => item.zt !== '1')
  if (isSubmit) {
    ElMessage.warning('存在已提交的数据,请检查后,再进行提交操作!')
    return
  }
  try {
    const type = await VXETable.modal.confirm('确认提交数据？', '温馨提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      loading.value = true
      const ids = checkedData.value.map((item) => item.id)
      const res = await submitData({
        ids: ids
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('提交成功!')
      await searchData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleBackData = async () => {
  try {
    // 增加校验
    const isback = checkedData.value.some((item) => item.zt === '1')
    if (isback) {
      ElMessage.warning('存在编辑的数据,请检查后,再进行驳回操作!')
      return
    }
    const type = await VXETable.modal.confirm('确认驳回数据？', '温馨提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      loading.value = true
      const ids = checkedData.value.map((item) => item.id)
      const res = await backData({
        ids: ids
      })
      if (!res.success) throw new Error(res.msg)
      ElMessage.success('驳回成功!')
      await searchData()
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handleExportData = async () => {
  try {
    loading.value = true
    error.value = null
    const flag = await apiService.exportDataPages()
    if (flag) loading.value = false
  } catch (e) {
    handleError(e as Error, '导出数据失败')
  }
}

const handleImportData = () => {
  let tempApi: any = getImportTemplate
  let importApi: any = importData
  if (!importApi) return
  let params = {
    title: '预算事项近三年项目关联',
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...searchForm,
        ...publicParams,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...searchForm,
        ...publicParams,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    getTableList: loadData,
    specialorgid: publicParams.bmId
  }
  importRef.value.acceptParams(params)
}

const loadData = async (): Promise<void> => {
  try {
    loading.value = true
    error.value = null
    checkedData.value = []
    columns.value = []
    if (tableRef.value) await tableRef.value.clearCheckboxRow()
    const { data, total } = await apiService.getProjectsWithGroups(
      childrenCurrentPage.value,
      childrenPageSize.value
    )
    const dynamicColumnData = await initParamsData('/yssxLinkXm/getDynamicColumn')
    columns.value = dynamicColumnData
    tableData.value = data
    totalProjectsCount.value = total
    isLink.value = true
    editConfig.enabled = false
  } catch (e) {
    handleError(e as Error, '加载项目数据失败')
  } finally {
    loading.value = false
  }
}

const totalProjects = computed<number>(() => {
  return totalProjectsCount.value
})

const handleChildrenSizeChange = (val: number): void => {
  try {
    if (val > 0) {
      childrenPageSize.value = val
      childrenCurrentPage.value = 1
      loadData()
    } else {
      throw new Error('页面大小必须大于0')
    }
  } catch (e) {
    handleError(e as Error, '更改子项目页面大小失败')
  }
}

const handleChildrenCurrentChange = (val: number): void => {
  try {
    if (val > 0) {
      childrenCurrentPage.value = val
      loadData()
    } else {
      throw new Error('页码必须大于0')
    }
  } catch (e) {
    handleError(e as Error, '更改子项目页码失败')
  }
}

watch([childrenCurrentPage, childrenPageSize], () => {
  error.value = null
})

const handleNodeClick = (node: any): void => {
  checkedData.value = []
  publicParams.nd = node.nd
  publicParams.protypeId = node.id
  currentKey.value = node.id
  loadData()
}

const loadTreeData = async (node: Node, resolve: (data: Tree[]) => void) => {
  try {
    let parentId = -1
    let nd = ''
    if (node.level === 0) {
      nd = ''
      parentId = -1
    } else {
      parentId = node.data.id
      nd = node.data.nd
    }
    const res = await getProtypeTreeYearCb({
      nd: nd || publicParams.nd,
      bmId: publicParams.bmId,
      dwId: publicParams.dwId,
      parentId
    })
    if (!res.success || !res.data) {
      throw new Error(res.msg || '请求的数据为空!')
    }
    resolve(res.data)
  } catch (e) {
    handleError(e as Error, '加载项目数据失败')
  }
}

const getRoleHandle = async () => {
  publicParams.bmId = userDialogRef.value.specialorgid
  publicParams.roleCode = userDialogRef.value.roleCode
  publicParams.dwId = userDialogRef.value.userMsg.org_id
  publicParams.specialorgcode = userDialogRef.value.userMsg.specialorgcode
  publicParams.userId = userDialogRef.value.userMsg.id
  publicParams.spRoleId = userDialogRef.value.spRoleId
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    isShowPage.value = true
    await initPublicParams()
  }
}

const initPublicParams = async () => {
  const yjdwRes = await initParamsData('/bizOrgTree/getYjdw', {
    ...publicParams
  })
  searchList.yjdwList = yjdwRes
  if (treeRef.value) {
    await nextTick(() => {
      const year = new Date().getFullYear().toString()
      treeRef.value.setCurrentKey(year)
      publicParams.nd = year
      publicParams.protypeId = year
      loadData()
    })
  }
  startGuide()
}

const selectRolesHandle = () => {
  userDialogRef.value.getUser()
}

const initParamsData = async (method: any, params?: any): Promise<any[]> => {
  const res = await baseService.post(method, params)
  if (res.success) {
    return res.data
  } else {
    ElMessage.error(res.msg)
    return []
  }
}
const resetHandle = () => {
  searchRef.value.resetFields()
  searchList.ejdwList = []
  loadData()
}

const handleFieldChange = async (value: string, prop: string) => {
  if (prop === 'yjdw') {
    searchList.ejdwList = []
    searchForm['ejdw'] = ''
    if (value) {
      const ejdwData = await baseService.post('/bizOrgTree/getEjdw', {
        YJDW: value,
        ...publicParams,
        parentCode: value
      })
      searchList.ejdwList = ejdwData.data || []
    }
  }
}

onMounted(async () => {
  try {
    selectRolesHandle()
    const dynamicColumnData = await initParamsData('/yssxLinkXm/getDynamicColumn')
    columns.value = dynamicColumnData
    editColumns.value = dynamicColumnData.filter((item) => item.eidt).map((item) => item.columnKey)
  } catch (e) {
    handleError(e as Error, '初始化加载失败')
  }
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const handleError = (error: Error, message = '操作失败'): void => {
  ElMessage({
    message: `${message}:${error.message}`,
    type: 'error',
    duration: 5000
  })
}
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
