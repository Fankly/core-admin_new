<template>
  <!-- 列设置 -->
  <el-drawer v-model="drawerVisible" title="列设置" size="450px">
    <div class="col-table">
      <el-table height="100%" :data="colSetting" :border="true" row-key="prop" default-expand-all :tree-props="{ children: '_children' }">
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

<script lang="ts">
export default {
  name: 'ColSetting'
}
</script>

<script setup lang="ts" name="ColSetting">
import { ref } from 'vue'

defineProps<{ colSetting: any[] }>()

const drawerVisible = ref<boolean>(false)

const openColSetting = () => {
  drawerVisible.value = true
}

defineExpose({
  openColSetting
})
</script>

<style scoped lang="less">
.cursor-move {
  cursor: move;
}
.col-table {
  height: calc(100vh - 70px);
}
</style>
