<template>
  <vxe-modal
    @close="handleClose"
    :destroy-on-close="true"
    :loading="loading"
    :mask="true"
    :lock-scroll="true"
    :lock-view="true"
    show-zoom
    resize
    position="center"
    :title="title"
    v-model="isShowModal"
    width="80%"
    height="820"
  >
    <div class="content">
      <div class="operation-top">
        <el-button :disabled="loading" type="primary" plain @click="handleQueryData">确 定</el-button>
        <el-button :disabled="loading" type="primary" plain @click="handleClose">关 闭</el-button>
      </div>
      <div class="main-search">
        <el-form ref="searchRef" label-position="right" :label-width="120" :model="searchForm">
          <Grid ref="gridRef" :gap="[10, 0]" :cols="4">
            <GridItem>
              <el-form-item prop="xmmc">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `项目名称` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <el-input v-model="searchForm.xmmc"></el-input>
                </div>
              </el-form-item>
            </GridItem>
            <GridItem>
              <el-form-item prop="gwxmbms">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `国网项目编码` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <ReMultipleText v-model="searchForm.gwxmbms" />
                </div>
              </el-form-item>
            </GridItem>
            <GridItem>
              <el-form-item prop="xmbms">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `储备编码` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <ReMultipleText v-model="searchForm.xmbms" />
                </div>
              </el-form-item>
            </GridItem>
            <GridItem>
              <el-form-item prop="yjfl">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `一级分类` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <el-select
                    class="select-style"
                    @change="(val:string)=>handleFieldChange(val,'yjfl')"
                    clearable
                    collapse-tags
                    v-model="searchForm.yjfl"
                  >
                    <el-option v-for="item in publicCodeList['GWXMFL']" :key="item.code" :label="item.name" :value="item.code"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </GridItem>
            <GridItem>
              <el-form-item prop="ejfl">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `二级分类` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <el-select
                    class="select-style"
                    @change="(val:string)=>handleFieldChange(val,'ejfl')"
                    clearable
                    collapse-tags
                    v-model="searchForm.ejfl"
                  >
                    <el-option v-for="item in searchList.ejflList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </GridItem>
            <GridItem>
              <el-form-item prop="sjfl">
                <template #label>
                  <el-space :size="4">
                    <span>{{ `三级分类` }}</span>
                  </el-space>
                  <span>&nbsp;：</span>
                </template>
                <div class="form">
                  <el-select
                    class="select-style"
                    @change="(val:string)=>handleFieldChange(val,'sjfl')"
                    clearable
                    collapse-tags
                    v-model="searchForm.sjfl"
                  >
                    <el-option v-for="item in searchList.sjflList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </GridItem>
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
                    class="select-style"
                    @change="(val:string)=>handleFieldChange(val,'yjdw')"
                    clearable
                    collapse-tags
                    v-model="searchForm.yjdw"
                  >
                    <el-option v-for="item in searchList.yjdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
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
                    class="select-style"
                    @change="(val:string)=>handleFieldChange(val,'ejdw')"
                    clearable
                    collapse-tags
                    v-model="searchForm.ejdw"
                  >
                    <el-option v-for="item in searchList.ejdwList" :key="item.code" :label="item.name" :value="item.code"></el-option>
                  </el-select>
                </div>
              </el-form-item>
            </GridItem>
            <GridItem />
            <GridItem />
            <GridItem />
            <GridItem>
              <div class="operation">
                <el-button type="primary" size="mini" plain @click="loadData">查 询</el-button>
                <el-button size="mini" plain @click="resetHandle">重 置</el-button>
              </div>
            </GridItem>
          </Grid>
        </el-form>
      </div>
      <div class="table">
        <vxe-table
          keep-source
          height="auto"
          max-height="100%"
          :checkbox-config="{
            trigger: 'row',
            highlight: true
          }"
          resizable
          :row-config="{ height: 32 }"
          border
          stripe
          show-overflow
          :edit-config="{ trigger: 'click', mode: 'cell', showStatus: true }"
          :data="tableData"
          @cell-click="cellClickHandle"
          @checkbox-change="checkChangeHandle"
          @checkbox-all="checkChangeAllHandle"
          :cell-style="cellStyle"
          ref="tableRef"
        >
          <vxe-column show-overflow show-header-overflow align="center" :width="55" type="checkbox"></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="80" field="nd" title="年度"></vxe-column>
          <vxe-column
            show-overflow
            show-header-overflow
            headerAlign="center"
            align="center"
            :width="150"
            field="proTypeName"
            title="项目类别"
          ></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="left" :width="220" field="xmmc" title="项目名称"></vxe-column>
          <vxe-column
            show-overflow
            show-header-overflow
            headerAlign="center"
            align="center"
            :width="150"
            field="gwxmbm"
            title="国网项目编码"
          ></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="150" field="xmbm" title="储备编码"></vxe-column>
          <vxe-column
            show-overflow
            show-header-overflow
            headerAlign="center"
            align="center"
            :width="150"
            field="yjdwName"
            title="一级单位"
          ></vxe-column>
          <vxe-column
            show-overflow
            show-header-overflow
            headerAlign="center"
            align="center"
            :width="150"
            field="ejdwName"
            title="二级单位"
          ></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="150" field="yjfl" title="一级分类"></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="150" field="ejfl" title="二级分类"></vxe-column>
          <vxe-column show-overflow show-header-overflow headerAlign="center" align="center" :width="150" field="sjfl" title="三级分类"></vxe-column>
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
  </vxe-modal>
