<template>
  <div class="operation">
    <div class="left">
      <el-button :disabled="isLoading" type="primary" size="mini" plain @click="DetailViewHandle">明细查看</el-button>
      <el-button type="primary" size="mini" plain :disabled="disabled" @click="expandHandle">一键展开</el-button>
      <el-button :disabled="isLoading" type="primary" size="mini" plain @click="pageExportHandle" v-permission="'PAGEEXPORT'">按页面导出</el-button>
      <el-button :disabled="disabledExport" type="primary" size="mini" plain @click="() => exportHandle('EXPORT')" v-permission="'EXPORT'"
        >导 出</el-button
      >
    </div>
    <div class="right">
      <ToolbarButtons :tool-button="['help']" @help-click="getHelpMessageHandle" />
    </div>
  </div>
  <HelpModal ref="helpModalRef" />
</template>

<script lang="ts">
export default {
  name: 'Header'
}
</script>

<script setup lang="ts">
import HelpModal from '@/components/HelpModal/index.vue'
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { ref, computed, defineEmits, defineExpose, defineProps, withDefaults } from 'vue'

interface Props {
  helpMessage: string
}

const emits = defineEmits(['pageExportData', 'exportApiData', 'onDetailView', 'expandData'])

const props = withDefaults(defineProps<Props>(), {
  helpMessage: ''
})

const isDisabled = ref(false)
const helpModalRef = ref()
const isLoaded = ref(false)
const isExported = ref(false)

const disabled = computed(() => isLoaded.value || isDisabled.value)

const disabledExport = computed(() => isLoaded.value || isExported.value)

const isLoading = computed(() => isLoaded.value)

const pageExportHandle = () => {
  emits('pageExportData')
}

const exportHandle = (flag: string) => {
  emits('exportApiData', flag)
}

const DetailViewHandle = () => {
  emits('onDetailView')
}

// 展开
const expandHandle = async () => {
  emits('expandData')
}

// 获取帮助信息
const getHelpMessageHandle = () => {
  helpModalRef.value.showModal = true
}

defineExpose({
  isDisabled,
  isLoaded,
  isExported
})

// emits.on("isExport", (val) => {
//   isExport.value = val;
// });

// emits.on("isDisable", (val) => {
//   isDisabled.value = val;
// });

// emits.on("isLoad", (val) => {
//   isLoaded.value = val;
// });
</script>

<style scoped lang="less">
.operation {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  .left {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .right {
    text-align: right;
    width: 100px;
  }
}
</style>
