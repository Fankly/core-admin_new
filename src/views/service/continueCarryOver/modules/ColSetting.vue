<template>
  <!-- 列设置 -->
  <el-drawer v-model="drawerVisible" title="列设置" size="450px">
    <div class="col-table">
      <el-table height="100%" :data="colSetting" :border="true" row-key="prop" default-expand-all :tree-props="{ children: '_children' }">
        <el-table-column prop="title" align="center" label="列名" />
        <el-table-column v-slot="scope" prop="visible" align="center" label="显示">
          <el-switch @change="() => changeData(scope.row.visible, scope.row.field)" v-model="scope.row.visible"></el-switch>
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
import { VxeGridInstance } from 'vxe-table'

const props = defineProps<{ colSetting: any[]; gridRef: VxeGridInstance | undefined }>()

const drawerVisible = ref<boolean>(false)

const openColSetting = () => {
  drawerVisible.value = true
}

const changeData = (visible: boolean, field: string) => {
  if (props.gridRef) {
    const column = props.gridRef?.getColumnByField(field)
    if (column) column.visible = visible
    props.gridRef?.refreshColumn()
  }
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
