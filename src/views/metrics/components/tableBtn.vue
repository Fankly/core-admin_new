<!-- 表格按钮和年度 -->
<template>
  <div class="header">
    <div class="left">
      <el-button plain size="mini" type="primary" @click="handlerClick('ADD')">新 增</el-button>
      <el-button plain size="mini" type="primary" @click="handlerClick('EDIT')">编 辑</el-button>
      <el-button plain size="mini" type="primary" @click="handlerClick('DELETE')">删 除</el-button>
      <el-button plain size="mini" type="primary" @click="handlerClick('COPY')">复 制</el-button>
    </div>
    <div class="right">
      <span>年度：</span>
      <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
        <el-option :key="item.yearCode" v-for="item in pageInfo.ndDataList" :label="item.yearName" :value="item.yearCode"></el-option>
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: '/metrics/components/tableBtn'
}
</script>
<script setup lang="ts">
import { onMounted, reactive, defineExpose, defineEmits, watch, ref } from 'vue'
import { getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'

interface List {
  yearCode: string
  yearName: string
}
const copyStatConfigRef = ref()
const emits = defineEmits(['handlerClick', 'changeNd', 'ndList'])
const formData = reactive({ nd: '' })

const pageInfo = reactive<{
  [key: string]: List[]
}>({
  ndDataList: []
})

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    formData.nd = new Date().getFullYear().toString()
    emits('ndList', pageInfo.ndDataList)
  } else {
    ElMessage.error(res.msg)
  }
}

const handlerClick = (val: any) => {
  emits('handlerClick', val)
}

watch(
  () => formData.nd,
  (newVal) => {
    emits('changeNd', newVal)
  },
  { deep: true, immediate: true }
)

const initParams = () => {
  getYearDataList()
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
  padding-bottom: 10px;

  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
    line-height: 32px;
  }

  .right {
    width: 200px;
    text-align: right;
  }
}
</style>
