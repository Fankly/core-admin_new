<!--预计结余版本列表组件 -->
<template>
  <div class="container">
    <div class="right">
      <el-form :inline="true">
        <el-form-item label="年度：">
          <el-select v-model="nd" placeholder="请选择" @change="changeNdDataHandle" style="width: 115px">
            <template v-for="item in ndList" :key="item.yearCode">
              <el-option :label="item.yearName" :value="item.yearCode"></el-option>
            </template>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <proTable
      stripe
      ref="proTableRef"
      @search="searchHandle"
      @reset="resetHandle"
      @row-click="handerClickTable"
      :request-api="pageMeeting"
      :request-auto="false"
      :search-col="4"
      :columns="tableColumns"
      @selection-change="selectionChange"
      :data-callback="pageList"
    >
      <!-- :toolButton="['other']" -->
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-for="button in currentActionButtons"
          :key="button.value"
          size="mini"
          :disabled="button.requiresSelection && !scope.isSelected"
          type="primary"
          plain
          @click="handleReview(scope.selectedList, button.value)"
          >{{ button.label }}</el-button
        >
      </template>
    </proTable>
  </div>
</template>
<script lang="ts">
export default {}
</script>
<script setup lang="ts">
import { ref, defineEmits, defineProps, nextTick, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getYearData } from '@/api/common'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { pageForProvince, pageForYjdw } from '@/api/service/balanceReporting/index'

type PageType = 'province' | 'city'
type ActionValue = '版本创建' | '版本修改' | '版本删除' | '下发单位管理' | '版本下发' | '上报查看' | '归档' | '取消归档' | '上报预计结余'

interface ActionButton {
  label: string
  value: ActionValue
  requiresSelection: boolean
}

const STATUS_OPTIONS = {
  province: [
    { value: '1', label: '草稿' },
    { value: '2', label: '收集中' },
    { value: '3', label: '归档' }
  ],
  city: [
    { value: '2', label: '收集中' },
    { value: '3', label: '归档' }
  ]
}

const STATUS_TEXT: Record<string, string> = {
  '1': '草稿',
  '2': '收集中',
  '3': '归档'
}

const ACTION_BUTTONS: Record<PageType, ActionButton[]> = {
  province: [
    { label: '版本创建', value: '版本创建', requiresSelection: false },
    { label: '版本修改', value: '版本修改', requiresSelection: true },
    { label: '版本删除', value: '版本删除', requiresSelection: true },
    { label: '下发单位管理', value: '下发单位管理', requiresSelection: true },
    { label: '版本下发', value: '版本下发', requiresSelection: true },
    { label: '上报查看', value: '上报查看', requiresSelection: true },
    { label: '归 档', value: '归档', requiresSelection: true },
    { label: '取消归档', value: '取消归档', requiresSelection: true }
  ],
  city: [
    { label: '上报预计结余', value: '上报预计结余', requiresSelection: true },
    { label: '上报查看', value: '上报查看', requiresSelection: true }
  ]
}

const ACTION_RESTRICTIONS: Record<string, { messagePrefix: string; actions: ActionValue[] }> = {
  '1': {
    messagePrefix: '草稿状态',
    actions: ['上报查看', '归档', '取消归档']
  },
  '2': {
    messagePrefix: '收集中',
    actions: ['版本修改', '版本删除', '版本下发', '取消归档']
  },
  '3': {
    messagePrefix: '已归档',
    actions: ['版本修改', '版本删除', '版本下发', '归档', '上报预计结余']
  }
}

const CONFIRM_ACTIONS: ActionValue[] = ['版本删除', '版本下发', '归档', '取消归档']
const normalizeStatus = (status: any) => String(status ?? '')

//接收父组件传参
const props = defineProps({
  // 页面类型
  type: {
    type: String,
    default: 'province'
  },
  specialorgid: {
    type: String,
    default: ''
  }
})
// 子组件
const emit = defineEmits(['clickBtn', 'pageType'])
const pageType = computed<PageType>(() => (props.type == 'city' ? 'city' : 'province'))
const currentActionButtons = computed(() => ACTION_BUTTONS[pageType.value])
const tableColumns = computed(() => [
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'versionNo', label: '版本编号', width: '130' },
  {
    prop: 'versionName',
    label: '版本名称',
    width: '300',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'status',
    label: '版本状态',
    search: { el: 'select', order: 2 },
    enum: STATUS_OPTIONS[pageType.value],
    isShow: false
  },
  { prop: 'nd', label: '年度', width: '80' },
  { prop: 'statusName', label: '版本状态', width: '100' },
  { prop: 'createDate', label: '创建日期', width: '180' },
  { prop: 'creatorName', label: '创建人', width: '80' },
  { prop: 'remake', label: '备注' } //,width:"430"
])

// 初始化页面
const proTableRef = ref() //表格元素
const nd = ref<any>() //年度
const ndList = ref<any>() //近三年

// 重置
const resetHandle = () => {
  proTableRef.value?.clearSelection()
}
// 搜索
const searchHandle = () => {
  proTableRef.value?.clearSelection()
}
// 列表查询
const pageMeeting = async (params: any) => {
  params.nd = Number(nd.value)
  params.specialorgid = props.specialorgid
  const api = pageType.value == 'province' ? pageForProvince : pageForYjdw
  return api(params)
}
// 数据处理回调
const pageList = (val: any) => {
  if (val?.records) {
    val.records.forEach((item: any) => {
      item.statusName = STATUS_TEXT[normalizeStatus(item.status)] || '草稿'
    })
    emit('pageType', { success: true })
    proTableRef.value?.startGuide?.()
  } else {
    emit('pageType', {
      success: false,
      msg: pageType.value == 'province' ? '仅限省公司访问' : '仅限一级单位访问'
    })
  }
  return val
}
// 单选
const selectionChange = (selection: any[] = []) => {
  if (selection.length > 1) {
    nextTick(() => {
      proTableRef.value?.clearSelection()
      proTableRef.value?.element.toggleRowSelection(selection[selection.length - 1])
    })
  }
}
//点击年度
const changeNdDataHandle = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList?.()
}
const initParams = async () => {
  let res = await getYearData()
  if (res.success) {
    ndList.value = res.data
    nd.value = new Date().getFullYear().toString()
    proTableRef.value?.getTableList?.()
  } else {
    ElMessage.error(res.msg)
  }
}
// 点击行
const handerClickTable = (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
// 项目评审
const handleReview = async (selectedList: any[] = [], val: ActionValue) => {
  const params = { value: val, selectedList: selectedList, nd: Number(nd.value) }
  if (selectedList.length != 1 && val != '版本创建') {
    return ElMessage.warning('请选择一条数据')
  }
  const restriction = ACTION_RESTRICTIONS[normalizeStatus(selectedList[0]?.status)]
  if (restriction?.actions.includes(val)) {
    return ElMessage.warning(`${restriction.messagePrefix}，无法${val}`)
  }
  if (CONFIRM_ACTIONS.includes(val)) {
    try {
      await ElMessageBox.confirm(`是否确定${val}？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      emit('clickBtn', params)
    } catch (error) {
      console.log(error)
    }
  } else {
    emit('clickBtn', params)
  }
}
watch(
  () => props.specialorgid,
  (newValue) => {
    if (newValue) {
      initParams()
    }
  }
)

// 子组件暴露方法到父组件
defineExpose({
  proTableRef
})
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  position: relative;
  .right {
    position: absolute;
    right: 110px;
    top: 8px;
  }
}
</style>
