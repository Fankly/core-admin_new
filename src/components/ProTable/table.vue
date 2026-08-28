<!--列表组件 -->
<template>
  <div class="container" v-loading="loading">
    <div class="right" v-if="tableType != 'NOND'">
      <el-form :inline="true">
        <el-form-item label="年度：">
          <el-select v-model="formData.nd" placeholder="请选择" @change="changeNdDataHandle" style="width: 115px">
            <template v-for="item in ndList" :key="item.code">
              <el-option :label="item.name" :value="item.code"></el-option>
            </template>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <proTable
      ref="proTableRef"
      @search="searchHandle"
      @reset="resetHandle"
      @row-click="handleClickRow"
      :data-callback="pageList"
      :request-api="pageMeeting"
      :request-auto="false"
      :search-col="4"
      :columns="tableColumns"
      stripe
    >
      <template #tableHeader="scope" v-if="showPage">
        <template v-for="(item, index) in btnList" :key="index">
          <el-button
            style="margin-right: 10px"
            v-if="item.type == 'normal'"
            v-permission="item.label"
            :disabled="!scope.isSelected && item.isSelected"
            type="primary"
            size="mini"
            plain
            @click="handleClickBtn(item, scope.selectedList)"
          >
            {{ item.value }}
          </el-button>
          <el-dropdown style="margin-right: 10px" placement="bottom" v-else trigger="click">
            <el-button v-permission="item.label" size="mini" plain type="primary">
              {{ item.value }}<i class="el-icon-arrow-down" style="margin-left: 6px"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu v-for="operation in item.children" :key="operation.id" v-permission="operation.label">
                <el-dropdown-item :disabled="!scope.isSelected && operation.isSelected" @click="handleClickBtn(operation, scope.selectedList)">
                  {{ operation.value }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </template>
    </proTable>
  </div>
</template>
<script lang="ts">
export default {
  name: 'btnTable'
}
</script>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import proTable from '@/components/ProTable/index.vue' //表格组件

interface propsVo {
  btnList: any[] //页面按钮
  tableType: string //页面编码，是否展示年度筛选
  tableColumns: any[] //列表项
  showPage: boolean
  pageApi: (params: any) => Promise<any> // 表格接口
}

//接收父组件传值
const props = defineProps<propsVo>()
// 子组件
const emits = defineEmits(['btnType', 'pageType'])
const formData = ref<any>({})
const ndList = ref<any>({})
const proTableRef = ref() // 初始化页面
const loading = ref<boolean>(false)
// 列表查询
const pageMeeting = (params: any) => {
  params = { ...params, ...formData.value }
  params['xmbmList'] = params['xmbm'] ? params['xmbm'].split(',') : []
  return props.pageApi(params)
}

// 重置
const resetHandle = () => {
  loading.value = true
  proTableRef.value?.clearSelection()
  emits('pageType', { success: true, type: 'reset' })
}
// 搜索
const searchHandle = (val: any) => {
  loading.value = true
  proTableRef.value?.clearSelection()
}
// 数据回调
const pageList = (val: any) => {
  if (val) {
    emits('pageType', { success: true })
  } else {
    emits('pageType', { success: false })
  }
  loading.value = false
  return val
}
//点击年度
const changeNdDataHandle = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value.getTableList()
}

// 点击按钮
const handleClickBtn = (val: any, selectedList: any) => {
  emits('btnType', { ...val, ...formData.value, selectedList: selectedList })
}

// 单击行选中当前行
const handleClickRow = async (row: any, column: any) => {
  nextTick(() => {
    if (column.type == 'selection') return
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(row)
  })
}
const getParams = () => {
  return proTableRef.value?.searchParam
}

defineExpose({
  proTableRef,
  formData,
  ndList,
  getParams: getParams
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
.items-popover {
  margin-bottom: 10px;
  text-align: center;
  cursor: pointer;
}

.items-popover:hover {
  font-weight: bold;
  color: var(--color-primary, #00857c);
}
</style>
