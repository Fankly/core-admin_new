<!-- 查看审核情况 -->
<template>
  <div>
    <vxe-modal
      resize
      show-zoom
      v-model="isShowModel"
      :destroy-on-close="true"
      :title="`审核情况`"
      :width="1400"
      :height="500"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div class="modal_content">
        <div class="export_btn">
          <el-button size="mini" type="primary" plain @click="handleExport" :disabled="tableData.length === 0">导 出</el-button>
        </div>
        <div class="modal_table">
          <el-table v-loading="loading" :data="tableData" border stripe height="100%" size="mini" :cell-style="cellStyle">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="deptid" label="部门" width="90" align="center" show-overflow-tooltip />
            <el-table-column prop="username" label="姓名" width="90" align="center" show-overflow-tooltip />
            <el-table-column prop="yjdw" label="一级单位" width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="ejdw" label="二级单位" width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="hasReviewed" label="是否已审核" width="90" align="center" :formatter="formatReviewed" />
            <el-table-column prop="opinion" label="审核结果" width="90" align="center" :formatter="formatOpinion" />
            <el-table-column prop="reason" label="工作量及内容意见" min-width="200" show-overflow-tooltip />
            <el-table-column prop="djReason" label="单价意见" min-width="160" show-overflow-tooltip />
            <el-table-column prop="sszqReason" label="实施周期意见" min-width="160" show-overflow-tooltip />
            <el-table-column prop="updateTime" label="更新时间" width="150" align="center" />
          </el-table>
        </div>
      </div>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'modalViewAudit'
}
</script>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStaffReviewStatusByXmId } from '@/api/service/xmcs/index'
import { exportXlsx } from '@/utils/export'

const isShowModel = ref<boolean>(false)
const loading = ref<boolean>(false)
const tableData = ref<any[]>([])

// 是否已审核列格式化
const formatReviewed = (row: any) => {
  return row.hasReviewed == '1' ? '已审核' : '未审核'
}

// 审核结果列格式化（opinion 字段后端已码值翻译为中文，未审核时为空则显示 "-"）
const formatOpinion = (row: any) => {
  return row.opinion || '-'
}

// "是否已审核"列着色
const cellStyle = ({ column, row }: any) => {
  if (column.property == 'hasReviewed') {
    if (row.hasReviewed == '1') {
      return { color: '#67c23a', fontWeight: 'bold' }
    }
    return { color: '#909399' }
  }
}

const acceptParams = async (param: any) => {
  isShowModel.value = true
  loading.value = true
  tableData.value = []
  try {
    const res: any = await getStaffReviewStatusByXmId({ xmid: param.xmid })
    if (res.success) {
      tableData.value = res.data || []
    } else {
      ElMessage.error(res.msg || '查询失败')
    }
  } finally {
    loading.value = false
  }
}

const closeHandle = () => {
  isShowModel.value = false
  tableData.value = []
}

// 导出（纯前端，exceljs）
const handleExport = () => {
  const headerList = ['部门', '姓名', '一级单位', '二级单位', '是否已审核', '审核结果', '工作量及内容意见', '单价意见', '实施周期意见', '更新时间']
  const dataList = tableData.value.map((row: any) => ({
    deptid: row.deptid || '',
    username: row.username || '',
    yjdw: row.yjdw || '',
    ejdw: row.ejdw || '',
    hasReviewed: row.hasReviewed == '1' ? '已审核' : '未审核',
    opinion: row.opinion || '-',
    reason: row.reason || '',
    djReason: row.djReason || '',
    sszqReason: row.sszqReason || '',
    updateTime: row.updateTime || ''
  }))
  exportXlsx(headerList, dataList, '审核情况.xlsx')
}

defineExpose({ acceptParams })
</script>
<style scoped lang="less">
.modal_content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}
.modal_table {
  flex: 1;
  min-height: 0;
}
</style>
