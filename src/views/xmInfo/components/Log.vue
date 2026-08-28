<template>
  <vxe-modal
    height="800"
    width="80%"
    v-bind="$attrs"
    :destroy-on-close="true"
    :loading="loading"
    @show="showHandle"
    @close="closeHandle"
    :title="title"
    v-model="showModal"
    show-zoom
    resize
    position="center"
  >
    <vxe-toolbar>
      <template #buttons>
        <el-button size="mini" plain type="primary" @click="closeHandle">关 闭</el-button>
      </template>
    </vxe-toolbar>
    <el-form label-position="right" label-width="110px" :model="modalData">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-form-item label="修改人名称：">
            <el-input :maxlength="120" v-model="modalData.xgrName" placeholder=""></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="项目类型：">
            <el-input :maxlength="120" v-model="modalData.name" placeholder=""></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="年度：">
            <el-date-picker :clearable="false" v-model="modalData.nd" value-format="YYYY" type="year" placeholder="选择年"></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="修改单位名称：">
            <el-input :maxlength="120" v-model="modalData.dwName" placeholder=""></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="修改时间：">
            <el-date-picker
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="updateTimeHandle"
              style="width: 100%"
              v-model="modalData.xgsj"
              range-separator="至"
              type="daterange"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="6"> </el-col>
        <el-col :span="6" style="text-align: right; margin-bottom: 10px">
          <el-button type="primary" plain size="mini" @click="searchHandle">查 询</el-button>
          <el-button type="primary" plain size="mini" @click="resetHandle">重 置</el-button>
        </el-col>
      </el-row>
    </el-form>
    <div class="table">
      <vxe-table
        :rowConfig="{
          height: 32,
          keyField: 'id'
        }"
        :column-config="{ resizable: true }"
        :border="true"
        align="center"
        show-overflow
        :data="tableInfo.tableData"
        height="100%"
      >
        <vxe-column v-for="item in tableInfo.columns" :field="item.field" :title="item.title" :key="item.field"></vxe-column>
      </vxe-table>
    </div>
    <el-pagination
      class="pageTotal"
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
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'Log'
}
</script>
<script setup lang="ts">
import { getLog } from '@/api/xmInfo/mbz'
import { ElMessage } from 'element-plus'
import { reactive, withDefaults, defineProps, defineEmits, ref, toRef, defineExpose } from 'vue'

interface Props {
  title: string
  nd: string
  specialorgid: string
}

const emit = defineEmits(['close'])

const props = withDefaults(defineProps<Props>(), {
  title: '目标总控制维护日志'
})

const page = reactive({
  total: 0,
  limit: 20,
  page: 1,
  current: '1'
})

const title = toRef(props, 'title')
const showModal = ref(false)
const loading = ref(false)

const modalData = reactive<{
  [key: string]: any
}>({
  name: '',
  nd: '',
  dwName: '',
  xgsj: '',
  xgrName: '',
  xgsjEnd: '',
  xgsjStart: ''
})
const tableInfo = reactive({
  tableData: [],
  columns: [
    {
      field: 'nd',
      title: '年度'
    },
    {
      field: 'name',
      title: '项目类型'
    },
    {
      field: 'xgqValue',
      title: '修改前值'
    },
    {
      field: 'xghValue',
      title: '修改后值'
    },
    {
      field: 'xgr',
      title: '修改人名称'
    },
    {
      field: 'dwName',
      title: '修改单位名称'
    },
    {
      field: 'xgsj',
      title: '修改时间'
    }
  ]
})

const showHandle = () => {
  modalData.nd = props.nd
  searchHandle()
}
const closeHandle = () => {
  showModal.value = false
  resetParams()
  emit('close')
}

const updateTimeHandle = (val: any[]) => {
  // modalData.xgsjStart =
  if (val && val.length) {
    modalData.xgsjStart = val[0]
    modalData.xgsjEnd = val[1]
  } else {
    modalData.xgsjStart = ''
    modalData.xgsjEnd = ''
  }
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

const resetParams = () => {
  page.total = 0
  page.limit = 10
  page.page = 1
  page.current = '1'
  for (const key in modalData) {
    modalData[key] = ''
  }
  modalData.nd = props.nd
  tableInfo.tableData.length = 0
}

const resetHandle = () => {
  resetParams()
  searchHandle()
}

const searchHandle = async () => {
  loading.value = true
  tableInfo.tableData.length = 0
  let parmas: any = {
    ...modalData,
    ...page,
    specialorgid: props.specialorgid
  }
  if ('xgsj' in parmas) delete parmas.xgsj
  let res = await getLog(parmas)
  if (res.success) {
    tableInfo.tableData = res.data.records
    page.total = res.data.total
  } else {
    ElMessage.error(res.msg)
  }
  loading.value = false
}

defineExpose({
  showModal
})
</script>

<style scoped>
.vxe-toolbar {
  padding: 0 !important;
  margin-bottom: 10px;
}

.table {
  height: calc(100% - 181px);
}

.el-select__popper {
  z-index: 3010 !important;
}
</style>
