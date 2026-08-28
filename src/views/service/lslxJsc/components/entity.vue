<!-- 版本下发单位/专业管理 -->
<template>
  <div>
    <vxe-modal
      resize
      show-zoom
      :title="title"
      v-model="isShowModel"
      :destroy-on-close="true"
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
          :columns="btnName == '选择下发单位' ? tableColumns : ZgkbmColumns"
          :pagination="false"
        >
          <template #tableHeader="scope">
            <el-button
              v-show="versionStatus?.status == '1' || versionStatus?.zgkbmIssueStatus!='1'"
              type="primary"
              size="mini"
              plain
              @click="handlerBtn('add', scope.selectedList)"
              >{{ btnName }}</el-button
            >
            <el-button
              v-show="versionStatus?.status == '1' || versionStatus?.zgkbmIssueStatus!='1'"
              type="primary"
              size="mini"
              plain
              @click="handlerBtn('del', scope.selectedList)"
              :disabled="!scope.isSelected"
              >删 除</el-button
            >
            <el-button
              type="primary"
              size="mini"
              plain
              v-if="btnName == '选择下发单位'"
              @click="handlerBtn('sort', scope.selectedList)"
              >保存排序</el-button
            >
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
import { ref, defineProps, defineEmits, defineExpose, reactive, nextTick } from 'vue'
import { ElMessageBox, ElMessage, ElInput } from 'element-plus'
import { h } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ColumnProps } from '@/components/ProTable/interface'
import chooseTree from '@/components/select/chooseTree.vue'
interface propsvo {
  title: string
  specialorgid: string
  tableApi: (params: any) => Promise<any> //表格数据
  treeApi: (params: any) => Promise<any> //树结构
  saveApi: (params: any) => Promise<any> //保存接口
  removeApi: (params: any) => Promise<any> //删除接口
  orderApi: (params: any) => Promise<any> //排序接口
}
//接收父组件传参
const props = defineProps<propsvo>()
const btnName = ref<any>('')
const isShowModel = ref(false)
const treeModalRef = ref()
const proTableRef = ref()
const versionStatus = ref<any>() //版本信息
const dataList = ref<[]>([]) //单位数据
const oldlist = ref<any>([]) //单位数据深拷贝
const pageMeeting = async () => {
  if (versionStatus.value && props.tableApi) {
    const params = { versionId: versionStatus.value?.versionId, page: 1, limit: 100 }
    let res: any = await props.tableApi(params)
    if (res.success) {
      res.data.records.forEach((item: any) => {
        item.versionNo = versionStatus.value?.versionNo
        item.versionName = versionStatus.value?.versionName
      })
      dataList.value = res.data.records
      oldlist.value = JSON.parse(JSON.stringify(res.data.records))
      proTableRef.value.clearSelection()
    } else {
      ElMessage.error(res.msg)
    }
  }
}
const saveTree = async (val: any) => {
  const params =
    btnName.value == '选择下发单位'
      ? { versionId: versionStatus.value?.versionId, dwIdList: val }
      : { versionId: versionStatus.value?.versionId, zgkbmIdList: val }
  let res: any = await props.saveApi(params)
  if (res.success) {
    ElMessage.success('添加成功！')
    treeModalRef.value.closeModalHandle()
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
    const id = btnName.value == '选择下发单位' ? props.specialorgid : 'QMYS_ZZJG'
    let res: any = await props.treeApi(id)
    if (res.success) {
      treeModalRef.value.title = btnName.value
      if (btnName.value == '选择下发省专业部门') {
        res.data.forEach((item: any) => {
          item.id = item.code
        })
      }
      treeModalRef.value.showAll = btnName.value == '选择下发省专业部门'
      treeModalRef.value.treeDataList = res.data
      if(btnName=='选择下发单位'){
        treeModalRef.value.checkedKeys = dataList.value.map((item: any) => item.dwId)
      }else{
        treeModalRef.value.checkedKeys = dataList.value.map((item: any) => item.zgkbmId)
      }
 
      treeModalRef.value.treeModal = true
    } else {
      ElMessage.error(res.msg)
    }
  } else if (val == 'del') {
    ElMessageBox.confirm('确定要删除所选数据？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        const Ids = selectedList.map((item: any) => item.id)
        let res: any = await props.removeApi(Ids)
        if (res.success) {
          ElMessage.success('删除成功！')
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
      (item: any, index: any) =>
        item.id == oldlist.value[index].id && item.dispOrder != oldlist.value[index].dispOrder
    )
    if (changeData.length == 0) {
      return ElMessage.warning('当前没有修改的数据')
    }
    let res: any = await props.orderApi(changeData)
    if (res.success) {
      ElMessage.success('排序更新成功！')
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

const ZgkbmColumns = reactive<ColumnProps<any>[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'versionNo', label: '版本编号', width: '130' },
  { prop: 'versionName', label: '版本名称', width: '200' },
  { prop: 'zgkbmName', label: '省专业部门名称' }
])
// 子组件暴露方法到父组件
defineExpose({
  isShowModel,
  versionStatus,
  pageMeeting,
  btnName
})
</script>
