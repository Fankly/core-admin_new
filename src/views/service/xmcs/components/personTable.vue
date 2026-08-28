<!-- 人员清单 -->
<template>
  <div>
    <vxe-modal
      ref="modalRef"
      resize
      show-zoom
      v-model="isShowTable"
      :destroy-on-close="true"
      :title="`人员清单`"
      :width="1200"
      :height="500"
      :close-on-press-escape="false"
      @close="closeSxModal"
    >
      <proTable
        ref="proTableRef"
        :data-callback="pageList"
        @search="searchHandle"
        @reset="resetHandle"
        :pagination="false"
        :toolButton="['other']"
        :request-api="pageMeeting"
        :request-auto="true"
        :search-col="4"
        :columns="tableColumns"
        @row-click="handerClickTable"
        height="100%"
      >
        <template #tableHeader="scope">
          <el-button size="mini" type="primary" :disabled="!scope.isSelected" plain @click="deleteData(scope.selectedList)">删 除</el-button>
        </template>
      </proTable>
    </vxe-modal>
  </div>
</template>
<script lang="ts">
export default {
  name: 'personTable'
}
</script>
<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { ElMessage } from 'element-plus'
import { bindStaffSaveDelete, getStaffByXmId } from '@/api/service/xmcs/index'
import { getPublicData } from '@/api/common' //公共代码
import { VXETable } from 'vxe-table'
import { getEjdwList, getYjdwList } from '@/api/matter'

// 子组件
const emit = defineEmits(['pageType'])
const formData = ref<any>({})
const proTableRef = ref() // 初始化页面
const isShowTable = ref<boolean>(false)
const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
// 列表查询
const pageMeeting = (params: any) => {
  const param = {
    ...params,
    ...formData.value
  }
  return getStaffByXmId(param)
}
// 数据回调
const pageList = (val: any) => {
  return val
}
const closeSxModal = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  isShowTable.value = false
}
// 搜索
const searchHandle = () => {
  proTableRef.value?.clearSelection()
}
//重置
const resetHandle = () => {
  ejdwListData.value.length = 0
  proTableRef.value?.clearSelection()
}
// 查看
const deleteData = async (selecList: any) => {
  if (selecList.length == 0) return ElMessage.warning('请选择数据')
  const type = await VXETable.modal.confirm(`确认删除？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const ids = selecList.map(({ id }: any) => id)
  const res: any = await bindStaffSaveDelete({ ids: ids })
  if (!res.success) return ElMessage.error(res.msg)
  ElMessage.success('已删除！')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const getYjdwEnum = async () => {
  yjdwListData.value.length = 0 //清空单位
  if (formData.value.specialorgid) {
    let res: any = await getYjdwList(formData.value.specialorgid)
    if (!res.success) return ElMessage.error(res.msg)
    yjdwListData.value.push(...res.data)
  }
}

const changeYjdwHandle = async (val: string) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  ejdwListData.value.length = 0
  if (val) {
    let res = await getEjdwList({
      parentId: val,
      specialorgid: formData.value.specialorgid
    })
    if (!res.success) return ElMessage.error(res.msg)
    ejdwListData.value.push(...res.data)
  }
}

// 单击行选中当前行
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}

const acceptParams = (param: any) => {
  isShowTable.value = true
  formData.value = { ...param }
  if (formData.value) {
    proTableRef.value?.getTableList()
    getYjdwEnum()
  }
}

const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  {
    prop: 'deptid',
    label: '所属部门',
    search: {
      el: 'select',
      order: 1
    },
    enum: () => getPublicData('ZXCSDEPTTYPE_COM'),
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.deptid
    }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    search: { el: 'select', props: { onChange: changeYjdwHandle }, order: 3 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdw
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    search: { el: 'select', order: 4 },
    enum: ejdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdw
    }
  },
  { prop: 'username', label: '用户姓名' }
])

defineExpose({ acceptParams })
</script>
<style scoped lang="less"></style>
