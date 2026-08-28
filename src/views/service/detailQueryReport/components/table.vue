<template>
  <div>
    <div style="height: 80vh" v-loading="loading">
      <proTable
        ref="proTableRef"
        @search="searchHandle"
        @reset="resetHandle"
        :data-callback="pageList"
        :request-api="pageMeeting"
        :request-auto="props.tableType != '3'"
        :search-col="4"
        :columns="props.columnsTable"
      >
        <template #tableHeader="scope">
          <el-button type="primary" size="mini" plain @click="handlerBtn(scope.selectedList)"
            >导 出</el-button
          >
        </template>
      </proTable>
    </div>
  </div>
</template>
<script lang="tsx">
export default {
  name: '/service/detailQueryReport/components/table'
}
</script>
<script setup lang="tsx">
import { ElNotification, ElMessage } from 'element-plus'
import { onMounted, ref, reactive, defineExpose, defineEmits, defineProps } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import {
  erpXhDetailPage,
  erpXhDetailExport,
  xmcbzyDetailPage,
  xmcbzyDetailExport,
  fyfjDetailPageByDw,
  fyfjDetailExportByDw,
  fyfjDetailPageByBm,
  fyfjDetailExportByBm,
  fyfjDetailPageByDwph,
  fyfjDetailExportByDwph
} from '@/api/service/detailQueryReport/index' //公共代码

const props = defineProps<{ columnsTable: any[]; tableType: string; fileName: string }>()

const emits = defineEmits(['reset'])

const loading = ref<boolean>(false)
const type = ref<string>('')
const proTableRef = ref() //按项目类型ref
// 按类型列表项
const columnsTable = ref<any[]>([])
const parmasData = ref<any>()
const dwId = ref()

// 搜索
const searchHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
  if (props.tableType) {
    emits('reset', { type: 'RESET' })
  }
}

// 导出
const handlerBtn = (selectedList: any) => {
  loading.value = true
  const api: any =
    props.tableType == '2'
      ? xmcbzyDetailExport
      : props.tableType == '3'
      ? fyfjDetailExportByDw
      : props.tableType == '4'
      ? fyfjDetailExportByBm
      : props.tableType == '5'
      ? fyfjDetailExportByDwph
      : erpXhDetailExport
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  api(parmasData.value)
    .then((res: any) => {
      const blob = res
      let dom = document.createElement('a')
      let url = window.URL.createObjectURL(blob)
      dom.href = url
      // 获取文件名
      let filename = `${props.fileName}.xlsx`
      dom.download = `${decodeURI(decodeURI(filename))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
      loading.value = false
    })
    .catch((error: any) => {
      ElMessage.error(error)
    })
}
// 接口调用
const pageMeeting = (params: any) => {
  const api: any =
    props.tableType == '2'
      ? xmcbzyDetailPage
      : props.tableType == '3'
      ? fyfjDetailPageByDw
      : props.tableType == '4'
      ? fyfjDetailPageByBm
      : props.tableType == '5'
      ? fyfjDetailPageByDwph
      : erpXhDetailPage
  parmasData.value = {}
  if (props.tableType == '2') {
    if (params.yd && !params.nd) {
      return ElMessage.warning('请选择年度')
    }
  }
  if (props.tableType == '3') {
    params.dwId = dwId.value
  }
  for (const key in params) {
    if (!['limit', 'page'].includes(key)) {
      parmasData.value[key] = params[key]
    }
  }
  return api(params)
}
// 数据处理回调
const pageList = (val: any) => {
  loading.value = false
  if (val && val != null) {
    if (props.tableType == '2') {
      val.records.forEach((item: any) => {
        item.yjdwName = item.yjdw
        item.ejdwName = item.ejdw
        item.cbzxName = item.cbzx
      })
    }
    if (['3', '4', '5'].includes(props.tableType)) {
      val.records.forEach((item: any) => {
        item.busiTypeName = item.busiType
        item.kmlxName = item.kmlx
        item.statusName = item.status
      })
    }
  } else {
    ElMessage.error('请重试！')
  }

  return val
}
defineExpose({
  columnsTable,
  loading,
  type,
  proTableRef,
  dwId,
  pageMeeting
})
</script>
