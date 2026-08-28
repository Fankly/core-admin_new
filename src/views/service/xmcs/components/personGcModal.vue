<!-- 观察人员维护 -->
<template>
  <vxe-modal show-zoom resize v-model="isShowModel" :destroy-on-close="true" :title="`观察人员维护`" :width="1200" :height="500" @close="closeHandle">
    <proTable
      @search="searchHandle"
      @reset="resetHandle"
      @row-click="handerClickTable"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="pageMeeting"
      :request-auto="true"
      :search-col="4"
      :toolButton="['search']"
      :columns="tableColumns"
      ref="proTableRef"
      height="100%"
    >
      <template #tableHeader="scope">
        <el-button v-if="clickType" size="mini" type="primary" plain @click="seetingPerson">人员设置</el-button>
        <el-button v-else size="mini" :disabled="!scope['isSelected']" type="primary" plain @click="personFp(scope.selectedList)">人员分配</el-button>
      </template>
    </proTable>
  </vxe-modal>
  <UserGcManager :special-org-id="modalParam?.specialorgid" v-model="dialogVisible" ref="userGcManagerRef" @close="getPersonEnum" />
</template>
<script lang="tsx">
export default {
  name: 'personGcModal'
}
</script>
<script setup lang="tsx">
import { ref, reactive, nextTick } from 'vue'
import UserGcManager from '@/views/service/xmcs/components/UserGcManager.vue'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { gcGetStaffPage } from '@/api/service/xmcs/index'
import { getPublicData } from '@/api/common' //公共代码
import { getEjdwList, getYjdwList } from '@/api/matter'
import { ElMessage } from 'element-plus'
const emit = defineEmits(['saveXm'])

const proTableRef = ref()
const isShowModel = ref(false)
const dialogVisible = ref(false)
const modalParam = ref<any>({})
const clickType = ref<boolean>(false)
const yjdwListData = ref<any[]>([])
const ejdwListData = ref<any[]>([])
// 点击行选中
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
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

// 列表查询回调函数
const callBackHandle = (val: any) => {
  return val
}

// 列表查询
const pageMeeting = (params: any) => {
  params['current'] = params['page']
  params['size'] = params['limit']
  params['dwType'] = params['dwType'] || ''
  return gcGetStaffPage({ ...params })
}

const getPersonEnum = async () => {
  if (modalParam.value.specialorgid) {
    proTableRef.value?.getTableList()
  }
}

const seetingPerson = () => {
  dialogVisible.value = true
}

const personFp = (selectedList: any[]) => {
  const staffIds = selectedList.map(({ id }: any) => id)
  emit('saveXm', { staffIds: staffIds, xmIds: modalParam.value?.xmIds || [] })
}

const closeHandle = () => {
  yjdwListData.value.length = 0
  ejdwListData.value.length = 0
  isShowModel.value = false
}

const getYjdwEnum = async () => {
  yjdwListData.value.length = 0 //清空单位
  if (modalParam.value.specialorgid) {
    let res: any = await getYjdwList(modalParam.value.specialorgid)
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
      specialorgid: modalParam.value.specialorgid
    })
    if (!res.success) return ElMessage.error(res.msg)
    ejdwListData.value.push(...res.data)
  }
}

const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', label: '序号', width: 50 },
  {
    prop: 'dwType',
    label: '类型',
    search: {
      el: 'select',
      order: 1
    },
    enum: () => getPublicData('ZXCSGCTYPE_COM'),
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    search: { el: 'select', props: { onChange: changeYjdwHandle }, order: 3 },
    enum: yjdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.yjdwName
    }
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    search: { el: 'select', order: 4 },
    enum: ejdwListData.value,
    fieldNames: { label: 'name', value: 'code' },
    render: ({ row }: any) => {
      return row.ejdwName
    }
  },
  { prop: 'username', label: '人员名单' }
])

const acceptParams = (param: any) => {
  isShowModel.value = true
  clickType.value = param.clickType
  modalParam.value = { ...param }
  if (modalParam.value) {
    getYjdwEnum()
    proTableRef.value?.getTableList()
  }
}

defineExpose({
  acceptParams,
  closeHandle
})
</script>
<style lang="less" scoped>
.top_btn {
  margin-bottom: 10px;
}
</style>
