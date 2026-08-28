<template>
  <wide-column :columnTables="columnTables" :nd="nd" :yd="yd" :flag="flag"></wide-column>
</template>

<script setup lang="ts" name="/wideColumn/HTQDHJHZ">
import WideColumn from '@/views/wideColumn/component/wideColumn.vue'
import { onMounted, ref } from 'vue'
import { getDynamicColumn } from '@/api/wideColumn'
import { ElMessage } from 'element-plus'

onMounted(() => {
  initData()
})

const columnTables = ref<any>([])
const nd = ref(true)
const yd = ref(true)
const flag = 'HTQDHJHZ'

const initData = () => {
  getDynamicColumn(flag).then((res) => {
    if (res.success) {
      columnTables.value = res.data.dynamicColumnLits
      //res.data.dynamicColumnLits.hidden 取反
      columnTables.value.forEach((item: any) => {
        item.hidden = !item.hidden
      })
      nd.value = res.data.nd
      yd.value = res.data.yd
    } else {
      ElMessage.error(res.msg)
    }
  })
}
</script>

<style scoped></style>
