<template>
  <vxe-modal
    @close="closeHandle"
    position="center"
    v-model="modalVisible"
    width="1100"
    height="640"
    title="修改事项"
    destroy-on-close
    :mask-closable="false"
    :loading="loading"
    show-zoom
    fullscreen
    resize
    transfer
  >
    <div class="matter-modal">
      <div class="matter-modal__toolbar">
        <el-button plain type="primary" size="small" :loading="loading" @click="submitHandle">确 认</el-button>
        <el-button plain type="primary" size="small" @click="closeHandle">取 消</el-button>
      </div>
      <div class="matter-modal__search">
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
                <el-button :loading="loading" type="primary" size="small" plain @click="searchHandle">查 询</el-button>
                <el-button :loading="loading" type="primary" size="small" plain @click="resetHandle">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="matter-modal__table">
        <vxe-table
          resizable
          ref="tableRef"
          border
          stripe
          show-overflow
          align="center"
          header-align="center"
          :row-config="{ height: 32, keyField: 'id' }"
          :radio-config="{ highlight: true, trigger: 'row' }"
          :data="tableDataList"
          height="100%"
        >
          <vxe-column width="50" type="radio"></vxe-column>
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
          <vxe-column field="statusName" width="120" title="状态"></vxe-column>
          <vxe-column field="remark" width="220" title="预算事项说明"></vxe-column>
        </vxe-table>
      </div>
      <div class="matter-modal__pager">
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
  </vxe-modal>
</template>

<script setup lang="ts">
import TreeSelect from '@/components/select/TreeSelect.vue'
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getGkbmInProvince, getSjflList, getSubProtypeTree, getYjflList } from '@/api/common'
import { getMatterBasicData, SearchData } from '@/api/matter/matterBasic'
import { ClassifyData } from '@/views/statistics/interface/CostRelatedItemsInterface'
import { modifyMatter } from '@/api/service/Storage/Outbound'
import VXETable from 'vxe-table'

interface Parameter {
  selectData: Record<string, any>[] | null
  specialorgid: string
}

const emit = defineEmits(['submitAfter'])

const formRef = ref()
const tableRef = ref()
const proTypeRef = ref()

const loading = ref(false)
const modalVisible = ref(false)

const parameter = ref<Parameter>({
  selectData: null,
  specialorgid: ''
})

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

const tableDataList = ref()

const page = reactive({
  total: 0,
  limit: 20,
  page: 1
})

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
      ElMessage({ type: 'error', message: res.msg })
    }
  })
}

// 获取省归口部门
const getProGkbmData = async () => {
  const res = await getGkbmInProvince()
  if (res.success) {
    searchList.gkbmList = res.data
  } else {
    ElMessage({ type: 'error', message: res.msg })
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
    ElMessage({ type: 'error', message: res.msg })
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
      ElMessage({ type: 'error', message: res.msg })
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
  proTypeRef.value?.clearSelect()
  clearDataHandle()
  formRef.value?.resetFields()
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
      specialorgid: parameter.value.specialorgid
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

const initSearchList = () => {
  getProjectData()
  getProGkbmData()
  getYjflData()
}

const submitHandle = async () => {
  try {
    const selectRecord = tableRef.value?.getRadioRecord?.()
    if (!selectRecord) {
      ElMessage.warning('请选择一条预算事项数据!')
      return
    }
    const xmIds = (parameter.value.selectData || []).map((item) => item.id)
    if (xmIds.length === 0) {
      ElMessage.warning('未获取到项目数据，无法修改!')
      return
    }
    const type = await VXETable.modal.confirm('确认是否修改事项?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return
    loading.value = true
    const res = await modifyMatter({
      xmIds,
      yssxId: selectRecord.id
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('修改事项成功!')
    emit('submitAfter')
    closeHandle()
  } catch (e: any) {
    if (e && e.message) {
      ElMessage.error(e.message)
    }
  } finally {
    loading.value = false
  }
}

const clearParameter = () => {
  searchData.zyssxbm = ''
  searchData.zyssxmc = ''
  searchData.zgkbmId = ''
  searchData.yjfl = ''
  if (searchData.xmlxs) searchData.xmlxs.length = 0
  if (searchData.sjfls) searchData.sjfls.length = 0
  searchData.ejfl = ''
  searchData.nd = ''
  searchList.ejflList = []
  searchList.sjflList = []
  tableDataList.value = []
  page.page = 1
  page.total = 0
  parameter.value.selectData = null
  parameter.value.specialorgid = ''
}

const closeHandle = () => {
  clearParameter()
  modalVisible.value = false
}

// 接收父组件参数
const acceptParams = (params: Parameter) => {
  parameter.value = { ...parameter.value, ...params }
  page.page = 1
  modalVisible.value = true
  initSearchList()
  searchHandle()
}

defineExpose({
  acceptParams
})
</script>

<style lang="less" scoped>
.matter-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__toolbar {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  &__search {
    flex: 0 0 auto;
  }

  &__table {
    flex: 1;
    min-height: 0;
    flex-grow: 1;
  }

  &__pager {
    flex: 0 0 auto;
    margin-top: 10px;
  }

  .operation {
    margin-bottom: 10px;
  }
}
</style>
