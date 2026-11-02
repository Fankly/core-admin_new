<template>
  <div class="history-version-container">
    <table-box
      id="historyTableBox"
      class="history-table"
      type="card"
      :data="tableImpl.dataList"
      :size="defaultFormItemSize"
      @sort-change="tableImpl.onSortChange"
      @refresh="refreshTable(true)"
    >
      <vxe-column title="序号" type="seq" width="50px" />
      <vxe-column title="版本号" :min-width="120" field="version">
        <template v-slot="scope">
          <span v-if="!scope.row.version">-</span>
          <span v-else>{{ scope.row.version }}</span>
        </template>
      </vxe-column>
      <vxe-column title="效果评分" :min-width="150" field="effectScore">
        <template v-slot="scope">
          <span v-if="!scope.row.effectScore">-</span>
          <el-rate v-else v-model="scope.row.effectScore" :max="5" allow-half show-score text-color="#ff9900" disabled />
        </template>
      </vxe-column>
      <vxe-column title="备注说明" :min-width="250" field="effectScoreRemark" show-overflow>
        <template v-slot="scope">
          <span v-if="!scope.row.effectScoreRemark">-</span>
          <span v-else>{{ scope.row.effectScoreRemark }}</span>
        </template>
      </vxe-column>
      <vxe-column title="绑定模型" :min-width="180" field="bindModel">
        <template v-slot="scope">
          <span v-if="!scope.row.bindModel">-</span>
          <span v-else>{{ ModelTypeDict.getValue(+scope.row.bindModel) }}</span>
        </template>
      </vxe-column>
      <vxe-column title="更新时间" :min-width="180" field="updateTime">
        <template v-slot="scope">
          <span v-if="!scope.row.updateTime">-</span>
          <span v-else>{{ scope.row.updateTime }}</span>
        </template>
      </vxe-column>
      <vxe-column title="状态" :min-width="100" field="status">
        <template v-slot="scope">
          <span v-if="!scope.row.status && scope.row.status !== 0">-</span>
          <base-tag v-else class="status--tag" size="small" :type="getType(+scope.row.status)">{{ getStatus(+scope.row.status) }}</base-tag>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="300" fixed="right">
        <template v-slot="scope">
          <el-button type="primary" link :size="defaultFormItemSize" @click="handleEdit(scope.row)"> 编辑 </el-button>
          <el-button :disabled="scope.row.status == 2" type="primary" link :size="defaultFormItemSize" @click="handleRelease(scope.row)">
            发布生效
          </el-button>
          <el-button type="primary" link :size="defaultFormItemSize" @click="handleScore(scope.row)"> 评分 </el-button>
          <el-button
            v-if="!scope.row.isDefault"
            type="primary" link
            :size="defaultFormItemSize"
            @click="handleDelete(scope.row)"
            class="text-danger"
            :disabled="scope.row.status == 2"
          >
            删除
          </el-button>
        </template>
      </vxe-column>
      <template #pagination>
        <el-row type="flex" justify="end" style="margin-top: 16px">
          <el-pagination
            :total="tableImpl.totalCount"
            :current-page="tableImpl.currentPage"
            :page-size="tableImpl.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next, sizes"
            @current-change="tableImpl.onCurrentPageChange"
            @size-change="tableImpl.onPageSizeChange"
          />
        </el-row>
      </template>
    </table-box>
  </div>
</template>

<script setup>
import { TableWidget } from '@/utils/widget.js'
import { CwAuditPrompt } from '@/api/mainController'
import ScoreDialog from './ScoreDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, toRef, toRefs, onMounted, getCurrentInstance } from 'vue'
defineOptions({
  name: 'HistoryVersion'
})
const componentProps = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  sceneId: {
    type: [String, Number],
    required: true
  }
})
const componentInstance = getCurrentInstance().proxy
const componentData = reactive({
  tableImpl: new TableWidget(loadTableData, loadTableVerify, true, false, 'createTime', false)
})
const tableImpl = toRef(componentData, 'tableImpl')
function getType(status) {
  let _type = 'primary'
  switch (+status) {
    case componentInstance.PromptStatusDict.UNCONFIGURED:
      _type = 'info'
      break
    case componentInstance.PromptStatusDict.INACTIVE:
      _type = 'warning'
      break
    case componentInstance.PromptStatusDict.ACTIVE:
      _type = 'success'
      break
  }
  return _type
}
function getStatus(status) {
  return componentInstance.PromptStatusDict.getList().find((item) => item.id == status)?.name
}
function refreshTable(reloadData = false) {
  if (reloadData) {
    componentData.tableImpl.refreshTable(true, 1)
  } else {
    componentData.tableImpl.refreshTable()
  }
}
function loadTableData(params) {
  params.cwAuditPromptDtoFilter = {
    id: componentProps.id,
    sceneId: componentProps.sceneId
  }
  return new Promise((resolve, reject) => {
    CwAuditPrompt.historyList(componentInstance, params)
      .then((res) => {
        resolve({
          dataList: res.data.dataList,
          totalCount: res.data.totalCount
        })
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function loadTableVerify() {
  return true
}
function handleView(row) {
  ElMessage.info('查看功能待实现')
}
function handleEdit(row) {
  componentInstance.observer?.cancel(true, row.id)
}
function handleRelease(row) {
  ElMessageBox.confirm('确认发布该版本为生效版本？')
    .then(() => {
      const params = {
        cwAuditPromptDto: {
          id: row.id,
          sceneId: componentProps.sceneId
        }
      }
      return CwAuditPrompt.releaseNew(componentInstance, params)
    })
    .then(() => {
      ElMessage.success('发布成功')
      refreshTable(true)
      componentInstance.observer?.cancel(true, row.id)
    })
    .catch(() => {})
}
function handleScore(row) {
  componentInstance.$dialog
    .show(
      '评分',
      ScoreDialog,
      {
        area: ['500px']
      },
      {
        id: row.id,
        score: row.effectScore,
        remark: row.effectScoreRemark
      }
    )
    .then((data) => {
      return CwAuditPrompt.score(componentInstance, {
        cwAuditPromptDtoFilter: {
          id: row.id,
          effectScore: data.effectScore,
          effectScoreRemark: data.effectScoreRemark
        }
      })
    })
    .then(() => {
      ElMessage.success('评分成功')
      refreshTable(true)
    })
    .catch(() => {})
}
function handleDelete(row) {
  ElMessageBox.confirm('确认删除该版本？')
    .then(() => {
      return CwAuditPrompt.deleteBatch(componentInstance, {
        idList: [row.id]
      })
    })
    .then(() => {
      ElMessage.success('删除成功')
      refreshTable(true)
    })
    .catch(() => {})
}
onMounted(() => {
  refreshTable(true)
})
defineExpose({
  getType,
  getStatus,
  refreshTable,
  loadTableData,
  loadTableVerify,
  handleView,
  handleEdit,
  handleRelease,
  handleScore,
  handleDelete,
  ...toRefs(componentData)
})
</script>

<style lang="less" scoped>
.history-version-container {
  padding: 10px;
  height: 100%;

  .history-table {
    height: 100%;
  }

  .text-danger:not(.is-disabled) {
    color: #f56c6c;
  }
}
</style>
