<template>
  <!-- 列设置 -->
  <el-drawer v-model="drawerVisible" title="列设置" size="min(450px, 100vw)">
    <div class="col-table">
      <el-table height="100%" :data="colSetting" :border="true" :row-key="getColumnKey" default-expand-all :tree-props="{ children: '_children' }">
        <el-table-column prop="label" align="center" label="列名" />
        <el-table-column v-slot="scope" prop="isShow" align="center" label="显示">
          <el-switch v-model="scope.row.isShow"></el-switch>
        </el-table-column>
        <template #empty>
          <div class="table-empty">
            <img src="@/assets/images/notData.png" alt="notData" />
            <div>暂无可配置列</div>
          </div>
        </template>
      </el-table>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ColumnProps } from '../interface'

defineOptions({ name: 'ColSetting' })

defineProps<{ colSetting: ColumnProps[] }>()
const getColumnKey = (column: ColumnProps) => column.prop ?? column.label ?? ''

const drawerVisible = ref<boolean>(false)

const openColSetting = () => {
  drawerVisible.value = true
}

defineExpose({
  openColSetting
})
</script>

<style scoped lang="less">
.col-table {
  height: 100%;
}
</style>
