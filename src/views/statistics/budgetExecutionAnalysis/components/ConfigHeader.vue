<template>
  <div class="header">
    <div v-if="isShowPage" class="left">
      <el-button v-permission="'ADD'" :disabled="actionDisabled" plain size="mini" type="primary" @click="addOrEditDataHandle('ADD')"
        >新 增</el-button
      >
      <el-button v-permission="'EDIT'" :disabled="actionDisabled" plain size="mini" type="primary" @click="addOrEditDataHandle('EDIT')"
        >修 改</el-button
      >
      <el-button v-permission="'DELETE'" :disabled="actionDisabled" plain size="mini" type="primary" @click="delDataHandle">删 除</el-button>
      <el-button v-permission="'COPY'" :disabled="actionDisabled" plain size="mini" type="primary" @click="copyHandle">复 制</el-button>
      <el-button v-permission="'ZBXGL'" :disabled="actionDisabled" plain size="mini" type="primary" @click="indicatorRelationHandle"
        >指标项关联</el-button
      >
    </div>
    <div class="right">
      <div class="filters">
        <div class="filter-item">
          <span>年度：</span>
          <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
            <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
          <span>展示维度：</span>
          <el-select style="width: 180px" v-model="formData.busiType" clearable placeholder="请选择展示维度">
            <el-option :key="item.code" v-for="item in pageInfo.busiTypeList" :label="item.name" :value="item.code"></el-option>
          </el-select>
        </div>
      </div>
      <div class="help">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
  </div>
  <copyStatConfig :busiType="props.busiType" ref="copyStatConfigRef" :ndList="pageInfo.ndDataList" :nd="formData.nd"></copyStatConfig>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/budgetExecutionAnalysis/components/ConfigHeader'
}
</script>

<script setup lang="ts">
import { computed, defineEmits, defineExpose, defineProps, onMounted, reactive, ref, watch } from 'vue'
import { getPublicCodeList, getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import copyStatConfig from '@/views/statistics/components/copyStatConfig.vue'

interface Props {
  showPage: boolean
  busiType: string
}

interface YearData {
  yearCode: string
  yearName: string
}

interface CodeData {
  code: string
  name: string
}

const copyStatConfigRef = ref()
const helpModalRef = ref()

const emits = defineEmits(['changeNd', 'changeBusiType', 'addData', 'deleteData', 'indicatorRelation'])

const props = defineProps<Props>()

const isShowPage = computed(() => props.showPage)
const actionDisabled = computed(() => !props.busiType)

const formData = reactive({
  nd: '',
  busiType: ''
})

const pageInfo = reactive<{
  ndDataList: YearData[]
  busiTypeList: CodeData[]
}>({
  ndDataList: [],
  busiTypeList: []
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) {
    helpModalRef.value.showModal = true
  }
}

const getYearDataList = async () => {
  try {
    let res = await getYearData()
    if (res.success) {
      pageInfo.ndDataList = res.data || []
      return
    }
    pageInfo.ndDataList = []
    ElMessage.error(res.msg)
  } catch {
    pageInfo.ndDataList = []
    ElMessage.error('年度数据加载失败，请稍后重试')
  }
}

const getBusiTypeList = async () => {
  try {
    const res = await getPublicCodeList({
      codes: ['BUDUGET_EXECUTION_ANALYSIS']
    })
    if (res.success && res.data) {
      pageInfo.busiTypeList = res.data['BUDUGET_EXECUTION_ANALYSIS'] || []
      return
    }
    pageInfo.busiTypeList = []
    ElMessage.error(res.msg)
  } catch {
    pageInfo.busiTypeList = []
    ElMessage.error('展示维度加载失败，请稍后重试')
  }
}

const initDefaultValue = () => {
  formData.nd = new Date().getFullYear().toString()
}

const copyHandle = () => {
  if (actionDisabled.value) return
  if (copyStatConfigRef.value) {
    copyStatConfigRef.value.showModal = true
  }
}

const addOrEditDataHandle = (flag: string) => {
  if (actionDisabled.value) return
  emits('addData', flag)
}

const delDataHandle = () => {
  if (actionDisabled.value) return
  emits('deleteData')
}

const indicatorRelationHandle = () => {
  if (actionDisabled.value) return
  emits('indicatorRelation')
}

watch(
  () => formData.nd,
  (newVal) => {
    emits('changeNd', newVal)
  }
)

watch(
  () => formData.busiType,
  (newVal) => {
    emits('changeBusiType', newVal)
  }
)

const initParams = async () => {
  await Promise.all([getYearDataList(), getBusiTypeList()])
  initDefaultValue()
}

defineExpose({
  pageInfo,
  formData
})

onMounted(initParams)
</script>

<style scoped lang="less">
.header {
  box-sizing: border-box;
  display: flex;
  gap: 12px;
  padding-bottom: 10px;

  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
    line-height: 32px;
  }

  .right {
    min-width: 0;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filters {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .filter-item {
    display: flex;
    align-items: center;
    white-space: nowrap;
  }
}
</style>
