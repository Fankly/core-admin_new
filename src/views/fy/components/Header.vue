<template>
  <div class="fy-header">
    <div class="left">
      <el-form :inline="true" v-if="toolButton">
        <el-form-item label="年度：" v-if="isShowTool('nd')">
          <el-select v-model="formParams.nd" placeholder="请选择" @change="changeNdDataHandle">
            <template v-for="item in formParams.ndList" :key="item.yearCode">
              <el-option :label="item.yearName" :value="item.yearCode"></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item class="left-sec" label="小数位数：" v-if="isShowTool('xsws')">
          <el-select v-model="formParams.xsws" @change="changeXswsDataHandle">
            <template v-for="item in formParams.xswsList" :key="item.code">
              <el-option :label="item.name" :value="item.code"></el-option>
            </template>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="right" v-if="isShowTool('dw')">
      <div class="dw">
        <span class="font-style">单位：{{ dwName }}</span>
      </div>
      <div class="help">
        <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
      </div>
    </div>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: 'fyHeader'
}
</script>
<script setup lang="ts">
import { getPublicCodeList, getYearData } from '@/api/common'
import { ElMessage } from 'element-plus'
import { onMounted, withDefaults, defineProps, defineEmits, defineExpose, reactive, ref } from 'vue'
import { FormParams } from '../prearranged/interface'
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'

export interface HeaderData {
  dwName: string
  toolButton?: ('nd' | 'dw' | 'xsws')[] | boolean // 是否显示年度或者单位 ==> 非必传（默认为true）
}
const props = withDefaults(defineProps<HeaderData>(), {
  dwName: '',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  toolButton: true
})

const emit = defineEmits(['changeNd', 'changeXsws'])

const helpModalRef = ref()

const formParams = reactive<FormParams>({
  nd: '',
  xsws: '',
  ndList: [],
  xswsList: []
})

const getHelpMessageHandle = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const initData = async () => {
  let flag = Array.isArray(props.toolButton) ? props.toolButton.includes('nd') : props.toolButton
  let flagXsws = Array.isArray(props.toolButton)
    ? props.toolButton.includes('xsws')
    : props.toolButton
  if (flag) {
    let res = await getYearData()
    if (res.success) {
      formParams.ndList = res.data
      formParams.nd = new Date().getFullYear().toString()
    } else {
      ElMessage.error(res.msg)
    }
  }
  if (flagXsws) {
    let codes = ['XSWS']
    const res = await getPublicCodeList({ codes })
    if (res.success && res.data) {
      formParams.xswsList = res.data['XSWS']
      formParams.xsws = '2'
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const changeNdDataHandle = (val: string) => {
  emit('changeNd', val)
}
const changeXswsDataHandle = (val: string) => {
  let value = ''
  if (val) value = val.split('_')[1]
  emit('changeXsws', value)
}

const isShowTool = (key: 'nd' | 'dw' | 'xsws') => {
  return Array.isArray(props.toolButton) ? props.toolButton.includes(key) : props.toolButton
}

onMounted(initData)

defineExpose({
  formParams
})
</script>

<style scoped lang="less">
.fy-header {
  display: flex;
  height: 40px;
  overflow: hidden;
  position: absolute;
  z-index: 999;
  right: 0;
  top: 0;
  line-height: 40px;
  min-width: auto;
  min-height: auto;

  .left {
    min-width: auto;
    min-height: auto;
    flex: 1;
    :deep(.el-form) {
      min-width: auto;
      min-height: auto;
      height: 39px !important;
      line-height: 39px !important;
      .el-form-item {
        margin: 0 14px 0 0;
        .el-form-item__content {
          width: 102px;
        }
      }
    }
  }

  .right {
    padding-right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .dw {
      margin-right: 10px;
    }
  }
}
.left-sec {
  :deep(.el-form-item__content) {
    width: 60px !important;
  }
}
</style>
