<!-- 版本下发单位管理 -->
<template>
  <div>
    <vxe-modal
      resize
      show-zoom
      v-model="isShowModel"
      :destroy-on-close="true"
      title="版本下发单位配置"
      :width="900"
      :close-on-press-escape="false"
      @close="closeHandle"
    >
      <div style="height: 60vh">
        <proTable
          :cell-style="columnStyle"
          row-key="id"
          ref="proTableRef"
          @row-click="handlerCilck"
          :data="dataList"
          sortable:search-col="4"
          :columns="tableColumns"
          :pagination="false"
          :toolButton="['other']"
        >
          <template #tableHeader="scope">
            <el-button v-show="versionStatus?.status == '1'" type="primary" size="mini" plain @click="handlerBtn('add', scope.selectedList)"
              >选择下发单位</el-button
            >
            <el-button
              v-show="versionStatus?.status == '1'"
              type="primary"
              size="mini"
              plain
              @click="handlerBtn('del', scope.selectedList)"
              :disabled="!scope.isSelected"
              >删 除</el-button
            >
            <el-button type="primary" size="mini" plain @click="handlerBtn('sort', scope.selectedList)">保存排序</el-button>
          </template>
        </proTable>
      </div>
    </vxe-modal>
  </div>
  <chooseTree ref="treeModalRef" @choose-data="saveTree" />
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineProps, defineExpose, reactive, nextTick } from 'vue'
import { ElMessageBox, ElMessage, ElInput } from 'element-plus'
import { h } from 'vue'
import { getDwTree, saveDw, pageDw, removeDw, updateDispOrder } from '@/api/service/balanceReporting/index'

import { saveDwYs, pageDwYs, removeDwYs, updateDispOrderYs, getDwTreeYs } from '@/api/lslxJsc/index'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ColumnProps } from '@/components/ProTable/interface'
import chooseTree from '@/components/select/chooseTree.vue'

//接收父组件传参
const props = defineProps({
  specialorgid: {
    type: String,
    default: ''
  }
})
const isType = ref<any>('')
const isShowModel = ref(false)
const treeModalRef = ref()
const proTableRef = ref()
const versionStatus = ref<any>() //版本信息
const dataList = ref<[]>([]) //单位数据
const oldlist = ref<any>([]) //单位数据深拷贝
const UNIT_API_MAP = {
  default: {
    page: pageDw,
    save: saveDw,
    remove: removeDw,
    updateDispOrder: updateDispOrder,
    getTree: getDwTree
  },
  ys: {
    page: pageDwYs,
    save: saveDwYs,
    remove: removeDwYs,
    updateDispOrder: updateDispOrderYs,
    getTree: getDwTreeYs
  }
}
const getUnitApis = () => (isType.value == '1' ? UNIT_API_MAP.ys : UNIT_API_MAP.default)
const getCheckedDwIds = () => (dataList.value ? dataList.value.map((item: any) => item.dwId) : [])
const pageMeeting = async () => {
  if (versionStatus.value) {
    const params = { versionId: versionStatus.value?.versionId, page: 1, limit: 100 }
    let res: any = await getUnitApis().page(params)
    if (res.success) {
      const records = res.data?.records || []
      records.forEach((item: any) => {
        item.versionNo = versionStatus.value?.versionNo
        item.versionName = versionStatus.value?.versionName
      })
      dataList.value = records
      oldlist.value = JSON.parse(JSON.stringify(records))
      proTableRef.value?.clearSelection?.()
    } else {
      ElMessage.error(res.msg)
    }
  }
}
const saveTree = async (val: any) => {
  const params = {
    versionId: versionStatus.value?.versionId,
    dwIdList: val
  }
  let res: any = await getUnitApis().save(params)
  if (res.success) {
    ElMessage.success('下发单位添加成功！')
    treeModalRef.value?.closeModalHandle?.()
    await pageMeeting()
  } else {
    ElMessage.error(res.msg)
  }
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (column.label != '显示顺序') {
    return 'background-color:rgba(232, 234, 236,0.5);cursor: pointer;'
  }
}
// 单选
const handlerCilck = (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 按钮点击事件
const handlerBtn = async (val: any, selectedList: any) => {
  if (val == 'add') {
    let res: any = await getUnitApis().getTree(props.specialorgid)
    if (res.success) {
      treeModalRef.value.title = '选择下发单位'
      treeModalRef.value.treeModal = true
      treeModalRef.value.treeDataList = res.data
      treeModalRef.value.checkedKeys = getCheckedDwIds()
    } else {
      ElMessage.error(res.msg)
    }
  } else if (val == 'del') {
    if (selectedList.length == 0) {
      return ElMessage.warning('请选择数据')
    }
    ElMessageBox.confirm('确定要删除所选单位？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const Ids = selectedList.map((item: any) => item.id)
        let res: any = await getUnitApis().remove(Ids)
        if (res.success) {
          ElMessage.success('下发单位删除成功！')
          await pageMeeting()
        } else {
          ElMessage.error(res.msg)
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  } else {
    const changeData = dataList.value.filter(
      (item: any, index: any) => item.id == oldlist.value[index]?.id && item.dispOrder != oldlist.value[index]?.dispOrder
    )
    if (changeData.length == 0) {
      return ElMessage.warning('当前没有修改的数据')
    }
    let res: any = await getUnitApis().updateDispOrder(changeData)
    if (res.success) {
      ElMessage.success('单位排序更新成功！')
      await pageMeeting()
    } else {
      ElMessage.error(res.msg)
    }
  }
}
// 关闭单位弹窗
const closeHandle = () => {
  isShowModel.value = false
}
// 列表项
const tableColumns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'versionNo', label: '版本编号', width: '130' },
  { prop: 'versionName', label: '版本名称', width: '200' },
  { prop: 'dwName', label: '单位名称' },
  {
    prop: 'dispOrder',
    label: '显示顺序',
    width: '120',
    headerRender: () => {
      return h('i', { class: 'el-icon-edit-outline' }, '显示顺序')
    },
    render: ({ row }: any) => {
      return h(ElInput, {
        modelValue: row.dispOrder,
        'onUpdate:modelValue': (val: any) => (row.dispOrder = val),
        inputStyle: { border: '1px solid #fff;', textAlign: 'center' }
      })
    }
  }
])
// 子组件暴露方法到父组件
defineExpose({
  isShowModel,
  versionStatus,
  pageMeeting,
  isType
})
</script>
