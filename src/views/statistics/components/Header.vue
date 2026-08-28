<template>
  <div class="header">
    <div v-if="isShowPage" class="left">
      <el-button
        v-permission="'ADD'"
        plain
        size="mini"
        type="primary"
        @click="addOrEditDataHandle('ADD')"
        >新 增</el-button
      >
      <el-button
        v-permission="'EDIT'"
        plain
        size="mini"
        type="primary"
        @click="addOrEditDataHandle('EDIT')"
        >修 改</el-button
      >
      <el-button v-permission="'DELETE'" plain size="mini" type="primary" @click="delDataHandle"
        >删 除</el-button
      >
      <el-button v-permission="'COPY'" plain size="mini" type="primary" @click="copyHandle"
        >复 制</el-button
      >
    </div>
    <div class="right">
      <div class="year">
        <span>年度：</span>
        <el-select style="width: 110px" v-model="formData.nd" placeholder="请选择年份">
          <el-option
            :key="item.yearCode"
            v-for="item in pageInfo.ndDataList"
            :label="item.yearName"
            :value="item.yearCode"
          ></el-option>
        </el-select>
      </div>
      <div class="help">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
  </div>
  <copyStatConfig
    :busiType="props.busiType"
    ref="copyStatConfigRef"
    :ndList="pageInfo.ndDataList"
    :nd="formData.nd"
  ></copyStatConfig>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: '/statistics/components/Header'
}
</script>
<script setup lang="ts">
import {
  onMounted,
  reactive,
  defineExpose,
  defineEmits,
  watch,
  defineProps,
  computed,
  ref
} from 'vue'
import { getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import copyStatConfig from '@/views/statistics/components/copyStatConfig.vue'

interface Props {
  showPage: boolean
  busiType: string
}

interface List {
  yearCode: string
  yearName: string
}
const copyStatConfigRef = ref()
const helpModalRef = ref()

const emits = defineEmits(['changeNd', 'addData', 'deleteData'])

const props = defineProps<Props>()

const isShowPage = computed(() => props.showPage)

const formData = reactive({
  nd: ''
})

const pageInfo = reactive<{
  [key: string]: List[]
}>({
  ndDataList: []
})

const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

const getYearDataList = async () => {
  let res = await getYearData()
  if (res.success) {
    pageInfo.ndDataList = res.data
    formData.nd = new Date().getFullYear().toString()
  } else {
    ElMessage.error(res.msg)
  }
}

const copyHandle = () => {
  copyStatConfigRef.value.showModal = true
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
    width: 180px;
    text-align: right;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
