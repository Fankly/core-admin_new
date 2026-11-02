<template>
  <div class="analysis">
    <div class="analysis__body card-container">
      <div @click="() => handleSelect(item)" :key="index" v-for="(item, index) in dataList" class="card-item">
        <div class="card-left">
          <div class="card-title">
            <TextOverHiddenTooltip :text="item.diffName" />
          </div>
          <div class="card-details">
            <span>
              <TextOverHiddenTooltip :text="item.diffDeptName" />
            </span>
            <!-- <span>
              <TextOverHiddenTooltip :text="item.diffProjectLead" />
            </span> -->
            <!-- <span>
              <TextOverHiddenTooltip :text="item.diffDate" />
            </span> -->
          </div>
        </div>
        <div class="card-right">
          <span class="danger">{{ item.vectorScore }}%</span>
        </div>
        <span class="status">
          <base-tag class="status--tag" size="small" :type="getType(item.projectReserveStatus)">{{ getStatus(item.projectReserveStatus) }}</base-tag>
          <!-- {{ReserveTypeDict.getValue(item.projectReservestatus)}} -->
          <!-- {{item.projectReservestatus == 0 ? '审批中':'上报审批中'}} -->
        </span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { CwProjectDiff, CwProject } from '@/api/mainController'
import { reactive, toRef, toRefs, watch, onMounted, getCurrentInstance } from 'vue'
defineOptions({
  name: 'similarAnalysis'
})
const componentProps = defineProps({
  projectId: {
    type: String
  }
})
const emit = defineEmits()
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
  dataList: [],
  reserveStatus: []
})
const dataList = toRef(componentData, 'dataList')
const reserveStatus = toRef(componentData, 'reserveStatus')
function getStatus(projectReserveStatus) {
  return componentData.reserveStatus.find((item) => item.key == projectReserveStatus)?.value
}
function getReserveStatus() {
  CwProject.reserveStatus(componentInstance, {}).then((res) => {
    componentData.reserveStatus = res.data
  })
}
function handleSelect(item) {
  emit('on-select', item)
}
function getType(type) {
  let _type = 'primary'
  switch (+type) {
    case componentInstance.ReserveTypeDict.CREATE:
      _type = 'info'
      break
    case componentInstance.ReserveTypeDict.REJECTED || componentInstance.ReserveTypeDict.DELAYED:
      _type = 'warning'
      break
    case componentInstance.ReserveTypeDict.FINISHED:
      _type = 'success'
      break
    case componentInstance.StatusReserveDict.PRE_REVIEW_COMPLETED:
      _type = 'success'
      break
  }
  return _type
}
function getList() {
  CwProjectDiff.list(componentInstance, {
    cwProjectDiffDtoFilter: {
      projectId: componentProps.projectId
    }
  }).then((res) => {
    const { dataList = [] } = res.data
    emit('update:data', dataList)
    componentData.dataList = dataList

    // this.dataValue = {
    //   projectOutcome: JSON.parse(projectOutcome),
    //   history: JSON.parse(history),
    //   ...otherValues
    // }
  })
}
watch(
  () => componentProps.projectId,
  function (val, oldVal) {
    if (val && oldVal && val != oldVal) {
      getList()
    }
  },
  {
    deep: true
  }
)
onMounted(() => {
  getList()
})
;(() => {
  getReserveStatus()
})()
defineExpose({
  getStatus,
  getReserveStatus,
  handleSelect,
  getType,
  getList,
  ...toRefs(componentData)
})
</script>
<style lang="less" scoped>
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
}

.card-item {
  flex: 1 1 calc((100% - 20px) / 3); /* 计算让 3 个 item 均分整行 */
  height: 115px;
  background: #ffffff;
  border-radius: 8px;
  border: 2px solid transparent;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  padding: 12px;
  transition: all 0.3s ease-in-out;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  .status {
    position: absolute;
    top: 10px;
    right: 10px;
    // .el-tag{
    //   color:#0092FF;
    //   border-color:#b3d8ff;
    // }
  }

  /* 左侧内容 */
  .card-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    margin-right: 10px;
  }

  /* 标题：绿色，大字体 */
  .card-title {
    font-size: 17px;
    font-weight: bold;
    color: @--color-primary;
    text-decoration: underline;
  }

  /* 左侧 3 行小文本 */
  .card-details {
    font-size: 12px;
    color: #666;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* 右侧文字（居中对齐） */
  .card-right {
    // width: 80px; /* 固定宽度，避免过度紧贴 */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: bold;
    color: @--color-success;
    .warning {
      color: @--color-warning;
    }
    .danger {
      color: @--color-danger;
    }
  }

  /* 悬浮交互 */
  &:hover {
    border-color: @--color-primary;
    box-shadow: 4px 4px 12px rgba(0, 128, 0, 0.2);
    transform: translateY(-4px);
  }
}

/* 解决最后一行单个 item 居中的问题 */
.card-container::after {
  content: '';
  flex-grow: 999; /* 让最后一行的空位不会导致 item 拉伸 */
  width: 0;
}

.analysis {
  height: 100%;
  display: flex;
  flex-direction: column;
  &__body {
    // flex:1;
    overflow: auto;
  }
  &__bottom {
    height: 30px;
    line-height: 30px;
    text-align: right;
    color: @--color-primary;
    font-weight: 400;
  }
}
</style>
