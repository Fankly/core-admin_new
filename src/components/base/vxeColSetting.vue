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

<script setup lang="ts" name="vxeColSetting">
import { ref } from 'vue'
import { VxeGridInstance } from 'vxe-table'

const props = defineProps<{ colSetting: any[]; gridRef: VxeGridInstance | undefined }>()
const emit = defineEmits<{
  (event: 'column-visibility-change', field: string, visible: boolean): void
}>()

const drawerVisible = ref<boolean>(false)

const openColSetting = () => {
  drawerVisible.value = true
}

const changeData = async (visible: boolean, field: string) => {
  if (props.gridRef) {
    const column = props.gridRef?.getColumnByField(field)
    if (column) column.visible = visible
    await props.gridRef?.refreshColumn()
    emit('column-visibility-change', field, visible)
  }
}

defineExpose({
  openColSetting
})
</script>

<style scoped lang="scss">
.cursor-move {
  cursor: move;
}
.col-table {
  height: calc(100vh - 70px);
}
</style>