</template>

<script setup lang="ts" name="Order">
import { computed, ref } from 'vue'
import { operation } from '@/views/service/continueCarryOver/modules/operation'
import Grid from '@/components/Grid/index.vue'
import GridItem from '@/components/Grid/components/GridItem.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { common } from '@/views/service/continueCarryOver/common'
import { getChoosePage, saveXjjzRecord } from '@/api/service/continueCarryOver'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'

interface Params {
  [key: string]: any
}

const searchData = ref<() => void>()
const sqdType = ref('')
const searchRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const tableRef = ref()
const hasSelectedProjects = computed(() => checkedData.value && checkedData.value.length === 0)
const title = ref('项目申请单')

const searchHandle = (searchFunc: () => void) => {
  searchData.value = searchFunc
}

const acceptParams = async (params: Params) => {
  isShowModal.value = true
  publicParams.value = params.publicParams
  searchHandle(params.searchData)
  searchList.yjdwList = await initParamsData('/bizOrgTree/getYjdw', {
    ...publicParams.value
  })
  sqdType.value = params.sqdType
  await getPublicParamsList()
  await loadData()
}
const { searchForm, searchList, publicCodeList, handleFieldChange, getPublicParamsList, initParamsData, publicParams, handleError } = common()

const totalProjectsCount = ref<number>(0)
const error = ref<string | null>(null)
const childrenCurrentPage = ref<number>(1)
const childrenPageSize = ref<number>(20)

const totalProjects = computed<number>(() => {
  return totalProjectsCount.value
})

const resetForm = () => {
  searchRef.value.resetFields()
  searchList.ejflList = []
  searchList.sjflList = []
  searchList.ejdwList = []
}

const resetHandle = () => {
  resetForm()
  loadData()
}

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

const loadData = async (): Promise<void> => {
  try {
    tableData.value = []
    loading.value = true
    error.value = null
    checkedData.value = []
    const nd = Number(publicParams.value.nd) - 1
    let protypeId: string | number = publicParams.value.protypeId
    if (protypeId === publicParams.value.nd) {
      protypeId = Number(protypeId) - 1
    }
    let gwxmbms = []
    let xmbms = []
    if (searchForm.gwxmbms) gwxmbms = searchForm.gwxmbms.split(',')
    if (searchForm.xmbms) xmbms = searchForm.xmbms.split(',')
    const res = await getChoosePage({
      ...searchForm,
      gwxmbms: gwxmbms,
      xmbms: xmbms,
      page: childrenCurrentPage.value,
      limit: childrenPageSize.value,
      ...publicParams.value,
      nd: nd,
      protypeId: protypeId
    })
    tableData.value = res.data.records
    totalProjectsCount.value = res.data.total
  } catch (e) {
    handleError(e as Error, '加载项目数据失败')
  } finally {
    loading.value = false
  }
}

const handleQueryData = async () => {
  if (checkedData.value.length === 0) {
    ElMessage.warning('请至少选中一条数据!')
    return
  }
  const tipsMainMsg = sqdType.value === '1' ? '续建' : '结转'
  const type = await VXETable.modal.confirm(`是否创建项目${tipsMainMsg}申请单？`, '提示', {
    status: 'warning',
    confirmButtonText: '是',
    cancelButtonText: '否'
  })
  if (type === 'confirm') {
    try {
      loading.value = true
      let protypeId: string | number = publicParams.value.protypeId
      if (protypeId === publicParams.value.nd) {
        protypeId = Number(protypeId) - 1
      }
      const selectedData = checkedData.value.map((checkData) => {
        return {
          isPack: checkData.isPack,
          nd: checkData.nd,
          xmbm: checkData.xmbm,
          xmid: checkData.xmId
        }
      })
      //   调用接口
      const res = await saveXjjzRecord({
        saveDatas: selectedData,
        sqdType: sqdType.value,
        protypeId: protypeId
      })
      if (!res.success) throw new Error(res.msg)
      //   关闭所有窗口
      handleClose()
      if (searchData.value) searchData.value()
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  }
}

const { checkChangeHandle, checkChangeAllHandle, cellStyle, tableData, checkedData, cellClickHandle } = operation(tableRef)

const handleClose = () => {
  searchRef.value.resetFields()
  resetForm()
  publicParams.value = {
    bmId: '',
    nd: '',
    protypeId: '',
    dwId: '',
    userId: '',
    specialorgcode: '',
    fqzz: '',
    spRoleId: ''
  }
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
@import url(css/index);
</style>
