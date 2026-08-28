<template>
  <div class="header">
    <div v-if="isShowPage" class="left">
      <el-button v-permission="'ADD'" plain size="mini" type="primary" @click="addOrEditDataHandle('ADD')">新 增</el-button>
      <el-button v-permission="'EDIT'" plain size="mini" type="primary" @click="addOrEditDataHandle('EDIT')">修 改</el-button>
      <el-button v-permission="'DELETE'" plain size="mini" type="primary" @click="delDataHandle">删 除</el-button>
    </div>
    <div class="right">
      <div class="filters">
        <div class="filter-item">
          <span>年度：</span>
          <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
            <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
          </el-select>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: '/goalValue/customGoalValue/components/ConfigHeader'
}
</script>

<script setup lang="ts">
import { computed, defineEmits, defineExpose, defineProps, onMounted, reactive, watch } from 'vue'
import { getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'

interface Props {
  showPage: boolean
}

interface YearData {
  yearCode: string
  yearName: string
}

const emits = defineEmits(['changeNd', 'addData', 'deleteData'])

const props = defineProps<Props>()

const isShowPage = computed(() => props.showPage)

const formData = reactive({
  nd: ''
})

const pageInfo = reactive<{
  ndDataList: YearData[]
}>({
  ndDataList: []
})

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

const initDefaultValue = () => {
  formData.nd = new Date().getFullYear().toString()
}

const addOrEditDataHandle = (flag: string) => {
  emits('addData', flag)
}

const delDataHandle = () => {
  emits('deleteData')
}

watch(
  () => formData.nd,
  (newVal) => {
    emits('changeNd', newVal)
  }
)

const initParams = async () => {
  await getYearDataList()
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
